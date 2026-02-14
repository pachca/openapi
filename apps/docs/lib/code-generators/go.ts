import type { Endpoint } from '../openapi/types';
import {
  generateExample,
  generateParameterExample,
  generateRequestExample,
  generateMultipartExample,
} from '../openapi/example-generator';
import { isRecord, requiresAuth, hasJsonContent, hasMultipartContent, resolveUrl } from './utils';

export function generateGo(
  endpoint: Endpoint,
  baseUrl: string = 'https://api.pachca.com/api/shared/v1'
): string {
  const url = resolveUrl(endpoint, baseUrl);
  const method = endpoint.method;

  // Multipart form-data
  if (['POST', 'PUT', 'PATCH'].includes(method) && hasMultipartContent(endpoint)) {
    const fields = generateMultipartExample(endpoint.requestBody);

    let code = `package main\n\n`;
    code += `import (\n`;
    code += `    "bytes"\n`;
    code += `    "fmt"\n`;
    code += `    "io"\n`;
    code += `    "mime/multipart"\n`;
    code += `    "net/http"\n`;
    code += `    "os"\n`;
    code += `)\n\n`;
    code += `func main() {\n`;
    code += `    var buf bytes.Buffer\n`;
    code += `    writer := multipart.NewWriter(&buf)\n\n`;

    if (fields) {
      for (const field of fields) {
        if (field.isFile) {
          code += `    file, _ := os.Open("${field.value}")\n`;
          code += `    defer file.Close()\n`;
          code += `    part, _ := writer.CreateFormFile("${field.name}", "${field.value}")\n`;
          code += `    io.Copy(part, file)\n\n`;
        } else {
          code += `    writer.WriteField("${field.name}", "${field.value}")\n`;
        }
      }
    }

    code += `    writer.Close()\n\n`;
    code += `    req, _ := http.NewRequest("${method}", "${url}", &buf)\n`;
    code += `    req.Header.Set("Content-Type", writer.FormDataContentType())\n`;
    if (requiresAuth(endpoint)) {
      code += `    req.Header.Set("Authorization", "Bearer YOUR_ACCESS_TOKEN")\n`;
    }
    code += `\n`;
    code += `    client := &http.Client{}\n`;
    code += `    resp, _ := client.Do(req)\n`;
    code += `    defer resp.Body.Close()\n\n`;
    code += `    fmt.Println(resp.StatusCode)\n`;
    code += `}`;

    return code;
  }

  let code = `package main\n\n`;
  code += `import (\n`;
  code += `    "bytes"\n`;
  code += `    "encoding/json"\n`;
  code += `    "fmt"\n`;
  code += `    "io"\n`;
  code += `    "net/http"\n`;
  code += `)\n\n`;
  code += `func main() {\n`;

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

  code += `    url := "${fullUrl}"\n\n`;

  // Build request body for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(method) && endpoint.requestBody) {
    // Используем явные примеры из OpenAPI (example/examples)
    const requestExample = generateRequestExample(endpoint.requestBody);
    const body =
      requestExample ||
      (endpoint.requestBody.content['application/json']?.schema
        ? generateExample(endpoint.requestBody.content['application/json'].schema)
        : null);

    if (body) {
      code += `    data := map[string]interface{}${goRepr(body)}\n`;
      code += `    jsonData, _ := json.Marshal(data)\n\n`;
      code += `    req, _ := http.NewRequest("${method}", url, bytes.NewBuffer(jsonData))\n`;
    } else {
      code += `    req, _ := http.NewRequest("${method}", url, nil)\n`;
    }
  } else {
    code += `    req, _ := http.NewRequest("${method}", url, nil)\n`;
  }

  if (requiresAuth(endpoint)) {
    code += `    req.Header.Set("Authorization", "Bearer YOUR_ACCESS_TOKEN")\n`;
  }
  if (hasJsonContent(endpoint)) {
    code += `    req.Header.Set("Content-Type", "application/json")\n`;
  }
  code += `\n`;

  code += `    client := &http.Client{}\n`;
  code += `    resp, _ := client.Do(req)\n`;
  code += `    defer resp.Body.Close()\n\n`;

  code += `    body, _ := io.ReadAll(resp.Body)\n`;
  code += `    fmt.Println(string(body))\n`;
  code += `}`;

  return code;
}

function goRepr(obj: unknown, indent: number = 0): string {
  const indentStr = '    '.repeat(indent);
  const nextIndentStr = '    '.repeat(indent + 1);

  if (obj === null || obj === undefined) {
    return 'nil';
  }

  if (typeof obj === 'boolean') {
    return obj ? 'true' : 'false';
  }

  if (typeof obj === 'string') {
    return `"${obj}"`;
  }

  if (typeof obj === 'number') {
    return String(obj);
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '{}';
    const items = obj.map((item) => `${nextIndentStr}${goRepr(item, indent + 1)}`).join(',\n');
    return `{\n${items},\n${indentStr}}`;
  }

  if (isRecord(obj)) {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    const items = keys
      .map((key) => `${nextIndentStr}"${key}": ${goRepr(obj[key], indent + 1)}`)
      .join(',\n');
    return `{\n${items},\n${indentStr}}`;
  }

  return String(obj);
}
