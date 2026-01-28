import type { Endpoint, Schema } from '../openapi/types';
import {
  generateExample,
  generateParameterExample,
  generateRequestExample,
} from '../openapi/example-generator';

export function generateRuby(
  endpoint: Endpoint,
  baseUrl: string = 'https://api.pachca.com/api/shared/v1'
): string {
  const url = `${baseUrl}${endpoint.path}`;
  const method = endpoint.method.toLowerCase();

  let code = `require 'net/http'\nrequire 'json'\n\n`;

  // Parse URI
  code += `uri = URI('${url}')\n`;

  // Add query parameters if any
  const queryParams = endpoint.parameters.filter((p) => p.in === 'query');
  if (queryParams.length > 0) {
    code += `params = {\n`;
    queryParams.forEach((p) => {
      const example = generateParameterExample(p);
      code += `  '${p.name}' => ${rubyRepr(example)},\n`;
    });
    code += `}\n`;
    code += `uri.query = URI.encode_www_form(params)\n\n`;
  }

  // Create request
  const methodCapitalized = method.charAt(0).toUpperCase() + method.slice(1);
  code += `request = Net::HTTP::${methodCapitalized}.new(uri)\n`;

  // Add authentication
  code += `request['Authorization'] = 'Bearer YOUR_ACCESS_TOKEN'\n`;
  code += `request['Content-Type'] = 'application/json'\n`;

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
      code += `\nrequest.body = ${rubyRepr(body)}.to_json\n`;
    }
  }

  code += `\nresponse = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|\n`;
  code += `  http.request(request)\n`;
  code += `end\n\n`;
  code += `puts JSON.parse(response.body)`;

  return code;
}

function rubyRepr(obj: any, indent: number = 0): string {
  const indentStr = '  '.repeat(indent);
  const nextIndentStr = '  '.repeat(indent + 1);

  if (obj === null || obj === undefined) {
    return 'nil';
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
    const items = obj.map((item) => `${nextIndentStr}${rubyRepr(item, indent + 1)}`).join(',\n');
    return `[\n${items}\n${indentStr}]`;
  }

  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    const items = keys
      .map((key) => `${nextIndentStr}'${key}' => ${rubyRepr(obj[key], indent + 1)}`)
      .join(',\n');
    return `{\n${items}\n${indentStr}}`;
  }

  return String(obj);
}
