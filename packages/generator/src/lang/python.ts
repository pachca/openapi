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
} from '../ir.js';
import { buildModelIndex, collectTypeRefs, type GeneratedFile, type GenerateOptions, type LanguageGenerator } from './types.js';
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

function emitEnum(lines: string[], e: IREnum): void {
  lines.push(`class ${e.name}(StrEnum):`);
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
  lines.push(`    data: list[${rt.dataRef}]`);
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

  lines.push('from __future__ import annotations');
  lines.push('');
  if (needDatetime) lines.push('from datetime import datetime');
  if (needDataclass) {
    lines.push('from dataclasses import dataclass');
    if (needEnum) lines.push('from enum import StrEnum');
  } else if (needEnum) {
    lines.push('from enum import StrEnum');
  }
  const typingImports: string[] = [];
  if (needAny) typingImports.push('Any');
  if (needUnion) typingImports.push('Union');
  if (typingImports.length > 0) lines.push(`from typing import ${typingImports.join(', ')}`);
  if (needDataclass || needEnum) lines.push('');

  const unionMembers = new Set<string>();
  for (const u of ir.unions) for (const ref of u.memberRefs) unionMembers.add(ref);

  for (const e of ir.enums) {
    emitEnum(lines, e);
    lines.push('');
    lines.push('');
  }

  for (const m of ir.models) {
    for (const inl of m.inlineObjects) {
      emitModel(lines, inl);
      lines.push('');
      lines.push('');
    }
    if (unionMembers.has(m.name)) {
      emitModel(lines, m);
      lines.push('');
      lines.push('');
      continue;
    }
    emitModel(lines, m);
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
  if (!op.successResponse.hasBody) return 'None';
  if (op.successResponse.isList) {
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

function needsAsdict(ir: IR): boolean {
  return ir.services.some((s) =>
    s.operations.some((op) => {
      if (op.requestBody?.contentType !== 'json') return false;
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
        if (op.successResponse.isList) {
          const rt = ir.responses.find((r) => r.name === op.successResponse.responseRef);
          if (rt) add(rt.name);
          if (op.isPaginated && op.successResponse.dataRef) {
            add(op.successResponse.dataRef);
          }
        } else if (op.successResponse.dataRef) {
          add(op.successResponse.dataRef);
        }
      }
      if (op.hasOAuthError || ir.models.some((m) => m.name === 'OAuthError')) {
        add('OAuthError');
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
    if (op.noAuth) {
      lines.push(`        async with httpx.AsyncClient() as _no_auth:`);
      lines.push(`            response = await _no_auth.${method}(`);
      lines.push(`                ${pathStr},`);
      if (hasQuery) lines.push('                params=query,');
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
      lines.push('            )');
    } else {
      lines.push(`        response = await self._client.${method}(`);
      lines.push(`            ${pathStr},`);
      if (hasQuery) lines.push('            params=query,');
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
      lines.push('        )');
    }
  }

  const hasBody = op.successResponse.hasBody && !op.successResponse.isRedirect;
  if (hasBody) lines.push('        body = response.json()');
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
  } else if (!op.successResponse.hasBody) {
    lines.push(`            case ${op.successResponse.statusCode}:`);
    lines.push('                return');
  } else if (op.successResponse.isList) {
    const rt = ir.responses.find((r) => r.name === op.successResponse.responseRef);
    lines.push(`            case ${op.successResponse.statusCode}:`);
    lines.push(`                return deserialize(${rt?.name ?? 'object'}, body)`);
  } else if (op.successResponse.isUnwrap && op.successResponse.dataRef) {
    lines.push(`            case ${op.successResponse.statusCode}:`);
    lines.push(`                return deserialize(${op.successResponse.dataRef}, body["data"])`);
  } else {
    lines.push(`            case ${op.successResponse.statusCode}:`);
    lines.push(`                return deserialize(${op.successResponse.dataRef ?? 'object'}, body)`);
  }

  if (op.hasOAuthError) {
    lines.push('            case 401:');
    lines.push(
      `                raise deserialize(OAuthError, ${hasBody ? 'body' : 'response.json()'})`,
    );
  }

  if (op.hasApiError || ir.models.some((m) => m.name === 'ApiError')) {
    lines.push('            case _:');
    lines.push(
      `                raise deserialize(ApiError, ${hasBody ? 'body' : 'response.json()'})`,
    );
  } else {
    lines.push('            case _:');
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
  lines.push('        while True:');
  {
    const callParts: string[] = [];
    if (op.externalUrl) callParts.push(camelToSnake(op.externalUrl));
    for (const p of op.pathParams) callParts.push(pyParamName(p.sdkName));
    if (paramsType) {
      lines.push('            if params is None:');
      lines.push(`                params = ${paramsType}()`);
      lines.push('            params.cursor = cursor');
      callParts.push('params=params');
    }
    lines.push(`            response = await self.${pyMethodName(op)}(${callParts.join(', ')})`);
  }
  const rt = ir.responses.find((r) => r.name === op.successResponse.responseRef);
  const metaAccess = rt?.metaIsRequired ? 'response.meta.paginate.next_page' : 'response.meta.paginate.next_page if response.meta else None';
  lines.push('            items.extend(response.data)');
  lines.push('            if not response.data:');
  lines.push('                break');
  lines.push(`            cursor = ${metaAccess}`);
  if (!rt?.metaIsRequired) {
    lines.push('            if not cursor:');
    lines.push('                break');
  }
  lines.push('        return items');
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

function generateClient(ir: IR): { content: string; needUtils: boolean } {
  const lines: string[] = [];
  const needToDict = needsAsdict(ir);
  const imports = collectClientImports(ir);
  const needUtils = ir.services.length > 0;

  if (ir.services.length > 0) {
    lines.push('from __future__ import annotations');
    lines.push('');
    lines.push('from dataclasses import dataclass');
    lines.push('');
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

  if (ir.services.length === 0) {
    while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
    lines.push('');
    return { content: lines.join('\n'), needUtils: false };
  }

  lines.push('');
  for (const svc of ir.services) {
    const serviceName = tagToServiceName(svc.tag);
    const implName = serviceToImplName(serviceName);
    lines.push(`class ${serviceName}:`);
    for (let i = 0; i < svc.operations.length; i++) {
      emitThrowingOperation(lines, svc.operations[i], ir);
      if (svc.operations[i].isPaginated && svc.operations[i].successResponse.dataRef) {
        lines.push('');
        emitThrowingPaginationMethod(lines, svc.operations[i]);
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
  lines.push('class PachcaClient:');
  const pyDefault = ir.baseUrl ? ` = ${JSON.stringify(ir.baseUrl)}` : '';
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

  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  lines.push('');
  return { content: lines.join('\n'), needUtils };
}

function generateUtils(): string {
  return [
    'from __future__ import annotations',
    '',
    'import dataclasses',
    'import keyword',
    'from dataclasses import asdict, fields',
    'from datetime import datetime',
    'from typing import Type, TypeVar, get_args, get_origin, get_type_hints',
    '',
    'import httpx',
    '',
    'T = TypeVar("T")',
    '',
    '',
    'def _is_dataclass_type(tp: type) -> bool:',
    '    return isinstance(tp, type) and dataclasses.is_dataclass(tp)',
    '',
    '',
    'def _resolve_type(tp: type) -> type | None:',
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
    'def _resolve_list_item_type(tp: type) -> type | None:',
    '    """Extract the item type from list[X]."""',
    '    origin = get_origin(tp)',
    '    if origin is list:',
    '        args = get_args(tp)',
    '        if args:',
    '            return args[0]',
    '    return None',
    '',
    '',
    'def deserialize(cls: Type[T], data: dict) -> T:',
    '    """Create a dataclass instance from a dict, recursively deserializing nested dataclasses."""',
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
    '        if isinstance(v, dict):',
    '            nested = _resolve_type(hints[f.name])',
    '            if nested is not None:',
    '                v = deserialize(nested, v)',
    '        elif isinstance(v, list) and v:',
    '            item_tp = _resolve_list_item_type(hints[f.name])',
    '            if item_tp is not None and _is_dataclass_type(item_tp):',
    '                v = [deserialize(item_tp, i) if isinstance(i, dict) else i for i in v]',
    '        elif isinstance(v, str):',
    '            hint = hints.get(f.name)',
    '            raw_hint = hint',
    '            if get_origin(hint) is not None:',
    '                for a in get_args(hint):',
    '                    if a is not type(None):',
    '                        raw_hint = a',
    '                        break',
    '            if raw_hint is datetime:',
    '                v = datetime.fromisoformat(v)',
    '        kwargs[k] = v',
    '    return cls(**kwargs)',
    '',
    '',
    'def _strip_nones(val: object) -> object:',
    '    if isinstance(val, dict):',
    '        return {',
    '            (k[:-1] if k.endswith("_") and keyword.iskeyword(k[:-1]) else k): _strip_nones(v)',
    '            for k, v in val.items() if v is not None',
    '        }',
    '    if isinstance(val, list):',
    '        return [_strip_nones(v) for v in val]',
    '    if isinstance(val, datetime):',
    '        return val.isoformat()',
    '    return val',
    '',
    '',
    'def serialize(obj: object) -> dict:',
    '    """Convert a dataclass to a dict, recursively omitting None values."""',
    '    return _strip_nones(asdict(obj))',
    '',
    '',
    '_MAX_RETRIES = 3',
    '_RETRYABLE_5XX = {500, 502, 503, 504}',
    '',
    '',
    'def _jitter(delay: float) -> float:',
    '    import random',
    '    return delay * (0.5 + random.random() * 0.5)',
    '',
    '',
    'class RetryTransport(httpx.AsyncBaseTransport):',
    '    """Wraps an httpx transport with retry on 429 Too Many Requests and 5xx errors."""',
    '',
    '    def __init__(self, transport: httpx.AsyncBaseTransport, max_retries: int = _MAX_RETRIES) -> None:',
    '        self._transport = transport',
    '        self._max_retries = max_retries',
    '',
    '    async def handle_async_request(self, request: httpx.Request) -> httpx.Response:',
    '        import asyncio',
    '        for attempt in range(self._max_retries + 1):',
    '            response = await self._transport.handle_async_request(request)',
    '            if response.status_code == 429 and attempt < self._max_retries:',
    '                retry_after = response.headers.get("retry-after")',
    '                delay = int(retry_after) if retry_after and retry_after.isdigit() else 2 ** attempt',
    '                await asyncio.sleep(delay)',
    '                continue',
    '            if response.status_code in _RETRYABLE_5XX and attempt < self._max_retries:',
    '                delay = _jitter(10 * (2 ** attempt))',
    '                await asyncio.sleep(delay)',
    '                continue',
    '            return response',
    '        return response  # unreachable',
    '',
  ].join('\n');
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
        if (ft.format === 'date-time') return `datetime.fromisoformat(${JSON.stringify(ft.example)})`;
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
        if (ft.format === 'date-time') return 'datetime.fromisoformat("2024-01-01T00:00:00Z")';
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
    if (shouldUnwrapBody(rb) && rb.unwrapField) {
      const sdkName = pyFieldName(rb.unwrapField);
      params.push({ name: sdkName, value: pyLiteral(rb.unwrapField.type, ir, models) });
      for (const r of collectTypeRefs(rb.unwrapField.type, ir, models)) imports.add(r);
    } else if (rb.schemaRef) {
      params.push({ name: 'request', value: pyLiteral({ kind: 'model', ref: rb.schemaRef }, ir, models) });
      for (const r of collectTypeRefs({ kind: 'model', ref: rb.schemaRef }, ir, models)) imports.add(r);
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
    const serviceProp = pyServiceProp(svc.tag);
    for (const op of svc.operations) {
      const ex = pyBuildOperationExample(op, ir, models, serviceProp);
      const entry: Record<string, unknown> = { usage: ex.usage };
      if (ex.output) entry.output = ex.output;
      if (ex.imports.length > 0) entry.imports = ex.imports;
      result[op.operationId] = entry;
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
      files.push({ path: 'utils.py', content: generateUtils() });
    }
    if (options?.examples) {
      files.push({ path: 'examples.json', content: generateExamples(ir) });
    }
    return files;
  }
}
