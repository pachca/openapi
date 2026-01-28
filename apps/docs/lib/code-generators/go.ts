import type { Endpoint } from '../openapi/types';
import {
  generateExample,
  generateParameterExample,
  generateRequestExample,
} from '../openapi/example-generator';
import { isRecord } from './utils';

export function generateGo(
  endpoint: Endpoint,
  baseUrl: string = 'https://api.pachca.com/api/shared/v1'
): string {
  const url = `${baseUrl}${endpoint.path}`;
  const method = endpoint.method;

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
    const params = queryParams
      .map((p) => {
        const example = generateParameterExample(p);
        return `${p.name}=${example}`;
      })
      .join('&');
    fullUrl = `${url}?${params}`;
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

  code += `    req.Header.Set("Authorization", "Bearer YOUR_ACCESS_TOKEN")\n`;
  code += `    req.Header.Set("Content-Type", "application/json")\n\n`;

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
