import type { Endpoint } from '../openapi/types';
import {
  generateExample,
  generateParameterExample,
  generateRequestExample,
} from '../openapi/example-generator';

export function generateNodeJS(
  endpoint: Endpoint,
  baseUrl: string = 'https://api.pachca.com/api/shared/v1'
): string {
  const url = `${baseUrl}${endpoint.path}`;
  const method = endpoint.method.toLowerCase();

  let code = `const https = require('https');\n\n`;

  // Add query parameters if any
  const queryParams = endpoint.parameters.filter((p) => p.in === 'query');
  let path = new URL(url).pathname;
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
    path = `${path}?${paramParts.join('&')}`;
  }

  code += `const options = {\n`;
  code += `    hostname: 'api.pachca.com',\n`;
  code += `    port: 443,\n`;
  code += `    path: '${path}',\n`;
  code += `    method: '${method.toUpperCase()}',\n`;
  code += `    headers: {\n`;
  code += `        'Content-Type': 'application/json',\n`;
  code += `        'Authorization': 'Bearer YOUR_ACCESS_TOKEN'\n`;
  code += `    }\n`;
  code += `};\n\n`;

  code += `const req = https.request(options, (res) => {\n`;
  code += `    let data = '';\n\n`;
  code += `    res.on('data', (chunk) => {\n`;
  code += `        data += chunk;\n`;
  code += `    });\n\n`;
  code += `    res.on('end', () => {\n`;
  code += `        console.log(JSON.parse(data));\n`;
  code += `    });\n`;
  code += `});\n\n`;

  // Add request body for POST/PUT/PATCH
  if (['post', 'put', 'patch'].includes(method) && endpoint.requestBody) {
    // Используем явные примеры из OpenAPI (example/examples)
    const requestExample = generateRequestExample(endpoint.requestBody);
    const body =
      requestExample ||
      (endpoint.requestBody.content['application/json']?.schema
        ? generateExample(endpoint.requestBody.content['application/json'].schema)
        : null);

    if (body) {
      code += `req.write(JSON.stringify(${JSON.stringify(body, null, 4)}));\n`;
    }
  }

  code += `req.on('error', (error) => {\n`;
  code += `    console.error(error);\n`;
  code += `});\n\n`;
  code += `req.end();`;

  return code;
}
