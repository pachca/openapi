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
  snakeToUpperSnake,
  tagToProperty,
  tagToServiceName,
  serviceToImplName,
} from '../naming.js';

const KOTLIN_KEYWORDS = new Set([
  'as', 'break', 'class', 'continue', 'do', 'else', 'false', 'for', 'fun',
  'if', 'import', 'in', 'interface', 'is', 'null', 'object', 'package',
  'return', 'super', 'this', 'throw', 'true', 'try', 'typealias', 'typeof',
  'val', 'var', 'when', 'while',
]);

// ── Helpers ──────────────────────────────────────────────────────────

function ktType(ft: IRFieldType): string {
  switch (ft.kind) {
    case 'primitive':
      if (ft.primitive === 'integer')
        return ft.format === 'int64' ? 'Long' : 'Int';
      if (ft.primitive === 'number') return 'Double';
      if (ft.primitive === 'boolean') return 'Boolean';
      if (ft.primitive === 'any') return 'Any';
      if (ft.primitive === 'string' && ft.format === 'date-time') return 'OffsetDateTime';
      return 'String';
    case 'enum':
    case 'model':
      return ft.ref ?? 'Any';
    case 'array':
      return `List<${ktType(ft.items!)}>`;
    case 'record':
      return `Map<String, ${ktType(ft.valueType!)}>`;
    case 'union':
      return ft.ref ?? 'Any';
    case 'literal':
      return 'String';
    case 'binary':
      return 'ByteArray';
  }
}

function needsSerialName(field: IRField): boolean {
  if (field.type.kind === 'binary') return false;
  return fieldSdkName(field) !== field.name;
}

function fieldSdkName(field: IRField): string {
  let name: string;
  if (field.name.includes('-')) {
    const camel = field.name.replace(/-([a-zA-Z])/g, (_, c) => c.toUpperCase());
    name = camel.charAt(0).toLowerCase() + camel.slice(1);
  } else {
    name = snakeToCamel(field.name);
  }
  if (KOTLIN_KEYWORDS.has(name)) return `\`${name}\``;
  return name;
}

function ktDefaultValue(
  value: unknown,
  type: IRFieldType,
): string | null {
  if (value === null) return 'null';

  if (type.kind === 'enum' && typeof value === 'string') {
    const enumType = ktType(type);
    return `${enumType}.${snakeToUpperSnake(value)}`;
  }

  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (type.kind === 'primitive' && type.primitive === 'integer' && type.format === 'int64') {
      return `${value}L`;
    }
    return String(value);
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';

  if (Array.isArray(value) && type.kind === 'array') {
    if (value.length === 0) return 'emptyList()';
    const rendered = value
      .map((v) => ktDefaultValue(v, type.items!))
      .filter((v): v is string => v !== null);
    return rendered.length === value.length
      ? `listOf(${rendered.join(', ')})`
      : null;
  }

  return null;
}

/** Check if ApiError model exists in IR */
function hasApiErrorModel(ir: IR): boolean {
  return ir.models.some((m) => m.name === 'ApiError');
}

// ── Models.kt ────────────────────────────────────────────────────────

function generateModels(ir: IR): string {
  const lines: string[] = [];
  const unionMemberRefs = new Set<string>();
  for (const u of ir.unions) {
    for (const ref of u.memberRefs) unionMemberRefs.add(ref);
  }

  // Collect data wrapper refs (deduplicated)
  const dataWrapperRefs = new Set<string>();
  for (const svc of ir.services) {
    for (const op of svc.operations) {
      if (op.successResponse.isUnwrap && op.successResponse.dataRef) {
        dataWrapperRefs.add(op.successResponse.dataRef);
      }
    }
  }

  // Determine imports
  let needSerialName = false;
  let needTransient = false;

  if (ir.enums.length > 0) needSerialName = true;
  if (ir.unions.length > 0) needSerialName = true;

  for (const m of ir.models) {
    for (const f of m.fields) {
      if (needsSerialName(f)) needSerialName = true;
      if (f.type.kind === 'binary') needTransient = true;
    }
    for (const inl of m.inlineObjects) {
      for (const f of inl.fields) {
        if (needsSerialName(f)) needSerialName = true;
      }
    }
  }

  // Header
  lines.push('package com.pachca.sdk');
  lines.push('');

  const needDateTime = ir.models.some((m) => m.fields.some((f) => f.type.kind === 'primitive' && f.type.primitive === 'string' && f.type.format === 'date-time'))
    || ir.params.some((p) => p.params.some((q) => q.type.kind === 'primitive' && q.type.primitive === 'string' && q.type.format === 'date-time'));

  const imports: string[] = [];
  if (needDateTime) imports.push('import java.time.OffsetDateTime');
  if (needDateTime) imports.push('import java.time.format.DateTimeFormatter');
  if (needDateTime) imports.push('import kotlinx.serialization.KSerializer');
  if (needSerialName) imports.push('import kotlinx.serialization.SerialName');
  imports.push('import kotlinx.serialization.Serializable');
  if (needTransient) imports.push('import kotlinx.serialization.Transient');
  if (needDateTime) imports.push('import kotlinx.serialization.descriptors.PrimitiveKind');
  if (needDateTime) imports.push('import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor');
  if (needDateTime) imports.push('import kotlinx.serialization.encoding.Decoder');
  if (needDateTime) imports.push('import kotlinx.serialization.encoding.Encoder');
  lines.push(imports.join('\n'));

  if (needDateTime) {
    lines.push('');
    lines.push('object OffsetDateTimeSerializer : KSerializer<OffsetDateTime> {');
    lines.push('    override val descriptor = PrimitiveSerialDescriptor("OffsetDateTime", PrimitiveKind.STRING)');
    lines.push('    override fun serialize(encoder: Encoder, value: OffsetDateTime) = encoder.encodeString(value.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))');
    lines.push('    override fun deserialize(decoder: Decoder): OffsetDateTime = OffsetDateTime.parse(decoder.decodeString(), DateTimeFormatter.ISO_OFFSET_DATE_TIME)');
    lines.push('}');
  }

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
    // Emit inline objects before parent
    for (const inl of m.inlineObjects) {
      lines.push('');
      emitModel(lines, inl);
    }
    lines.push('');
    emitModel(lines, m);
  }

  // Response types
  for (const rt of ir.responses) {
    lines.push('');
    emitResponseType(lines, rt);
  }

  // Data wrappers
  for (const ref of dataWrapperRefs) {
    lines.push('');
    lines.push(`@Serializable`);
    lines.push(`data class ${ref}DataWrapper(val data: ${ref})`);
  }

  lines.push('');
  return lines.join('\n');
}

