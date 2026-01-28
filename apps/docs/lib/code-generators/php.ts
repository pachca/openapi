import type { Endpoint } from '../openapi/types';
import {
  generateExample,
  generateParameterExample,
  generateRequestExample,
} from '../openapi/example-generator';
import { isRecord } from './utils';

export function generatePHP(
  endpoint: Endpoint,
  baseUrl: string = 'https://api.pachca.com/api/shared/v1'
): string {
  const url = `${baseUrl}${endpoint.path}`;
  const method = endpoint.method;

  let code = `<?php\n\n`;

  // Add query parameters if any
  const queryParams = endpoint.parameters.filter((p) => p.in === 'query');
  let fullUrl = url;
  if (queryParams.length > 0) {
    const params = queryParams
      .map((p) => {
        const example = generateParameterExample(p);
        return `'${p.name}' => ${phpRepr(example)}`;
      })
      .join(', ');
    code += `$params = [${params}];\n`;
    fullUrl = `${url}?' . http_build_query($params)`;
  }

  code += `$curl = curl_init();\n\n`;

  code += `curl_setopt_array($curl, [\n`;
  code += `    CURLOPT_URL => '${fullUrl}',\n`;
  code += `    CURLOPT_RETURNTRANSFER => true,\n`;
  code += `    CURLOPT_CUSTOMREQUEST => '${method}',\n`;
  code += `    CURLOPT_HTTPHEADER => [\n`;
  code += `        'Authorization: Bearer YOUR_ACCESS_TOKEN',\n`;
  code += `        'Content-Type: application/json',\n`;
  code += `    ],\n`;

  // Add request body for POST/PUT/PATCH
  if (['POST', 'PUT', 'PATCH'].includes(method) && endpoint.requestBody) {
    // Используем явные примеры из OpenAPI (example/examples)
    const requestExample = generateRequestExample(endpoint.requestBody);
    const body =
      requestExample ||
      (endpoint.requestBody.content['application/json']?.schema
        ? generateExample(endpoint.requestBody.content['application/json'].schema)
        : null);

    if (body) {
      code += `    CURLOPT_POSTFIELDS => json_encode(${phpRepr(body)}),\n`;
    }
  }

  code += `]);\n\n`;
  code += `$response = curl_exec($curl);\n`;
  code += `curl_close($curl);\n\n`;
  code += `echo $response;\n`;
  code += `?>`;

  return code;
}

function phpRepr(obj: unknown, indent: number = 0): string {
  const indentStr = '    '.repeat(indent);
  const nextIndentStr = '    '.repeat(indent + 1);

  if (obj === null || obj === undefined) {
    return 'null';
  }

  if (typeof obj === 'boolean') {
    return obj ? 'true' : 'false';
  }

  if (typeof obj === 'string') {
    return `'${obj}'`;
  }

  if (typeof obj === 'number') {
    return String(obj);
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    const items = obj.map((item) => `${nextIndentStr}${phpRepr(item, indent + 1)}`).join(',\n');
    return `[\n${items}\n${indentStr}]`;
  }

  if (isRecord(obj)) {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '[]';
    const items = keys
      .map((key) => `${nextIndentStr}'${key}' => ${phpRepr(obj[key], indent + 1)}`)
      .join(',\n');
    return `[\n${items}\n${indentStr}]`;
  }

  return String(obj);
}
