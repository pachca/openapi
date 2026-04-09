import {
  shouldUnwrapBody,
  type IR,
  type IREnum,
  type IRModel,
  type IRUnion,
  type IRField,
  type IRFieldType,
  type IRService,
  type IROperation,
  type IRParam,
  type IRResponseType,
} from '../ir.js';
import { buildModelIndex, collectTypeRefs, type GeneratedFile, type GenerateOptions, type LanguageGenerator } from './types.js';
import {
  snakeToCamel,
  snakeToPascal,
  snakeToUpperSnake,
  tagToProperty,
  tagToServiceName,
  serviceToImplName,
} from '../naming.js';

const CSHARP_KEYWORDS = new Set([
  'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch',
  'char', 'checked', 'class', 'const', 'continue', 'decimal', 'default',
  'delegate', 'do', 'double', 'else', 'enum', 'event', 'explicit',
  'extern', 'false', 'finally', 'fixed', 'float', 'for', 'foreach',
  'goto', 'if', 'implicit', 'in', 'int', 'interface', 'internal', 'is',
  'lock', 'long', 'namespace', 'new', 'null', 'object', 'operator',
  'out', 'override', 'params', 'private', 'protected', 'public',
  'readonly', 'ref', 'return', 'sbyte', 'sealed', 'short', 'sizeof',
  'stackalloc', 'static', 'string', 'struct', 'switch', 'this', 'throw',
  'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe',
  'ushort', 'using', 'virtual', 'void', 'volatile', 'while',
]);

// ── Helpers ──────────────────────────────────────────────────────────

/** BCL type names that conflict with common using directives in Client.cs */
const CS_BCL_CONFLICTS = new Set(['Task', 'Thread']);

/** Fully-qualify type names that conflict with BCL types imported in Client.cs */
function csClientTypeRef(name: string): string {
  return CS_BCL_CONFLICTS.has(name) ? `Pachca.Sdk.${name}` : name;
}

/** Sanitize enum member value into a valid C# identifier (PascalCase) */
function csEnumMemberName(value: string): string {
  return snakeToPascal(value.replace(/[^a-zA-Z0-9_]/g, '_'));
}

function csType(ft: IRFieldType): string {
  switch (ft.kind) {
    case 'primitive':
      if (ft.primitive === 'integer')
        return ft.format === 'int64' ? 'long' : 'int';
      if (ft.primitive === 'number') return 'double';
      if (ft.primitive === 'boolean') return 'bool';
      if (ft.primitive === 'any') return 'object';
      if (ft.primitive === 'string') {
        if (ft.format === 'date-time') return 'DateTimeOffset';
      }
      return 'string';
    case 'enum':
    case 'model':
      return ft.ref ?? 'object';
    case 'array':
      return `List<${csType(ft.items!)}>`;
    case 'record':
      return `Dictionary<string, ${csType(ft.valueType!)}>`;
    case 'union':
      return ft.ref ?? 'object';
    case 'literal':
      return 'string';
    case 'binary':
      return 'byte[]';
  }
}

/** Whether a type is a C# value type (needs ? for nullable) */
function isValueType(ft: IRFieldType): boolean {
  if (ft.kind === 'primitive') {
    if (ft.primitive === 'integer' || ft.primitive === 'number' || ft.primitive === 'boolean') return true;
    if (ft.primitive === 'string' && ft.format === 'date-time') return true;
  }
  if (ft.kind === 'enum') return true;
  return false;
}

function fieldSdkName(field: IRField): string {
  let name: string;
  if (field.name.includes('-')) {
    name = field.name.replace(/-([a-zA-Z])/g, (_, c) => c.toUpperCase());
    name = name.charAt(0).toUpperCase() + name.slice(1);
  } else {
    name = snakeToPascal(field.name);
  }
  if (CSHARP_KEYWORDS.has(name.toLowerCase())) return `@${name}`;
  return name;
}

function paramSdkName(name: string): string {
  const camel = snakeToCamel(name);
  if (CSHARP_KEYWORDS.has(camel)) return `@${camel}`;
  return camel;
}

function csDefaultValue(
  value: unknown,
  type: IRFieldType,
): string | null {
  if (value === null) return 'null';

  if (type.kind === 'enum' && typeof value === 'string') {
    const enumType = csType(type);
    return `${enumType}.${csEnumMemberName(value)}`;
  }

  if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`;
  if (typeof value === 'number') {
    if (type.kind === 'primitive' && type.primitive === 'integer' && type.format === 'int64') {
      return `${value}L`;
    }
    if (type.kind === 'primitive' && type.primitive === 'number') {
      return `${value}d`;
    }
    return String(value);
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';

  if (Array.isArray(value) && type.kind === 'array') {
    if (value.length === 0) return `new List<${csType(type.items!)}>()`;
    return null;
  }

  return null;
}

/** Build value expression for a query parameter, handling type-specific serialization */
function queryParamValueExpr(p: IRParam): string {
  const paramName = paramSdkName(p.sdkName);
  const valueSuffix = isValueType(p.type) && !p.required ? '.Value' : '';
  if (p.type.kind === 'primitive' && p.type.primitive === 'boolean')
    return `(${paramName}${valueSuffix} ? "true" : "false")`;
  if (p.type.kind === 'primitive' && p.type.primitive === 'string' && p.type.format === 'date-time')
    return `${paramName}${valueSuffix}.ToString("o")`;
  if (p.type.kind === 'enum')
    return `PachcaUtils.EnumToApiString(${paramName}${valueSuffix})`;
  if (p.type.kind === 'primitive' && p.type.primitive === 'string')
    return paramName;
  return `${paramName}${valueSuffix}.ToString()!`;
}

/** Check if ApiError model exists in IR */
function hasApiErrorModel(ir: IR): boolean {
  return ir.models.some((m) => m.name === 'ApiError');
}

// ── Models.cs ────────────────────────────────────────────────────────

function generateModels(ir: IR): string {
  const lines: string[] = [];
  const unionMemberRefs = new Set<string>();
  for (const u of ir.unions) {
    for (const ref of u.memberRefs) unionMemberRefs.add(ref);
  }

  // Collect data wrapper refs
  const dataWrapperRefs = new Set<string>();
  for (const svc of ir.services) {
    for (const op of svc.operations) {
      if (op.successResponse.isUnwrap && op.successResponse.dataRef) {
        dataWrapperRefs.add(op.successResponse.dataRef);
      }
    }
  }

  // Header
  lines.push('#nullable enable');
  lines.push('');
  lines.push('using System;');
  lines.push('using System.Collections.Generic;');
  lines.push('using System.Linq;');
  lines.push('using System.Text.Json;');
  lines.push('using System.Text.Json.Serialization;');
  lines.push('');
  lines.push('namespace Pachca.Sdk;');

  // Enums
  for (const e of ir.enums) {
    lines.push('');
    emitEnum(lines, e);
  }

  // Unions
  for (const u of ir.unions) {
    lines.push('');
    emitUnion(lines, u, ir);
  }

  // Models (skip union members)
  for (const m of ir.models) {
    if (unionMemberRefs.has(m.name)) continue;
    for (const inl of m.inlineObjects) {
      lines.push('');
      emitModel(lines, inl, ir.models);
    }
    lines.push('');
    emitModel(lines, m, ir.models);
  }

  // Response types
  for (const rt of ir.responses) {
    lines.push('');
    emitResponseType(lines, rt);
  }

  // Data wrappers
  for (const ref of dataWrapperRefs) {
    lines.push('');
    lines.push(`public class ${ref}DataWrapper`);
    lines.push('{');
    lines.push(`    [JsonPropertyName("data")]`);
    lines.push(`    public ${ref} Data { get; set; } = default!;`);
    lines.push('}');
  }

  lines.push('');
  return lines.join('\n');
}

function emitEnum(lines: string[], e: IREnum): void {
  if (e.description && e.hasDescriptions && e.members.length > 1) {
    lines.push(`/// <summary>${e.description}</summary>`);
  }
  lines.push(`[JsonConverter(typeof(${e.name}Converter))]`);
  lines.push(`public enum ${e.name}`);
  lines.push('{');
  for (const m of e.members) {
    if (m.description) {
      lines.push(`    /// <summary>${m.description}</summary>`);
    }
    lines.push(`    ${csEnumMemberName(m.value)},`);
  }
  lines.push('}');
  lines.push('');
  emitEnumConverter(lines, e);
}

