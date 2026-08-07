import type { Endpoint, Schema } from '../openapi/types';
import { generateUrlFromOperation } from '../openapi/mapper';
import {
  generateParameterExample,
  generateExample,
  type ExampleOptions,
} from '../openapi/example-generator';
import { requiresAuth, getQueryParams, resolveParamName, shellQuote } from './utils';

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

  // Add --json for consistent JSON output
  parts.push('--json');

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

/**
 * Extract body fields with wrapper unwrapping (same logic as CLI generator).
 * If body has a single object property (e.g. { message: { ... } }),
 * unwrap it and return inner fields + sibling scalar fields.
 */
interface BodyField {
  name: string;
  example: unknown;
  schemaType?: string | string[];
  format?: string;
}

/**
 * Flatten one level of `allOf` into the schema's own properties. The docs
 * parser keeps `allOf` unmerged, so a composed schema has no `properties` of
 * its own until this runs.
 */
function mergeAllOf(schema: Schema): Schema {
  if (!schema?.allOf || schema.allOf.length === 0) return schema ?? {};
  const merged: Schema = { ...schema };
  const properties: Record<string, Schema> = { ...(schema.properties ?? {}) };
  const required: string[] = [...(schema.required ?? [])];
  for (const sub of schema.allOf) {
    const inner = mergeAllOf(sub as Schema);
    Object.assign(properties, inner.properties ?? {});
    required.push(...(inner.required ?? []));
    if (!merged.type && inner.type) merged.type = inner.type;
  }
  merged.properties = properties;
  merged.required = required;
  delete merged.allOf;
  return merged;
}

function extractUnwrappedBodyFields(
  requestBody: Endpoint['requestBody'],
  options?: ExampleOptions
): BodyField[] {
  if (!requestBody) return [];

  const content =
    requestBody.content['application/json'] || requestBody.content['multipart/form-data'];
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

  const topKeys = Object.keys(properties);

  // Detect wrapper: the largest top-level object property. Resolve allOf and
  // don't require a literal `type: 'object'` — an allOf-composed wrapper usually
  // declares neither, and the real CLI generator resolves before asking, so the
  // two would disagree.
  //
  // The size rule has to match `pickWrapperKey` in the CLI generator: it used to
  // demand exactly one object here, so a second one appearing beside the wrapper
  // cancelled unwrapping and the example collapsed into one raw JSON flag, while
  // the command itself kept its individual flags.
  const objectKeys = topKeys.filter((k) => {
    const inner = mergeAllOf(properties[k] as Schema);
    return !!inner.properties && Object.keys(inner.properties).length > 0;
  });

  if (objectKeys.length > 0) {
    const wrapperKey = objectKeys.reduce((biggest, key) => {
      const size = (k: string) =>
        Object.keys(mergeAllOf(properties[k] as Schema).properties ?? {}).length;
      return size(key) > size(biggest) ? key : biggest;
    }, objectKeys[0]);
    const innerSchema = properties[wrapperKey] as Schema;
    const innerRequired = innerSchema.required || [];
    const fields: BodyField[] = [];

    // Inner fields from the wrapper object
    if (innerSchema.properties) {
      for (const [name, propSchema] of Object.entries(innerSchema.properties)) {
        const s = propSchema as Schema;
        if (s.readOnly) continue;
        if (options?.requiredOnly && !innerRequired.includes(name)) continue;
        const example = generateExample(s, 0, options);
        if (example === undefined) continue;
        if (isRedundantDefault(s, innerRequired.includes(name), example)) continue;
        fields.push({ name, example, schemaType: s.type, format: s.format });
      }
    }

    // Sibling scalar fields (top-level properties outside the wrapper)
    const topRequired = schema.required || [];
    for (const key of topKeys) {
      if (key === wrapperKey) continue;
      const s = properties[key] as Schema;
      if (s.readOnly) continue;
      if (options?.requiredOnly && !topRequired.includes(key)) continue;
      const example = generateExample(s, 0, options);
      if (example === undefined) continue;
      if (isRedundantDefault(s, topRequired.includes(key), example)) continue;
      fields.push({ name: key, example, schemaType: s.type, format: s.format });
    }

    return fields;
  }

  // No wrapper — use all top-level properties
  const topRequired = schema.required || [];
  const fields: BodyField[] = [];
  for (const [name, propSchema] of Object.entries(properties)) {
    const s = propSchema as Schema;
    if (s.readOnly) continue;
    if (options?.requiredOnly && !topRequired.includes(name)) continue;
    const example = generateExample(s, 0, options);
    if (example === undefined) continue;
    if (isRedundantDefault(s, topRequired.includes(name), example)) continue;
    fields.push({ name, example, schemaType: s.type, format: s.format });
  }
  return fields;
}

/** Шум: опциональное поле, у которого пример равен дефолту схемы. Тождественно «не передавать поле». */
function isRedundantDefault(schema: Schema, isRequired: boolean, example: unknown): boolean {
  return !isRequired && schema.default !== undefined && example === schema.default;
}
