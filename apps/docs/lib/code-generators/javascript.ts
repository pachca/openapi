import type { Endpoint } from '../openapi/types';
import {
  generateExample,
  generateParameterExample,
  generateRequestExample,
} from '../openapi/example-generator';

export function generateJavaScript(
  endpoint: Endpoint,
  baseUrl: string = 'https://api.pachca.com/api/shared/v1'
): string {
  const url = `${baseUrl}${endpoint.path}`;
  const method = endpoint.method;

  let code = `const response = await fetch('${url}'`;

  // Add query parameters if any
  const queryParams = endpoint.parameters.filter((p) => p.in === 'query');
  if (queryParams.length > 0) {
    const params = queryParams.map((p) => `${p.name}=${generateParameterExample(p)}`).join('&');
    code = `const response = await fetch('${url}?${params}'`;
  }

  code += `, {\n  method: '${method}',`;

  // Add headers
  code += `\n  headers: {`;
  code += `\n    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',`;
  code += `\n    'Content-Type': 'application/json'`;
  code += `\n  }`;

  // Add body for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(method) && endpoint.requestBody) {
    // Используем явные примеры из OpenAPI (example/examples)
    const requestExample = generateRequestExample(endpoint.requestBody);
    const body =
      requestExample ||
      (endpoint.requestBody.content['application/json']?.schema
        ? generateExample(endpoint.requestBody.content['application/json'].schema)
        : null);

    if (body) {
      code += `,\n  body: JSON.stringify(${JSON.stringify(body, null, 4).replace(/\n/g, '\n  ')})`;
    }
  }

  code += `\n});\n\n`;
  code += `const data = await response.json();\n`;
  code += `console.log(data);`;

  return code;
}
