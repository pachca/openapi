import type { Endpoint, Schema } from '../openapi/types';
import { generateUrlFromOperation } from '../openapi/mapper';
import {
  authoredExample,
  generateParameterExample,
  generateExample,
  type ExampleOptions,
} from '../openapi/example-generator';
import {
  requiresAuth,
  getQueryParams,
  resolveParamName,
  shellQuote,
  mergeAllOf,
  pickWrapperKey,
  isRecord,
} from './utils';

export function generateCLI(endpoint: Endpoint, options?: ExampleOptions): string {
  const url = generateUrlFromOperation(endpoint);
  const [, , section, action] = url.split('/');
  let command = `pachca ${section} ${action}`;

  const positionalArgs: string[] = [];
  const parts: string[] = [];

  // Path parameters as positional args (CLI uses Args, not flags)
  const pathParams = endpoint.parameters.filter((p) => p.in === 'path');
  for (const p of pathParams) {
    const example = generateParameterExample(p);
    positionalArgs.push(String(example));
  }

  // Body fields as flags (for POST/PUT/PATCH)
  if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.requestBody) {
    const bodyFields = extractUnwrappedBodyFields(endpoint.requestBody, options);
    for (const { name, example, schemaType, format } of bodyFields) {
      // Multipart binary field → CLI --file=<path> (not a hex blob)
      if (format === 'binary') {
        parts.push(`--file=./${name}.jpg`);
        continue;
      }
      valueToFlag(name, example, schemaType, parts, true);
    }
  }

  // Query parameters as flags
  const queryParams = getQueryParams(endpoint);
  for (const p of queryParams) {
    if (endpoint.paginated && p.name === 'cursor') continue;
    const schemaType = p.schema?.type;
    // Expand composite params (e.g., sort[{field}]) into separate flags
    if (p['x-param-names'] && p['x-param-names'].length > 0) {
      const example = generateParameterExample(p);
      for (const sub of p['x-param-names']) {
        valueToFlag(sub.name, example, schemaType, parts);
      }
    } else {
      const example = generateParameterExample(p);
      const name = resolveParamName(p);
      valueToFlag(name, example, schemaType, parts);
    }
  }

  // External URL flag (e.g. --direct-url for POST /direct_url)
  if (endpoint.externalUrl) {
    const externalFlag = toKebabCase(endpoint.externalUrl);
    parts.unshift(`--${externalFlag}=$DIRECT_URL`);
  }

  // Ответ телом файла: команда сохраняет его на диск, JSON-вывода у неё нет
  const binaryResponse = !!endpoint.responses?.['200']?.content?.['application/octet-stream'];
  if (binaryResponse) {
    parts.push('--save ./file');
  } else {
    // Add --json for consistent JSON output
    parts.push('--json');
  }

  // Add --token if auth required (skip for external URL endpoints)
  if (requiresAuth(endpoint) && !endpoint.externalUrl) {
    parts.push('--token YOUR_ACCESS_TOKEN');
  }

  if (positionalArgs.length > 0) {
    command += ' ' + positionalArgs.join(' ');
  }

  if (parts.length > 0) {
    command += ' \\\n  ' + parts.join(' \\\n  ');
  }

  const lines: string[] = [];
  if (endpoint.externalUrl) {
    lines.push('# URL получается из ответа POST /uploads (поле direct_url)');
  }
  if (endpoint.paginated) {
    lines.push('# Добавьте --all для автоматической пагинации');
  }
  if (lines.length > 0) {
    return lines.join('\n') + '\n' + command;
  }
  return command;
}

function toKebabCase(s: string): string {
  return s
    .replace(/[\[\]]/g, '-')
    .replace(/_/g, '-')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/-+/g, '-')
    .replace(/-$/, '')
    .toLowerCase();
}

/**
 * Convert a value to CLI flag(s) and push to parts.
 *
 * `jsonArrays` distinguishes the two array conventions the real CLI uses:
 * body arrays go through `JSON.parse` (28 call sites), query arrays through
 * `.split(',')`. Emitting a comma-joined list for a body flag produced an
 * example that dies with «Invalid JSON in --member-ids» when pasted.
 */
