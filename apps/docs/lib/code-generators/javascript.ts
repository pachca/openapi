import type { Endpoint } from '../openapi/types';
import { generateRequestExample, generateMultipartExample } from '../openapi/example-generator';
import {
  requiresAuth,
  hasJsonContent,
  hasMultipartContent,
  resolveUrl,
  buildQueryString,
} from './utils';

export function generateJavaScript(
  endpoint: Endpoint,
  baseUrl: string = 'https://api.pachca.com/api/shared/v1'
): string {
  const url = resolveUrl(endpoint, baseUrl);
  const method = endpoint.method;

  const qs = buildQueryString(endpoint);
  let code = `const response = await fetch('${url}${qs ? `?${qs}` : ''}'`;

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
      const requestExample = generateRequestExample(endpoint.requestBody);

      if (requestExample) {
        code += `,\n  body: JSON.stringify(${JSON.stringify(requestExample, null, 4).replace(/\n/g, '\n  ')})`;
      }
    }

    code += `\n});\n\n`;
    code += `const data = await response.json();\n`;
    code += `console.log(data);`;
  }

  return code;
}