function emitEnumConverter(lines: string[], e: IREnum): void {
  lines.push(`internal class ${e.name}Converter : JsonConverter<${e.name}>`);
  lines.push('{');
  lines.push(`    public override ${e.name} Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)`);
  lines.push('    {');
  lines.push('        var value = reader.GetString();');
  lines.push('        return value switch');
  lines.push('        {');
  for (const m of e.members) {
    lines.push(`            "${m.value}" => ${e.name}.${csEnumMemberName(m.value)},`);
  }
  lines.push(`            _ => throw new JsonException($"Unknown ${e.name} value: {value}"),`);
  lines.push('        };');
  lines.push('    }');
  lines.push('');
  lines.push(`    public override void Write(Utf8JsonWriter writer, ${e.name} value, JsonSerializerOptions options)`);
  lines.push('    {');
  lines.push('        var str = value switch');
  lines.push('        {');
  for (const m of e.members) {
    lines.push(`            ${e.name}.${csEnumMemberName(m.value)} => "${m.value}",`);
  }
  lines.push(`            _ => value.ToString(),`);
  lines.push('        };');
  lines.push('        writer.WriteStringValue(str);');
  lines.push('    }');
  lines.push('}');
}

function emitUnion(
  lines: string[],
  u: IRUnion,
  ir: IR,
): void {
  const memberModels = u.memberRefs
    .map((ref) => ir.models.find((m) => m.name === ref))
    .filter(Boolean) as IRModel[];

  const discriminatorField = u.discriminatorField;

  lines.push(`[JsonPolymorphic(TypeDiscriminatorPropertyName = "${discriminatorField}")]`);
  for (const memberModel of memberModels) {
    const litField = memberModel.fields.find((f) => f.type.kind === 'literal');
    const litValue = litField?.type.literalValue ?? '';
    lines.push(`[JsonDerivedType(typeof(${memberModel.name}), "${litValue}")]`);
  }
  lines.push(`public abstract class ${u.name}`);
  lines.push('{');
  lines.push(`    [JsonPropertyName("${discriminatorField}")]`);
  lines.push(`    public abstract string ${snakeToPascal(discriminatorField)} { get; }`);
  lines.push('}');

  for (const memberModel of memberModels) {
    const litField = memberModel.fields.find((f) => f.type.kind === 'literal');
    const litValue = litField?.type.literalValue ?? '';
    const otherFields = memberModel.fields.filter(
      (f) => f.type.kind !== 'literal',
    );

    lines.push('');
    lines.push(`public class ${memberModel.name} : ${u.name}`);
    lines.push('{');
    lines.push(`    public override string ${snakeToPascal(discriminatorField)} => "${litValue}";`);
    for (const f of otherFields) {
      const sdkName = fieldSdkName(f);
      const typeName = csType(f.type);
      const isOpt = !f.required || f.nullable;
      const nullSuffix = isOpt ? '?' : '';
      lines.push(`    [JsonPropertyName("${f.name}")]`);
      if (isOpt) {
        lines.push(`    public ${typeName}${nullSuffix} ${sdkName} { get; set; }`);
      } else {
        lines.push(`    public ${typeName} ${sdkName} { get; set; } = default!;`);
      }
    }
    lines.push('}');
  }
}

function emitModel(
  lines: string[],
  m: IRModel,
  allModels: IRModel[],
): void {
  const fields = m.fields;
  const ext = m.isError ? ' : Exception' : '';

  if (fields.length === 0) {
    lines.push(`public class ${m.name}${ext} { }`);
    return;
  }

  lines.push(`public class ${m.name}${ext}`);
  lines.push('{');

  // Sort binary fields last
  const hasBinaryField = fields.some((f) => f.type.kind === 'binary');
  const sortedFields = hasBinaryField
    ? [...fields].sort((a, b) => {
        const aIsBinary = a.type.kind === 'binary';
        const bIsBinary = b.type.kind === 'binary';
        if (aIsBinary !== bIsBinary) return aIsBinary ? 1 : -1;
        return 0;
      })
    : fields;

  for (const f of sortedFields) {
    const sdkName = fieldSdkName(f);
    const typeName = csType(f.type);
    const isBinary = f.type.kind === 'binary';
    const isOpt = !f.required || f.nullable;

    if (isBinary) {
      lines.push(`    [JsonIgnore]`);
      lines.push(`    public byte[] ${sdkName} { get; set; } = Array.Empty<byte>();`);
    } else {
      lines.push(`    [JsonPropertyName("${f.name}")]`);
      if (isOpt) {
        lines.push(`    public ${typeName}? ${sdkName} { get; set; }`);
      } else {
        if (f.defaultValue !== undefined) {
          const renderedDefault = csDefaultValue(f.defaultValue, f.type);
          if (renderedDefault !== null) {
            lines.push(`    public ${typeName} ${sdkName} { get; set; } = ${renderedDefault};`);
          } else {
            lines.push(`    public ${typeName} ${sdkName} { get; set; } = default!;`);
          }
        } else {
          lines.push(`    public ${typeName} ${sdkName} { get; set; } = default!;`);
        }
      }
    }
  }

  if (m.name === 'ApiError') {
    const errorsField = m.fields.find((f) => f.name === 'errors');
    const itemsRef = errorsField?.type.kind === 'array' && errorsField.type.items?.kind === 'model'
      ? errorsField.type.items.ref
      : undefined;
    const itemsModel = itemsRef ? allModels.find((am) => am.name === itemsRef) : undefined;
    const hasMessage = itemsModel?.fields.some((f) => f.name === 'message');

    if (hasMessage) {
      lines.push('');
      lines.push('    public override string Message => Errors is not { Count: > 0 }');
      lines.push('        ? "api error"');
      lines.push('        : Errors.Count == 1 ? Errors[0].Message');
      lines.push('        : $"Errors: {string.Join(\\"; \\", Errors.Select(t => t.Message))}";');
    }
  }
  if (m.name === 'OAuthError') {
    const errField = m.fields.find((f) => f.name === 'error');
    if (errField) {
      lines.push('');
      lines.push(`    public override string Message => ${fieldSdkName(errField)} ?? "oauth error";`);
    }
  }

  lines.push('}');
}

