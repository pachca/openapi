import type { Endpoint } from '../openapi/types';
import {
  generateExample,
  generateParameterExample,
  generateRequestExample,
  generateMultipartExample,
} from '../openapi/example-generator';
import { requiresAuth, hasJsonContent, hasMultipartContent, resolveUrl } from './utils';

export function generateJava(
  endpoint: Endpoint,
  baseUrl: string = 'https://api.pachca.com/api/shared/v1'
): string {
  const url = resolveUrl(endpoint, baseUrl);
  const method = endpoint.method;

  // Multipart form-data
  if (['POST', 'PUT', 'PATCH'].includes(method) && hasMultipartContent(endpoint)) {
    const fields = generateMultipartExample(endpoint.requestBody);

    let code = `import java.net.http.*;\nimport java.net.URI;\nimport java.nio.file.*;\nimport java.util.*;\n\n`;
    code += `public class ApiRequest {\n`;
    code += `    public static void main(String[] args) throws Exception {\n`;
    code += `        String boundary = UUID.randomUUID().toString();\n\n`;

    code += `        var parts = new ArrayList<byte[]>();\n`;
    if (fields) {
      for (const field of fields) {
        if (field.isFile) {
          code += `        parts.add(("--" + boundary + "\\r\\nContent-Disposition: form-data; name=\\"${field.name}\\"; filename=\\"${field.value}\\"\\r\\nContent-Type: application/octet-stream\\r\\n\\r\\n").getBytes());\n`;
          code += `        parts.add(Files.readAllBytes(Path.of("${field.value}")));\n`;
          code += `        parts.add("\\r\\n".getBytes());\n`;
        } else {
          code += `        parts.add(("--" + boundary + "\\r\\nContent-Disposition: form-data; name=\\"${field.name}\\"\\r\\n\\r\\n${field.value}\\r\\n").getBytes());\n`;
        }
      }
    }
    code += `        parts.add(("--" + boundary + "--\\r\\n").getBytes());\n\n`;

    code += `        var body = parts.stream()\n`;
    code += `            .reduce(new byte[0], (a, b) -> {\n`;
    code += `                var result = new byte[a.length + b.length];\n`;
    code += `                System.arraycopy(a, 0, result, 0, a.length);\n`;
    code += `                System.arraycopy(b, 0, result, a.length, b.length);\n`;
    code += `                return result;\n`;
    code += `            });\n\n`;

    code += `        HttpClient client = HttpClient.newHttpClient();\n`;
    code += `        HttpRequest request = HttpRequest.newBuilder()\n`;
    code += `            .uri(URI.create("${url}"))\n`;
    if (requiresAuth(endpoint)) {
      code += `            .header("Authorization", "Bearer YOUR_ACCESS_TOKEN")\n`;
    }
    code += `            .header("Content-Type", "multipart/form-data; boundary=" + boundary)\n`;
    code += `            .method("${method}", HttpRequest.BodyPublishers.ofByteArray(body))\n`;
    code += `            .build();\n\n`;

    code += `        HttpResponse<String> response = client.send(request,\n`;
    code += `            HttpResponse.BodyHandlers.ofString());\n\n`;
    code += `        System.out.println(response.statusCode());\n`;
    code += `    }\n`;
    code += `}`;

    return code;
  }

  let code = `import java.net.http.*;\nimport java.net.URI;\n\n`;
  code += `public class ApiRequest {\n`;
  code += `    public static void main(String[] args) throws Exception {\n`;

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
  if (requiresAuth(endpoint)) {
    code += `            .header("Authorization", "Bearer YOUR_ACCESS_TOKEN")\n`;
  }
  if (hasJsonContent(endpoint)) {
    code += `            .header("Content-Type", "application/json")\n`;
  }
  code += `            .method("${method}", HttpRequest.BodyPublishers.ofString(${requestBody}))\n`;
  code += `            .build();\n\n`;

  code += `        HttpResponse<String> response = client.send(request,\n`;
  code += `            HttpResponse.BodyHandlers.ofString());\n\n`;
  code += `        System.out.println(response.body());\n`;
  code += `    }\n`;
  code += `}`;

  return code;
}
