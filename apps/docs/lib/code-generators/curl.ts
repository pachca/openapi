import type { Endpoint } from '../openapi/types';
import {
  generateRequestExample,
  generateMultipartExample,
  type ExampleOptions,
} from '../openapi/example-generator';
import {
  requiresAuth,
  hasJsonContent,
  hasMultipartContent,
  resolveUrl,
  buildQueryString,
} from './utils';

export function generateCurl(
  endpoint: Endpoint,
  baseUrl: string = 'https://api.pachca.com/api/shared/v1',
  options?: ExampleOptions
): string {
  const method = endpoint.method;
  const url = endpoint.externalUrl ? '$DIRECT_URL' : resolveUrl(endpoint, baseUrl);

  // Determine if -X flag is needed:
  // - GET: omit (curl default)
  // - POST with body: omit (-d/-F implies POST)
  // - PUT/PATCH/DELETE: always include
  const hasBodyData = endpoint.requestBody != null;
  const needsMethod = method !== 'GET' && !(method === 'POST' && hasBodyData);

  const lines: string[] = [];

  // Add comment for external URL endpoints
  if (endpoint.externalUrl) {
    lines.push('# URL получается из ответа POST /uploads (поле direct_url)');
  }

  // Add comment for paginated endpoints
  if (endpoint.paginated) {
    lines.push('# Для получения следующей страницы используйте cursor из meta.paginate.next_page');
  }

  let curl = needsMethod ? `curl -X ${method} "${url}"` : `curl "${url}"`;

  // Add authentication header (skip for external URL endpoints)
  if (requiresAuth(endpoint) && !endpoint.externalUrl) {
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
      const requestExample = generateRequestExample(endpoint.requestBody, options);

      if (requestExample) {
        curl += ` \\\n  -d '${JSON.stringify(requestExample, null, 2)}'`;
      }
    }
  }

  // Add query parameters if any
  const qs = buildQueryString(endpoint, endpoint.paginated ? ['cursor'] : undefined);
  if (qs) {
    curl = curl.replace(`"${url}"`, `"${url}?${qs}"`);
  }

  if (lines.length > 0) {
    return lines.join('\n') + '\n' + curl;
  }
  return curl;
}
