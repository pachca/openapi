import {
  shouldUnwrapBody,
  type IR,
  type IREnum,
  type IRField,
  type IRFieldType,
  type IRModel,
  type IROperation,
  type IRResponseType,
  type IRService,
  type IRUnion,
  paginateHasNext,
} from '../ir.js';
import { bodyExample, buildModelIndex, collectTypeRefs, namedBodyExamples, nullableOptionalFields, requestModelNames, type GeneratedFile, type GenerateOptions, type LanguageGenerator } from './types.js';
import {
  camelToSnake,
  snakeToUpperSnake,
  tagToServiceName,
  serviceToImplName,
} from '../naming.js';

const PYTHON_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
  'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
  'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
  'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield',
]);

function pyFieldName(field: IRField): string {
  const name = field.name.includes('-')
    ? field.name.replace(/-/g, '_').toLowerCase()
    : camelToSnake(field.name);
  if (PYTHON_KEYWORDS.has(name)) return `${name}_`;
  return name;
}

function pyServiceProp(tag: string): string {
  return tag
    .trim()
    .split(/\s+/)
    .map((w) => w.toLowerCase())
    .join('_');
}

function pyMethodName(op: IROperation): string {
  return camelToSnake(op.methodName);
}

function pyParamName(sdkName: string): string {
  return camelToSnake(sdkName);
}

function pyEnumMemberName(value: string): string {
  return snakeToUpperSnake(value).replace(/[^A-Z0-9_]/g, '_');
}

function isOptionalField(field: IRField): boolean {
  return !field.required || field.nullable;
}

function hasAnyTypeInField(ft: IRFieldType): boolean {
  if (ft.kind === 'primitive' && ft.primitive === 'any') return true;
  if (ft.items) return hasAnyTypeInField(ft.items);
  if (ft.valueType) return hasAnyTypeInField(ft.valueType);
  return false;
}

function hasDateTimeInField(ft: IRFieldType): boolean {
  if (ft.kind === 'primitive' && ft.primitive === 'string' && ft.format === 'date-time') return true;
  if (ft.items) return hasDateTimeInField(ft.items);
  if (ft.valueType) return hasDateTimeInField(ft.valueType);
  return false;
}

function hasAnyType(model: IRModel): boolean {
  return model.fields.some((f) => hasAnyTypeInField(f.type)) ||
    model.inlineObjects.some((m) => hasAnyType(m));
}

function pyType(ft: IRFieldType): string {
  switch (ft.kind) {
    case 'primitive':
      if (ft.primitive === 'integer') return 'int';
      if (ft.primitive === 'number') return 'float';
      if (ft.primitive === 'boolean') return 'bool';
      if (ft.primitive === 'any') return 'Any';
      if (ft.primitive === 'string' && ft.format === 'date-time') return 'datetime';
      return 'str';
    case 'enum':
    case 'model':
    case 'union':
      // A value union is the union of its members: `list[str] | ScopesChange`.
      if (ft.kind === 'union' && ft.valueUnion && ft.members) return ft.members.map(pyType).join(' | ');
      return ft.ref ?? 'object';
    case 'array':
      return `list[${pyType(ft.items!)}]`;
    case 'record':
      return `dict[str, ${pyType(ft.valueType!)}]`;
    case 'literal':
      return 'str';
    case 'binary':
      return 'bytes';
  }
}

function pyDefault(
  field: IRField,
): string | null {
  if (field.defaultValue === undefined) return null;
  const value = field.defaultValue;
  if (value === null) return 'None';
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    if (field.type.kind === 'enum' && field.type.ref) {
      return `${field.type.ref}.${pyEnumMemberName(value)}`;
    }
    return JSON.stringify(value);
  }
  return null;
}

/** The open enum type of `OAuthError.error`, when the spec gives that field one. */
function oauthErrorCodeEnum(ir: IR): string | undefined {
  const field = ir.models.find((m) => m.name === 'OAuthError')?.fields.find((f) => f.name === 'error');
  if (field?.type.kind !== 'enum' || !field.type.ref) return undefined;
  return ir.enums.find((e) => e.name === field.type.ref)?.open ? field.type.ref : undefined;
}

/**
 * `StrEnum` appeared in Python 3.11, and the package supports 3.10: there it is a
 * `str` mixin whose `str()` and f-strings give the value, as `StrEnum` does.
 */
function emitStrEnumImport(lines: string[]): void {
  lines.push('try:');
  lines.push('    from enum import StrEnum');
  lines.push('except ImportError:  # Python 3.10');
  lines.push('    from enum import Enum');
  lines.push('');
  lines.push('    class StrEnum(str, Enum):  # noqa: UP042');
  lines.push('        def __str__(self) -> str:');
  lines.push('            return self._value_');
  lines.push('');
  lines.push('        def __format__(self, format_spec: str) -> str:');
  lines.push('            return self._value_.__format__(format_spec)');
}

/**
 * Base of the open enums: a value the SDK does not list yet becomes a member that
 * keeps it, instead of a `ValueError`. That member is not registered on the
 * class, so `is_known` tells it apart even when the enum lists `unknown` itself;
 * its name then becomes `UNKNOWN_VALUE`, as the Swift catch-all `unknownValue`.
 */
function emitOpenStrEnum(lines: string[]): void {
  lines.push('class OpenStrEnum(StrEnum):');
  lines.push('    """An enum of responses: a value this SDK does not list yet becomes a member that keeps it, with is_known False."""');
  lines.push('');
  lines.push('    @classmethod');
  lines.push('    def _missing_(cls, value: object) -> OpenStrEnum | None:');
  lines.push('        if not isinstance(value, str):');
  lines.push('            return None');
  lines.push('        member = str.__new__(cls, value)');
  lines.push('        member._name_ = "UNKNOWN_VALUE" if "UNKNOWN" in cls.__members__ else "UNKNOWN"');
  lines.push('        member._value_ = value');
  lines.push('        return member');
  lines.push('');
  lines.push('    @property');
  lines.push('    def is_known(self) -> bool:');
  lines.push('        """Whether this SDK version lists the value."""');
  lines.push('        return self._value_ in type(self)._value2member_map_');
}

function emitEnum(lines: string[], e: IREnum): void {
  lines.push(`class ${e.name}(${e.open ? 'OpenStrEnum' : 'StrEnum'}):`);
  if (e.description && e.hasDescriptions && e.members.length > 1) {
    lines.push(`    """${e.description}"""`);
    lines.push('');
  }
  for (const m of e.members) {
    const suffix = m.description ? `  # ${m.description}` : '';
    lines.push(
      `    ${pyEnumMemberName(m.value)} = ${JSON.stringify(m.value)}${suffix}`,
    );
  }
}

function emitModel(
  lines: string[],
  m: IRModel,
  allModels: IRModel[],
  requestModels: Set<string> = new Set(),
): void {
  lines.push('@dataclass');
  if (m.isError) {
    lines.push(`class ${m.name}(Exception):`);
  } else {
    lines.push(`class ${m.name}:`);
  }

  if (m.fields.length === 0) {
    lines.push('    pass');
    return;
  }

  const requiredFirst = [...m.fields].sort((a, b) => {
    const aOpt = isOptionalField(a);
    const bOpt = isOptionalField(b);
    if (aOpt !== bOpt) return aOpt ? 1 : -1;
    return 0;
  });

  for (const f of requiredFirst) {
    const name = pyFieldName(f);
    const type = pyType(f.type);
    if (f.type.kind === 'literal' && f.type.literalValue) {
      lines.push(`    ${name}: str  # literal "${f.type.literalValue}"`);
      continue;
    }

    let fullType = type;
    if (isOptionalField(f)) fullType = `${fullType} | None`;

    const explicitDefault = pyDefault(f);
    if (explicitDefault !== null) {
      lines.push(`    ${name}: ${fullType} = ${explicitDefault}`);
    } else if (isOptionalField(f)) {
      lines.push(`    ${name}: ${fullType} = None`);
    } else {
      lines.push(`    ${name}: ${fullType}`);
    }
  }

  // An unset field stays out of the body: null_fields sends null by name.
  const nullable = requestModels.has(m.name) ? nullableOptionalFields(m) : [];
  if (nullable.length > 0) {
    lines.push(`    # Fields to send as null: ${nullable.map(pyFieldName).join(', ')}`);
    lines.push('    null_fields: Sequence[str] = ()');
  }

  if (m.name === 'ApiError') {
    const errorsField = m.fields.find((f) => f.name === 'errors');
    const itemsRef = errorsField?.type.kind === 'array' && errorsField.type.items?.kind === 'model'
      ? errorsField.type.items.ref
      : undefined;
    const itemsModel = itemsRef ? allModels.find((am) => am.name === itemsRef) : undefined;
    const hasMessage = itemsModel?.fields.some((f) => f.name === 'message');

    lines.push('    # HTTP status code of the answer, set by the client. An empty body or one that is not JSON leaves errors empty.');
    lines.push('    status_code: int | None = None');

    if (hasMessage) {
      lines.push('');
      lines.push('    def __str__(self) -> str:');
      lines.push('        if not self.errors:');
      lines.push('            return f"HTTP {self.status_code}" if self.status_code is not None else "api error"');
      lines.push('        if len(self.errors) == 1:');
      lines.push('            return self.errors[0].message');
      lines.push('        return "Errors: " + "; ".join(e.message for e in self.errors)');
    }
  }
  if (m.name === 'OAuthError') {
    const errField = m.fields.find((f) => f.name === 'error');
    if (errField) {
      lines.push('');
      lines.push('    def __str__(self) -> str:');
      lines.push(errField.type.kind === 'enum'
        ? `        return str(self.${pyFieldName(errField)})`
        : `        return self.${pyFieldName(errField)}`);
    }
  }
}

function emitUnion(lines: string[], u: IRUnion): void {
  lines.push(`${u.name} = Union[${u.memberRefs.join(', ')}]`);
}

function emitParamsType(lines: string[], name: string, params: IROperation['queryParams']): void {
  lines.push('@dataclass');
  lines.push(`class ${name}:`);
  if (params.length === 0) {
    lines.push('    pass');
    return;
  }
  const sorted = [...params].sort((a, b) => {
    if (a.required !== b.required) return a.required ? -1 : 1;
    return 0;
  });
  for (const p of sorted) {
    const t = pyType(p.type);
    const fieldName = pyParamName(p.sdkName);
    if (p.required) {
      lines.push(`    ${fieldName}: ${t}`);
    } else {
      lines.push(`    ${fieldName}: ${t} | None = None`);
    }
  }
}