function emitResponseType(lines: string[], rt: IRResponseType): void {
  lines.push(`public class ${rt.name}`);
  lines.push('{');
  lines.push(`    [JsonPropertyName("data")]`);
  lines.push(`    public List<${rt.dataRef}> Data { get; set; } = new();`);
  if (rt.metaRef) {
    const nullSuffix = rt.metaIsRequired ? '' : '?';
    lines.push(`    [JsonPropertyName("meta")]`);
    lines.push(`    public ${rt.metaRef}${nullSuffix} Meta { get; set; }${rt.metaIsRequired ? ' = default!;' : ''}`);
  }
  lines.push('}');
}

// ── Utils.cs ─────────────────────────────────────────────────────────

function generateUtils(): string {
  return `#nullable enable

using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace Pachca.Sdk;

internal static class PachcaUtils
{
    private const int MaxRetries = 3;
    private static readonly HashSet<int> Retryable5xx = new() { 500, 502, 503, 504 };
    private static readonly Random JitterRandom = new();

    internal static readonly JsonSerializerOptions JsonOptions = new()
    {
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
        PropertyNameCaseInsensitive = true,
    };

    private static TimeSpan AddJitter(TimeSpan delay)
    {
        var factor = 0.5 + JitterRandom.NextDouble() * 0.5;
        return TimeSpan.FromMilliseconds(delay.TotalMilliseconds * factor);
    }

    internal static async Task<HttpResponseMessage> SendWithRetryAsync(
        HttpClient client,
        HttpRequestMessage request,
        CancellationToken cancellationToken = default)
    {
        for (var attempt = 0; attempt <= MaxRetries; attempt++)
        {
            HttpRequestMessage req;
            if (attempt == 0)
            {
                req = request;
            }
            else
            {
                req = await CloneRequestAsync(request).ConfigureAwait(false);
            }

            var response = await client.SendAsync(req, cancellationToken).ConfigureAwait(false);

            if ((int)response.StatusCode == 429 && attempt < MaxRetries)
            {
                var delay = response.Headers.RetryAfter?.Delta
                    ?? TimeSpan.FromSeconds(Math.Pow(2, attempt));
                await System.Threading.Tasks.Task.Delay(AddJitter(delay), cancellationToken).ConfigureAwait(false);
                response.Dispose();
                continue;
            }

            if (Retryable5xx.Contains((int)response.StatusCode) && attempt < MaxRetries)
            {
                var delay = AddJitter(TimeSpan.FromSeconds(10 * Math.Pow(2, attempt)));
                await System.Threading.Tasks.Task.Delay(delay, cancellationToken).ConfigureAwait(false);
                response.Dispose();
                continue;
            }

            return response;
        }

        return await client.SendAsync(
            await CloneRequestAsync(request).ConfigureAwait(false),
            cancellationToken).ConfigureAwait(false);
    }

    private static async Task<HttpRequestMessage> CloneRequestAsync(HttpRequestMessage request)
    {
        var clone = new HttpRequestMessage(request.Method, request.RequestUri);
        foreach (var header in request.Headers)
            clone.Headers.TryAddWithoutValidation(header.Key, header.Value);

        if (request.Content != null)
        {
            var content = await request.Content.ReadAsByteArrayAsync().ConfigureAwait(false);
            clone.Content = new ByteArrayContent(content);
            if (request.Content.Headers.ContentType != null)
                clone.Content.Headers.ContentType = request.Content.Headers.ContentType;
        }

        return clone;
    }

    internal static T Deserialize<T>(string json) =>
        JsonSerializer.Deserialize<T>(json, JsonOptions)
            ?? throw new InvalidOperationException("Deserialization returned null");

    internal static string Serialize<T>(T value) =>
        JsonSerializer.Serialize(value, JsonOptions);

    internal static string EnumToApiString<T>(T value) where T : struct, Enum =>
        JsonSerializer.Serialize(value, JsonOptions).Trim('"');
}
`;
}

// ── Client.cs ────────────────────────────────────────────────────────

function generateClient(ir: IR): string {
  if (ir.services.length === 0) {
    return '#nullable enable\n\nnamespace Pachca.Sdk;\n';
  }

  const lines: string[] = [];
  const globalHasApiError = hasApiErrorModel(ir);

  const hasMultipart = ir.services.some((s) =>
    s.operations.some((op) => op.requestBody?.contentType === 'multipart'),
  );
  const hasRedirect = ir.services.some((s) =>
    s.operations.some((op) => op.successResponse.isRedirect),
  );

  // Header
  lines.push('#nullable enable');
  lines.push('');
  lines.push('using System;');
  lines.push('using System.Collections.Generic;');
  lines.push('using System.Net;');
  lines.push('using System.Net.Http;');
  lines.push('using System.Net.Http.Headers;');
  if (hasMultipart) {
    lines.push('using System.IO;');
  }
  lines.push('using System.Text;');
  lines.push('using System.Text.Json;');
  lines.push('using System.Threading;');
  // Note: System.Threading.Tasks is NOT imported to avoid conflict with Pachca.Sdk.Task model
  // Async methods use fully qualified System.Threading.Tasks.Task<T> instead
  lines.push('');
  lines.push('namespace Pachca.Sdk;');

  // Services
  for (const svc of ir.services) {
    lines.push('');
    emitService(lines, svc, ir, globalHasApiError);
  }

  // PachcaClient
  lines.push('');
  emitPachcaClient(lines, ir, hasRedirect);

  lines.push('');
  return lines.join('\n');
}

