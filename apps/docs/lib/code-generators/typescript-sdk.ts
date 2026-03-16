import type { Endpoint } from '../openapi/types';
import type { ExampleOptions } from '../openapi/example-generator';
import { getSdkCallInfo, getRequestBodyExample, renderSdkBody, snakeToCamel } from './sdk-utils';

export function generateTypescriptSdk(
  endpoint: Endpoint,
  _baseUrl?: string,
  options?: ExampleOptions
): string {
  const info = getSdkCallInfo(endpoint);
  const lines: string[] = [];

  // Import
  lines.push('import { PachcaClient } from "@pachca/sdk";');
  lines.push('');
  lines.push('const pachca = new PachcaClient("YOUR_ACCESS_TOKEN");');
  lines.push('');

  // External URL endpoints: show full two-step flow
  if (info.externalUrl) {
    lines.push('// Шаг 1: получить параметры загрузки');
    lines.push('const params = await pachca.common.getUploadParams();');
    lines.push('');
    lines.push('// Шаг 2: загрузить файл (SDK собирает multipart автоматически)');
    lines.push(
      `await pachca.${info.service}.${info.methodName}(params.${snakeToCamel(info.externalUrl)}, { ...params, file });`
    );
    return lines.join('\n');
  }

  // Build method call
  const args: string[] = [];

  // Path params
  for (const p of info.pathParams) {
    args.push(String(p.example));
  }

  // Request body
  if (info.hasBody && !info.isMultipart) {
    const { data, schema } = getRequestBodyExample(endpoint, options);
    if (data) {
      const rendered = renderSdkBody(data, schema, {
        keyTransform: snakeToCamel,
        typeConstructor: (_name, inner) => `{${inner}}`,
        objectLiteral: (inner) => `{${inner}}`,
        stringLiteral: (v) => JSON.stringify(v),
        numberLiteral: (v) => String(v),
        booleanLiteral: (v) => String(v),
        nullLiteral: 'null',
        arrayLiteral: (items) => `[${items.join(', ')}]`,
        kvSep: ': ',
        indent: '  ',
      });
      args.push(rendered);
    }
  }

  const call = `pachca.${info.service}.${info.methodName}(${args.join(', ')})`;

  if (info.isVoid) {
    lines.push(`await ${call};`);
  } else {
    lines.push(`const result = await ${call};`);
    lines.push('console.log(result);');
  }

  if (info.paginated) {
    lines.push('');
    lines.push(`// Авто-пагинация: pachca.${info.service}.${info.methodName}All()`);
  }

  return lines.join('\n');
}
