import type { Endpoint } from '../openapi/types';
import {
  generateExample,
  generateParameterExample,
  generateRequestExample,
  generateMultipartExample,
} from '../openapi/example-generator';
import { requiresAuth, hasJsonContent, hasMultipartContent } from './utils';

export function generateCurl(
  endpoint: Endpoint,
  baseUrl: string = 'https://api.pachca.com/api/shared/v1'
): string {
  const url = `${baseUrl}${endpoint.path}`;
  const method = endpoint.method;

  let curl = `curl -X ${method} "${url}"`;

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
    // Add headers
    if (hasJsonContent(endpoint)) {
      curl += ` \\\n  -H "Content-Type: application/json"`;
    }

    // Add request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method) && endpoint.requestBody) {
      // Используем явные примеры из OpenAPI (example/examples)
      const requestExample = generateRequestExample(endpoint.requestBody);

      if (requestExample) {
        curl += ` \\\n  -d '${JSON.stringify(requestExample, null, 2)}'`;
      } else {
        // Если явных примеров нет, генерируем из схемы
        const content = endpoint.requestBody.content['application/json'];
        if (content?.schema) {
          const body = generateExample(content.schema);
          if (body) {
            curl += ` \\\n  -d '${JSON.stringify(body, null, 2)}'`;
          }
        }
      }
    }
  }

  // Add query parameters if any
  const queryParams = endpoint.parameters.filter((p) => p.in === 'query');
  if (queryParams.length > 0) {
    const paramParts: string[] = [];
    for (const p of queryParams) {
      const example = generateParameterExample(p);
      if (Array.isArray(example)) {
        for (const val of example) {
          paramParts.push(`${p.name}[]=${encodeURIComponent(String(val))}`);
        }
      } else {
        paramParts.push(`${p.name}=${encodeURIComponent(String(example))}`);
      }
    }
    curl = curl.replace(url, `${url}?${paramParts.join('&')}`);
  }

  return curl;
}