function emitService(
  lines: string[],
  svc: IRService,
  ir: IR,
  globalHasApiError: boolean,
): void {
  const serviceName = tagToServiceName(svc.tag);
  const implName = serviceToImplName(serviceName);

  lines.push(`public class ${serviceName}`);
  lines.push('{');
  for (let i = 0; i < svc.operations.length; i++) {
    lines.push('');
    emitThrowingOperation(lines, svc.operations[i], ir);
    if (svc.operations[i].isPaginated && svc.operations[i].successResponse.dataRef) {
      lines.push('');
      emitThrowingPaginationMethod(lines, svc.operations[i], ir);
    }
  }
  lines.push('}');
  lines.push('');
  lines.push(`public sealed class ${implName} : ${serviceName}`);
  lines.push('{');
  lines.push('    private readonly string _baseUrl;');
  lines.push('    private readonly HttpClient _client;');
  lines.push('');
  lines.push(`    internal ${implName}(string baseUrl, HttpClient client)`);
  lines.push('    {');
  lines.push('        _baseUrl = baseUrl;');
  lines.push('        _client = client;');
  lines.push('    }');

  for (let i = 0; i < svc.operations.length; i++) {
    lines.push('');
    emitOperation(lines, svc.operations[i], ir, globalHasApiError);
    if (svc.operations[i].isPaginated && svc.operations[i].successResponse.dataRef) {
      lines.push('');
      emitPaginationMethod(lines, svc.operations[i], ir);
    }
  }

  lines.push('}');
}

function emitPaginationMethod(lines: string[], op: IROperation, ir: IR, modifier = 'public override'): void {
  const indent = '    ';
  const indent2 = '        ';
  const itemType = csClientTypeRef(op.successResponse.dataRef ?? 'object');

  // Build params: same as original minus cursor
  const params: string[] = [];
  if (op.externalUrl) params.push(`string ${paramSdkName(op.externalUrl)}`);
  for (const p of op.pathParams) params.push(`${csType(p.type)} ${paramSdkName(p.sdkName)}`);
  for (const p of op.queryParams) {
    if (p.name === 'cursor') continue;
    const typeName = csType(p.type);
    if (p.required) {
      params.push(`${typeName} ${paramSdkName(p.sdkName)}`);
    } else {
      params.push(`${typeName}? ${paramSdkName(p.sdkName)} = null`);
    }
  }
  params.push('CancellationToken cancellationToken = default');

  const methodName = `${snakeToPascal(op.methodName)}AllAsync`;

  lines.push(`${indent}${modifier} async System.Threading.Tasks.Task<List<${itemType}>> ${methodName}(`);
  for (let i = 0; i < params.length; i++) {
    const comma = i < params.length - 1 ? ',' : ')';
    lines.push(`${indent2}${params[i]}${comma}`);
  }
  lines.push(`${indent}{`);
  lines.push(`${indent2}var items = new List<${itemType}>();`);
  lines.push(`${indent2}string? cursor = null;`);
  lines.push(`${indent2}do`);
  lines.push(`${indent2}{`);

  // Build call args
  const callArgs: string[] = [];
  if (op.externalUrl) callArgs.push(`${paramSdkName(op.externalUrl)}: ${paramSdkName(op.externalUrl)}`);
  for (const p of op.pathParams) callArgs.push(`${paramSdkName(p.sdkName)}`);

  // Determine if we need to pass request body
  if (op.requestBody) {
    const rb = op.requestBody;
    if (shouldUnwrapBody(rb) && rb.unwrapField) {
      callArgs.push(`${paramSdkName(rb.unwrapField.name)}`);
    } else if (rb.schemaRef) {
      callArgs.push('request');
    }
  }

  for (const p of op.queryParams) {
    if (p.name === 'cursor') {
      callArgs.push('cursor: cursor');
    } else {
      callArgs.push(`${paramSdkName(p.sdkName)}: ${paramSdkName(p.sdkName)}`);
    }
  }
  callArgs.push('cancellationToken: cancellationToken');

  const baseName = `${snakeToPascal(op.methodName)}Async`;
  lines.push(`${indent2}    var response = await ${baseName}(${callArgs.join(', ')}).ConfigureAwait(false);`);
  const rt = ir.responses.find((r) => r.name === op.successResponse.responseRef);
  const metaAccess = rt?.metaIsRequired ? 'response.Meta.Paginate.NextPage' : 'response.Meta?.Paginate?.NextPage';
  lines.push(`${indent2}    items.AddRange(response.Data);`);
  lines.push(`${indent2}    if (response.Data.Count == 0) break;`);
  lines.push(`${indent2}    cursor = ${metaAccess};`);
  lines.push(rt?.metaIsRequired ? `${indent2}} while (true);` : `${indent2}} while (cursor != null);`);
  lines.push(`${indent2}return items;`);
  lines.push(`${indent}}`);
}

function emitOperation(
  lines: string[],
  op: IROperation,
  ir: IR,
  globalHasApiError: boolean,
  modifier = 'public override',
): void {
  const indent = '    ';
  const indent2 = '        ';

  const returnType = getReturnType(op, ir);
  const taskType = returnType
    ? `System.Threading.Tasks.Task<${returnType}>`
    : 'System.Threading.Tasks.Task';
  const params = buildMethodParams(op, ir);
  const methodName = `${snakeToPascal(op.methodName)}Async`;

  if (op.deprecated) lines.push(`${indent}[Obsolete("This method is deprecated")]`);

  if (params.length === 0) {
    lines.push(`${indent}${modifier} async ${taskType} ${methodName}(CancellationToken cancellationToken = default)`);
  } else if (params.length === 1) {
    lines.push(`${indent}${modifier} async ${taskType} ${methodName}(${params[0]}, CancellationToken cancellationToken = default)`);
  } else {
    lines.push(`${indent}${modifier} async ${taskType} ${methodName}(`);
    for (const p of params) {
      lines.push(`${indent2}${p},`);
    }
    lines.push(`${indent2}CancellationToken cancellationToken = default)`);
  }
  lines.push(`${indent}{`);

  emitMethodBody(lines, op, ir, globalHasApiError);

  lines.push(`${indent}}`);
}

function emitThrowingOperation(lines: string[], op: IROperation, ir: IR): void {
  const returnType = getReturnType(op, ir);
  const taskType = returnType ? `System.Threading.Tasks.Task<${returnType}>` : 'System.Threading.Tasks.Task';
  const params = buildMethodParams(op, ir);
  const methodName = `${snakeToPascal(op.methodName)}Async`;
  const indent = '    ';
  const indent2 = '        ';
  if (op.deprecated) lines.push(`${indent}[Obsolete("This method is deprecated")]`);
  if (params.length === 0) {
    lines.push(`${indent}public virtual async ${taskType} ${methodName}(CancellationToken cancellationToken = default)`);
  } else if (params.length === 1) {
    lines.push(`${indent}public virtual async ${taskType} ${methodName}(${params[0]}, CancellationToken cancellationToken = default)`);
  } else {
    lines.push(`${indent}public virtual async ${taskType} ${methodName}(`);
    for (const p of params) lines.push(`${indent2}${p},`);
    lines.push(`${indent2}CancellationToken cancellationToken = default)`);
  }
  lines.push(`${indent}{`);
  lines.push(`${indent2}throw new NotImplementedException(${JSON.stringify(`${op.tag}.${op.methodName} is not implemented`)});`);
  lines.push(`${indent}}`);
}