function emitResponseType(lines: string[], rt: IRResponseType): void {
  lines.push('@dataclass');
  lines.push(`class ${rt.name}:`);
  lines.push(rt.dataIsArray ? `    data: list[${rt.dataRef}]` : `    data: ${rt.dataRef}`);
  if (rt.metaRef) {
    if (rt.metaIsRequired) lines.push(`    meta: ${rt.metaRef}`);
    else lines.push(`    meta: ${rt.metaRef} | None = None`);
  }
}

function generateModels(ir: IR): string {
  const lines: string[] = [];
  const needDataclass = ir.models.length > 0 || ir.params.length > 0 || ir.responses.length > 0;
  const needEnum = ir.enums.length > 0;
  const needUnion = ir.unions.length > 0;
  const needAny = ir.models.some((m) => hasAnyType(m)) || ir.params.some((p) => p.params.some((q) => hasAnyTypeInField(q.type)));
  const needDatetime = ir.models.some((m) => m.fields.some((f) => hasDateTimeInField(f.type))) || ir.params.some((p) => p.params.some((q) => hasDateTimeInField(q.type)));

  const requestModelsForImports = requestModelNames(ir);
  const needSequence = [...buildModelIndex(ir).values()].some(
    (m) => requestModelsForImports.has(m.name) && nullableOptionalFields(m).length > 0,
  );

  lines.push('from __future__ import annotations');
  lines.push('');
  if (needSequence) lines.push('from collections.abc import Sequence');
  if (needDatetime) lines.push('from datetime import datetime');
  if (needDataclass) lines.push('from dataclasses import dataclass');
  const typingImports: string[] = [];
  if (needAny) typingImports.push('Any');
  if (needUnion) typingImports.push('Union');
  if (typingImports.length > 0) lines.push(`from typing import ${typingImports.join(', ')}`);
  if (needDataclass || needEnum) lines.push('');
  if (needEnum) {
    emitStrEnumImport(lines);
    lines.push('');
    lines.push('');
  }

  const unionMembers = new Set<string>();
  for (const u of ir.unions) for (const ref of u.memberRefs) unionMembers.add(ref);
  const requestModels = requestModelNames(ir);

  if (ir.enums.some((e) => e.open)) {
    emitOpenStrEnum(lines);
    lines.push('');
    lines.push('');
  }

  for (const e of ir.enums) {
    emitEnum(lines, e);
    lines.push('');
    lines.push('');
  }

  for (const m of ir.models) {
    for (const inl of m.inlineObjects) {
      emitModel(lines, inl, ir.models, requestModels);
      lines.push('');
      lines.push('');
    }
    if (unionMembers.has(m.name)) {
      emitModel(lines, m, ir.models, requestModels);
      lines.push('');
      lines.push('');
      continue;
    }
    emitModel(lines, m, ir.models, requestModels);
    lines.push('');
    lines.push('');
  }

  for (const u of ir.unions) {
    emitUnion(lines, u);
    lines.push('');
    lines.push('');
  }

  for (const p of ir.params) {
    emitParamsType(lines, p.name, p.params);
    lines.push('');
    lines.push('');
  }

  for (const r of ir.responses) {
    emitResponseType(lines, r);
    lines.push('');
    lines.push('');
  }

  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  lines.push('');
  return lines.join('\n');
}

function opReturnType(op: IROperation, ir: IR): string {
  if (op.successResponse.isRedirect) return 'str';
  if (op.successResponse.isBinary) return 'bytes';
  if (!op.successResponse.hasBody) return 'None';
  if (op.successResponse.isList || op.successResponse.isSingleWithMeta) {
    const rt = ir.responses.find((r) => r.name === op.successResponse.responseRef);
    return rt?.name ?? 'object';
  }
  return op.successResponse.dataRef ?? 'object';
}

function pyPath(path: string, op: IROperation): string {
  let p = path;
  for (const param of op.pathParams) {
    p = p.replace(`{${param.name}}`, `{${pyParamName(param.sdkName)}}`);
  }
  return p;
}

function pyHasApiError(ir: IR): boolean {
  return ir.models.some((m) => m.name === 'ApiError');
}

function pyHasOAuthError(ir: IR): boolean {
  return ir.models.some((m) => m.name === 'OAuthError');
}

/** Both error models exist, so an error's class is read off its body. */
function pyPicksErrorByBody(ir: IR): boolean {
  return pyHasApiError(ir) && pyHasOAuthError(ir);
}

/** Only OAuthError exists: a 401 is read by its own helper, other errors stay a RuntimeError. */
function pyReadsOAuthErrorAlone(ir: IR): boolean {
  return pyHasOAuthError(ir) && !pyHasApiError(ir) && ir.services.some((s) => s.operations.some((o) => o.hasOAuthError));
}

/** `OAuthError(...)` built from a dict `body` whose `error` is a string. */
function pyOAuthErrorFromDict(ir: IR): string {
  const model = ir.models.find((m) => m.name === 'OAuthError');
  const codeEnum = oauthErrorCodeEnum(ir);
  const args = [`error=${codeEnum ? `${codeEnum}(body["error"])` : 'body["error"]'}`];
  if (model?.fields.some((f) => f.name === 'error_description')) {
    args.push('error_description=str(body.get("error_description") or "")');
  }
  return `OAuthError(${args.join(', ')})`;
}

/** A form body (`application/x-www-form-urlencoded`): httpx sends `data=` as one, empty fields left out. */
function pyFormData(op: IROperation): string {
  const rb = op.requestBody!;
  if (shouldUnwrapBody(rb)) {
    const f = rb.unwrapField!;
    return `{${JSON.stringify(f.name)}: str(${pyFieldName(f)})}`;
  }
  return '_form_data(serialize(request))';
}

function needsAsdict(ir: IR): boolean {
  return ir.services.some((s) =>
    s.operations.some((op) => {
      if (op.requestBody?.contentType !== 'json' && op.requestBody?.contentType !== 'form') return false;
      return !shouldUnwrapBody(op.requestBody);
    }),
  );
}

function collectClientImports(ir: IR): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (name: string): void => {
    if (!seen.has(name)) {
      seen.add(name);
      out.push(name);
    }
  };

  if (ir.services.length === 0) {
    for (const e of ir.enums) add(e.name);
    for (const m of ir.models) {
      for (const inl of m.inlineObjects) add(inl.name);
      add(m.name);
    }
    for (const u of ir.unions) add(u.name);
    for (const p of ir.params) add(p.name);
    for (const r of ir.responses) add(r.name);
    return out;
  }

  for (const s of ir.services) {
    for (const op of s.operations) {
      if (op.requestBody) {
        const rb = op.requestBody;
        if (rb.schemaRef && !shouldUnwrapBody(rb)) add(rb.schemaRef);
      }
      if (op.queryParams.length > 0) {
        const pascal = op.methodName.charAt(0).toUpperCase() + op.methodName.slice(1);
        add(`${pascal}Params`);
      }
      if (op.successResponse.hasBody && !op.successResponse.isRedirect) {
        if (op.successResponse.isList || op.successResponse.isSingleWithMeta) {
          const rt = ir.responses.find((r) => r.name === op.successResponse.responseRef);
          if (rt) add(rt.name);
          if (op.isPaginated && op.successResponse.dataRef) {
            add(op.successResponse.dataRef);
          }
        } else if (op.successResponse.dataRef) {
          add(op.successResponse.dataRef);
        }
      }
      if (op.methodName === 'getWebhookEvents' && op.successResponse.dataRef === 'WebhookEvent') {
        add('WebhookPayloadUnion');
      }
      if (op.hasOAuthError || ir.models.some((m) => m.name === 'OAuthError')) {
        add('OAuthError');
        // The error helpers build the OAuthError themselves, its code included.
        const codeEnum = oauthErrorCodeEnum(ir);
        if (codeEnum && (pyPicksErrorByBody(ir) || pyReadsOAuthErrorAlone(ir))) add(codeEnum);
      }
      if (op.hasApiError || ir.models.some((m) => m.name === 'ApiError')) {
        add('ApiError');
      }
      for (const p of op.pathParams) {
        if (p.type.ref) add(p.type.ref);
      }
      for (const p of op.queryParams) {
        if (p.type.ref) add(p.type.ref);
      }
      if (op.requestBody && shouldUnwrapBody(op.requestBody)) {
        const f = op.requestBody.unwrapField!;
        if (f.type.ref) add(f.type.ref);
      }
    }
  }

  return out;
}

