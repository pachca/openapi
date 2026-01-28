import type { Endpoint } from '../openapi/types';
import {
  generateExample,
  generateParameterExample,
  generateRequestExample,
} from '../openapi/example-generator';

export function generateJava(
  endpoint: Endpoint,
  baseUrl: string = 'https://api.pachca.com/api/shared/v1'
): string {
  const url = `${baseUrl}${endpoint.path}`;
  const method = endpoint.method;

  let code = `import java.net.http.*;\nimport java.net.URI;\n\n`;
  code += `public class ApiRequest {\n`;
  code += `    public static void main(String[] args) throws Exception {\n`;

  // Add query parameters if any
  const queryParams = endpoint.parameters.filter((p) => p.in === 'query');
  let fullUrl = url;
  if (queryParams.length > 0) {
    const params = queryParams
      .map((p) => {
        const example = generateParameterExample(p);
        return `${p.name}=${example}`;
      })
      .join('&');
    fullUrl = `${url}?${params}`;
  }

  // Build request body for POST/PUT/PATCH
  let requestBody = '""';
  if (['POST', 'PUT', 'PATCH'].includes(method) && endpoint.requestBody) {
    // Используем явные примеры из OpenAPI (example/examples)
    const requestExample = generateRequestExample(endpoint.requestBody);
    const body =
      requestExample ||
      (endpoint.requestBody.content['application/json']?.schema
        ? generateExample(endpoint.requestBody.content['application/json'].schema)
        : null);

    if (body) {
      const jsonBody = JSON.stringify(body, null, 12).replace(/\n/g, '\n            ');
      requestBody = `"""
            ${jsonBody}
            """`;
    }
  }

  code += `        HttpClient client = HttpClient.newHttpClient();\n`;
  code += `        HttpRequest request = HttpRequest.newBuilder()\n`;
  code += `            .uri(URI.create("${fullUrl}"))\n`;
  code += `            .header("Authorization", "Bearer YOUR_ACCESS_TOKEN")\n`;
  code += `            .header("Content-Type", "application/json")\n`;
  code += `            .method("${method}", HttpRequest.BodyPublishers.ofString(${requestBody}))\n`;
  code += `            .build();\n\n`;

  code += `        HttpResponse<String> response = client.send(request,\n`;
  code += `            HttpResponse.BodyHandlers.ofString());\n\n`;
  code += `        System.out.println(response.body());\n`;
  code += `    }\n`;
  code += `}`;

  return code;
}
