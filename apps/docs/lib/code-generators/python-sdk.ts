import type { Endpoint } from '../openapi/types';
import type { ExampleOptions } from '../openapi/example-generator';
import { getSdkCallInfo, getRequestBodyExample, renderSdkBody } from './sdk-utils';

function pythonRepr(value: string): string {
  return JSON.stringify(value);
}

export function generatePythonSdk(
  endpoint: Endpoint,
  _baseUrl?: string,
  options?: ExampleOptions
): string {
  const info = getSdkCallInfo(endpoint);
  const lines: string[] = [];

  // External URL endpoints: show full two-step flow
  if (info.externalUrl) {
    const pyUrl = info.externalUrl
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '');
    lines.push('from pachca.client import PachcaClient');
    lines.push('from pachca.models import FileUploadRequest');
    lines.push('');
    lines.push('client = PachcaClient("YOUR_ACCESS_TOKEN")');
    lines.push('');
    lines.push('# Шаг 1: получить параметры загрузки');
    lines.push(`params = await client.common.get_upload_params()`);
    lines.push('');
    lines.push('# Шаг 2: загрузить файл (SDK собирает multipart автоматически)');
    lines.push(
      `await client.${info.servicePython}.${info.methodNamePython}(params.${pyUrl}, FileUploadRequest(**vars(params), file=file_data))`
    );
    return lines.join('\n');
  }

  // Collect type names for models import
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
        keyTransform: (key) => key, // Python SDK uses snake_case (original keys)
        typeConstructor: (name, inner) => {
          if (!typeNames.includes(name)) typeNames.push(name);
          return `${name}(${inner})`;
        },
        objectLiteral: (inner) => `{${inner}}`,
        stringLiteral: pythonRepr,
        numberLiteral: (v) => String(v),
        booleanLiteral: (v) => (v ? 'True' : 'False'),
        nullLiteral: 'None',
        arrayLiteral: (items) => `[${items.join(', ')}]`,
        kvSep: '=',
        indent: '    ',
      });
      args.push(rendered);
    }
  }

  // Assemble imports
  lines.push('from pachca.client import PachcaClient');
  if (typeNames.length > 0) {
    lines.push(`from pachca.models import ${typeNames.join(', ')}`);
  }
  lines.push('');
  lines.push('client = PachcaClient("YOUR_ACCESS_TOKEN")');
  lines.push('');

  const call = `client.${info.servicePython}.${info.methodNamePython}(${args.join(', ')})`;

  if (info.isVoid) {
    lines.push(`await ${call}`);
  } else {
    lines.push(`result = await ${call}`);
    lines.push('print(result)');
  }

  if (info.paginated) {
    lines.push('');
    lines.push(`# Авто-пагинация: client.${info.servicePython}.${info.methodNamePython}_all()`);
  }

  return lines.join('\n');
}