function emitOperation(lines: string[], op: IROperation, ir: IR): void {
  const args: string[] = [];
  if (op.externalUrl) {
    args.push(`${camelToSnake(op.externalUrl)}: str`);
  }
  for (const p of op.pathParams) args.push(`${pyParamName(p.sdkName)}: ${pyType(p.type)}`);

  if (op.requestBody) {
    const rb = op.requestBody;
    if (shouldUnwrapBody(rb)) {
      const f = rb.unwrapField!;
      args.push(`${pyFieldName(f)}: ${pyType(f.type)}`);
    } else if (rb.schemaRef) {
      args.push(`request: ${rb.schemaRef}`);
    }
  }

  if (op.queryParams.length > 0) {
    const pascal = op.methodName.charAt(0).toUpperCase() + op.methodName.slice(1);
    const hasRequired = op.queryParams.some((p) => p.required);
    args.push(
      hasRequired
        ? `params: ${pascal}Params`
        : `params: ${pascal}Params | None = None`,
    );
  }

  if (op.deprecated) lines.push('    # Deprecated');
  lines.push(`    async def ${pyMethodName(op)}(`);
  if (args.length === 0) {
    lines.push(
      `        self${opReturnType(op, ir) ? `) -> ${opReturnType(op, ir)}:` : '):'}`
    );
  } else {
    lines.push('        self,');
    for (const a of args) lines.push(`        ${a},`);
    lines.push(`    ) -> ${opReturnType(op, ir)}:`);
  }

  const path = pyPath(op.path, op);
  const isMultipart = op.requestBody?.contentType === 'multipart';
  if (isMultipart) {
    lines.push(`        data: dict[str, str] = {}`);
    const req = ir.models.find((m) => m.name === op.requestBody!.schemaRef);
    const isUnwrapped = shouldUnwrapBody(op.requestBody!);
    if (req) {
      const binary = req.fields.find((f) => f.type.kind === 'binary');
      const nonBinary = req.fields.filter((f) => f.type.kind !== 'binary');
      for (const f of nonBinary.filter((x) => !isOptionalField(x))) {
        const ref = isUnwrapped ? pyFieldName(f) : `request.${pyFieldName(f)}`;
        lines.push(
          `        data[${JSON.stringify(f.name)}] = ${ref}`,
        );
      }
      for (const f of nonBinary.filter((x) => isOptionalField(x))) {
        const ref = isUnwrapped ? pyFieldName(f) : `request.${pyFieldName(f)}`;
        lines.push(`        if ${ref} is not None:`);
        lines.push(
          `            data[${JSON.stringify(f.name)}] = ${ref}`,
        );
      }
      const binaryRef = binary
        ? (isUnwrapped ? pyFieldName(binary) : `request.${pyFieldName(binary)}`)
        : undefined;
      const filesExpr = binary
        ? `{"${binary.name}": ${binaryRef}}`
        : '{}';
      const mpPathStr = op.externalUrl
        ? camelToSnake(op.externalUrl)
        : path.includes('{') ? `f"${path}"` : `"${path}"`;
      const pyClient = op.noAuth ? 'httpx.AsyncClient()' : 'self._client';
      if (op.noAuth) {
        lines.push(`        async with ${pyClient} as _no_auth:`);
        lines.push('            response = await _no_auth.post(');
        lines.push(`                ${mpPathStr},`);
        lines.push('                data=data,');
        lines.push(`                files=${filesExpr},`);
        lines.push('            )');
      } else {
        lines.push('        response = await self._client.post(');
        lines.push(`            ${mpPathStr},`);
        lines.push('            data=data,');
        lines.push(`            files=${filesExpr},`);
        lines.push('        )');
      }
    } else {
      const elsePathStr = op.externalUrl
        ? camelToSnake(op.externalUrl)
        : path.includes('{') ? `f"${path}"` : `"${path}"`;
      if (op.noAuth) {
        lines.push(`        async with httpx.AsyncClient() as _no_auth:`);
        lines.push(`            response = await _no_auth.${op.method.toLowerCase()}(${elsePathStr})`);
      } else {
        lines.push(`        response = await self._client.${op.method.toLowerCase()}(${elsePathStr})`);
      }
    }
  } else {
    if (op.queryParams.length > 0) {
      const hasArray = op.queryParams.some((p) => p.isArray);
      if (hasArray || op.queryParams.some((p) => p.required)) {
        lines.push('        query: list[tuple[str, str]] = []');
      } else {
        lines.push('        query: dict[str, str] = {}');
      }
      for (const p of op.queryParams) {
        const paramName = pyParamName(p.sdkName);
        const v = `params.${paramName}`;
        const maybe = p.required ? v : `params.${paramName}`;
        if (p.isArray) {
          const guard = p.required ? `${maybe} is not None` : `params is not None and ${maybe} is not None`;
          lines.push(`        if ${guard}:`);
          lines.push(`            for v in ${v}:`);
          lines.push(`                query.append((${JSON.stringify(p.name)}, str(v)))`);
        } else {
          const isDateTime = p.type.kind === 'primitive' && p.type.primitive === 'string' && p.type.format === 'date-time';
          const rhs = p.type.kind === 'primitive' && p.type.primitive === 'boolean'
            ? `str(${v}).lower()`
            : p.type.kind === 'primitive' &&
              (p.type.primitive === 'integer' || p.type.primitive === 'number')
              ? `str(${v})`
              : isDateTime
                ? `${v}.isoformat()`
                : v;
          if (p.required) {
            if (op.queryParams.some((x) => x.isArray) || op.queryParams.some((x) => x.required)) {
              lines.push(`        query.append((${JSON.stringify(p.name)}, ${rhs}))`);
            } else {
              lines.push(`        query[${JSON.stringify(p.name)}] = ${rhs}`);
            }
          } else {
            lines.push(`        if params is not None and ${v} is not None:`);
            if (op.queryParams.some((x) => x.isArray) || op.queryParams.some((x) => x.required)) {
              lines.push(`            query.append((${JSON.stringify(p.name)}, ${rhs}))`);
            } else {
              lines.push(`            query[${JSON.stringify(p.name)}] = ${rhs}`);
            }
          }
        }
      }
    }

    const method = op.method.toLowerCase();
    const hasBody = op.requestBody?.contentType === 'json';
    const hasQuery = op.queryParams.length > 0;
    const pathStr = op.externalUrl
      ? camelToSnake(op.externalUrl)
      : path.includes('{') ? `f"${path}"` : `"${path}"`;
    const headersArg = op.requestHeaders?.length
      ? `headers={${op.requestHeaders.map((h) => `${JSON.stringify(h.name)}: ${JSON.stringify(h.value)}`).join(', ')}},`
      : undefined;
    if (op.noAuth) {
      // An external address is absolute; an API path needs the client's base URL.
      const noAuthClient = op.externalUrl ? 'httpx.AsyncClient()' : 'httpx.AsyncClient(base_url=self._client.base_url)';
      lines.push(`        async with ${noAuthClient} as _no_auth:`);
      lines.push(`            response = await _no_auth.${method}(`);
      lines.push(`                ${pathStr},`);
      if (hasQuery) lines.push('                params=query,');
      if (headersArg) lines.push(`                ${headersArg}`);
      if (op.successResponse.isRedirect) lines.push('                follow_redirects=False,');
      if (hasBody) {
        const rb = op.requestBody!;
        if (shouldUnwrapBody(rb)) {
          const f = rb.unwrapField!;
          lines.push(`                json={${JSON.stringify(f.name)}: ${pyFieldName(f)}},`);
        } else {
          lines.push('                json=serialize(request),');
        }
      }
      if (op.requestBody?.contentType === 'form') lines.push(`                data=${pyFormData(op)},`);
      lines.push('            )');
    } else {
      lines.push(`        response = await self._client.${method}(`);
      lines.push(`            ${pathStr},`);
      if (hasQuery) lines.push('            params=query,');
      if (headersArg) lines.push(`            ${headersArg}`);
      if (op.successResponse.isRedirect) lines.push('            follow_redirects=False,');
      if (hasBody) {
        const rb = op.requestBody!;
        if (shouldUnwrapBody(rb)) {
          const f = rb.unwrapField!;
          lines.push(`            json={${JSON.stringify(f.name)}: ${pyFieldName(f)}},`);
        } else {
          lines.push('            json=serialize(request),');
        }
      }
      if (op.requestBody?.contentType === 'form') lines.push(`            data=${pyFormData(op)},`);
      lines.push('        )');
    }
  }

  // Only the success answer is parsed strictly: an error body may be empty or not JSON.
  lines.push('        match response.status_code:');

  if (op.successResponse.isRedirect) {
    lines.push(`            case ${op.successResponse.statusCode}:`);
    lines.push('                location = response.headers.get("location")');
    lines.push('                if not location:');
    lines.push(
      '                    raise RuntimeError(',
    );
    lines.push(
      '                        "Missing Location header in redirect response"',
    );
    lines.push('                    )');
    lines.push('                return location');
  } else if (op.successResponse.isBinary) {
    lines.push(`            case ${op.successResponse.statusCode}:`);
    lines.push('                return response.content');
  } else if (!op.successResponse.hasBody) {
    lines.push(`            case ${op.successResponse.statusCode}:`);
    lines.push('                return');
  } else if (op.successResponse.isList || op.successResponse.isSingleWithMeta) {
    const rt = ir.responses.find((r) => r.name === op.successResponse.responseRef);
    lines.push(`            case ${op.successResponse.statusCode}:`);
    lines.push(`                return deserialize(${rt?.name ?? 'object'}, response.json())`);
  } else if (op.successResponse.isUnwrap && op.successResponse.dataRef) {
    lines.push(`            case ${op.successResponse.statusCode}:`);
    lines.push(`                return deserialize(${op.successResponse.dataRef}, response.json()["data"])`);
  } else {
    lines.push(`            case ${op.successResponse.statusCode}:`);
    lines.push(`                return deserialize(${op.successResponse.dataRef ?? 'object'}, response.json())`);
  }

  // With both error models the body decides the class, a 401 included.
  if (op.hasOAuthError && !pyPicksErrorByBody(ir)) {
    lines.push('            case 401:');
    lines.push('                raise _oauth_error_from_response(response)');
  }

  lines.push('            case _:');
  if (pyHasApiError(ir)) {
    lines.push('                raise _error_from_response(response)');
  } else {
    lines.push('                raise RuntimeError(');
    lines.push('                    f"Unexpected status code: {response.status_code}"');
    lines.push('                )');
  }
}