function emitThrowingPaginationMethod(lines: string[], op: IROperation, ir: IR): void {
  const indent = '    ';
  const indent2 = '        ';
  const itemType = csClientTypeRef(op.successResponse.dataRef ?? 'object');
  const params: string[] = [];
  if (op.externalUrl) params.push(`string ${paramSdkName(op.externalUrl)}`);
  for (const p of op.pathParams) params.push(`${csType(p.type)} ${paramSdkName(p.sdkName)}`);
  for (const p of op.queryParams) {
    if (p.name === 'cursor') continue;
    const typeName = csType(p.type);
    params.push(p.required ? `${typeName} ${paramSdkName(p.sdkName)}` : `${typeName}? ${paramSdkName(p.sdkName)} = null`);
  }
  params.push('CancellationToken cancellationToken = default');
  const methodName = `${snakeToPascal(op.methodName)}AllAsync`;
  lines.push(`${indent}public virtual async System.Threading.Tasks.Task<List<${itemType}>> ${methodName}(`);
  for (let i = 0; i < params.length; i++) {
    const comma = i < params.length - 1 ? ',' : ')';
    lines.push(`${indent2}${params[i]}${comma}`);
  }
  lines.push(`${indent}{`);
  lines.push(`${indent2}throw new NotImplementedException(${JSON.stringify(`${op.tag}.${op.methodName}All is not implemented`)});`);
  lines.push(`${indent}}`);
}

function getReturnType(
  op: IROperation,
  ir: IR,
): string | null {
  const resp = op.successResponse;
  if (resp.isRedirect) return 'string';
  if (!resp.hasBody) return null;
  if (resp.isList) {
    const rt = ir.responses.find((r) => r.name === resp.responseRef);
    return rt?.name ?? 'object';
  }
  if (resp.isUnwrap && resp.dataRef) return csClientTypeRef(resp.dataRef);
  return csClientTypeRef(resp.dataRef ?? 'object');
}

function buildMethodParams(
  op: IROperation,
  ir: IR,
): string[] {
  const params: string[] = [];

  if (op.externalUrl) {
    params.push(`string ${paramSdkName(op.externalUrl)}`);
  }

  for (const p of op.pathParams) {
    params.push(`${csType(p.type)} ${paramSdkName(p.sdkName)}`);
  }

  if (op.requestBody) {
    const rb = op.requestBody;
    if (shouldUnwrapBody(rb)) {
      const f = rb.unwrapField!;
      const sdkName = paramSdkName(f.name);
      const typeName = csType(f.type);
      params.push(`${typeName} ${sdkName}`);
    } else if (rb.schemaRef) {
      params.push(`${rb.schemaRef} request`);
    }
  }

  for (const p of op.queryParams) {
    const typeName = csType(p.type);
    if (p.required) {
      params.push(`${typeName} ${paramSdkName(p.sdkName)}`);
    } else {
      params.push(`${typeName}? ${paramSdkName(p.sdkName)} = null`);
    }
  }

  return params;
}

function emitMethodBody(
  lines: string[],
  op: IROperation,
  ir: IR,
  globalHasApiError: boolean,
): void {
  const indent2 = '        ';

  const isMultipart = op.requestBody?.contentType === 'multipart';
  const httpMethod = op.method.toUpperCase();

  let urlPath = op.path;
  for (const p of op.pathParams) {
    urlPath = urlPath.replace(`{${p.sdkName}}`, `{${paramSdkName(p.sdkName)}}`);
    urlPath = urlPath.replace(`{${p.name}}`, `{${paramSdkName(p.sdkName)}}`);
  }

  if (isMultipart) {
    emitMultipartBody(lines, op, ir, urlPath, globalHasApiError);
    return;
  }

  // Build URL
  const hasQueryParams = op.queryParams.length > 0;

  if (op.externalUrl) {
    lines.push(`${indent2}var url = ${paramSdkName(op.externalUrl)};`);
  } else if (hasQueryParams) {
    lines.push(`${indent2}var queryParts = new List<string>();`);
    for (const p of op.queryParams) {
      const paramName = paramSdkName(p.sdkName);
      // Escape curly braces in param name for C# string interpolation
      const paramKey = p.name.replace(/\{/g, '{{').replace(/\}/g, '}}');
      if (p.isArray) {
        const itemIsEnum = p.type.kind === 'array' && p.type.items?.kind === 'enum';
        const itemExpr = itemIsEnum ? 'PachcaUtils.EnumToApiString(item)' : 'item.ToString()!';
        if (p.required) {
          lines.push(`${indent2}foreach (var item in ${paramName})`);
          lines.push(`${indent2}    queryParts.Add($"${paramKey}={Uri.EscapeDataString(${itemExpr})}");`);
        } else {
          lines.push(`${indent2}if (${paramName} != null)`);
          lines.push(`${indent2}    foreach (var item in ${paramName})`);
          lines.push(`${indent2}        queryParts.Add($"${paramKey}={Uri.EscapeDataString(${itemExpr})}");`);
        }
      } else {
        const valueExpr = queryParamValueExpr(p);
        if (p.required) {
          lines.push(`${indent2}queryParts.Add($"${paramKey}={Uri.EscapeDataString(${valueExpr})}");`);
        } else {
          lines.push(`${indent2}if (${paramName} != null)`);
          lines.push(`${indent2}    queryParts.Add($"${paramKey}={Uri.EscapeDataString(${valueExpr})}");`);
        }
      }
    }
    lines.push(`${indent2}var url = $"{_baseUrl}${urlPath}" + (queryParts.Count > 0 ? "?" + string.Join("&", queryParts) : "");`);
  } else {
    lines.push(`${indent2}var url = $"{_baseUrl}${urlPath}";`);
  }

  // Build request — use 'httpRequest' when method has a 'request' body param
  const hasBodyParam = op.requestBody && !shouldUnwrapBody(op.requestBody) && op.requestBody.schemaRef;
  const reqVar = hasBodyParam ? 'httpRequest' : 'request';
  lines.push(`${indent2}using var ${reqVar} = new HttpRequestMessage(HttpMethod.${httpMethodName(httpMethod)}, url);`);

  if (op.noAuth) {
    lines.push(`${indent2}${reqVar}.Headers.Authorization = null;`);
  }

  // Set body
  const hasJsonBody = op.requestBody && op.requestBody.contentType === 'json';
  if (hasJsonBody) {
    const rb = op.requestBody!;
    if (shouldUnwrapBody(rb)) {
      const f = rb.unwrapField!;
      const sdkName = paramSdkName(f.name);
      lines.push(`${indent2}var body = new ${rb.schemaRef} { ${fieldSdkName(f)} = ${sdkName} };`);
      lines.push(`${indent2}${reqVar}.Content = new StringContent(PachcaUtils.Serialize(body), Encoding.UTF8, "application/json");`);
    } else {
      lines.push(`${indent2}${reqVar}.Content = new StringContent(PachcaUtils.Serialize(request), Encoding.UTF8, "application/json");`);
    }
  }

  // Send request
  lines.push(`${indent2}using var response = await PachcaUtils.SendWithRetryAsync(_client, ${reqVar}, cancellationToken).ConfigureAwait(false);`);
  lines.push(`${indent2}var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);`);

  emitResponseHandling(lines, op, ir, globalHasApiError);
}

