import type { Endpoint } from '../openapi/types';
import type { ExampleOptions } from '../openapi/example-generator';
import { getSdkCallInfo, getRequestBodyExample, renderSdkBody, snakeToCamel } from './sdk-utils';

export function generateSwiftSdk(
  endpoint: Endpoint,
  _baseUrl?: string,
  options?: ExampleOptions
): string {
  const info = getSdkCallInfo(endpoint);
  const lines: string[] = [];

  // External URL endpoints: show full two-step flow
  if (info.externalUrl) {
    lines.push('import PachcaSDK');
    lines.push('');
    lines.push('let pachca = PachcaClient(token: "YOUR_ACCESS_TOKEN")');
    lines.push('');
    lines.push('// Шаг 1: получить параметры загрузки');
    lines.push('let params = try await pachca.common.getUploadParams()');
    lines.push('');
    lines.push('// Шаг 2: загрузить файл (SDK собирает multipart автоматически)');
    lines.push('let fileData = try Data(contentsOf: URL(fileURLWithPath: "report.pdf"))');
    lines.push(`try await pachca.${info.service}.${info.methodName}(`);
    lines.push(`    ${snakeToCamel(info.externalUrl)}: params.${snakeToCamel(info.externalUrl)},`);
    lines.push('    request: FileUploadRequest(');
    lines.push('        contentDisposition: params.contentDisposition,');
    lines.push('        acl: params.acl, policy: params.policy,');
    lines.push('        xAmzCredential: params.xAmzCredential,');
    lines.push('        xAmzAlgorithm: params.xAmzAlgorithm,');
    lines.push('        xAmzDate: params.xAmzDate,');
    lines.push('        xAmzSignature: params.xAmzSignature,');
    lines.push('        key: params.key, file: fileData');
    lines.push('    )');
    lines.push(')');
    return lines.join('\n');
  }

  lines.push('import PachcaSDK');
  lines.push('');
  lines.push('let pachca = PachcaClient(token: "YOUR_ACCESS_TOKEN")');
  lines.push('');

  // Build method call
  const args: string[] = [];

  // Path params — Swift uses labels: pinMessage(id: 123)
  for (const p of info.pathParams) {
    args.push(`${p.sdkName}: ${String(p.example)}`);
  }

  // Request body — Swift uses "request:" label
  if (info.hasBody && !info.isMultipart) {
    const { data, schema } = getRequestBodyExample(endpoint, options);
    if (data) {
      const rendered = renderSdkBody(data, schema, {
        keyTransform: snakeToCamel,
        typeConstructor: (name, inner) => `${name}(${inner})`,
        objectLiteral: (inner) => `[${inner}]`,
        stringLiteral: (v) => JSON.stringify(v),
        numberLiteral: (v) => String(v),
        booleanLiteral: (v) => String(v),
        nullLiteral: 'nil',
        arrayLiteral: (items) => `[${items.join(', ')}]`,
        kvSep: ': ',
        indent: '    ',
      });
      args.push(`request: ${rendered}`);
    }
  }

  const call = `pachca.${info.service}.${info.methodName}(${args.join(', ')})`;

  if (info.isVoid) {
    lines.push(`try await ${call}`);
  } else {
    lines.push(`let result = try await ${call}`);
    lines.push('print(result)');
  }

  if (info.paginated) {
    lines.push('');
    lines.push(`// Авто-пагинация: pachca.${info.service}.${info.methodName}All()`);
  }

  return lines.join('\n');
}