function emitPaginationMethod(lines: string[], op: IROperation, ir: IR): void {
  const itemType = op.successResponse.dataRef ?? 'object';
  const pascal = op.methodName.charAt(0).toUpperCase() + op.methodName.slice(1);
  const paramsType = op.queryParams.length > 0 ? `${pascal}Params` : null;

  const args: string[] = [];
  if (op.externalUrl) args.push(`${camelToSnake(op.externalUrl)}: str`);
  for (const p of op.pathParams) args.push(`${pyParamName(p.sdkName)}: ${pyType(p.type)}`);
  if (paramsType) {
    const hasRequired = op.queryParams.some((p) => p.required && p.name !== 'cursor');
    args.push(
      hasRequired ? `params: ${paramsType}` : `params: ${paramsType} | None = None`,
    );
  }

  lines.push(`    async def ${pyMethodName(op)}_all(`);
  lines.push('        self,');
  for (const a of args) lines.push(`        ${a},`);
  lines.push(`    ) -> list[${itemType}]:`);
  lines.push(`        items: list[${itemType}] = []`);
  lines.push('        cursor: str | None = None');
  const rt = ir.responses.find((r) => r.name === op.successResponse.responseRef);
  const useHasNext = paginateHasNext(ir, rt?.metaRef) !== undefined;

  const callParts: string[] = [];
  if (op.externalUrl) callParts.push(camelToSnake(op.externalUrl));
  for (const p of op.pathParams) callParts.push(pyParamName(p.sdkName));
  if (paramsType) callParts.push('params=params');

  if (useHasNext) {
    lines.push('        has_next = True');
    lines.push('        while has_next:');
    if (paramsType) {
      lines.push('            if params is None:');
      lines.push(`                params = ${paramsType}()`);
      lines.push('            params.cursor = cursor');
    }
    lines.push(`            response = await self.${pyMethodName(op)}(${callParts.join(', ')})`);
    lines.push('            items.extend(response.data)');
    lines.push('            if not response.data:');
    lines.push('                break');
    lines.push('            cursor = response.meta.paginate.next_page');
    lines.push('            reported_has_next = getattr(response.meta.paginate, "has_next", None)');
    lines.push('            has_next = True if reported_has_next is None else reported_has_next');
  } else {
    const metaAccess = rt?.metaIsRequired ? 'response.meta.paginate.next_page' : 'response.meta.paginate.next_page if response.meta else None';
    lines.push('        while True:');
    if (paramsType) {
      lines.push('            if params is None:');
      lines.push(`                params = ${paramsType}()`);
      lines.push('            params.cursor = cursor');
    }
    lines.push(`            response = await self.${pyMethodName(op)}(${callParts.join(', ')})`);
    lines.push('            items.extend(response.data)');
    lines.push('            if not response.data:');
    lines.push('                break');
    lines.push(`            cursor = ${metaAccess}`);
    if (!rt?.metaIsRequired) {
      lines.push('            if not cursor:');
      lines.push('                break');
    }
  }
  lines.push('        return items');
}

function hasWebhookPolling(svc: IRService): boolean {
  return svc.operations.some((op) => op.methodName === 'getWebhookEvents' && op.successResponse.dataRef === 'WebhookEvent');
}

function emitThrowingOperation(lines: string[], op: IROperation, ir: IR): void {
  const args: string[] = [];
  if (op.externalUrl) args.push(`${camelToSnake(op.externalUrl)}: str`);
  for (const p of op.pathParams) args.push(`${pyParamName(p.sdkName)}: ${pyType(p.type)}`);

  if (op.requestBody) {
    const rb = op.requestBody;
    if (shouldUnwrapBody(rb)) {
      const f = rb.unwrapField!;
      args.push(`${pyFieldName(f)}: ${pyType(f.type)}`);
    } else if (rb.schemaRef) {
      args.push(`request: ${rb.schemaRef}`);
    }
  }

  if (op.queryParams.length > 0) {
    const pascal = op.methodName.charAt(0).toUpperCase() + op.methodName.slice(1);
    const hasRequired = op.queryParams.some((p) => p.required);
    args.push(hasRequired ? `params: ${pascal}Params` : `params: ${pascal}Params | None = None`);
  }

  if (op.deprecated) lines.push('    # Deprecated');
  lines.push(`    async def ${pyMethodName(op)}(`);
  if (args.length === 0) {
    lines.push(`        self) -> ${opReturnType(op, ir)}:`);
  } else {
    lines.push('        self,');
    for (const a of args) lines.push(`        ${a},`);
    lines.push(`    ) -> ${opReturnType(op, ir)}:`);
  }
  lines.push(`        raise NotImplementedError(${JSON.stringify(`${op.tag}.${op.methodName} is not implemented`)})`);
}

function emitThrowingPaginationMethod(lines: string[], op: IROperation): void {
  const itemType = op.successResponse.dataRef ?? 'object';
  const pascal = op.methodName.charAt(0).toUpperCase() + op.methodName.slice(1);
  const paramsType = op.queryParams.length > 0 ? `${pascal}Params` : null;

  const args: string[] = [];
  if (op.externalUrl) args.push(`${camelToSnake(op.externalUrl)}: str`);
  for (const p of op.pathParams) args.push(`${pyParamName(p.sdkName)}: ${pyType(p.type)}`);
  if (paramsType) {
    const hasRequired = op.queryParams.some((p) => p.required && p.name !== 'cursor');
    args.push(hasRequired ? `params: ${paramsType}` : `params: ${paramsType} | None = None`);
  }

  lines.push(`    async def ${pyMethodName(op)}_all(`);
  lines.push('        self,');
  for (const a of args) lines.push(`        ${a},`);
  lines.push(`    ) -> list[${itemType}]:`);
  lines.push(`        raise NotImplementedError(${JSON.stringify(`${op.tag}.${op.methodName}All is not implemented`)})`);
}

function emitThrowingWebhookPollingMethods(lines: string[], svc: IRService): void {
  lines.push('    async def poll_webhook_events(');
  lines.push('        self,');
  lines.push('        *,');
  lines.push('        limit: int | None = 50,');
  lines.push('        interval_seconds: float = 5.0,');
  lines.push('        created_after: datetime | None = None,');
  lines.push('        max_seen_delivery_ids: int = 5_000,');
  lines.push('    ) -> AsyncIterator[WebhookEvent]:');
  lines.push(`        raise NotImplementedError(${JSON.stringify(`${svc.tag}.pollWebhookEvents is not implemented`)})`);
  lines.push('');
  lines.push('    async def poll_webhook_payloads(');
  lines.push('        self,');
  lines.push('        *,');
  lines.push('        limit: int | None = 50,');
  lines.push('        interval_seconds: float = 5.0,');
  lines.push('        created_after: datetime | None = None,');
  lines.push('        max_seen_delivery_ids: int = 5_000,');
  lines.push('    ) -> AsyncIterator[WebhookPayloadUnion]:');
  lines.push(`        raise NotImplementedError(${JSON.stringify(`${svc.tag}.pollWebhookPayloads is not implemented`)})`);
}

function emitWebhookPollingMethods(lines: string[]): void {
  lines.push('    async def poll_webhook_events(');
  lines.push('        self,');
  lines.push('        *,');
  lines.push('        limit: int | None = 50,');
  lines.push('        interval_seconds: float = 5.0,');
  lines.push('        created_after: datetime | None = None,');
  lines.push('        max_seen_delivery_ids: int = 5_000,');
  lines.push('    ) -> AsyncIterator[WebhookEvent]:');
  lines.push('        if max_seen_delivery_ids <= 0:');
  lines.push('            raise ValueError("max_seen_delivery_ids must be greater than 0")');
  lines.push('');
  lines.push('        effective_created_after = created_after or datetime.now(timezone.utc)');
  lines.push('        seen_id_order: deque[str] = deque()');
  lines.push('        seen_ids: set[str] = set()');
  lines.push('');
  lines.push('        def remember(id: str) -> bool:');
  lines.push('            if id in seen_ids:');
  lines.push('                return False');
  lines.push('            seen_ids.add(id)');
  lines.push('            seen_id_order.append(id)');
  lines.push('            while len(seen_id_order) > max_seen_delivery_ids:');
  lines.push('                seen_ids.remove(seen_id_order.popleft())');
  lines.push('            return True');
  lines.push('');
  lines.push('        while True:');
  lines.push('            cursor: str | None = None');
  lines.push('            has_next = True');
  lines.push('            while has_next:');
  lines.push('                response = await self.get_webhook_events(');
  lines.push('                    GetWebhookEventsParams(limit=limit, cursor=cursor),');
  lines.push('                )');
  lines.push('                page_has_recent_events = False');
  lines.push('                for event in reversed(response.data):');
  lines.push('                    matches_created_after = event.created_at >= effective_created_after');
  lines.push('                    if matches_created_after:');
  lines.push('                        page_has_recent_events = True');
  lines.push('                    if matches_created_after and remember(event.id):');
  lines.push('                        yield event');
  lines.push('                reported_has_next = getattr(response.meta.paginate, "has_next", None)');
  lines.push('                has_next = (bool(response.data) if reported_has_next is None else reported_has_next) and page_has_recent_events');
  lines.push('                cursor = response.meta.paginate.next_page');
  lines.push('            await asyncio.sleep(interval_seconds)');
  lines.push('');
  lines.push('    async def poll_webhook_payloads(');
  lines.push('        self,');
  lines.push('        *,');
  lines.push('        payload_type: type[TPayload] | tuple[type[TPayload], ...] | None = None,');
  lines.push('        limit: int | None = 50,');
  lines.push('        interval_seconds: float = 5.0,');
  lines.push('        created_after: datetime | None = None,');
  lines.push('        max_seen_delivery_ids: int = 5_000,');
  lines.push('    ) -> AsyncIterator[WebhookPayloadUnion | TPayload]:');
  lines.push('        async for event in self.poll_webhook_events(');
  lines.push('            limit=limit,');
  lines.push('            interval_seconds=interval_seconds,');
  lines.push('            created_after=created_after,');
  lines.push('            max_seen_delivery_ids=max_seen_delivery_ids,');
  lines.push('        ):');
  lines.push('            if payload_type is None or isinstance(event.payload, payload_type):');
  lines.push('                yield event.payload');
}