function httpMethodName(method: string): string {
  switch (method) {
    case 'GET': return 'Get';
    case 'POST': return 'Post';
    case 'PUT': return 'Put';
    case 'DELETE': return 'Delete';
    case 'PATCH': return 'Patch';
    default: return 'Get';
  }
}

function emitMultipartBody(
  lines: string[],
  op: IROperation,
  ir: IR,
  urlPath: string,
  globalHasApiError: boolean,
): void {
  const indent2 = '        ';

  const reqModel = ir.models.find(
    (m) => m.name === op.requestBody!.schemaRef,
  );
  if (!reqModel) return;

  const binaryField = reqModel.fields.find((f) => f.type.kind === 'binary');
  const nonBinaryFields = reqModel.fields.filter((f) => f.type.kind !== 'binary');
  const isUnwrapped = shouldUnwrapBody(op.requestBody!);

  if (op.externalUrl) {
    lines.push(`${indent2}var url = ${paramSdkName(op.externalUrl)};`);
  } else {
    lines.push(`${indent2}var url = $"{_baseUrl}${urlPath}";`);
  }

  lines.push(`${indent2}using var content = new MultipartFormDataContent();`);

  for (const f of nonBinaryFields) {
    const sdk = isUnwrapped ? paramSdkName(f.name) : `request.${fieldSdkName(f)}`;
    const isOptional = !f.required || f.nullable;
    if (isOptional) {
      lines.push(`${indent2}if (${sdk} != null)`);
      lines.push(`${indent2}    content.Add(new StringContent($"{${sdk}}"), "${f.name}");`);
    } else {
      lines.push(`${indent2}content.Add(new StringContent($"{${sdk}}"), "${f.name}");`);
    }
  }

  if (binaryField) {
    const sdk = isUnwrapped ? paramSdkName(binaryField.name) : `request.${fieldSdkName(binaryField)}`;
    lines.push(`${indent2}content.Add(new ByteArrayContent(${sdk}), "${binaryField.name}", "${binaryField.name}");`);
  }

  lines.push(`${indent2}using var httpRequest = new HttpRequestMessage(HttpMethod.${httpMethodName(op.method.toUpperCase())}, url);`);
  lines.push(`${indent2}httpRequest.Content = content;`);
  if (op.noAuth) {
    lines.push(`${indent2}httpRequest.Headers.Authorization = null;`);
  }
  lines.push(`${indent2}using var response = await PachcaUtils.SendWithRetryAsync(_client, httpRequest, cancellationToken).ConfigureAwait(false);`);
  lines.push(`${indent2}var json = await response.Content.ReadAsStringAsync(cancellationToken).ConfigureAwait(false);`);

  emitResponseHandling(lines, op, ir, globalHasApiError);
}

function emitResponseHandling(
  lines: string[],
  op: IROperation,
  ir: IR,
  globalHasApiError: boolean,
): void {
  const indent2 = '        ';

  const resp = op.successResponse;

  lines.push(`${indent2}switch ((int)response.StatusCode)`);
  lines.push(`${indent2}{`);

  if (resp.isRedirect) {
    lines.push(`${indent2}    case ${resp.statusCode}:`);
    lines.push(`${indent2}        return response.Headers.Location?.ToString()`);
    lines.push(`${indent2}            ?? throw new InvalidOperationException("Missing Location header in redirect response");`);
  } else if (!resp.hasBody) {
    lines.push(`${indent2}    case ${resp.statusCode}:`);
    lines.push(`${indent2}        return;`);
  } else if (resp.isList) {
    lines.push(`${indent2}    case ${resp.statusCode}:`);
    // Use same lookup as getReturnType for consistency
    const foundResp = ir.responses.find((r) => r.name === resp.responseRef);
    const rt = foundResp?.name ?? 'object';
    lines.push(`${indent2}        return PachcaUtils.Deserialize<${rt}>(json);`);
  } else if (resp.isUnwrap && resp.dataRef) {
    lines.push(`${indent2}    case ${resp.statusCode}:`);
    lines.push(`${indent2}        return PachcaUtils.Deserialize<${csClientTypeRef(resp.dataRef)}DataWrapper>(json).Data;`);
  } else {
    lines.push(`${indent2}    case ${resp.statusCode}:`);
    lines.push(`${indent2}        return PachcaUtils.Deserialize<${csClientTypeRef(resp.dataRef ?? 'object')}>(json);`);
  }

  if (op.hasOAuthError) {
    lines.push(`${indent2}    case 401:`);
    lines.push(`${indent2}        throw PachcaUtils.Deserialize<OAuthError>(json);`);
  }

  if (op.hasApiError || globalHasApiError) {
    lines.push(`${indent2}    default:`);
    lines.push(`${indent2}        throw PachcaUtils.Deserialize<ApiError>(json);`);
  } else {
    lines.push(`${indent2}    default:`);
    lines.push(`${indent2}        throw new InvalidOperationException($"Unexpected status code: {(int)response.StatusCode}");`);
  }

  lines.push(`${indent2}}`);
}

