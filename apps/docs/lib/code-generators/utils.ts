// Re-export type guards from shared utils
export { isRecord } from '../utils/type-guards';

import type { Endpoint, Parameter } from '../openapi/types';
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