function generateClient(ir: IR): { content: string; needUtils: boolean } {
  const lines: string[] = [];
  const needToDict = needsAsdict(ir);
  const imports = collectClientImports(ir);
  const needUtils = ir.services.length > 0;
  const needPolling = ir.services.some(hasWebhookPolling);

  if (ir.services.length > 0) {
    lines.push('from __future__ import annotations');
    lines.push('');
    if (needPolling) lines.push('import asyncio');
    if (needPolling) lines.push('from collections import deque');
    if (needPolling) lines.push('from datetime import datetime, timezone');
    if (needPolling) lines.push('from typing import AsyncIterator, TypeVar');
    if (needPolling) lines.push('');
    if (ir.oauthAuthorizeUrl) {
      lines.push('import base64');
      lines.push('import hashlib');
      lines.push('import secrets');
      lines.push('from dataclasses import dataclass');
      lines.push('from urllib.parse import urlencode');
      lines.push('');
    }
    lines.push('import httpx');
    lines.push('');
  }

  if (imports.length > 0) {
    if (imports.length <= 3) {
      lines.push(`from .models import ${imports.join(', ')}`);
    } else {
      lines.push('from .models import (');
      for (const imp of imports) lines.push(`    ${imp},`);
      lines.push(')');
    }
    const utilImports = ['deserialize'];
    if (needToDict) utilImports.push('serialize');
    if (ir.services.length > 0) utilImports.push('RetryTransport');
    if (needUtils) lines.push(`from .utils import ${utilImports.join(', ')}`);
  }

  if (needPolling) {
    lines.push('');
    lines.push('TPayload = TypeVar("TPayload", bound=WebhookPayloadUnion)');
  }

  if (ir.services.some((s) => s.operations.some((o) => o.requestBody?.contentType === 'form' && !shouldUnwrapBody(o.requestBody)))) {
    lines.push('');
    lines.push('');
    lines.push('def _form_data(fields: dict) -> dict[str, str]:');
    lines.push('    # A form body (application/x-www-form-urlencoded): booleans go as true and false like in JSON.');
    lines.push('    return {k: str(v).lower() if isinstance(v, bool) else str(v) for k, v in fields.items() if v is not None}');
  }

  if (ir.services.length > 0 && (pyHasApiError(ir) || pyReadsOAuthErrorAlone(ir))) {
    lines.push('');
    lines.push('');
    lines.push('def _error_body(response: httpx.Response) -> object:');
    lines.push('    # The body of an error answer, or None when it is empty or not JSON (a 404 without a body, a proxy page).');
    lines.push('    try:');
    lines.push('        return response.json()');
    lines.push('    except ValueError:');
    lines.push('        return None');
  }

  if (ir.services.length > 0 && pyHasApiError(ir)) {
    lines.push('');
    lines.push('');
    lines.push('def _error_from_response(response: httpx.Response) -> Exception:');
    if (pyPicksErrorByBody(ir)) {
      lines.push('    # An error body is either {"errors": [...]} or the OAuth form {"error", "error_description"},');
      lines.push('    # which also comes with 400 and 403 (insufficient_scope, invalid_grant). The body decides the class.');
    }
    lines.push('    # An empty body or one that is not JSON gives an ApiError with no errors. The status code stays in status_code.');
    lines.push('    body = _error_body(response)');
    if (pyPicksErrorByBody(ir)) {
      lines.push('    if isinstance(body, dict) and isinstance(body.get("error"), str) and "errors" not in body:');
      lines.push(`        return ${pyOAuthErrorFromDict(ir)}`);
    }
    lines.push('    error = ApiError(errors=[])');
    lines.push('    errors = body.get("errors") if isinstance(body, dict) else None');
    lines.push('    if isinstance(errors, list) and all(isinstance(item, dict) for item in errors):');
    lines.push('        try:');
    lines.push('            error = deserialize(ApiError, body)');
    lines.push('        except (TypeError, ValueError):');
    lines.push('            pass  # errors of another shape: the status code still says what happened');
    lines.push('    error.status_code = response.status_code');
    lines.push('    return error');
  }

  if (ir.services.length > 0 && pyReadsOAuthErrorAlone(ir)) {
    lines.push('');
    lines.push('');
    lines.push('def _oauth_error_from_response(response: httpx.Response) -> Exception:');
    lines.push('    # A 401 body that is empty or not the OAuth form gives a RuntimeError with the status code.');
    lines.push('    body = _error_body(response)');
    lines.push('    if isinstance(body, dict) and isinstance(body.get("error"), str):');
    lines.push(`        return ${pyOAuthErrorFromDict(ir)}`);
    lines.push('    return RuntimeError(f"Unexpected status code: {response.status_code}")');
  }

  if (ir.services.length > 0 && ir.oauthAuthorizeUrl) {
    lines.push('');
    lines.push('');
    lines.push(`PACHCA_AUTHORIZE_URL = ${JSON.stringify(ir.oauthAuthorizeUrl)}`);
    lines.push('');
    lines.push('');
    lines.push('@dataclass');
    lines.push('class Pkce:');
    lines.push('    # A PKCE pair: keep code_verifier until the code exchange, put code_challenge into the link.');
    lines.push('    code_verifier: str');
    lines.push('    code_challenge: str');
    lines.push('');
    lines.push('');
    lines.push('def _base64_url(data: bytes) -> str:');
    lines.push('    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()');
    lines.push('');
    lines.push('');
    lines.push('def create_pkce() -> Pkce:');
    lines.push('    # A random code_verifier and its SHA-256 code_challenge.');
    lines.push('    code_verifier = _base64_url(secrets.token_bytes(32))');
    lines.push('    return Pkce(code_verifier, _base64_url(hashlib.sha256(code_verifier.encode()).digest()))');
    lines.push('');
    lines.push('');
    lines.push('def build_authorize_url(');
    lines.push('    client_id: str,');
    lines.push('    redirect_uri: str,');
    lines.push('    state: str,');
    lines.push('    code_challenge: str,');
    lines.push('    authorize_url: str = PACHCA_AUTHORIZE_URL,');
    lines.push(') -> str:');
    lines.push('    # The authorization link for a message button: the consent screen with PKCE (S256).');
    lines.push('    query = urlencode({');
    lines.push('        "client_id": client_id,');
    lines.push('        "redirect_uri": redirect_uri,');
    lines.push('        "response_type": "code",');
    lines.push('        "state": state,');
    lines.push('        "code_challenge": code_challenge,');
    lines.push('        "code_challenge_method": "S256",');
    lines.push('    })');
    lines.push('    return f"{authorize_url}?{query}"');
  }

  if (ir.services.length === 0) {
    while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
    lines.push('');
    return { content: lines.join('\n'), needUtils: false };
  }

  lines.push('');
  for (const svc of ir.services) {
    const serviceName = tagToServiceName(svc.tag);
    const implName = serviceToImplName(serviceName);
    if (svc.deprecated) lines.push(`# Deprecated: ${serviceName} is kept for backward compatibility — use the new service(s).`);
    lines.push(`class ${serviceName}:`);
    for (let i = 0; i < svc.operations.length; i++) {
      emitThrowingOperation(lines, svc.operations[i], ir);
      if (svc.operations[i].isPaginated && svc.operations[i].successResponse.dataRef) {
        lines.push('');
        emitThrowingPaginationMethod(lines, svc.operations[i]);
      }
      if (svc.operations[i].methodName === 'getWebhookEvents' && svc.operations[i].successResponse.dataRef === 'WebhookEvent') {
        lines.push('');
        emitWebhookPollingMethods(lines);
      }
      if (i < svc.operations.length - 1) lines.push('');
    }
    lines.push('');
    lines.push('');
    lines.push(`class ${implName}(${serviceName}):`);
    lines.push('    def __init__(self, client: httpx.AsyncClient) -> None:');
    lines.push('        self._client = client');
    lines.push('');
    for (let i = 0; i < svc.operations.length; i++) {
      emitOperation(lines, svc.operations[i], ir);
      if (svc.operations[i].isPaginated && svc.operations[i].successResponse.dataRef) {
        lines.push('');
        emitPaginationMethod(lines, svc.operations[i], ir);
      }
      if (i < svc.operations.length - 1) lines.push('');
    }
    lines.push('');
    lines.push('');
  }

  const serviceEntries = ir.services
    .map((s) => ({ prop: pyServiceProp(s.tag), cls: tagToServiceName(s.tag) }))
    .sort((a, b) => a.prop.localeCompare(b.prop));
  if (ir.baseUrl) {
    lines.push(`PACHCA_API_URL = ${JSON.stringify(ir.baseUrl)}`);
    lines.push('');
    lines.push('');
  }
  lines.push('class PachcaClient:');
  const pyDefault = ir.baseUrl ? ' = PACHCA_API_URL' : '';
  const constructorArgs = serviceEntries.map((s) => `${s.prop}: ${s.cls} | None = None`);
  const signature = ['self', `token: str`, `base_url: str${pyDefault}`, ...constructorArgs].join(', ');
  lines.push(`    def __init__(${signature}) -> None:`);
  lines.push('        self._client = httpx.AsyncClient(');
  lines.push('            base_url=base_url,');
  lines.push('            headers={"Authorization": f"Bearer {token}"},');
  lines.push('            transport=RetryTransport(httpx.AsyncHTTPTransport()),');
  lines.push('        )');
  for (const s of serviceEntries) {
    lines.push(`        self.${s.prop}: ${s.cls} = ${s.prop} or ${serviceToImplName(s.cls)}(self._client)`);
  }
  lines.push('');
  lines.push('    async def close(self) -> None:');
  lines.push('        await self._client.aclose()');
  lines.push('');

  // from_client classmethod
  lines.push('    @classmethod');
  lines.push('    def from_client(');
  lines.push('        cls,');
  lines.push('        client: httpx.AsyncClient,');
  for (const s of serviceEntries) {
    lines.push(`        ${s.prop}: ${s.cls} | None = None,`);
  }
  lines.push('    ) -> "PachcaClient":');
  lines.push('        self = cls.__new__(cls)');
  lines.push('        self._client = client');
  for (const s of serviceEntries) {
    lines.push(`        self.${s.prop}: ${s.cls} = ${s.prop} or ${serviceToImplName(s.cls)}(client)`);
  }
  lines.push('        return self');
  lines.push('');

  // stub classmethod
  lines.push('    @classmethod');
  lines.push('    def stub(');
  lines.push('        cls,');
  for (const s of serviceEntries) {
    lines.push(`        ${s.prop}: ${s.cls} | None = None,`);
  }
  lines.push('    ) -> "PachcaClient":');
  lines.push('        self = cls.__new__(cls)');
  lines.push('        self._client = None');
  for (const s of serviceEntries) {
    lines.push(`        self.${s.prop} = ${s.prop} or ${s.cls}()`);
  }
  lines.push('        return self');

  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  lines.push('');
  return { content: lines.join('\n'), needUtils };
}