function emitPachcaClient(
  lines: string[],
  ir: IR,
  hasRedirect: boolean,
): void {
  if (ir.baseUrl) {
    lines.push(`public static class PachcaConstants`);
    lines.push('{');
    lines.push(`    public const string PachcaApiUrl = ${JSON.stringify(ir.baseUrl)};`);
    lines.push('}');
    lines.push('');
  }
  const csDefault = ir.baseUrl ? ' = PachcaConstants.PachcaApiUrl' : '';

  lines.push('public sealed class PachcaClient : IDisposable');
  lines.push('{');
  lines.push('    private readonly HttpClient? _client;');
  lines.push('');
  const serviceEntries = ir.services
    .map((svc) => ({
      propName: snakeToPascal(tagToProperty(svc.tag)),
      paramName: tagToProperty(svc.tag),
      className: tagToServiceName(svc.tag),
    }))
    .sort((a, b) => a.propName.localeCompare(b.propName));
  for (const s of serviceEntries) {
    lines.push(`    public ${s.className} ${s.propName} { get; }`);
  }

  // Private constructor taking only services
  lines.push('');
  const privateParams = serviceEntries.map((s) => `${s.className} ${s.paramName}`);
  lines.push(`    private PachcaClient(${privateParams.join(', ')})`);
  lines.push('    {');
  for (const s of serviceEntries) {
    lines.push(`        ${s.propName} = ${s.paramName};`);
  }
  lines.push('    }');

  // Public constructor with token, baseUrl, and optional service overrides
  lines.push('');
  const constructorParams = ['string token', `string baseUrl${csDefault}`];
  for (const s of serviceEntries) {
    constructorParams.push(`${s.className}? ${s.paramName} = null`);
  }
  lines.push(`    public PachcaClient(${constructorParams.join(', ')})`);
  lines.push('    {');

  if (hasRedirect) {
    lines.push('        var handler = new SocketsHttpHandler');
    lines.push('        {');
    lines.push('            AllowAutoRedirect = false,');
    lines.push('        };');
    lines.push('        _client = new HttpClient(handler);');
  } else {
    lines.push('        _client = new HttpClient();');
  }

  lines.push('        _client.DefaultRequestHeaders.Authorization =');
  lines.push('            new AuthenticationHeaderValue("Bearer", token);');
  lines.push('');

  for (const s of serviceEntries) {
    lines.push(`        ${s.propName} = ${s.paramName} ?? new ${serviceToImplName(s.className)}(baseUrl, _client);`);
  }

  lines.push('    }');

  // Public constructor with pre-configured HttpClient
  lines.push('');
  const httpConstructorParams = ['string baseUrl', 'HttpClient client'];
  for (const s of serviceEntries) {
    httpConstructorParams.push(`${s.className}? ${s.paramName} = null`);
  }
  lines.push(`    public PachcaClient(${httpConstructorParams.join(', ')})`);
  lines.push('    {');
  lines.push('        _client = client;');
  lines.push('');
  for (const s of serviceEntries) {
    lines.push(`        ${s.propName} = ${s.paramName} ?? new ${serviceToImplName(s.className)}(baseUrl, _client);`);
  }
  lines.push('    }');

  // Static Stub() factory method
  lines.push('');
  const stubParams = serviceEntries.map((s) => `${s.className}? ${s.paramName} = null`);
  lines.push(`    public static PachcaClient Stub(${stubParams.join(', ')})`);
  lines.push('    {');
  const stubArgs = serviceEntries.map((s) => `${s.paramName} ?? new ${s.className}()`);
  lines.push(`        return new PachcaClient(${stubArgs.join(', ')});`);
  lines.push('    }');

  lines.push('');
  lines.push('    public void Dispose()');
  lines.push('    {');
  lines.push('        _client?.Dispose();');
  lines.push('        GC.SuppressFinalize(this);');
  lines.push('    }');
  lines.push('}');
}

// ── Examples ─────────────────────────────────────────────────────────

function csLiteral(
  ft: IRFieldType,
  ir: IR,
  models: Map<string, IRModel>,
  visited: Set<string> = new Set(),
  indent: number = 0,
): string {
  if (ft.example !== undefined) {
    if (ft.kind === 'primitive') {
      if ((ft.primitive === 'integer' || ft.primitive === 'number') && typeof ft.example === 'number') {
        if (ft.primitive === 'integer') return ft.format === 'int64' ? `${ft.example}L` : String(ft.example);
        return `${ft.example}d`;
      }
      if (ft.primitive === 'boolean' && typeof ft.example === 'boolean') return String(ft.example);
      if (ft.primitive === 'string' && typeof ft.example === 'string') {
        if (ft.format === 'date-time') return `DateTimeOffset.Parse(${JSON.stringify(ft.example)})`;
        return JSON.stringify(ft.example);
      }
    }
    if (ft.kind === 'enum' && typeof ft.example === 'string') {
      const e = ir.enums.find((en) => en.name === ft.ref);
      const member = e?.members.find((m) => m.value === ft.example);
      if (e && member) return `${e.name}.${csEnumMemberName(member.value)}`;
    }
  }
  switch (ft.kind) {
    case 'primitive': {
      if (ft.primitive === 'integer') return ft.format === 'int64' ? '123L' : '123';
      if (ft.primitive === 'number') return '1.5d';
      if (ft.primitive === 'boolean') return 'true';
      if (ft.primitive === 'any') return 'new object()';
      if (ft.primitive === 'string') {
        if (ft.format === 'date-time') return 'DateTimeOffset.UtcNow';
      }
      return '"example"';
    }
    case 'enum': {
      const e = ir.enums.find((en) => en.name === ft.ref);
      if (e && e.members.length > 0) {
        return `${e.name}.${csEnumMemberName(e.members[0].value)}`;
      }
      return `default(${ft.ref ?? 'object'})`;
    }
    case 'model': {
      const u = ir.unions.find((un) => un.name === ft.ref);
      if (u && u.memberRefs.length > 0) {
        return csModelLiteral(u.memberRefs[0], ir, models, visited, indent);
      }
      return csModelLiteral(ft.ref ?? 'object', ir, models, visited, indent);
    }
    case 'array':
      return `new List<${csType(ft.items!)}> { ${csLiteral(ft.items!, ir, models, visited, indent)} }`;
    case 'record':
      return `new Dictionary<string, ${csType(ft.valueType!)}> { ["key"] = ${csLiteral(ft.valueType!, ir, models, visited, indent)} }`;
    case 'union': {
      const u = ir.unions.find((un) => un.name === ft.ref);
      if (u && u.memberRefs.length > 0) {
        return csModelLiteral(u.memberRefs[0], ir, models, visited, indent);
      }
      return `default(${ft.ref ?? 'object'})!`;
    }
    case 'literal':
      return JSON.stringify(ft.literalValue);
    case 'binary':
      return 'Array.Empty<byte>()';
  }
}

