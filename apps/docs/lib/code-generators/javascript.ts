import type { Endpoint } from '../openapi/types';
import {
  generateExample,
  generateParameterExample,
  generateRequestExample,
  generateMultipartExample,
} from '../openapi/example-generator';
import { requiresAuth, hasJsonContent, hasMultipartContent, resolveUrl } from './utils';

export function generateJavaScript(
  endpoint: Endpoint,
  baseUrl: string = 'https://api.pachca.com/api/shared/v1'
): string {
  const url = resolveUrl(endpoint, baseUrl);
  const method = endpoint.method;

  let code = `const response = await fetch('${url}'`;

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
    code = `const response = await fetch('${url}?${paramParts.join('&')}'`;
  }

  code += `, {\n  method: '${method}',`;

  // Multipart form-data
  if (['POST', 'PUT', 'PATCH'].includes(method) && hasMultipartContent(endpoint)) {
    const fields = generateMultipartExample(endpoint.requestBody);

    // headers — no Content-Type for multipart (browser sets it with boundary)
    code += `\n  headers: {`;
    if (requiresAuth(endpoint)) {
      code += `\n    'Authorization': 'Bearer YOUR_ACCESS_TOKEN'`;
    }
    code += `\n  }`;

    if (fields) {
      code += `,\n  body: formData`;
    }
    code += `\n});\n\n`;

    // FormData before fetch
    if (fields) {
      let formCode = `const formData = new FormData();\n`;
      for (const field of fields) {
        if (field.isFile) {
          formCode += `formData.append('${field.name}', fileInput.files[0]);\n`;
        } else {
          formCode += `formData.append('${field.name}', '${field.value}');\n`;
        }
      }
      formCode += `\n`;
      code = formCode + code;
    }

    code += `console.log(response.status);`;
  } else {
    // Add headers
    code += `\n  headers: {`;
    if (requiresAuth(endpoint)) {
      code += `\n    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',`;
    }
    if (hasJsonContent(endpoint)) {
      code += `\n    'Content-Type': 'application/json'`;
    }
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
  }

  return code;
}