function generateUtils(ir: IR): string {
  const lines: string[] = [
    'from __future__ import annotations',
    '',
    'import dataclasses',
    'import json',
    'import keyword',
    'import types',
    'from dataclasses import fields',
    'from datetime import datetime',
    'from enum import Enum',
    'from typing import Any, Callable, Type, TypeVar, Union, get_args, get_origin, get_type_hints',
    '',
    'import httpx',
  ];

  // Request models with fields the caller can send as null by name.
  const requestModels = requestModelNames(ir);
  const nullableModels = [...buildModelIndex(ir).values()]
    .filter((m) => requestModels.has(m.name) && nullableOptionalFields(m).length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  const customUnions = ir.unions.filter((u) => u.unionDeserializer === 'webhook-payload');
  // Import every union this module names at module level, not just the ones with
  // a custom deserializer: `_UNION_DISCRIMINATORS` below references the plain
  // discriminated unions too, and a missing name is a NameError on import — which
  // `py_compile` does not catch because it only parses.
  const discriminatedUnions = ir.unions.filter((u) => !u.unionDeserializer && u.discriminatorField);
  const referencedUnions = [...customUnions, ...discriminatedUnions];
  if (referencedUnions.length > 0 || nullableModels.length > 0) {
    const importNames = new Set<string>();
    for (const u of referencedUnions) {
      importNames.add(u.name);
      for (const ref of u.memberRefs) importNames.add(ref);
    }
    for (const m of nullableModels) importNames.add(m.name);
    lines.push('');
    lines.push('from .models import (');
    for (const name of [...importNames].sort()) {
      lines.push(`    ${name},`);
    }
    lines.push(')');
  }

  lines.push(
    '',
    'T = TypeVar("T")',
    '',
    '',
    'def parse_datetime(value: str) -> datetime:',
    '    """Parse an ISO 8601 time. Before Python 3.11 `fromisoformat` does not accept the `Z` suffix."""',
    '    return datetime.fromisoformat(value[:-1] + "+00:00" if value.endswith("Z") else value)',
    '',
    '',
    'def _is_dataclass_type(tp: object) -> bool:',
    '    return isinstance(tp, type) and dataclasses.is_dataclass(tp)',
    '',
    '',
    'def _resolve_type(tp: object) -> type | None:',
    '    """Extract a concrete dataclass type from Optional[X] or X | None."""',
    '    origin = get_origin(tp)',
    '    if origin is list:',
    '        return None  # lists are handled inline',
    '    args = get_args(tp)',
    '    for arg in args:',
    '        if _is_dataclass_type(arg):',
    '            return arg',
    '    if _is_dataclass_type(tp):',
    '        return tp',
    '    return None',
    '',
    '',
    'def _union_members(tp: object) -> list[type]:',
    '    """Dataclass members of a Union, ignoring None and non-dataclass arms."""',
    '    if get_origin(tp) is list:',
    '        return []',
    '    return [arg for arg in get_args(tp) if _is_dataclass_type(arg)]',
    '',
    '',
    'def _declared_keys(member: type) -> set[str]:',
    '    return {f.name[:-1] if f.name.endswith("_") else f.name for f in fields(member)}',
    '',
    '',
    'def _rank_union_members(members: list[type], data: dict) -> list[type]:',
    '    """Order the members of a union with no discriminator by how well they fit a payload.',
    '',
    '    Ranks by: most payload keys recognised, then fewest unrecognised, then',
    '    fewest declared fields (so an empty member only wins an empty payload).',
    '    A tie keeps the declared order.',
    '    """',
    '    keys = {k.replace("-", "_").lower() for k in data}',
    '',
    '    def score(member: type) -> tuple[int, int, int]:',
    '        declared = _declared_keys(member)',
    '        return (-len(keys & declared), len(keys - declared), len(declared))',
    '',
    '    return sorted(members, key=score)',
    '',
    '',
    'def _fits(tp: object, value: object) -> bool:',
    '    """Whether a JSON value has the shape a field type takes.',
    '',
    '    A list fits a list, an object fits a model or a dict, a string fits a string,',
    '    an enum or a time, a number fits a number and a boolean a boolean. None fits',
    '    any field. A union member whose field does not fit gives way to the next one.',
    '    """',
    '    if value is None or tp is Any:',
    '        return True',
    '    origin = get_origin(tp)',
    '    if origin is Union or origin is types.UnionType:',
    '        return any(_fits(arg, value) for arg in get_args(tp) if arg is not type(None))',
    '    if origin is list:',
    '        args = get_args(tp)',
    '        return isinstance(value, list) and (not args or all(_fits(args[0], item) for item in value))',
    '    if origin is dict:',
    '        return isinstance(value, dict)',
    '    if not isinstance(tp, type):',
    '        return True',
    '    if _is_dataclass_type(tp) or tp is dict:',
    '        return isinstance(value, dict)',
    '    if tp is list:',
    '        return isinstance(value, list)',
    '    if tp is bool:',
    '        return isinstance(value, bool)',
    '    if issubclass(tp, (str, Enum)) or tp is datetime:',
    '        return isinstance(value, str)',
    '    if tp is int:',
    '        return isinstance(value, int) and not isinstance(value, bool)',
    '    if tp is float:',
    '        return isinstance(value, (int, float)) and not isinstance(value, bool)',
    '    return True',
    '',
    '',
    'def _resolve_list_item_type(tp: object) -> object | None:',
    '    """Extract the item type from list[X] or list[X] | None."""',
    '    origin = get_origin(tp)',
    '    if origin is list:',
    '        args = get_args(tp)',
    '        return args[0] if args else None',
    '    if origin is Union or origin is types.UnionType:',
    '        for arg in get_args(tp):',
    '            if get_origin(arg) is list and get_args(arg):',
    '                return get_args(arg)[0]',
    '    return None',
    '',
    '',
    'CustomUnionDeserializer = Callable[[dict], object]',
    '',
    '',
    'def _deserialize_instance(tp: object, value: object, strict: bool = False) -> object:',
    '    """Decode a JSON value into a field type. With strict, a nested model or a list',
    '    of models checks its value types too, so a union member gives way to the next',
    '    one when a value deep inside it has another type."""',
    '    custom = _CUSTOM_UNION_DESERIALIZERS.get(tp)',
    '    if custom is not None and isinstance(value, dict):',
    '        return custom(value)',
    '    if isinstance(value, dict):',
    '        members = _union_members(tp)',
    '        if len(members) > 1:',
    '            # Multi-member union: pick by discriminator when the spec has one,',
    '            # otherwise by which member best matches the payload shape. Taking',
    '            # the first member (the old behaviour) silently dropped the data.',
    '            disc = _UNION_DISCRIMINATORS.get(tp)',
    '            if disc is not None:',
    '                field_name, by_value = disc',
    '                chosen = by_value.get(value.get(field_name))',
    '                if chosen is not None:',
    '                    return _deserialize_dataclass(chosen, value, strict)',
    '            # The first member that decodes wins: one that fits the keys best but',
    '            # misses a required field, or holds a value of another type (a list',
    '            # where it takes an object), gives way to the next.',
    '            errors: list[Exception] = []',
    '            for member in _rank_union_members(members, value):',
    '                try:',
    '                    return _deserialize_dataclass(member, value, strict=True)',
    '                except (TypeError, ValueError) as error:',
    '                    errors.append(error)',
    '            raise errors[0]',
    '        nested = _resolve_type(tp)',
    '        if nested is not None:',
    '            return _deserialize_dataclass(nested, value, strict)',
    '    if isinstance(value, list):',
    '        item_tp = _resolve_list_item_type(tp)',
    '        if item_tp is not None:',
    '            return [_deserialize_instance(item_tp, item, strict) for item in value]',
    '    if isinstance(value, str):',
    '        raw_tp = tp',
    '        if get_origin(tp) is not None:',
    '            for arg in get_args(tp):',
    '                if arg is not type(None):',
    '                    raw_tp = arg',
    '                    break',
    '        if raw_tp is datetime:',
    '            return parse_datetime(value)',
    '        if isinstance(raw_tp, type) and issubclass(raw_tp, Enum):',
    '            # An open enum keeps a value it does not list in a member with is_known False;',
    '            # a closed one refuses it, and the raw string is kept as is.',
    '            try:',
    '                return raw_tp(value)',
    '            except ValueError:',
    '                return value',
    '    return value',
    '',
    '',
    'def _deserialize_dataclass(cls: Type[T], data: dict, strict: bool = False) -> T:',
    '    """Build a dataclass from a dict. With strict, a value whose type does not',
    '    fit its field raises TypeError, here or in a nested model, so a union tries',
    '    its next member."""',
    '    field_map = {f.name: f for f in fields(cls)}',
    '    hints = get_type_hints(cls)',
    '    norm = {k.replace("-", "_").lower(): v for k, v in data.items()}',
    '    kwargs = {}',
    '    for k, v in norm.items():',
    '        if k not in field_map:',
    '            k = f"{k}_"',
    '            if k not in field_map:',
    '                continue',
    '        f = field_map[k]',
    '        if strict and not _fits(hints[f.name], v):',
    '            raise TypeError(f"{cls.__name__}.{f.name} does not take {type(v).__name__}")',
    '        kwargs[k] = _deserialize_instance(hints[f.name], v, strict)',
    '    return cls(**kwargs)',
    ''
  );

  if (customUnions.length > 0) {
    for (const u of customUnions) {
      const fnName = `_${camelToSnake(u.name)}_deserialize`;
      if (u.unionDeserializer === 'webhook-payload') {
        lines.push(`def ${fnName}(data: dict) -> ${u.name}:`);
        lines.push('    match (data.get("type"), data.get("event")):');
        lines.push('        case ("message", "link_shared"):');
        lines.push('            return _deserialize_instance(LinkSharedWebhookPayload, data)');
        lines.push('        case ("message", _):');
        lines.push('            return _deserialize_instance(MessageWebhookPayload, data)');
        for (const ref of u.memberRefs.filter((ref) => ref !== 'MessageWebhookPayload' && ref !== 'LinkSharedWebhookPayload')) {
          const model = ir.models.find((m) => m.name === ref);
          const typeField = model?.fields.find(
            (f) => f.name === u.discriminatorField && f.type.kind === 'literal',
          ) ?? model?.fields.find((f) => f.type.kind === 'literal');
          const disc = typeField?.type.literalValue;
          if (disc) {
            lines.push(`        case (${JSON.stringify(disc)}, _):`);
            lines.push(`            return _deserialize_instance(${ref}, data)`);
          }
        }
        lines.push('        case _:');
        lines.push(`            raise ValueError(f"Unknown ${u.name} discriminator: {data.get('type')}")`);
        lines.push('');
      }
    }
  }

  lines.push('_CUSTOM_UNION_DESERIALIZERS: dict[object, CustomUnionDeserializer] = {');
  for (const u of customUnions) {
    lines.push(`    ${u.name}: _${camelToSnake(u.name)}_deserialize,`);
  }
  lines.push('}');
  lines.push('');
  lines.push('# Unions the spec discriminates by a literal field: {union: (field, {value: member})}.');
  lines.push('# Unions absent here have no discriminator and are matched by payload shape.');
  lines.push('_UNION_DISCRIMINATORS: dict[object, tuple[str, dict[str, type]]] = {');
  for (const u of ir.unions) {
    if (u.unionDeserializer || !u.discriminatorField) continue;
    const entries: string[] = [];
    for (const ref of u.memberRefs) {
      const model = ir.models.find((m) => m.name === ref);
      const litField = model?.fields.find(
        (f) => f.name === u.discriminatorField && f.type.kind === 'literal',
      );
      const litValue = litField?.type.literalValue;
      if (litValue === undefined) continue;
      entries.push(`${JSON.stringify(litValue)}: ${ref}`);
    }
    if (entries.length === 0) continue;
    lines.push(
      `    ${u.name}: (${JSON.stringify(u.discriminatorField)}, {${entries.join(', ')}}),`,
    );
  }
  lines.push('}');
  lines.push('');
  lines.push('');
  lines.push('def deserialize(cls: Type[T], data: dict) -> T:');
  lines.push('    """Create a typed instance from a dict, recursively deserializing nested values."""');
  lines.push('    return _deserialize_instance(cls, data)');
  lines.push('');
  lines.push('');
  lines.push('# Fields of a request model the caller can send as null, by name in null_fields.');
  lines.push('_NULLABLE_FIELDS: dict[type, frozenset[str]] = {');
  for (const m of nullableModels) {
    const names = nullableOptionalFields(m).map((f) => JSON.stringify(pyFieldName(f))).join(', ');
    lines.push(`    ${m.name}: frozenset({${names}}),`);
  }
  lines.push('}');
  lines.push('');
  lines.push('');
  lines.push('def _json_key(name: str) -> str:');
  lines.push('    return name[:-1] if name.endswith("_") and keyword.iskeyword(name[:-1]) else name');
  lines.push('');
  lines.push('');
  lines.push('def _to_json(val: object) -> object:');
  lines.push('    if dataclasses.is_dataclass(val) and not isinstance(val, type):');
  lines.push('        nullable = _NULLABLE_FIELDS.get(type(val))');
  lines.push('        null_fields: frozenset[str] = frozenset()');
  lines.push('        if nullable is not None:');
  lines.push('            names = getattr(val, "null_fields", ())');
  lines.push('            # A single name passed as a string is one field, not its letters.');
  lines.push('            null_fields = frozenset((names,) if isinstance(names, str) else names)');
  lines.push('            unknown = sorted(null_fields - nullable)');
  lines.push('            if unknown:');
  lines.push('                raise ValueError(f"{type(val).__name__}: field {unknown[0]!r} cannot be sent as null")');
  lines.push('        out: dict[str, object] = {}');
  lines.push('        for f in fields(val):');
  lines.push('            if nullable is not None and f.name == "null_fields":');
  lines.push('                continue');
  lines.push('            if f.name in null_fields:');
  lines.push('                out[_json_key(f.name)] = None');
  lines.push('                continue');
  lines.push('            v = getattr(val, f.name)');
  lines.push('            if v is not None:');
  lines.push('                out[_json_key(f.name)] = _to_json(v)');
  lines.push('        return out');
  lines.push('    if isinstance(val, dict):');
  lines.push('        return {_json_key(k): _to_json(v) for k, v in val.items() if v is not None}');
  lines.push('    if isinstance(val, (list, tuple)):');
  lines.push('        return [_to_json(v) for v in val]');
  lines.push('    if isinstance(val, datetime):');
  lines.push('        return val.isoformat()');
  lines.push('    return val');
  lines.push('');
  lines.push('');
  lines.push('def serialize(obj: object) -> dict:');
  lines.push('    """Convert a dataclass to a dict for the request body.');
  lines.push('');
  lines.push('    A field that is None stays out of the body. A field named in null_fields');
  lines.push('    goes out as null, whatever value it holds, and a name the model does not');
  lines.push('    take as null raises ValueError before the request is sent.');
  lines.push('    """');
  lines.push('    result = _to_json(obj)');
  lines.push('    if not isinstance(result, dict):');
  lines.push('        raise TypeError(f"serialize takes a dataclass, got {type(obj).__name__}")');
  lines.push('    return result');
  lines.push('');
  lines.push('');
  lines.push('_MAX_RETRIES = 3');
  lines.push('_RETRYABLE_5XX = {500, 502, 503, 504}');
  lines.push('# A 5xx says nothing about whether the server already applied the request.');
  lines.push('# These methods are safe to repeat. A retried POST or PATCH could apply');
  lines.push('# twice: POST /messages would send the message again, and the API has no');
  lines.push('# idempotency key. 429 is safe for any method: the request was rejected');
  lines.push('# before it was processed.');
  lines.push('_IDEMPOTENT_METHODS = {"GET", "HEAD", "OPTIONS", "PUT", "DELETE"}');
  lines.push('# Only the daily chat limit and the hour-long ban wait longer than a minute.');
  lines.push('_MAX_RETRY_AFTER = 60');
  lines.push('');
  lines.push('');
  lines.push('# Retry-After is a minimum, not an estimate: waiting less lands the retry');
  lines.push('# inside a window that is still closed. Jitter only upwards.');
  lines.push('def _add_jitter(delay: float) -> float:');
  lines.push('    import random');
  lines.push('    return delay * (1 + random.random() * 0.25)');
  lines.push('');
  lines.push('');
  lines.push('async def _is_query_timeout(response: httpx.Response) -> bool:');
  lines.push('    """A 504 with the code timeout is a search the server stopped because the');
  lines.push('    query is too heavy: the same query would time out again, so it goes back to');
  lines.push('    the caller at once. A 504 from a proxy has no such code and is retried. The');
  lines.push('    body stays on the response, so the caller can still read it."""');
  lines.push('    if response.status_code != 504:');
  lines.push('        return False');
  lines.push('    try:');
  lines.push('        body = json.loads(await response.aread())');
  lines.push('    except ValueError:');
  lines.push('        return False');
  lines.push('    errors = body.get("errors") if isinstance(body, dict) else None');
  lines.push('    return isinstance(errors, list) and any(');
  lines.push('        isinstance(error, dict) and error.get("code") == "timeout" for error in errors');
  lines.push('    )');
  lines.push('');
  lines.push('');
  lines.push('class RetryTransport(httpx.AsyncBaseTransport):');
  lines.push('    """Wraps an httpx transport with retry on 429, and on 5xx for idempotent methods."""');
  lines.push('');
  lines.push('    def __init__(self, transport: httpx.AsyncBaseTransport, max_retries: int = _MAX_RETRIES) -> None:');
  lines.push('        self._transport = transport');
  lines.push('        self._max_retries = max_retries');
  lines.push('');
  lines.push('    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:');
  lines.push('        import asyncio');
  lines.push('        for attempt in range(self._max_retries + 1):');
  lines.push('            response = await self._transport.handle_async_request(request)');
  lines.push('            if response.status_code == 429 and attempt < self._max_retries:');
  lines.push('                retry_after = response.headers.get("retry-after")');
  lines.push('                seconds = int(retry_after) if retry_after and retry_after.isdigit() else None');
  lines.push('                # A long pause is the daily chat limit or an hour-long ban. Retrying');
  lines.push('                # it is pointless, and an early retry doubles the pause: hand the');
  lines.push('                # response back so the caller can schedule the work itself.');
  lines.push('                if seconds is not None and seconds > _MAX_RETRY_AFTER:');
  lines.push('                    return response');
  lines.push('                delay = seconds if seconds is not None else 2 ** attempt');
  lines.push('                await asyncio.sleep(_add_jitter(delay))');
  lines.push('                continue');
  lines.push('            if (');
  lines.push('                response.status_code in _RETRYABLE_5XX');
  lines.push('                and request.method in _IDEMPOTENT_METHODS');
  lines.push('                and attempt < self._max_retries');
  lines.push('                and not await _is_query_timeout(response)');
  lines.push('            ):');
  lines.push('                delay = attempt + 1');
  lines.push('                await asyncio.sleep(_add_jitter(delay))');
  lines.push('                continue');
  lines.push('            return response');
  lines.push('        return response  # unreachable');
  lines.push('');

  return lines.join('\n');
}

// ── Examples ──────────────────────────────────────────────────────────

function pyLiteral(
  ft: IRFieldType,
  ir: IR,
  models: Map<string, IRModel>,
  visited: Set<string> = new Set(),
  indent: number = 0,
): string {
  if (ft.example !== undefined) {
    if (ft.kind === 'primitive') {
      if ((ft.primitive === 'integer' || ft.primitive === 'number') && typeof ft.example === 'number') return String(ft.example);
      if (ft.primitive === 'boolean' && typeof ft.example === 'boolean') return ft.example ? 'True' : 'False';
      if (ft.primitive === 'string' && typeof ft.example === 'string') {
        if (ft.format === 'date-time') return `datetime.fromisoformat(${JSON.stringify(ft.example.replace(/Z$/, '+00:00'))})`;
        return JSON.stringify(ft.example);
      }
    }
    if (ft.kind === 'enum' && typeof ft.example === 'string') {
      const e = ir.enums.find((en) => en.name === ft.ref);
      const member = e?.members.find((m) => m.value === ft.example);
      if (e && member) return `${e.name}.${pyEnumMemberName(member.value)}`;
    }
  }
  switch (ft.kind) {
    case 'primitive': {
      if (ft.primitive === 'integer') return '123';
      if (ft.primitive === 'number') return '1.5';
      if (ft.primitive === 'boolean') return 'True';
      if (ft.primitive === 'any') return '{}';
      if (ft.primitive === 'string') {
        if (ft.format === 'date-time') return 'datetime.fromisoformat("2024-01-01T00:00:00+00:00")';
        if (ft.format === 'date') return '"2024-01-01"';
      }
      return '"example"';
    }
    case 'enum': {
      const e = ir.enums.find((en) => en.name === ft.ref);
      if (e && e.members.length > 0) {
        return `${e.name}.${pyEnumMemberName(e.members[0].value)}`;
      }
      return `${ft.ref ?? 'object'}`;
    }
    case 'model': {
      const u = ir.unions.find((un) => un.name === ft.ref);
      if (u && u.memberRefs.length > 0) {
        return pyModelLiteral(u.memberRefs[0], ir, models, visited, indent);
      }
      return pyModelLiteral(ft.ref ?? 'object', ir, models, visited, indent);
    }
    case 'array':
      return `[${pyLiteral(ft.items!, ir, models, visited, indent)}]`;
    case 'record':
      return `{"key": ${pyLiteral(ft.valueType!, ir, models, visited, indent)}}`;
    case 'union': {
      if (ft.valueUnion && ft.members) return pyLiteral(ft.members[0], ir, models, visited, indent);
      const u = ir.unions.find((un) => un.name === ft.ref);
      if (u && u.memberRefs.length > 0) {
        return pyModelLiteral(u.memberRefs[0], ir, models, visited, indent);
      }
      return `${ft.ref ?? 'object'}`;
    }
    case 'literal':
      return `"${ft.literalValue}"`;
    case 'binary':
      return 'b""';
  }
}

function pyModelLiteral(
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
    const name = pyFieldName(f);
    const value = pyLiteral(f.type, ir, models, nextVisited, childIndent);
    return `${name}=${value}`;
  });

  const hasMultiLineChild = entries.some((e) => e.includes('\n'));
  if (multiLine || hasMultiLineChild) {
    return `${modelName}(\n${entries.map((e) => `${pad}${e}`).join(',\n')}\n${closePad})`;
  }
  return `${modelName}(${entries.join(', ')})`;
}

