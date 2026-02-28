import type { Endpoint } from '../openapi/types';
import {
  generateParameterExample,
  generateRequestExample,
  generateMultipartExample,
} from '../openapi/example-generator';
import {
  requiresAuth,
  hasJsonContent,
  hasMultipartContent,
  resolveUrl,
  getQueryParams,
  resolveParamName,
} from './utils';

export function generateCurl(
  endpoint: Endpoint,
  baseUrl: string = 'https://api.pachca.com/api/shared/v1'
): string {
  const method = endpoint.method;
  const url = resolveUrl(endpoint, baseUrl);

  // Determine if -X flag is needed:
  // - GET: omit (curl default)
  // - POST with body: omit (-d/-F implies POST)
  // - PUT/PATCH/DELETE: always include
  const hasBodyData = endpoint.requestBody != null;
  const needsMethod = method !== 'GET' && !(method === 'POST' && hasBodyData);

  let curl = needsMethod ? `curl -X ${method} "${url}"` : `curl "${url}"`;

  // Add authentication header
  if (requiresAuth(endpoint)) {
    curl += ` \\\n  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`;
  }

  // Multipart form-data
  if (['POST', 'PUT', 'PATCH'].includes(method) && hasMultipartContent(endpoint)) {
    const fields = generateMultipartExample(endpoint.requestBody);
    if (fields) {
      for (const field of fields) {
        if (field.isFile) {
          curl += ` \\\n  -F "${field.name}=@${field.value}"`;
        } else {
          curl += ` \\\n  -F "${field.name}=${field.value}"`;
        }
      }
    }
  } else {
    // Add Content-Type header for JSON requests
    if (hasJsonContent(endpoint)) {
      curl += ` \\\n  -H "Content-Type: application/json"`;
    }

    // Add request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method) && endpoint.requestBody) {
      const requestExample = generateRequestExample(endpoint.requestBody);

      if (requestExample) {
        curl += ` \\\n  -d '${JSON.stringify(requestExample, null, 2)}'`;
      }
    }
  }

  // Add query parameters if any
  const queryParams = getQueryParams(endpoint);
  if (queryParams.length > 0) {
    const paramParts: string[] = [];
    for (const p of queryParams) {
      const example = generateParameterExample(p);
      if (Array.isArray(example)) {
        for (const val of example) {
          paramParts.push(`${resolveParamName(p)}[]=${String(val)}`);
        }
      } else {
        paramParts.push(`${resolveParamName(p)}=${String(example)}`);
      }
    }
    curl = curl.replace(`"${url}"`, `"${url}?${paramParts.join('&')}"`);
  }

  return curl;
}