function csModelLiteral(
  modelName: string,
  ir: IR,
  models: Map<string, IRModel>,
  visited: Set<string>,
  indent: number = 0,
): string {
  if (visited.has(modelName)) return `new ${modelName}()`;
  const model = models.get(modelName);
  if (!model || model.fields.length === 0) return `new ${modelName}()`;

  const nextVisited = new Set(visited);
  nextVisited.add(modelName);

  const isCyclic = (f: IRField) =>
    f.type.kind === 'model' && f.type.ref != null && nextVisited.has(f.type.ref);
  const fields = model.fields.filter(
    (f) => f.type.kind !== 'literal' && (f.type.kind !== 'binary' || f.required) && !(isCyclic(f) && (!f.required || f.nullable)),
  );
  if (fields.length === 0) return `new ${modelName}()`;

  const multiLine = fields.length > 2;
  const childIndent = indent + 1;
  const pad = '    '.repeat(childIndent);
  const closePad = '    '.repeat(indent);

  const entries = fields.map((f) => {
    const name = fieldSdkName(f);
    const value = csLiteral(f.type, ir, models, nextVisited, childIndent);
    return `${name} = ${value}`;
  });

  const hasMultiLineChild = entries.some((e) => e.includes('\n'));
  if (multiLine || hasMultiLineChild) {
    return `new ${modelName}\n${closePad}{\n${entries.map((e) => `${pad}${e}`).join(',\n')}\n${closePad}}`;
  }
  return `new ${modelName} { ${entries.join(', ')} }`;
}

function csFingerprint(
  ft: IRFieldType,
  ir: IR,
  models: Map<string, IRModel>,
  visited: Set<string> = new Set(),
): string {
  switch (ft.kind) {
    case 'primitive':
      return csType(ft);
    case 'enum':
      return ft.ref ?? 'object';
    case 'model': {
      const model = models.get(ft.ref!);
      if (!model || visited.has(ft.ref!)) return ft.ref ?? 'object';
      return csModelFingerprint(model, ir, models, visited);
    }
    case 'array':
      return `List<${csFingerprint(ft.items!, ir, models, visited)}>`;
    case 'record':
      return `Dictionary<string, ${csFingerprint(ft.valueType!, ir, models, visited)}>`;
    case 'union':
      return ft.ref ?? 'object';
    case 'literal':
      return 'string';
    case 'binary':
      return 'byte[]';
  }
}

function csModelFingerprint(
  model: IRModel,
  ir: IR,
  models: Map<string, IRModel>,
  visited: Set<string>,
): string {
  const nextVisited = new Set(visited);
  nextVisited.add(model.name);

  const fields = model.fields.map((f) => {
    const name = fieldSdkName(f);
    const type = csFingerprint(f.type, ir, models, nextVisited);
    const opt = (!f.required || f.nullable) ? '?' : '';
    return `${name}: ${type}${opt}`;
  });

  return `${model.name}(${fields.join(', ')})`;
}

function buildOutputFingerprint(
  op: IROperation,
  ir: IR,
  models: Map<string, IRModel>,
): string | null {
  const resp = op.successResponse;
  if (resp.isRedirect) return 'string';
  if (!resp.hasBody) return null;

  if (resp.isList && resp.responseRef) {
    const rt = ir.responses.find((r) => r.name === resp.responseRef);
    if (rt) {
      const parts: string[] = [];
      parts.push(`Data: List<${rt.dataRef}>`);
      if (rt.metaRef) {
        const opt = rt.metaIsRequired ? '' : '?';
        parts.push(`Meta: ${rt.metaRef}${opt}`);
      }
      return `${rt.name}(${parts.join(', ')})`;
    }
  }

  if (resp.dataRef) {
    const model = models.get(resp.dataRef);
    if (model) return csModelFingerprint(model, ir, models, new Set());
    return resp.dataRef;
  }

  return 'object';
}

function buildOperationExample(
  op: IROperation,
  ir: IR,
  models: Map<string, IRModel>,
  serviceProp: string,
): { usage: string; output: string | null; imports: string[] } {
  const params: { name: string; value: string }[] = [];
  const imports = new Set<string>();

  if (op.externalUrl) {
    params.push({ name: paramSdkName(op.externalUrl), value: '"https://example.com"' });
  }

  for (const p of op.pathParams) {
    params.push({ name: paramSdkName(p.sdkName), value: csLiteral(p.type, ir, models) });
    for (const r of collectTypeRefs(p.type, ir, models)) imports.add(r);
  }

  if (op.requestBody) {
    const rb = op.requestBody;
    if (shouldUnwrapBody(rb) && rb.unwrapField) {
      const sdkName = paramSdkName(rb.unwrapField.name);
      params.push({ name: sdkName, value: csLiteral(rb.unwrapField.type, ir, models) });
      for (const r of collectTypeRefs(rb.unwrapField.type, ir, models)) imports.add(r);
    } else if (rb.schemaRef) {
      params.push({ name: 'request', value: csLiteral({ kind: 'model', ref: rb.schemaRef }, ir, models) });
      for (const r of collectTypeRefs({ kind: 'model', ref: rb.schemaRef }, ir, models)) imports.add(r);
    }
  }

  for (const p of op.queryParams) {
    params.push({ name: paramSdkName(p.sdkName), value: csLiteral(p.type, ir, models) });
    for (const r of collectTypeRefs(p.type, ir, models)) imports.add(r);
  }

  const declarations: string[] = [];
  const callArgs: string[] = [];

  for (const { name, value } of params) {
    if (value.includes('new ') || value.includes('{')) {
      declarations.push(`var ${name} = ${value};`);
      callArgs.push(name);
    } else {
      callArgs.push(value);
    }
  }

  const output = buildOutputFingerprint(op, ir, models);
  const methodName = `${snakeToPascal(op.methodName)}Async`;
  const rawCall = `await client.${serviceProp}.${methodName}(${callArgs.join(', ')})`;
  const call = output ? `var response = ${rawCall};` : `${rawCall};`;
  const usage = declarations.length > 0
    ? [...declarations, call].join('\n')
    : call;

  return { usage, output, imports: [...imports].sort() };
}

function generateExamples(ir: IR): string {
  const models = buildModelIndex(ir);
  const result: Record<string, object> = {};

  result['Client_Init'] = {
    usage: 'using var client = new PachcaClient("YOUR_TOKEN");',
    imports: ['PachcaClient'],
  };

  for (const svc of ir.services) {
    const serviceProp = snakeToPascal(tagToProperty(svc.tag));
    for (const op of svc.operations) {
      const ex = buildOperationExample(op, ir, models, serviceProp);
      const entry: Record<string, unknown> = { usage: ex.usage };
      if (ex.output) entry.output = ex.output;
      if (ex.imports.length > 0) entry.imports = ex.imports;
      result[op.operationId] = entry;
    }
  }

  return JSON.stringify(result, null, 2) + '\n';
}

// ── Main ─────────────────────────────────────────────────────────────

export class CSharpGenerator implements LanguageGenerator {
  readonly dirName = 'cs';

  generate(ir: IR, options?: GenerateOptions): GeneratedFile[] {
    const files: GeneratedFile[] = [
      { path: 'Models.cs', content: generateModels(ir) },
      { path: 'Client.cs', content: generateClient(ir) },
      { path: 'Utils.cs', content: generateUtils() },
    ];

    if (options?.examples) {
      files.push({ path: 'examples.json', content: generateExamples(ir) });
    }
    return files;
  }
}
