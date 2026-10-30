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

export function hasFormContent(endpoint: Endpoint): boolean {
  if (!endpoint.requestBody?.content) return false;
  return 'application/x-www-form-urlencoded' in endpoint.requestBody.content;
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
 * Mirrors `pickWrapperKey` in `packages/cli/scripts/generate-cli.ts`: the
 * object property with the most fields wins, so a small sibling object beside
 * the wrapper doesn't cancel it. The CLI example and the narrowing below both
 * use this one rule, so the flags they print match the real command's.
 */
export function pickWrapperKey(properties: Record<string, Schema>): string | undefined {
  const size = (key: string) => Object.keys(mergeAllOf(properties[key]).properties ?? {}).length;
  const objectKeys = Object.keys(properties).filter((k) => size(k) > 0);
  if (objectKeys.length === 0) return undefined;
  return objectKeys.reduce((biggest, key) => (size(key) > size(biggest) ? key : biggest));
}

/**
 * Keep the named, the required and the `keep` fields of an object schema. A
 * named field takes its value from `params` and counts as required, so the
 * example shows it even when the value equals the field's default.
 */
function narrowObjectSchema(
  schema: Schema,
  params: Record<string, unknown>,
  keep: Record<string, Schema> = {}
): Schema {
  const merged = mergeAllOf(schema);
  if (!merged.properties) return schema;

  const kept: Record<string, Schema> = {};
  const required = new Set(merged.required ?? []);
  for (const [name, prop] of Object.entries(merged.properties)) {
    if (Object.hasOwn(keep, name)) {
      kept[name] = keep[name];
    } else if (Object.hasOwn(params, name)) {
      kept[name] = { ...prop, example: params[name] };
      required.add(name);
    } else if (required.has(name)) {
      kept[name] = prop;
    }
  }
  return {
    ...merged,
    properties: kept,
    required: [...required].filter((name) => name in kept),
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
 *
 * The media type's hand-authored `example`/`examples` go too: the generators
 * prefer them over the schema, so a narrowed body that kept them still showed
 * the spec's full example (`entity_id: 334` with a button) instead of `params`.
 * A body that `params` does not touch at all keeps its schema and examples.
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
    const properties = merged.properties;
    if (!properties) continue;

    // Params that name only path or query parameters leave the body as it is:
    // narrowed to its required fields it would lose the spec's example and
    // collapse to an empty wrapper (`{ "message": {} }`).
    const wrapperKey = pickWrapperKey(properties);
    const wrapperFields = wrapperKey ? (mergeAllOf(properties[wrapperKey]).properties ?? {}) : {};
    const namesBodyField = Object.keys(params).some(
      (name) => Object.hasOwn(properties, name) || Object.hasOwn(wrapperFields, name)
    );
    if (!namesBodyField) continue;

    const narrowed = wrapperKey
      ? narrowObjectSchema(merged, params, {
          [wrapperKey]: narrowObjectSchema(properties[wrapperKey], params),
        })
      : narrowObjectSchema(merged, params);

    content[mediaType] = { ...media, schema: narrowed, example: undefined, examples: undefined };
    changed = true;
  }

  return changed ? { ...requestBody, content } : requestBody;
}

/**
 * Keep one hand-authored example of a request body, picked by its key or its
 * `summary` (the `@opExample` title), so a guide can show the variant it is
 * about while the method page's code tabs show the first one. `null` when no
 * media type has such an example, so the caller can say so instead of silently
 * showing another body.
 */
export function selectRequestExample(
  requestBody: Endpoint['requestBody'],
  name: string
): Endpoint['requestBody'] | null {
  if (!requestBody?.content) return null;

  let found = false;
  const content = { ...requestBody.content };
  for (const [mediaType, media] of Object.entries(content)) {
    const entry = Object.entries(media?.examples ?? {}).find(
      ([key, example]) => key === name || example.summary === name
    );
    if (!entry) continue;
    content[mediaType] = { ...media, example: undefined, examples: { [entry[0]]: entry[1] } };
    found = true;
  }

  return found ? { ...requestBody, content } : null;
}