function emitEnum(lines: string[], e: IREnum): void {
  if (e.description && e.hasDescriptions && e.members.length > 1) {
    lines.push(`/** ${e.description} */`);
  }
  lines.push('@Serializable');
  lines.push(`enum class ${e.name}(val value: String) {`);
  for (const m of e.members) {
    if (m.description) {
      lines.push(`    /** ${m.description} */`);
    }
    lines.push(
      `    @SerialName("${m.value}") ${snakeToUpperSnake(m.value)}("${m.value}"),`,
    );
  }
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

  lines.push('@Serializable');
  lines.push(`sealed interface ${u.name} {`);
  lines.push(`    val ${snakeToCamel(discriminatorField)}: String`);
  lines.push('}');

  for (const memberModel of memberModels) {
    const litField = memberModel.fields.find((f) => f.type.kind === 'literal');
    const litValue = litField?.type.literalValue ?? '';
    const otherFields = memberModel.fields.filter(
      (f) => f.type.kind !== 'literal',
    );

    lines.push('');
    lines.push('@Serializable');
    lines.push(`@SerialName("${litValue}")`);
    lines.push(`data class ${memberModel.name}(`);
    lines.push(
      `    override val ${snakeToCamel(discriminatorField)}: String = "${litValue}",`,
    );
    for (const f of otherFields) {
      const sdkName = fieldSdkName(f);
      const typeName = ktType(f.type);
      const isOpt = !f.required;
      const fullType = isOpt ? `${typeName}?` : typeName;
      const default_ = isOpt ? ' = null' : '';
      const isDateTime = f.type.kind === 'primitive' && f.type.primitive === 'string' && f.type.format === 'date-time';
      const dtAnnotation = isDateTime ? '@Serializable(with = OffsetDateTimeSerializer::class) ' : '';
      const serialName =
        needsSerialName(f) ? `${dtAnnotation}@SerialName("${f.name}") ` : dtAnnotation;
      lines.push(`    ${serialName}val ${sdkName}: ${fullType}${default_},`);
    }
    lines.push(`) : ${u.name}`);
  }
}

function emitModel(
  lines: string[],
  m: IRModel,
): void {
  const fields = m.fields;

  lines.push('@Serializable');

  if (fields.length === 0) {
    const ext = m.isError ? ' : Exception()' : '';
    lines.push(`class ${m.name}${ext}`);
    return;
  }

  lines.push(`data class ${m.name}(`);

  // For models with binary fields: required non-binary first, optional, binary last
  const hasBinaryField = fields.some((f) => f.type.kind === 'binary');
  const sortedFields = hasBinaryField
    ? [...fields].sort((a, b) => {
        const aIsBinary = a.type.kind === 'binary';
        const bIsBinary = b.type.kind === 'binary';
        if (aIsBinary !== bIsBinary) return aIsBinary ? 1 : -1;
        if (!aIsBinary && !bIsBinary) {
          const aIsOpt = !a.required || a.nullable;
          const bIsOpt = !b.required || b.nullable;
          if (aIsOpt !== bIsOpt) return aIsOpt ? 1 : -1;
        }
        return 0;
      })
    : fields;

  for (const f of sortedFields) {
    const sdkName = fieldSdkName(f);
    const typeName = ktType(f.type);
    const isBinary = f.type.kind === 'binary';
    const isOpt = !f.required || f.nullable;

    let fullType: string;
    let default_: string;

    if (isBinary) {
      fullType = 'ByteArray';
      default_ = ' = ByteArray(0)';
    } else if (isOpt) {
      fullType = `${typeName}?`;
      if (f.defaultValue !== undefined) {
        const renderedDefault = ktDefaultValue(f.defaultValue, f.type);
        default_ = renderedDefault !== null ? ` = ${renderedDefault}` : ' = null';
      } else {
        default_ = ' = null';
      }
    } else {
      fullType = typeName;
      default_ = '';
    }

    const isDateTime = f.type.kind === 'primitive' && f.type.primitive === 'string' && f.type.format === 'date-time';
    const dtAnnotation = isDateTime ? '@Serializable(with = OffsetDateTimeSerializer::class) ' : '';
    const annotation = isBinary
      ? '@Transient '
      : needsSerialName(f)
        ? `${dtAnnotation}@SerialName("${f.name}") `
        : dtAnnotation;

    lines.push(`    ${annotation}val ${sdkName}: ${fullType}${default_},`);
  }

  const ext = m.isError ? ' : Exception()' : '';
  lines.push(`)${ext}`);
}

