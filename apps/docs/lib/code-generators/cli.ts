import type { Endpoint, Schema } from '../openapi/types';
import { generateUrlFromOperation } from '../openapi/mapper';
import {
  generateParameterExample,
  generateExample,
  type ExampleOptions,
} from '../openapi/example-generator';
import { requiresAuth, getQueryParams, resolveParamName } from './utils';

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
      valueToFlag(name, example, schemaType, parts);
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

/** Convert a value to CLI flag(s) and push to parts */
function valueToFlag(
  name: string,
  value: unknown,
  schemaType: string | string[] | undefined,
  parts: string[]
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
    if (typeof value[0] !== 'object') {
      parts.push(`--${flag}=${value.join(',')}`);
    } else {
      parts.push(`--${flag}='${JSON.stringify(value)}'`);
    }
  } else if (typeof value === 'object') {
    parts.push(`--${flag}='${JSON.stringify(value)}'`);
  } else {
    const strValue = String(value);
    if (strValue.includes(' ')) {
      parts.push(`--${flag}="${strValue}"`);
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

function extractUnwrappedBodyFields(
  requestBody: Endpoint['requestBody'],
  options?: ExampleOptions
): BodyField[] {
  if (!requestBody) return [];

  const content =
    requestBody.content['application/json'] || requestBody.content['multipart/form-data'];
  if (!content?.schema) return [];

  const schema = content.schema;
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

  // Detect wrapper: exactly one top-level property that is an object with its own properties
  const objectKeys = topKeys.filter((k) => {
    const propSchema = properties[k] as Schema;
    return propSchema.type === 'object' && propSchema.properties;
  });

  if (objectKeys.length === 1) {
    const wrapperKey = objectKeys[0];
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
        if (example !== undefined) {
          fields.push({ name, example, schemaType: s.type, format: s.format });
        }
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
      if (example !== undefined) {
        fields.push({ name: key, example, schemaType: s.type, format: s.format });
      }
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
    if (example !== undefined) {
      fields.push({ name, example, schemaType: s.type, format: s.format });
    }
  }
  return fields;
}
