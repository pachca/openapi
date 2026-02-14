import type { Endpoint } from '../openapi/types';
import {
  generateExample,
  generateParameterExample,
  generateRequestExample,
  generateMultipartExample,
} from '../openapi/example-generator';
import { requiresAuth, hasMultipartContent, resolveUrl } from './utils';

export function generateDotNet(
  endpoint: Endpoint,
  baseUrl: string = 'https://api.pachca.com/api/shared/v1'
): string {
  const url = resolveUrl(endpoint, baseUrl);
  const method = endpoint.method;

  let code = `using System;\nusing System.Net.Http;\nusing System.Net.Http.Headers;\nusing System.Text;\nusing System.Threading.Tasks;\n\n`;
  code += `class Program\n{\n`;
  code += `    static async Task Main(string[] args)\n    {\n`;
  code += `        using var client = new HttpClient();\n\n`;

  // Add authentication
  if (requiresAuth(endpoint)) {
    code += `        client.DefaultRequestHeaders.Authorization = \n`;
    code += `            new AuthenticationHeaderValue("Bearer", "YOUR_ACCESS_TOKEN");\n\n`;
  }

  // Add query parameters if any
  const queryParams = endpoint.parameters.filter((p) => p.in === 'query');
  let fullUrl = url;
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
    fullUrl = `${url}?${paramParts.join('&')}`;
  }

  // Multipart form-data
  if (['POST', 'PUT', 'PATCH'].includes(method) && hasMultipartContent(endpoint)) {
    const fields = generateMultipartExample(endpoint.requestBody);

    code += `        using var content = new MultipartFormDataContent();\n`;
    if (fields) {
      for (const field of fields) {
        if (field.isFile) {
          code += `        var fileStream = File.OpenRead("${field.value}");\n`;
          code += `        content.Add(new StreamContent(fileStream), "${field.name}", "${field.value}");\n`;
        } else {
          code += `        content.Add(new StringContent("${field.value}"), "${field.name}");\n`;
        }
      }
    }
    code += `\n`;

    const methodLower = method.toLowerCase();
    const methodCapitalized = methodLower.charAt(0).toUpperCase() + methodLower.slice(1);
    code += `        var response = await client.${methodCapitalized}Async(\n`;
    code += `            "${fullUrl}", content);\n`;
  } else if (['POST', 'PUT', 'PATCH'].includes(method) && endpoint.requestBody) {
    // Build request body for POST/PUT/PATCH
    // Используем явные примеры из OpenAPI (example/examples)
    const requestExample = generateRequestExample(endpoint.requestBody);
    const body =
      requestExample ||
      (endpoint.requestBody.content['application/json']?.schema
        ? generateExample(endpoint.requestBody.content['application/json'].schema)
        : null);

    if (body) {
      const jsonBody = JSON.stringify(body, null, 12).replace(/\n/g, '\n            ');
      code += `        var json = @"\n            ${jsonBody}\n            ";\n`;
      code += `        var content = new StringContent(json, Encoding.UTF8, "application/json");\n\n`;

      const methodLower = method.toLowerCase();
      const methodCapitalized = methodLower.charAt(0).toUpperCase() + methodLower.slice(1);
      code += `        var response = await client.${methodCapitalized}Async(\n`;
      code += `            "${fullUrl}", content);\n`;
    } else {
      code += `        var response = await client.GetAsync("${fullUrl}");\n`;
    }
  } else {
    code += `        var response = await client.GetAsync("${fullUrl}");\n`;
  }

  code += `        var result = await response.Content.ReadAsStringAsync();\n`;
  code += `        Console.WriteLine(result);\n`;
  code += `    }\n`;
  code += `}`;

  return code;
}