function emitResponseType(lines: string[], rt: IRResponseType): void {
  lines.push('@Serializable');
  lines.push(`data class ${rt.name}(`);
  lines.push(`    val data: List<${rt.dataRef}>,`);
  if (rt.metaRef) {
    const opt = rt.metaIsRequired ? '' : '?';
    const default_ = rt.metaIsRequired ? '' : ' = null';
    lines.push(`    val meta: ${rt.metaRef}${opt}${default_},`);
  }
  lines.push(')');
}

// ── Client.kt ────────────────────────────────────────────────────────

function generateClient(ir: IR): string {
  if (ir.services.length === 0) {
    return 'package com.pachca.sdk\n';
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
  lines.push('package com.pachca.sdk');
  lines.push('');
  lines.push('import io.ktor.client.*');
  lines.push('import io.ktor.client.call.*');
  lines.push('import io.ktor.client.plugins.*');
  lines.push('import io.ktor.client.plugins.auth.*');
  lines.push('import io.ktor.client.plugins.auth.providers.*');
  lines.push('import io.ktor.client.plugins.contentnegotiation.*');
  lines.push('import io.ktor.client.request.*');
  if (hasMultipart) {
    lines.push('import io.ktor.client.request.forms.*');
  }
  lines.push('import io.ktor.client.statement.*');
  lines.push('import io.ktor.http.*');
  lines.push('import io.ktor.serialization.kotlinx.json.*');
  lines.push('import kotlinx.serialization.json.Json');
  lines.push('import java.io.Closeable');
  const clientNeedDateTime = ir.params.some((p) => p.params.some((q) => q.type.kind === 'primitive' && q.type.primitive === 'string' && q.type.format === 'date-time'));
  if (clientNeedDateTime) {
    lines.push('import java.time.OffsetDateTime');
  }

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

  lines.push(`interface ${serviceName} {`);
  for (let i = 0; i < svc.operations.length; i++) {
    if (i > 0) lines.push('');
    emitInterfaceOperation(lines, svc.operations[i], ir);
    if (svc.operations[i].isPaginated && svc.operations[i].successResponse.dataRef) {
      lines.push('');
      emitInterfacePaginationMethod(lines, svc.operations[i], ir);
    }
  }
  lines.push('}');
  lines.push('');
  lines.push(`class ${implName} internal constructor(`);
  lines.push('    private val baseUrl: String,');
  lines.push('    private val client: HttpClient,');
  lines.push(`) : ${serviceName} {`);

  for (let i = 0; i < svc.operations.length; i++) {
    if (i > 0) lines.push('');
    emitOperation(lines, svc.operations[i], ir, globalHasApiError);
    if (svc.operations[i].isPaginated && svc.operations[i].successResponse.dataRef) {
      lines.push('');
      emitPaginationMethod(lines, svc.operations[i], ir);
    }
  }

  lines.push('}');
}

function emitInterfaceOperation(lines: string[], op: IROperation, ir: IR): void {
  const indent = '    ';
  const indent2 = '        ';
  const returnType = getReturnType(op, ir);
  const returnSuffix = returnType ? `: ${returnType}` : '';
  const params = buildMethodParams(op, ir);

  if (op.deprecated) lines.push(`${indent}@Deprecated("This method is deprecated")`);
  if (params.length === 0) {
    lines.push(`${indent}suspend fun ${op.methodName}()${returnSuffix} =`);
  } else if (params.length === 1) {
    lines.push(`${indent}suspend fun ${op.methodName}(${params[0]})${returnSuffix} =`);
  } else if (params.length <= 2) {
    lines.push(`${indent}suspend fun ${op.methodName}(${params.join(', ')})${returnSuffix} =`);
  } else {
    lines.push(`${indent}suspend fun ${op.methodName}(`);
    for (const p of params) lines.push(`${indent2}${p},`);
    lines.push(`${indent})${returnSuffix} =`);
  }
  lines.push(`${indent2}throw NotImplementedError(${JSON.stringify(`${op.tag}.${op.methodName} is not implemented`)})`);
}

function emitInterfacePaginationMethod(lines: string[], op: IROperation, ir: IR): void {
  const indent = '    ';
  const indent2 = '        ';
  const itemType = op.successResponse.dataRef ?? 'Any';
  const params: string[] = [];
  if (op.externalUrl) params.push(`${op.externalUrl}: String`);
  for (const p of op.pathParams) params.push(`${p.sdkName}: ${ktType(p.type)}`);
  for (const p of op.queryParams) {
    if (p.name === 'cursor') continue;
    const typeName = ktType(p.type);
    params.push(p.required ? `${p.sdkName}: ${typeName}` : `${p.sdkName}: ${typeName}? = null`);
  }

  if (params.length <= 2) {
    lines.push(`${indent}suspend fun ${op.methodName}All(${params.join(', ')}): List<${itemType}> =`);
  } else {
    lines.push(`${indent}suspend fun ${op.methodName}All(`);
    for (const p of params) lines.push(`${indent2}${p},`);
    lines.push(`${indent}): List<${itemType}> =`);
  }
  lines.push(`${indent2}throw NotImplementedError(${JSON.stringify(`${op.tag}.${op.methodName}All is not implemented`)})`);
}

function stripKotlinDefaultValue(param: string): string {
  const index = param.indexOf(' = ');
  return index === -1 ? param : param.slice(0, index);
}

function emitPaginationMethod(lines: string[], op: IROperation, ir: IR): void {
  const indent = '    ';
  const indent2 = '        ';
  const itemType = op.successResponse.dataRef ?? 'Any';

  // Build params: same as original minus cursor
  const params: string[] = [];
  if (op.externalUrl) params.push(`${op.externalUrl}: String`);
  for (const p of op.pathParams) params.push(`${p.sdkName}: ${ktType(p.type)}`);
  for (const p of op.queryParams) {
    if (p.name === 'cursor') continue;
    const typeName = ktType(p.type);
    params.push(p.required ? `${p.sdkName}: ${typeName}` : `${p.sdkName}: ${typeName}? = null`);
  }
  const overrideParams = params.map(stripKotlinDefaultValue);

  if (overrideParams.length <= 2) {
    lines.push(`${indent}override suspend fun ${op.methodName}All(${overrideParams.join(', ')}): List<${itemType}> {`);
  } else {
    lines.push(`${indent}override suspend fun ${op.methodName}All(`);
    for (const p of overrideParams) lines.push(`${indent2}${p},`);
    lines.push(`${indent}): List<${itemType}> {`);
  }

  lines.push(`${indent2}val items = mutableListOf<${itemType}>()`);
  lines.push(`${indent2}var cursor: String? = null`);
  lines.push(`${indent2}do {`);

  // Build call args for original method
  const callArgs: string[] = [];
  if (op.externalUrl) callArgs.push(`${op.externalUrl} = ${op.externalUrl}`);
  for (const p of op.pathParams) callArgs.push(`${p.sdkName} = ${p.sdkName}`);
  for (const p of op.queryParams) {
    if (p.name === 'cursor') {
      callArgs.push('cursor = cursor');
    } else {
      callArgs.push(`${p.sdkName} = ${p.sdkName}`);
    }
  }

  const callStr = callArgs.length <= 3
    ? `${op.methodName}(${callArgs.join(', ')})`
    : `${op.methodName}(\n${callArgs.map(a => `${indent2}        ${a},`).join('\n')}\n${indent2}    )`;
  lines.push(`${indent2}    val response = ${callStr}`);
  const rt = ir.responses.find((r) => r.name === op.successResponse.responseRef);
  const metaAccess = rt?.metaIsRequired ? 'response.meta.paginate.nextPage' : 'response.meta?.paginate?.nextPage';
  lines.push(`${indent2}    items.addAll(response.data)`);
  lines.push(`${indent2}    if (response.data.isEmpty()) break`);
  lines.push(`${indent2}    cursor = ${metaAccess}`);
  lines.push(rt?.metaIsRequired ? `${indent2}} while (true)` : `${indent2}} while (cursor != null)`);
  lines.push(`${indent2}return items`);
  lines.push(`${indent}}`);
}

function emitOperation(
  lines: string[],
  op: IROperation,
  ir: IR,
  globalHasApiError: boolean,
): void {
  const indent = '    ';
  const indent2 = '        ';

  const returnType = getReturnType(op, ir);
  const returnSuffix = returnType ? `: ${returnType}` : '';
  const params = buildMethodParams(op, ir).map(stripKotlinDefaultValue);

  if (op.deprecated) lines.push(`${indent}@Deprecated("This method is deprecated")`);
  if (params.length === 0) {
    lines.push(`${indent}override suspend fun ${op.methodName}()${returnSuffix} {`);
  } else if (params.length === 1) {
    lines.push(
      `${indent}override suspend fun ${op.methodName}(${params[0]})${returnSuffix} {`,
    );
  } else if (params.length <= 2) {
    lines.push(
      `${indent}override suspend fun ${op.methodName}(${params.join(', ')})${returnSuffix} {`,
    );
  } else {
    lines.push(`${indent}override suspend fun ${op.methodName}(`);
    for (const p of params) {
      lines.push(`${indent2}${p},`);
    }
    lines.push(`${indent})${returnSuffix} {`);
  }

  emitMethodBody(lines, op, ir, globalHasApiError);

  lines.push(`${indent}}`);
}

function getReturnType(
  op: IROperation,
  ir: IR,
): string | null {
  const resp = op.successResponse;
  if (resp.isRedirect) return 'String';
  if (!resp.hasBody) return null;
  if (resp.isList) {
    const rt = ir.responses.find((r) => r.name === resp.responseRef);
    return rt?.name ?? 'Any';
  }
  if (resp.isUnwrap && resp.dataRef) return resp.dataRef;
  return resp.dataRef ?? 'Any';
}

function buildMethodParams(
  op: IROperation,
  ir: IR,
): string[] {
  const params: string[] = [];

  if (op.externalUrl) {
    params.push(`${op.externalUrl}: String`);
  }

  for (const p of op.pathParams) {
    params.push(`${p.sdkName}: ${ktType(p.type)}`);
  }

  if (op.requestBody) {
    const rb = op.requestBody;
    if (shouldUnwrapBody(rb)) {
      const f = rb.unwrapField!;
      const sdkName = snakeToCamel(f.name);
      const typeName = ktType(f.type);
      params.push(`${sdkName}: ${typeName}`);
    } else if (rb.schemaRef) {
      params.push(`request: ${rb.schemaRef}`);
    }
  }

  for (const p of op.queryParams) {
    const typeName = ktType(p.type);
    if (p.required) {
      params.push(`${p.sdkName}: ${typeName}`);
    } else {
      params.push(`${p.sdkName}: ${typeName}? = null`);
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
  const indent3 = '            ';

  const isMultipart = op.requestBody?.contentType === 'multipart';
  const httpMethod = op.method.toLowerCase();

  let urlPath = op.path;
  for (const p of op.pathParams) {
    urlPath = urlPath.replace(`{${p.sdkName}}`, `\$${p.sdkName}`);
    urlPath = urlPath.replace(`{${p.name}}`, `\$${p.sdkName}`);
  }

  if (isMultipart) {
    emitMultipartBody(lines, op, ir, urlPath, globalHasApiError);
    return;
  }

  const hasQueryParams = op.queryParams.length > 0;
  const hasJsonBody =
    op.requestBody && op.requestBody.contentType === 'json';
  const needsBlock = hasQueryParams || hasJsonBody;

  const urlExpr = op.externalUrl ? op.externalUrl : `"$baseUrl${urlPath}"`;

  if (needsBlock) {
    lines.push(
      `${indent2}val response = client.${httpMethod}(${urlExpr}) {`,
    );
    for (const p of op.queryParams) {
      if (p.isArray) {
        const itemIsEnum = p.type.kind === 'array' && p.type.items?.kind === 'enum';
        const itemExpr = itemIsEnum ? 'it.value' : 'it';
        if (p.required) {
          lines.push(
            `${indent3}${p.sdkName}.forEach { parameter("${p.name}", ${itemExpr}) }`,
          );
        } else {
          lines.push(
            `${indent3}${p.sdkName}?.forEach { parameter("${p.name}", ${itemExpr}) }`,
          );
        }
      } else {
        const isDateTime = p.type.kind === 'primitive' && p.type.primitive === 'string' && p.type.format === 'date-time';
        const valueExpr = p.type.kind === 'enum' ? 'it.value' : isDateTime ? 'it.toString()' : 'it';
        if (p.required) {
          const reqExpr = p.type.kind === 'enum'
            ? `${p.sdkName}.value`
            : isDateTime
              ? `${p.sdkName}.toString()`
              : p.sdkName;
          lines.push(`${indent3}parameter("${p.name}", ${reqExpr})`);
        } else {
          lines.push(
            `${indent3}${p.sdkName}?.let { parameter("${p.name}", ${valueExpr}) }`,
          );
        }
      }
    }
    if (hasJsonBody) {
      lines.push(`${indent3}contentType(ContentType.Application.Json)`);
      const rb = op.requestBody!;
      if (shouldUnwrapBody(rb)) {
        const f = rb.unwrapField!;
        const sdkName = snakeToCamel(f.name);
        lines.push(
          `${indent3}setBody(${rb.schemaRef}(${sdkName} = ${sdkName}))`,
        );
      } else {
        lines.push(`${indent3}setBody(request)`);
      }
    }
    if (op.noAuth) lines.push(`${indent3}headers.remove(HttpHeaders.Authorization)`);
    lines.push(`${indent2}}`);
  } else {
    if (op.noAuth) {
      lines.push(
        `${indent2}val response = client.${httpMethod}(${urlExpr}) {`,
      );
      lines.push(`${indent3}headers.remove(HttpHeaders.Authorization)`);
      lines.push(`${indent2}}`);
    } else {
      lines.push(
        `${indent2}val response = client.${httpMethod}(${urlExpr})`,
      );
    }
  }

  emitResponseHandling(lines, op, globalHasApiError);
}

function emitMultipartBody(
  lines: string[],
  op: IROperation,
  ir: IR,
  urlPath: string,
  globalHasApiError: boolean,
): void {
  const indent2 = '        ';
  const indent3 = '            ';
  const indent4 = '                ';

  const reqModel = ir.models.find(
    (m) => m.name === op.requestBody!.schemaRef,
  );
  if (!reqModel) return;

  lines.push(
    `${indent2}val response = client.submitFormWithBinaryData(`,
  );
  const multipartUrl = op.externalUrl ? op.externalUrl : `"$baseUrl${urlPath}"`;
  lines.push(`${indent3}${multipartUrl},`);
  lines.push(`${indent3}formData {`);

  const binaryField = reqModel.fields.find(
    (f) => f.type.kind === 'binary',
  );
  const nonBinaryFields = reqModel.fields.filter(
    (f) => f.type.kind !== 'binary',
  );

  const isUnwrapped = shouldUnwrapBody(op.requestBody!);

  // Optional fields first (in schema order)
  for (const f of nonBinaryFields) {
    const sdkName = fieldSdkName(f);
    const ref = isUnwrapped ? sdkName : `request.${sdkName}`;
    const isOptional = !f.required || f.nullable;
    if (isOptional) {
      lines.push(
        `${indent4}${ref}?.let { append("${f.name}", it) }`,
      );
    }
  }
  // Required fields
  for (const f of nonBinaryFields) {
    const sdkName = fieldSdkName(f);
    const ref = isUnwrapped ? sdkName : `request.${sdkName}`;
    const isOptional = !f.required || f.nullable;
    if (!isOptional) {
      lines.push(`${indent4}append("${f.name}", ${ref})`);
    }
  }
  // Binary field
  if (binaryField) {
    const sdkName = fieldSdkName(binaryField);
    const ref = isUnwrapped ? sdkName : `request.${sdkName}`;
    lines.push(
      `${indent4}append("${binaryField.name}", ${ref}, Headers.build {`,
    );
    lines.push(
      `${indent4}    append(HttpHeaders.ContentDisposition, "filename=\\"${binaryField.name}\\"")`,
    );
    lines.push(`${indent4}})`);
  }

  lines.push(`${indent3}},`);
  if (op.noAuth) {
    lines.push(`${indent2}) {`);
    lines.push(`${indent3}headers.remove(HttpHeaders.Authorization)`);
    lines.push(`${indent2}}`);
  } else {
    lines.push(`${indent2})`);
  }

  emitResponseHandling(lines, op, globalHasApiError);
}

function emitResponseHandling(
  lines: string[],
  op: IROperation,
  globalHasApiError: boolean,
): void {
  const indent2 = '        ';
  const indent3 = '            ';

  const resp = op.successResponse;
  const hasReturn = resp.hasBody || resp.isRedirect;
  const keyword = hasReturn ? 'return when' : 'when';

  lines.push(`${indent2}${keyword} (response.status.value) {`);

  if (resp.isRedirect) {
    lines.push(
      `${indent3}${resp.statusCode} -> response.headers[HttpHeaders.Location]`,
    );
    lines.push(
      `${indent3}    ?: error("Missing Location header in redirect response")`,
    );
  } else if (!resp.hasBody) {
    lines.push(`${indent3}${resp.statusCode} -> return`);
  } else if (resp.isList) {
    lines.push(`${indent3}${resp.statusCode} -> response.body()`);
  } else if (resp.isUnwrap && resp.dataRef) {
    lines.push(
      `${indent3}${resp.statusCode} -> response.body<${resp.dataRef}DataWrapper>().data`,
    );
  } else {
    lines.push(`${indent3}${resp.statusCode} -> response.body()`);
  }

  // Error handling
  if (op.hasOAuthError) {
    lines.push(
      `${indent3}401 -> throw response.body<OAuthError>()`,
    );
  }
  // Use ApiError if the operation declares it OR if ApiError exists in the spec
  if (op.hasApiError || globalHasApiError) {
    lines.push(
      `${indent3}else -> throw response.body<ApiError>()`,
    );
  } else {
    lines.push(
      `${indent3}else -> throw RuntimeException("Unexpected status code: \${response.status.value}")`,
    );
  }

  lines.push(`${indent2}}`);
}

function emitPachcaClient(
  lines: string[],
  ir: IR,
  hasRedirect: boolean,
): void {
  const ktDefault = ir.baseUrl ? ` = ${JSON.stringify(ir.baseUrl)}` : '';
  const serviceEntries = ir.services
    .map((svc) => ({
      propName: tagToProperty(svc.tag),
      className: tagToServiceName(svc.tag),
    }))
    .sort((a, b) => a.propName.localeCompare(b.propName));

  // Private constructor taking nullable client + all services
  lines.push('class PachcaClient private constructor(');
  lines.push('    private val client: HttpClient?,');
  for (let i = 0; i < serviceEntries.length; i++) {
    const s = serviceEntries[i];
    const suffix = i < serviceEntries.length - 1 ? ',' : '';
    lines.push(`    val ${s.propName}: ${s.className}${suffix}`);
  }
  lines.push(') : Closeable {');
  lines.push('');
  lines.push('    companion object {');

  // operator fun invoke - creates HttpClient and real services
  const invokeArgs = [`token: String`, `baseUrl: String${ktDefault}`];
  for (const s of serviceEntries) {
    invokeArgs.push(`${s.propName}: ${s.className}? = null`);
  }
  lines.push('        operator fun invoke(');
  for (let i = 0; i < invokeArgs.length; i++) {
    const suffix = i < invokeArgs.length - 1 ? ',' : '';
    lines.push(`            ${invokeArgs[i]}${suffix}`);
  }
  lines.push('        ): PachcaClient {');
  lines.push('            val client = createClient(token)');
  lines.push('            return PachcaClient(');
  lines.push('                client = client,');
  for (let i = 0; i < serviceEntries.length; i++) {
    const s = serviceEntries[i];
    const suffix = i < serviceEntries.length - 1 ? ',' : '';
    lines.push(`                ${s.propName} = ${s.propName} ?: ${serviceToImplName(s.className)}(baseUrl, client)${suffix}`);
  }
  lines.push('            )');
  lines.push('        }');
  lines.push('');

  // fun stub - creates client without HttpClient
  lines.push('        fun stub(');
  for (let i = 0; i < serviceEntries.length; i++) {
    const s = serviceEntries[i];
    const suffix = i < serviceEntries.length - 1 ? ',' : '';
    lines.push(`            ${s.propName}: ${s.className} = object : ${s.className} {}${suffix}`);
  }
  lines.push('        ): PachcaClient = PachcaClient(');
  lines.push('            client = null,');
  for (let i = 0; i < serviceEntries.length; i++) {
    const s = serviceEntries[i];
    const suffix = i < serviceEntries.length - 1 ? ',' : '';
    lines.push(`            ${s.propName} = ${s.propName}${suffix}`);
  }
  lines.push('        )');
  lines.push('');

  // private fun createClient
  lines.push('        private fun createClient(token: String): HttpClient = HttpClient {');
  lines.push('            expectSuccess = false');
  if (hasRedirect) {
    lines.push('            followRedirects = false');
  }
  lines.push('            install(ContentNegotiation) { json(Json { explicitNulls = false }) }');
  lines.push('            install(HttpRequestRetry) {');
  lines.push('                maxRetries = 3');
  lines.push('                retryIf { _, response ->');
  lines.push('                    response.status.value == 429 || response.status.value in setOf(500, 502, 503, 504)');
  lines.push('                }');
  lines.push('                delayMillis { retry ->');
  lines.push('                    val retryAfter = response?.headers?.get("Retry-After")?.toLongOrNull()');
  lines.push('                    if (retryAfter != null && response?.status?.value == 429) {');
  lines.push('                        retryAfter * 1000L');
  lines.push('                    } else {');
  lines.push('                        val base = 10_000L * (1L shl retry)');
  lines.push('                        val jitter = 0.5 + kotlin.random.Random.nextDouble() * 0.5');
  lines.push('                        (base * jitter).toLong()
  lines.push('                }');
  lines.push('            }');
  lines.push('            defaultRequest { bearerAuth(token) }');
  lines.push('        }');
  lines.push('    }');
  lines.push('');
  lines.push('    override fun close() {');
  lines.push('        client?.close()');
  lines.push('    }');
  lines.push('}');
}

// ── Examples ──────────────────────────────────────────────────────────

function ktLiteral(
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
        return String(ft.example);
      }
      if (ft.primitive === 'boolean' && typeof ft.example === 'boolean') return String(ft.example);
      if (ft.primitive === 'string' && typeof ft.example === 'string') {
        if (ft.format === 'date-time') return `OffsetDateTime.parse(${JSON.stringify(ft.example)})`;
        return JSON.stringify(ft.example);
      }
    }
    if (ft.kind === 'enum' && typeof ft.example === 'string') {
      const e = ir.enums.find((en) => en.name === ft.ref);
      const member = e?.members.find((m) => m.value === ft.example);
      if (e && member) return `${e.name}.${snakeToUpperSnake(member.value)}`;
    }
  }
  switch (ft.kind) {
    case 'primitive': {
      if (ft.primitive === 'integer') return ft.format === 'int64' ? '123L' : '123';
      if (ft.primitive === 'number') return '1.5';
      if (ft.primitive === 'boolean') return 'true';
      if (ft.primitive === 'any') return 'mapOf<String, Any>()';
      // string with format variants
      if (ft.primitive === 'string') {
        if (ft.format === 'date-time') return 'OffsetDateTime.parse("2024-01-01T00:00:00Z")';
        if (ft.format === 'date') return '"2024-01-01"';
      }
      return '"example"';
    }
    case 'enum': {
      const e = ir.enums.find((en) => en.name === ft.ref);
      if (e && e.members.length > 0) {
        return `${e.name}.${snakeToUpperSnake(e.members[0].value)}`;
      }
      return `${ft.ref ?? 'Any'}()`;
    }
    case 'model': {
      const u = ir.unions.find((un) => un.name === ft.ref);
      if (u && u.memberRefs.length > 0) {
        return ktModelLiteral(u.memberRefs[0], ir, models, visited, indent);
      }
      return ktModelLiteral(ft.ref ?? 'Any', ir, models, visited, indent);
    }
    case 'array':
      return `listOf(${ktLiteral(ft.items!, ir, models, visited, indent)})`;
    case 'record':
      return `mapOf("key" to ${ktLiteral(ft.valueType!, ir, models, visited, indent)})`;
    case 'union': {
      const u = ir.unions.find((un) => un.name === ft.ref);
      if (u && u.memberRefs.length > 0) {
        return ktModelLiteral(u.memberRefs[0], ir, models, visited, indent);
      }
      return `${ft.ref ?? 'Any'}()`;
    }
    case 'literal':
      return `"${ft.literalValue}"`;
    case 'binary':
      return 'ByteArray(0)';
  }
}

function ktModelLiteral(
  modelName: string,
  ir: IR,
  models: Map<string, IRModel>,
  visited: Set<string>,
  indent: number = 0,
): string {
  if (visited.has(modelName)) return `${modelName}()`;
  const model = models.get(modelName);
  if (!model || model.fields.length === 0) return `${modelName}()`;

  const nextVisited = new Set(visited);
  nextVisited.add(modelName);

  const isCyclic = (f: IRField) =>
    f.type.kind === 'model' && f.type.ref != null && nextVisited.has(f.type.ref);
  const fields = model.fields.filter(
    (f) => (f.type.kind !== 'binary' || f.required) && !(isCyclic(f) && (!f.required || f.nullable)),
  );
  if (fields.length === 0) return `${modelName}()`;

  const multiLine = fields.length > 2;
  const childIndent = indent + 1;
  const pad = '    '.repeat(childIndent);
  const closePad = '    '.repeat(indent);

  const entries = fields.map((f) => {
    const name = fieldSdkName(f);
    const value = ktLiteral(f.type, ir, models, nextVisited, childIndent);
    return `${name} = ${value}`;
  });

  const hasMultiLineChild = entries.some((e) => e.includes('\n'));
  if (multiLine || hasMultiLineChild) {
    return `${modelName}(\n${entries.map((e) => `${pad}${e}`).join(',\n')}\n${closePad})`;
  }
  return `${modelName}(${entries.join(', ')})`;
}

function ktFingerprint(
  ft: IRFieldType,
  ir: IR,
  models: Map<string, IRModel>,
  visited: Set<string> = new Set(),
): string {
  switch (ft.kind) {
    case 'primitive':
      return ktType(ft);
    case 'enum':
      return ft.ref ?? 'Any';
    case 'model': {
      const model = models.get(ft.ref!);
      if (!model || visited.has(ft.ref!)) return ft.ref ?? 'Any';
      return ktModelFingerprint(model, ir, models, visited);
    }
    case 'array':
      return `List<${ktFingerprint(ft.items!, ir, models, visited)}>`;
    case 'record':
      return `Map<String, ${ktFingerprint(ft.valueType!, ir, models, visited)}>`;
    case 'union':
      return ft.ref ?? 'Any';
    case 'literal':
      return 'String';
    case 'binary':
      return 'ByteArray';
  }
}

function ktModelFingerprint(
  model: IRModel,
  ir: IR,
  models: Map<string, IRModel>,
  visited: Set<string>,
): string {
  const nextVisited = new Set(visited);
  nextVisited.add(model.name);

  const fields = model.fields.map((f) => {
    const name = fieldSdkName(f);
    const type = ktFingerprint(f.type, ir, models, nextVisited);
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
  if (resp.isRedirect) return 'String';
  if (!resp.hasBody) return null;

  if (resp.isList && resp.responseRef) {
    const rt = ir.responses.find((r) => r.name === resp.responseRef);
    if (rt) {
      const parts: string[] = [];
      parts.push(`data: List<${rt.dataRef}>`);
      if (rt.metaRef) {
        const opt = rt.metaIsRequired ? '' : '?';
        parts.push(`meta: ${rt.metaRef}${opt}`);
      }
      return `${rt.name}(${parts.join(', ')})`;
    }
  }

  if (resp.dataRef) {
    const model = models.get(resp.dataRef);
    if (model) return ktModelFingerprint(model, ir, models, new Set());
    return resp.dataRef;
  }

  return 'Any';
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
    params.push({ name: op.externalUrl, value: '"https://example.com"' });
  }

  for (const p of op.pathParams) {
    params.push({ name: p.sdkName, value: ktLiteral(p.type, ir, models) });
    for (const r of collectTypeRefs(p.type, ir, models)) imports.add(r);
  }

  if (op.requestBody) {
    const rb = op.requestBody;
    if (shouldUnwrapBody(rb) && rb.unwrapField) {
      const sdkName = snakeToCamel(rb.unwrapField.name);
      params.push({ name: sdkName, value: ktLiteral(rb.unwrapField.type, ir, models) });
      for (const r of collectTypeRefs(rb.unwrapField.type, ir, models)) imports.add(r);
    } else if (rb.schemaRef) {
      params.push({ name: 'request', value: ktLiteral({ kind: 'model', ref: rb.schemaRef }, ir, models) });
      for (const r of collectTypeRefs({ kind: 'model', ref: rb.schemaRef }, ir, models)) imports.add(r);
    }
  }

  for (const p of op.queryParams) {
    params.push({ name: p.sdkName, value: ktLiteral(p.type, ir, models) });
    for (const r of collectTypeRefs(p.type, ir, models)) imports.add(r);
  }

  const declarations: string[] = [];
  const callArgs: string[] = [];

  for (const { name, value } of params) {
    if (value.includes('(')) {
      declarations.push(`val ${name} = ${value}`);
      callArgs.push(`${name} = ${name}`);
    } else {
      callArgs.push(`${name} = ${value}`);
    }
  }

  const output = buildOutputFingerprint(op, ir, models);
  const rawCall = `client.${serviceProp}.${op.methodName}(${callArgs.join(', ')})`;
  const call = output ? `val response = ${rawCall}` : rawCall;
  const usage = declarations.length > 0
    ? [...declarations, call].join('\n')
    : call;

  return { usage, output, imports: [...imports].sort() };
}

function generateExamples(ir: IR): string {
  const models = buildModelIndex(ir);
  const result: Record<string, object> = {};

  result['Client_Init'] = {
    usage: 'val client = PachcaClient("YOUR_TOKEN")',
    imports: ['PachcaClient'],
  };

  for (const svc of ir.services) {
    const serviceProp = tagToProperty(svc.tag);
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

export class KotlinGenerator implements LanguageGenerator {
  readonly dirName = 'kt';

  generate(ir: IR, options?: GenerateOptions): GeneratedFile[] {
    const files: GeneratedFile[] = [
      { path: 'Models.kt', content: generateModels(ir) },
      { path: 'Client.kt', content: generateClient(ir) },
    ];
    if (options?.examples) {
      files.push({ path: 'examples.json', content: generateExamples(ir) });
    }
    return files;
  }
}