function valueToFlag(
  name: string,
  value: unknown,
  schemaType: string | string[] | undefined,
  parts: string[],
  jsonArrays = false
): void {
  const flag = toKebabCase(name);
  if (value === undefined || value === null) return;

  // Boolean flags use --flag / --no-flag syntax (oclif convention)
  if (schemaType === 'boolean' || typeof value === 'boolean') {
    parts.push(value ? `--${flag}` : `--no-${flag}`);
    return;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return;
    if (typeof value[0] !== 'object' && !jsonArrays) {
      parts.push(`--${flag}=${value.join(',')}`);
    } else {
      parts.push(`--${flag}=${shellQuote(JSON.stringify(value))}`);
    }
  } else if (typeof value === 'object') {
    parts.push(`--${flag}=${shellQuote(JSON.stringify(value))}`);
  } else if (typeof value === 'number' || typeof value === 'bigint') {
    parts.push(`--${flag}=${value}`);
  } else {
    const strValue = String(value);
    // Квотируем только если в значении есть пробел или shell-метасимвол.
    // Простые URL, идентификаторы, enum-значения и slug-и остаются без кавычек
    // (по соглашению gh / Vercel / Heroku / AWS).
    if (/[\s&|;()<>*?$`\\'"#]/.test(strValue)) {
      parts.push(`--${flag}=${shellQuote(strValue)}`);
    } else {
      parts.push(`--${flag}=${strValue}`);
    }
  }
}

interface BodyField {
  name: string;
  example: unknown;
  schemaType?: string | string[];
  format?: string;
}

/**
 * Body fields as CLI flags, with the wrapper unwrapped the way the real CLI
 * does it: for `{ message: {...}, link_preview }` the flags are the wrapper's
 * fields plus the siblings beside it.
 */
function extractUnwrappedBodyFields(
  requestBody: Endpoint['requestBody'],
  options?: ExampleOptions
): BodyField[] {
  if (!requestBody) return [];

  const jsonContent = requestBody.content['application/json'];
  const content = jsonContent || requestBody.content['multipart/form-data'];
  if (!content?.schema) return [];

  const schema = mergeAllOf(content.schema);
  const properties = schema.properties;
  if (!properties || schema.type !== 'object') {
    // Not an object schema — generate example as-is
    const example = generateExample(schema, 0, options);
    if (example && typeof example === 'object' && !Array.isArray(example)) {
      return Object.entries(example as Record<string, unknown>).map(([name, val]) => ({
        name,
        example: val,
      }));
    }
    return [];
  }

  // The wrapper rule is the real CLI generator's: an allOf-composed wrapper
  // declares no `type: 'object'` of its own, and a second, smaller object beside
  // the wrapper must not cancel unwrapping (the example then collapsed into one
  // raw JSON flag while the command itself kept its individual flags).
  const wrapperKey = pickWrapperKey(properties);
  const innerSchema = wrapperKey ? mergeAllOf(properties[wrapperKey]) : undefined;

  // A hand-written example in the spec is a coherent request: the curl tab
  // shows it, and the CLI tab has to send the same body. Built field by field
  // from the schema instead, it carried every field with an `@example` —
  // `--display-name` that only a bot may send, a picture with `duration_ms`.
  const authored = jsonContent ? authoredExample(jsonContent) : undefined;
  if (isRecord(authored)) {
    const inner = wrapperKey ? authored[wrapperKey] : undefined;
    if (wrapperKey && innerSchema && isRecord(inner)) {
      return [
        ...authoredFields(inner, innerSchema, options),
        ...authoredFields(omit(authored, wrapperKey), schema, options),
      ];
    }
    return authoredFields(authored, schema, options);
  }

  if (wrapperKey && innerSchema) {
    return [...schemaFields(innerSchema, options), ...schemaFields(schema, options, wrapperKey)];
  }

  // No wrapper — use all top-level properties
  return schemaFields(schema, options);
}

/** Flags from the schema: every writable field that has an example of its own. */
function schemaFields(schema: Schema, options?: ExampleOptions, skipKey?: string): BodyField[] {
  const required = schema.required || [];
  const fields: BodyField[] = [];
  for (const [name, propSchema] of Object.entries(schema.properties ?? {})) {
    if (name === skipKey) continue;
    const s = propSchema as Schema;
    if (s.readOnly) continue;
    if (options?.requiredOnly && !required.includes(name)) continue;
    const example = generateExample(s, 0, options);
    if (example === undefined) continue;
    if (isRedundantDefault(s, required.includes(name), example)) continue;
    fields.push({ name, example, schemaType: s.type, format: s.format });
  }
  return fields;
}

/** Flags from a hand-written example: its fields and values as written, typed by the schema. */
function authoredFields(
  values: Record<string, unknown>,
  schema: Schema,
  options?: ExampleOptions
): BodyField[] {
  const required = schema.required || [];
  const fields: BodyField[] = [];
  for (const [name, example] of Object.entries(values)) {
    if (example === undefined) continue;
    const s = (schema.properties?.[name] ?? {}) as Schema;
    if (s.readOnly) continue;
    if (options?.requiredOnly && !required.includes(name)) continue;
    fields.push({ name, example, schemaType: s.type, format: s.format });
  }
  return fields;
}

function omit(values: Record<string, unknown>, key: string): Record<string, unknown> {
  return Object.fromEntries(Object.entries(values).filter(([name]) => name !== key));
}

/** Шум: опциональное поле, у которого пример равен дефолту схемы. Тождественно «не передавать поле». */
function isRedundantDefault(schema: Schema, isRequired: boolean, example: unknown): boolean {
  return !isRequired && schema.default !== undefined && example === schema.default;
}