function pyFingerprint(
  ft: IRFieldType,
  ir: IR,
  models: Map<string, IRModel>,
  visited: Set<string> = new Set(),
): string {
  switch (ft.kind) {
    case 'primitive':
      return pyType(ft);
    case 'enum':
      return ft.ref ?? 'object';
    case 'model': {
      const model = models.get(ft.ref!);
      if (!model || visited.has(ft.ref!)) return ft.ref ?? 'object';
      return pyModelFingerprint(model, ir, models, visited);
    }
    case 'array':
      return `list[${pyFingerprint(ft.items!, ir, models, visited)}]`;
    case 'record':
      return `dict[str, ${pyFingerprint(ft.valueType!, ir, models, visited)}]`;
    case 'union':
      if (ft.valueUnion && ft.members) return ft.members.map((m) => pyFingerprint(m, ir, models, visited)).join(' | ');
      return ft.ref ?? 'object';
    case 'literal':
      return 'str';
    case 'binary':
      return 'bytes';
  }
}

function pyModelFingerprint(
  model: IRModel,
  ir: IR,
  models: Map<string, IRModel>,
  visited: Set<string>,
): string {
  const nextVisited = new Set(visited);
  nextVisited.add(model.name);

  const fields = model.fields.map((f) => {
    const name = pyFieldName(f);
    const type = pyFingerprint(f.type, ir, models, nextVisited);
    const opt = (!f.required || f.nullable) ? ' | None' : '';
    return `${name}: ${type}${opt}`;
  });

  return `${model.name}(${fields.join(', ')})`;
}

