// Re-export type guards from shared utils
export { isRecord } from '../utils/type-guards';

import type { Endpoint } from '../openapi/types';
import { generateParameterExample } from '../openapi/example-generator';

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
  return !endpoint.description?.includes('#access_token_not_required');
}

export function hasJsonContent(endpoint: Endpoint): boolean {
  if (!endpoint.requestBody) return false;
  return 'application/json' in endpoint.requestBody.content;
}

export function hasMultipartContent(endpoint: Endpoint): boolean {
  if (!endpoint.requestBody) return false;
  return 'multipart/form-data' in endpoint.requestBody.content;
}
