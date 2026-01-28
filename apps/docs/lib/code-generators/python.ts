import type { Endpoint, Schema } from '../openapi/types';
import {
  generateExample,
  generateParameterExample,
  generateRequestExample,
} from '../openapi/example-generator';

export function generatePython(
  endpoint: Endpoint,
  baseUrl: string = 'https://api.pachca.com/api/shared/v1'
): string {
  const url = `${baseUrl}${endpoint.path}`;
  const method = endpoint.method.toLowerCase();

  let code = `import requests\n\n`;

  // Add query parameters if any
  const queryParams = endpoint.parameters.filter((p) => p.in === 'query');
  if (queryParams.length > 0) {
    code += `params = {\n`;
    queryParams.forEach((p) => {
      const example = generateParameterExample(p);
      code += `    '${p.name}': ${pythonRepr(example)},\n`;
    });
    code += `}\n\n`;
  }

  // Add request body for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.requestBody) {
    // Используем явные примеры из OpenAPI (example/examples)
    const requestExample = generateRequestExample(endpoint.requestBody);
    const body =
      requestExample ||
      (endpoint.requestBody.content['application/json']?.schema
        ? generateExample(endpoint.requestBody.content['application/json'].schema)
        : null);

    if (body) {
      code += `data = ${pythonRepr(body)}\n\n`;
    }
  }

  // Make the request
  code += `headers = {\n`;
  code += `    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',\n`;
  code += `    'Content-Type': 'application/json'\n`;
  code += `}\n\n`;

  code += `response = requests.${method}(\n`;
  code += `    '${url}'`;

  if (queryParams.length > 0) {
    code += `,\n    params=params`;
  }

  code += `,\n    headers=headers`;

  if (['post', 'put', 'patch'].includes(method) && endpoint.requestBody) {
    code += `,\n    json=data`;
  }

  code += `\n)\n\n`;
  code += `print(response.json())`;

  return code;
}

function pythonRepr(obj: any, indent: number = 0): string {
  const indentStr = '    '.repeat(indent);
  const nextIndentStr = '    '.repeat(indent + 1);

  if (obj === null || obj === undefined) {
    return 'None';
  }

  if (typeof obj === 'boolean') {
    return obj ? 'True' : 'False';
  }

  if (typeof obj === 'string') {
    return `'${obj}'`;
  }

  if (typeof obj === 'number') {
    return String(obj);
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    const items = obj.map((item) => `${nextIndentStr}${pythonRepr(item, indent + 1)}`).join(',\n');
    return `[\n${items}\n${indentStr}]`;
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    const items = keys
      .map((key) => `${nextIndentStr}'${key}': ${pythonRepr(obj[key], indent + 1)}`)
      .join(',\n');
    return `{\n${items}\n${indentStr}}`;
  }

  return String(obj);
}
