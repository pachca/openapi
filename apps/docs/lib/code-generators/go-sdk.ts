import type { Endpoint } from '../openapi/types';
import type { ExampleOptions } from '../openapi/example-generator';
import { getSdkCallInfo, getRequestBodyExample, renderSdkBody, goName } from './sdk-utils';

export function generateGoSdk(
  endpoint: Endpoint,
  _baseUrl?: string,
  options?: ExampleOptions
): string {
  const info = getSdkCallInfo(endpoint);
  const lines: string[] = [];

  // External URL endpoints: show full two-step flow
  if (info.externalUrl) {
    const goField = info.externalUrl.charAt(0).toUpperCase() + info.externalUrl.slice(1);
    lines.push('package main');
    lines.push('');
    lines.push('import (');
    lines.push('    "context"');
    lines.push('    "log"');
    lines.push('    "os"');
    lines.push('');
    lines.push('    pachca "github.com/pachca/openapi/sdk/go/generated"');
    lines.push(')');
    lines.push('');
    lines.push('func main() {');
    lines.push('    client := pachca.NewPachcaClient("YOUR_ACCESS_TOKEN")');
    lines.push('    ctx := context.Background()');
    lines.push('');
    lines.push('    // Шаг 1: получить параметры загрузки');
    lines.push('    params, err := client.Common.GetUploadParams(ctx)');
    lines.push('    if err != nil {');
    lines.push('        log.Fatal(err)');
    lines.push('    }');
    lines.push('');
    lines.push('    // Шаг 2: загрузить файл (SDK собирает multipart автоматически)');
    lines.push('    file, _ := os.Open("report.pdf")');
    lines.push(
      `    err = client.${info.serviceGo}.${info.methodNameGo}(ctx, params.${goField}, pachca.FileUploadRequest{`
    );
    lines.push('        ContentDisposition: params.ContentDisposition,');
    lines.push('        ACL: params.ACL, Policy: params.Policy,');
    lines.push('        XAMZCredential: params.XAMZCredential,');
    lines.push('        XAMZAlgorithm: params.XAMZAlgorithm,');
    lines.push('        XAMZDate: params.XAMZDate,');
    lines.push('        XAMZSignature: params.XAMZSignature,');
    lines.push('        Key: params.Key, File: file,');
    lines.push('    })');
    lines.push('    if err != nil {');
    lines.push('        log.Fatal(err)');
    lines.push('    }');
    lines.push('}');
    return lines.join('\n');
  }

  lines.push('package main');
  lines.push('');
  lines.push('import (');
  lines.push('    "context"');
  if (!info.isVoid) {
    lines.push('    "fmt"');
  }
  lines.push('    "log"');
  lines.push('');
  lines.push('    pachca "github.com/pachca/openapi/sdk/go/generated"');
  lines.push(')');
  lines.push('');
  lines.push('func main() {');
  lines.push('    client := pachca.NewPachcaClient("YOUR_ACCESS_TOKEN")');
  lines.push('');

  // Build method call
  const args: string[] = ['context.Background()'];

  // Path params
  for (const p of info.pathParams) {
    args.push(String(p.example));
  }

  // Request body
  if (info.hasBody && !info.isMultipart) {
    const { data, schema } = getRequestBodyExample(endpoint, options);
    if (data) {
      const rendered = renderSdkBody(data, schema, {
        keyTransform: goName,
        typeConstructor: (name, inner) => `pachca.${name}{${inner}}`,
        objectLiteral: (inner) => `map[string]interface{}{${inner}}`,
        stringLiteral: (v) => JSON.stringify(v),
        numberLiteral: (v) => String(v),
        booleanLiteral: (v) => String(v),
        nullLiteral: 'nil',
        arrayLiteral: (items) => `[]interface{}{${items.join(', ')}}`,
        kvSep: ': ',
        indent: '        ',
        trailingComma: true,
      });
      args.push(rendered);
    }
  }

  const call = `client.${info.serviceGo}.${info.methodNameGo}(${args.join(', ')})`;

  if (info.isVoid) {
    lines.push(`    err := ${call}`);
    lines.push('    if err != nil {');
    lines.push('        log.Fatal(err)');
    lines.push('    }');
  } else {
    lines.push(`    result, err := ${call}`);
    lines.push('    if err != nil {');
    lines.push('        log.Fatal(err)');
    lines.push('    }');
    lines.push('    fmt.Println(result)');
  }

  if (info.paginated) {
    lines.push('');
    lines.push(`    // Авто-пагинация: client.${info.serviceGo}.${info.methodNameGo}All()`);
  }

  lines.push('}');

  return lines.join('\n');
}
