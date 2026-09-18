// Re-export type guards from shared utils
export { isRecord } from '../utils/type-guards';

import type { Endpoint, Parameter, Schema } from '../openapi/types';
import { generateParameterExample } from '../openapi/example-generator';

/**
 * POSIX single-quoting for a shell argument.
 *
 * Single quotes are the only quoting that leaves `$`, backtick and `\` inert —
 * double quotes still expand them, so a value like `.../${filename}` (a real S3
 * key template) or `{"a":1}` got mangled on paste. An embedded `'` is closed,
 * escaped and reopened.
 */
export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

export function resolveUrl(endpoint: Endpoint, baseUrl: string): string {
  let resolvedPath = endpoint.path;
  const pathParams = endpoint.parameters.filter((p) => p.in === 'path');
  for (const p of pathParams) {
    const example = generateParameterExample(p);
    resolvedPath = resolvedPath.replace(`{${p.name}}`, String(example));
  }
  return `${baseUrl}${resolvedPath}`;
}

export function requiresAuth(endpoint: Endpoint): boolean {
  return endpoint.requirements?.auth !== false;
}

export function hasJsonContent(endpoint: Endpoint): boolean {
  if (!endpoint.requestBody) return false;
  return 'application/json' in endpoint.requestBody.content;
}

export function hasMultipartContent(endpoint: Endpoint): boolean {
  if (!endpoint.requestBody) return false;
  return 'multipart/form-data' in endpoint.requestBody.content;
}

export function getQueryParams(endpoint: Endpoint): Parameter[] {
  return endpoint.parameters.filter((p) => p.in === 'query');
}

export function resolveParamName(param: Parameter): string {
  return param['x-param-names']?.[0]?.name || param.name;
}

export function buildQueryString(endpoint: Endpoint, exclude?: string[]): string {
  const queryParams = getQueryParams(endpoint);
  if (queryParams.length === 0) return '';

  const parts: string[] = [];
  for (const p of queryParams) {
    if (exclude?.includes(p.name)) continue;
    const example = generateParameterExample(p);
    if (Array.isArray(example)) {
      for (const val of example) {
        parts.push(`${resolveParamName(p)}[]=${String(val)}`);
      }
    } else {
      parts.push(`${resolveParamName(p)}=${String(example)}`);
    }
  }
  return parts.join('&');
}

/**
 * Flatten one level of `allOf` into the schema's own properties. The docs
 * parser keeps `allOf` unmerged, so a composed schema has no `properties` of
 * its own until this runs.
 */
export function mergeAllOf(schema: Schema): Schema {
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

/**
 * Pick the object property that wraps the real fields (`{ draft: {...} }`).
 * Mirrors the rule in the CLI generator: the object property with the most
 * fields wins, so a small sibling object beside the wrapper doesn't cancel it.
 */
function pickWrapperKey(properties: Record<string, Schema>): string | undefined {
  const objectKeys = Object.keys(properties).filter((k) => {
    const inner = mergeAllOf(properties[k]);
    return !!inner.properties && Object.keys(inner.properties).length > 0;
  });
  if (objectKeys.length === 0) return undefined;
  return objectKeys.reduce((biggest, key) => {
    const a = Object.keys(mergeAllOf(properties[key]).properties ?? {}).length;
    const b = Object.keys(mergeAllOf(properties[biggest]).properties ?? {}).length;
    return a > b ? key : biggest;
  });
}

function narrowObjectSchema(schema: Schema, params: Record<string, unknown>): Schema {
  const merged = mergeAllOf(schema);
  if (!merged.properties) return schema;

  const kept: Record<string, Schema> = {};
  for (const [name, prop] of Object.entries(merged.properties)) {
    const named = Object.hasOwn(params, name);
    if (!named && !merged.required?.includes(name)) continue;
    kept[name] = named ? { ...prop, example: params[name] } : prop;
  }
  return {
    ...merged,
    properties: kept,
    required: merged.required?.filter((name) => name in kept),
  };
}

/**
 * Keep only the named and the required fields of a request body, and use the
 * given values as their examples.
 *
 * Without this, a generated guide example carried every optional field that had
 * an `@example` in the spec — for `POST /drafts` that meant `schedule`, which
 * turns the very thing being demonstrated into a scheduled message. Narrowing
 * belongs here rather than in each generator so curl and CLI stay in step.
 */
export function narrowRequestBody(
  requestBody: Endpoint['requestBody'],
  params: Record<string, unknown>
): Endpoint['requestBody'] {
  if (!requestBody?.content) return requestBody;

  const content = { ...requestBody.content };
  let changed = false;

  for (const [mediaType, media] of Object.entries(content)) {
    const schema = media?.schema;
    if (!schema) continue;

    const merged = mergeAllOf(schema);
    if (!merged.properties) continue;

    const wrapperKey = pickWrapperKey(merged.properties);
    const narrowed = wrapperKey
      ? {
          ...merged,
          properties: {
            ...merged.properties,
            [wrapperKey]: narrowObjectSchema(merged.properties[wrapperKey], params),
          },
        }
      : narrowObjectSchema(merged, params);

    content[mediaType] = { ...media, schema: narrowed };
    changed = true;
  }

  return changed ? { ...requestBody, content } : requestBody;
}
