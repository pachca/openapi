import type { Endpoint } from '../openapi/types';
import type { ExampleOptions } from '../openapi/example-generator';
import { getSdkCallInfo, getRequestBodyExample, renderSdkBody, snakeToCamel } from './sdk-utils';

export function generateKotlinSdk(
  endpoint: Endpoint,
  _baseUrl?: string,
  options?: ExampleOptions
): string {
  const info = getSdkCallInfo(endpoint);
  const lines: string[] = [];
  // External URL endpoints: show full two-step flow
  if (info.externalUrl) {
    lines.push('import com.pachca.sdk.PachcaClient');
    lines.push('import com.pachca.sdk.FileUploadRequest');
    lines.push('');
    lines.push('val client = PachcaClient("YOUR_ACCESS_TOKEN")');
    lines.push('');
    lines.push('// Шаг 1: получить параметры загрузки');
    lines.push('val params = client.common.getUploadParams()');
    lines.push('');
    lines.push('// Шаг 2: загрузить файл (SDK собирает multipart автоматически)');
    lines.push(
      `client.${info.service}.${info.methodName}(params.${snakeToCamel(info.externalUrl)}, FileUploadRequest(`
    );
    lines.push('    contentDisposition = params.contentDisposition,');
    lines.push('    acl = params.acl, policy = params.policy,');
    lines.push('    xAmzCredential = params.xAmzCredential,');
    lines.push('    xAmzAlgorithm = params.xAmzAlgorithm,');
    lines.push('    xAmzDate = params.xAmzDate,');
    lines.push('    xAmzSignature = params.xAmzSignature,');
    lines.push('    key = params.key, file = fileBytes,');
    lines.push('))');
    return lines.join('\n');
  }

  const imports: string[] = ['PachcaClient'];

  // Collect type names for imports
  const typeNames: string[] = [];

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
        typeConstructor: (name, inner) => {
          if (!typeNames.includes(name)) typeNames.push(name);
          return `${name}(${inner})`;
        },
        objectLiteral: (inner) => `mapOf(${inner})`,
        stringLiteral: (v) => JSON.stringify(v),
        numberLiteral: (v) => String(v),
        booleanLiteral: (v) => String(v),
        nullLiteral: 'null',
        arrayLiteral: (items) => `listOf(${items.join(', ')})`,
        kvSep: ' = ',
        indent: '    ',
      });
      args.push(rendered);
    }
  }

  // Assemble imports — each on its own line (Kotlin requires separate import statements)
  imports.push(...typeNames);
  for (const name of imports) {
    lines.push(`import com.pachca.sdk.${name}`);
  }
  lines.push('');
  lines.push('val client = PachcaClient("YOUR_ACCESS_TOKEN")');
  lines.push('');

  const call = `client.${info.service}.${info.methodName}(${args.join(', ')})`;

  if (info.isVoid) {
    lines.push(`${call}`);
  } else {
    lines.push(`val result = ${call}`);
    lines.push('println(result)');
  }

  if (info.paginated) {
    lines.push('');
    lines.push(`// Авто-пагинация: client.${info.service}.${info.methodName}All()`);
  }

  return lines.join('\n');
}
