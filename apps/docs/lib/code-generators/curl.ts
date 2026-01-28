import type { Endpoint } from '../openapi/types';
import {
  generateExample,
  generateParameterExample,
  generateRequestExample,
} from '../openapi/example-generator';

export function generateCurl(
  endpoint: Endpoint,
  baseUrl: string = 'https://api.pachca.com/api/shared/v1'
): string {
  const url = `${baseUrl}${endpoint.path}`;
  const method = endpoint.method;

  let curl = `curl -X ${method} "${url}"`;

  // Add authentication header
  curl += ` \\\n  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"`;

  // Add headers
  curl += ` \\\n  -H "Content-Type: application/json"`;

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

  // Add query parameters if any
  const queryParams = endpoint.parameters.filter((p) => p.in === 'query');
  if (queryParams.length > 0) {
    const params = queryParams.map((p) => `${p.name}=${generateParameterExample(p)}`).join('&');
    curl = curl.replace(url, `${url}?${params}`);
  }

  return curl;
}
