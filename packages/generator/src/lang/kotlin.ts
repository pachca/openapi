import type {
  IR,
  IREnum,
  IRModel,
  IRUnion,
  IRField,
  IRFieldType,
  IRService,
  IROperation,
  IRParam,
  IRResponseType,
} from '../ir.js';
import type { GeneratedFile, LanguageGenerator } from './types.js';
import {
  snakeToCamel,
  snakeToUpperSnake,
  tagToProperty,
  tagToServiceName,
} from '../naming.js';

// ── Helpers ──────────────────────────────────────────────────────────

function ktType(ft: IRFieldType, enumNames: Set<string>): string {
  switch (ft.kind) {
    case 'primitive':
      if (ft.primitive === 'integer')
        return ft.format === 'int64' ? 'Long' : 'Int';
      if (ft.primitive === 'number') return 'Double';
      if (ft.primitive === 'boolean') return 'Boolean';
      return 'String';
    case 'enum':
    case 'model':
      return ft.ref ?? 'Any';
    case 'array':
      return `List<${ktType(ft.items!, enumNames)}>`;
    case 'record':
      return `Map<String, ${ktType(ft.valueType!, enumNames)}>`;
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
  if (field.name.includes('-')) {
    return field.name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  }
  return snakeToCamel(field.name);
}

function isEnumType(ft: IRFieldType, enumNames: Set<string>): boolean {
  if (ft.kind === 'enum') return true;
  if (ft.kind === 'model' && ft.ref && enumNames.has(ft.ref)) return true;
  return false;
}

function ktDefaultValue(
  value: unknown,
  type: IRFieldType,
  enumNames: Set<string>,
): string | null {
  if (value === null) return 'null';

  if (isEnumType(type, enumNames) && typeof value === 'string') {
    const enumType = ktType(type, enumNames);
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
      .map((v) => ktDefaultValue(v, type.items!, enumNames))
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

/** Whether to unwrap a single-field request body into function params */
function shouldUnwrapBody(
  unwrapMode: string,
  unwrapField?: IRField,
): boolean {
  if (unwrapMode !== 'single' || !unwrapField) return false;
  const k = unwrapField.type.kind;
  // Only unwrap simple types (primitive, array, enum), not model/record
  return k !== 'model' && k !== 'record';
}

// ── Models.kt ────────────────────────────────────────────────────────

function generateModels(ir: IR): string {
  const lines: string[] = [];
  const enumNames = new Set(ir.enums.map((e) => e.name));
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

  const imports: string[] = [];
  if (needSerialName) imports.push('import kotlinx.serialization.SerialName');
  imports.push('import kotlinx.serialization.Serializable');
  if (needTransient) imports.push('import kotlinx.serialization.Transient');
  lines.push(imports.join('\n'));

  // Enums
  for (const e of ir.enums) {
    lines.push('');
    emitEnum(lines, e);
  }

  // Unions
  for (const u of ir.unions) {
    lines.push('');
    emitUnion(lines, u, ir, enumNames);
  }

  // Models (skip union members)
  for (const m of ir.models) {
    if (unionMemberRefs.has(m.name)) continue;
    // Emit inline objects before parent
    for (const inl of m.inlineObjects) {
      lines.push('');
      emitModel(lines, inl, enumNames);
    }
    lines.push('');
    emitModel(lines, m, enumNames);
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
  enumNames: Set<string>,
): void {
  const memberModels = u.memberRefs
    .map((ref) => ir.models.find((m) => m.name === ref))
    .filter(Boolean) as IRModel[];

  let discriminatorField = 'type';
  if (memberModels.length > 0) {
    const litField = memberModels[0].fields.find(
      (f) => f.type.kind === 'literal',
    );
    if (litField) discriminatorField = litField.name;
  }

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
      const typeName = ktType(f.type, enumNames);
      const isOpt = !f.required;
      const fullType = isOpt ? `${typeName}?` : typeName;
      const default_ = isOpt ? ' = null' : '';
      const serialName =
        needsSerialName(f) ? `@SerialName("${f.name}") ` : '';
      lines.push(`    ${serialName}val ${sdkName}: ${fullType}${default_},`);
    }
    lines.push(`) : ${u.name}`);
  }
}

function emitModel(
  lines: string[],
  m: IRModel,
  enumNames: Set<string>,
): void {
  const fields = m.fields;

  lines.push('@Serializable');

  if (fields.length === 0) {
    const ext = m.isError ? ' : Exception()' : '';
    lines.push(`data class ${m.name}()${ext}`);
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
    const typeName = ktType(f.type, enumNames);
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
        const renderedDefault = ktDefaultValue(f.defaultValue, f.type, enumNames);
        default_ = renderedDefault !== null ? ` = ${renderedDefault}` : ' = null';
      } else {
        default_ = ' = null';
      }
    } else {
      fullType = typeName;
      default_ = '';
    }

    const annotation = isBinary
      ? '@Transient '
      : needsSerialName(f)
        ? `@SerialName("${f.name}") `
        : '';

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
  const enumNames = new Set(ir.enums.map((e) => e.name));
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
  lines.push('import io.ktor.client.plugins.contentnegotiation.*');
  lines.push('import io.ktor.client.request.*');
  if (hasMultipart) {
    lines.push('import io.ktor.client.request.forms.*');
  }
  lines.push('import io.ktor.client.statement.*');
  lines.push('import io.ktor.http.*');
  lines.push('import io.ktor.serialization.kotlinx.json.*');
  lines.push('import java.io.Closeable');

  // Services
  for (const svc of ir.services) {
    lines.push('');
    emitService(lines, svc, ir, enumNames, globalHasApiError);
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
  enumNames: Set<string>,
  globalHasApiError: boolean,
): void {
  const serviceName = tagToServiceName(svc.tag);

  lines.push(`class ${serviceName} internal constructor(`);
  lines.push('    private val baseUrl: String,');
  lines.push('    private val client: HttpClient,');
  lines.push(') {');

  for (let i = 0; i < svc.operations.length; i++) {
    if (i > 0) lines.push('');
    emitOperation(lines, svc.operations[i], ir, enumNames, globalHasApiError);
  }

  lines.push('}');
}

function emitOperation(
  lines: string[],
  op: IROperation,
  ir: IR,
  enumNames: Set<string>,
  globalHasApiError: boolean,
): void {
  const indent = '    ';
  const indent2 = '        ';

  const returnType = getReturnType(op, ir, enumNames);
  const returnSuffix = returnType ? `: ${returnType}` : '';
  const params = buildMethodParams(op, ir, enumNames);

  if (params.length === 0) {
    lines.push(`${indent}suspend fun ${op.methodName}()${returnSuffix} {`);
  } else if (params.length === 1) {
    lines.push(
      `${indent}suspend fun ${op.methodName}(${params[0]})${returnSuffix} {`,
    );
  } else if (params.length <= 2) {
    lines.push(
      `${indent}suspend fun ${op.methodName}(${params.join(', ')})${returnSuffix} {`,
    );
  } else {
    lines.push(`${indent}suspend fun ${op.methodName}(`);
    for (const p of params) {
      lines.push(`${indent2}${p},`);
    }
    lines.push(`${indent})${returnSuffix} {`);
  }

  emitMethodBody(lines, op, ir, enumNames, globalHasApiError);

  lines.push(`${indent}}`);
}

function getReturnType(
  op: IROperation,
  ir: IR,
  enumNames: Set<string>,
): string | null {
  const resp = op.successResponse;
  if (resp.isRedirect) return 'String';
  if (!resp.hasBody) return null;
  if (resp.isList) {
    const rt = ir.responses.find(
      (r) => r.dataRef === resp.dataRef && r.dataIsArray,
    );
    return rt?.name ?? 'Any';
  }
  if (resp.isUnwrap && resp.dataRef) return resp.dataRef;
  return resp.dataRef ?? 'Any';
}

function buildMethodParams(
  op: IROperation,
  ir: IR,
  enumNames: Set<string>,
): string[] {
  const params: string[] = [];

  for (const p of op.pathParams) {
    params.push(`${p.sdkName}: ${ktType(p.type, enumNames)}`);
  }

  if (op.requestBody) {
    const rb = op.requestBody;
    if (shouldUnwrapBody(rb.unwrapMode, rb.unwrapField)) {
      const f = rb.unwrapField!;
      const sdkName = snakeToCamel(f.name);
      const typeName = ktType(f.type, enumNames);
      params.push(`${sdkName}: ${typeName}`);
    } else if (rb.schemaRef) {
      params.push(`request: ${rb.schemaRef}`);
    }
  }

  for (const p of op.queryParams) {
    const typeName = ktType(p.type, enumNames);
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
  enumNames: Set<string>,
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
    emitMultipartBody(lines, op, ir, enumNames, urlPath, globalHasApiError);
    return;
  }

  const hasQueryParams = op.queryParams.length > 0;
  const hasJsonBody =
    op.requestBody && op.requestBody.contentType === 'json';
  const needsBlock = hasQueryParams || hasJsonBody;

  if (needsBlock) {
    lines.push(
      `${indent2}val response = client.${httpMethod}("$baseUrl${urlPath}") {`,
    );
    for (const p of op.queryParams) {
      if (p.isArray) {
        if (p.required) {
          lines.push(
            `${indent3}${p.sdkName}.forEach { parameter("${p.name}", it) }`,
          );
        } else {
          lines.push(
            `${indent3}${p.sdkName}?.forEach { parameter("${p.name}", it) }`,
          );
        }
      } else {
        const valueExpr = isEnumType(p.type, enumNames) ? 'it.value' : 'it';
        if (p.required) {
          const reqExpr = isEnumType(p.type, enumNames)
            ? `${p.sdkName}.value`
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
      if (shouldUnwrapBody(rb.unwrapMode, rb.unwrapField)) {
        const f = rb.unwrapField!;
        const sdkName = snakeToCamel(f.name);
        lines.push(
          `${indent3}setBody(${rb.schemaRef}(${sdkName} = ${sdkName}))`,
        );
      } else {
        lines.push(`${indent3}setBody(request)`);
      }
    }
    lines.push(`${indent2}}`);
  } else {
    lines.push(
      `${indent2}val response = client.${httpMethod}("$baseUrl${urlPath}")`,
    );
  }

  emitResponseHandling(lines, op, globalHasApiError);
}

function emitMultipartBody(
  lines: string[],
  op: IROperation,
  ir: IR,
  _enumNames: Set<string>,
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
  lines.push(`${indent3}"$baseUrl${urlPath}",`);
  lines.push(`${indent3}formData {`);

  const binaryField = reqModel.fields.find(
    (f) => f.type.kind === 'binary',
  );
  const nonBinaryFields = reqModel.fields.filter(
    (f) => f.type.kind !== 'binary',
  );

  // Optional fields first (in schema order)
  for (const f of nonBinaryFields) {
    const sdkName = fieldSdkName(f);
    const isOptional = !f.required || f.nullable;
    if (isOptional) {
      lines.push(
        `${indent4}request.${sdkName}?.let { append("${f.name}", it) }`,
      );
    }
  }
  // Required fields
  for (const f of nonBinaryFields) {
    const sdkName = fieldSdkName(f);
    const isOptional = !f.required || f.nullable;
    if (!isOptional) {
      lines.push(`${indent4}append("${f.name}", request.${sdkName})`);
    }
  }
  // Binary field
  if (binaryField) {
    const sdkName = fieldSdkName(binaryField);
    lines.push(
      `${indent4}append("${binaryField.name}", request.${sdkName}, Headers.build {`,
    );
    lines.push(
      `${indent4}    append(HttpHeaders.ContentDisposition, "filename=\\"${binaryField.name}\\"")`,
    );
    lines.push(`${indent4}})`);
  }

  lines.push(`${indent3}},`);
  lines.push(`${indent2})`);

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
  lines.push('class PachcaClient(baseUrl: String, token: String) : Closeable {');
  lines.push('    private val client = HttpClient {');
  lines.push('        expectSuccess = false');
  if (hasRedirect) {
    lines.push('        followRedirects = false');
  }
  lines.push('        install(ContentNegotiation) {');
  lines.push('            json()');
  lines.push('        }');
  lines.push('        defaultRequest {');
  lines.push('            bearerAuth(token)');
  lines.push('        }');
  lines.push('    }');
  lines.push('');

  const serviceEntries = ir.services
    .map((svc) => ({
      propName: tagToProperty(svc.tag),
      className: tagToServiceName(svc.tag),
    }))
    .sort((a, b) => a.propName.localeCompare(b.propName));

  for (const s of serviceEntries) {
    lines.push(`    val ${s.propName} = ${s.className}(baseUrl, client)`);
  }

  lines.push('');
  lines.push('    override fun close() {');
  lines.push('        client.close()');
  lines.push('    }');
  lines.push('}');
}

// ── Main ─────────────────────────────────────────────────────────────

export class KotlinGenerator implements LanguageGenerator {
  readonly dirName = 'kt';

  generate(ir: IR): GeneratedFile[] {
    return [
      { path: 'Models.kt', content: generateModels(ir) },
      { path: 'Client.kt', content: generateClient(ir) },
    ];
  }
}