function pyBuildOutputFingerprint(
  op: IROperation,
  ir: IR,
  models: Map<string, IRModel>,
): string | null {
  const resp = op.successResponse;
  if (resp.isRedirect) return 'str';
  if (resp.isBinary) return 'bytes';
  if (!resp.hasBody) return null;

  if (resp.isList && resp.responseRef) {
    const rt = ir.responses.find((r) => r.name === resp.responseRef);
    if (rt) {
      const parts: string[] = [];
      parts.push(`data: list[${rt.dataRef}]`);
      if (rt.metaRef) {
        const opt = rt.metaIsRequired ? '' : ' | None';
        parts.push(`meta: ${rt.metaRef}${opt}`);
      }
      return `${rt.name}(${parts.join(', ')})`;
    }
  }

  // A single object with meta: both sides spelled out, the object as an unwrapped method shows it.
  if (resp.isSingleWithMeta && resp.responseRef) {
    const rt = ir.responses.find((r) => r.name === resp.responseRef);
    if (rt) {
      const fp = (ref: string): string => {
        const model = models.get(ref);
        return model ? pyModelFingerprint(model, ir, models, new Set()) : ref;
      };
      const parts: string[] = [`data: ${fp(rt.dataRef)}`];
      if (rt.metaRef) {
        const opt = rt.metaIsRequired ? '' : ' | None';
        parts.push(`meta: ${fp(rt.metaRef)}${opt}`);
      }
      return `${rt.name}(${parts.join(', ')})`;
    }
  }

  if (resp.dataRef) {
    const model = models.get(resp.dataRef);
    if (model) return pyModelFingerprint(model, ir, models, new Set());
    return resp.dataRef;
  }

  return 'object';
}

function pyBuildOperationExample(
  op: IROperation,
  ir: IR,
  models: Map<string, IRModel>,
  serviceProp: string,
): { usage: string; output: string | null; imports: string[] } {
  const params: { name: string; value: string }[] = [];
  const imports = new Set<string>();

  if (op.externalUrl) {
    params.push({ name: camelToSnake(op.externalUrl), value: '"https://example.com"' });
  }

  for (const p of op.pathParams) {
    params.push({ name: pyParamName(p.sdkName), value: pyLiteral(p.type, ir, models) });
    for (const r of collectTypeRefs(p.type, ir, models)) imports.add(r);
  }

  if (op.requestBody) {
    const rb = op.requestBody;
    const body = bodyExample(rb, ir, models);
    if (shouldUnwrapBody(rb) && rb.unwrapField) {
      const sdkName = pyFieldName(rb.unwrapField);
      params.push({ name: sdkName, value: pyLiteral(body.type, body.ir, body.models) });
      for (const r of collectTypeRefs(body.type, body.ir, body.models)) imports.add(r);
    } else if (rb.schemaRef) {
      params.push({ name: 'request', value: pyLiteral(body.type, body.ir, body.models) });
      for (const r of collectTypeRefs(body.type, body.ir, body.models)) imports.add(r);
    }
  }

  // Query params become a single params argument
  const queryEntries: { name: string; value: string }[] = [];
  for (const p of op.queryParams) {
    queryEntries.push({ name: pyParamName(p.sdkName), value: pyLiteral(p.type, ir, models) });
    for (const r of collectTypeRefs(p.type, ir, models)) imports.add(r);
  }

  const declarations: string[] = [];
  const callArgs: string[] = [];

  for (const { name, value } of params) {
    if (value.includes('(') || value.includes('{') || value.includes('[')) {
      declarations.push(`${name} = ${value}`);
      callArgs.push(`${name}=${name}`);
    } else {
      callArgs.push(`${name}=${value}`);
    }
  }

  if (queryEntries.length > 0) {
    const multiLine = queryEntries.length > 2;
    const pascal = op.methodName.charAt(0).toUpperCase() + op.methodName.slice(1);
    const paramsTypeName = `${pascal}Params`;
    imports.add(paramsTypeName);
    if (multiLine) {
      const inner = queryEntries.map((e) => `    ${e.name}=${e.value}`).join(',\n');
      declarations.push(`params = ${paramsTypeName}(\n${inner}\n)`);
    } else {
      declarations.push(`params = ${paramsTypeName}(${queryEntries.map((e) => `${e.name}=${e.value}`).join(', ')})`);
    }
    callArgs.push('params=params');
  }

  const method = pyMethodName(op);
  const output = pyBuildOutputFingerprint(op, ir, models);
  const rawCall = `await client.${serviceProp}.${method}(${callArgs.join(', ')})`;
  const call = output ? `response = ${rawCall}` : rawCall;
  const usage = declarations.length > 0
    ? [...declarations, call].join('\n')
    : call;

  return { usage, output, imports: [...imports].sort() };
}

function generateExamples(ir: IR): string {
  const models = buildModelIndex(ir);
  const result: Record<string, object> = {};

  result['Client_Init'] = {
    usage: 'client = PachcaClient("YOUR_TOKEN")',
    imports: ['PachcaClient'],
  };

  for (const svc of ir.services) {
    if (svc.deprecated) continue; // backward-compat alias service — document new names only
    const serviceProp = pyServiceProp(svc.tag);
    for (const op of svc.operations) {
      if (op.isAlias) continue; // alias op — documented under its new service
      const ex = pyBuildOperationExample(op, ir, models, serviceProp);
      const entry: Record<string, unknown> = { usage: ex.usage };
      if (ex.output) entry.output = ex.output;
      if (ex.imports.length > 0) entry.imports = ex.imports;
      const named = namedBodyExamples(op, (o) => pyBuildOperationExample(o, ir, models, serviceProp));
      if (named) entry.examples = named;
      result[op.operationId] = entry;
      if (op.methodName === 'getWebhookEvents' && op.successResponse.dataRef === 'WebhookEvent') {
        result[`${op.operationId}_pollWebhookEvents`] = {
          usage: `async for event in client.${serviceProp}.poll_webhook_events(interval_seconds=5.0):\n    print(event)`,
        };
        result[`${op.operationId}_pollWebhookPayloads`] = {
          usage: `async for payload in client.${serviceProp}.poll_webhook_payloads(interval_seconds=5.0):\n    print(payload)`,
        };
      }
    }
  }

  return JSON.stringify(result, null, 2) + '\n';
}

// ── Main ─────────────────────────────────────────────────────────────

export class PythonGenerator implements LanguageGenerator {
  readonly dirName = 'py';

  generate(ir: IR, options?: GenerateOptions): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    files.push({ path: '__init__.py', content: '' });
    files.push({ path: 'models.py', content: generateModels(ir) });
    const client = generateClient(ir);
    files.push({ path: 'client.py', content: client.content });
    if (client.needUtils) {
      files.push({ path: 'utils.py', content: generateUtils(ir) });
    }
    if (options?.examples) {
      files.push({ path: 'examples.json', content: generateExamples(ir) });
    }
    return files;
  }
}
