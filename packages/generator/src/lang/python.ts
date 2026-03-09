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
import type { GeneratedFile, LanguageGenerator } from './types.js';
import {
  camelToSnake,
  snakeToUpperSnake,
  tagToServiceName,
} from '../naming.js';

function pyFieldName(field: IRField): string {
  if (field.name.includes('-')) return field.name.replace(/-/g, '_').toLowerCase();
  return camelToSnake(field.name);
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

  lines.push('from __future__ import annotations');
  lines.push('');
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
    const rt = ir.responses.find(
      (r) => r.dataRef === op.successResponse.dataRef && r.dataIsArray,
    );
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
          const rt = ir.responses.find(
            (r) => r.dataRef === op.successResponse.dataRef && r.dataIsArray,
          );
          if (rt) add(rt.name);
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
    if (req) {
      const binary = req.fields.find((f) => f.type.kind === 'binary');
      const nonBinary = req.fields.filter((f) => f.type.kind !== 'binary');
      for (const f of nonBinary.filter((x) => !isOptionalField(x))) {
        lines.push(
          `        data[${JSON.stringify(f.name)}] = request.${pyFieldName(f)}`,
        );
      }
      for (const f of nonBinary.filter((x) => isOptionalField(x))) {
        lines.push(`        if request.${pyFieldName(f)} is not None:`);
        lines.push(
          `            data[${JSON.stringify(f.name)}] = request.${pyFieldName(f)}`,
        );
      }
      const filesExpr = binary
        ? `{"${binary.name}": request.${pyFieldName(binary)}}`
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
          lines.push(`        if ${maybe} is not None:`);
          lines.push(`            for v in ${v}:`);
          lines.push(`                query.append((${JSON.stringify(p.name)}, str(v)))`);
        } else {
          const rhs = p.type.kind === 'primitive' && p.type.primitive === 'boolean'
            ? `str(${v}).lower()`
            : p.type.kind === 'primitive' &&
              (p.type.primitive === 'integer' || p.type.primitive === 'number')
              ? `str(${v})`
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
    const rt = ir.responses.find(
      (r) => r.dataRef === op.successResponse.dataRef && r.dataIsArray,
    );
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

function generateClient(ir: IR): { content: string; needUtils: boolean } {
  const lines: string[] = [];
  const needToDict = needsAsdict(ir);
  const imports = collectClientImports(ir);
  const needUtils = ir.services.length > 0;

  if (ir.services.length > 0) {
    lines.push('from __future__ import annotations');
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
    if (needUtils) lines.push(`from .utils import ${utilImports.join(', ')}`);
  }

  if (ir.services.length === 0) {
    while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
    lines.push('');
    return { content: lines.join('\n'), needUtils: false };
  }

  lines.push('');
  for (const svc of ir.services) {
    lines.push(`class ${tagToServiceName(svc.tag)}:`);
    lines.push('    def __init__(self, client: httpx.AsyncClient) -> None:');
    lines.push('        self._client = client');
    lines.push('');
    for (let i = 0; i < svc.operations.length; i++) {
      emitOperation(lines, svc.operations[i], ir);
      if (i < svc.operations.length - 1) lines.push('');
    }
    lines.push('');
    lines.push('');
  }

  lines.push('class PachcaClient:');
  const pyDefault = ir.baseUrl ? ` = ${JSON.stringify(ir.baseUrl)}` : '';
  lines.push(`    def __init__(self, token: str, base_url: str${pyDefault}) -> None:`);
  lines.push('        self._client = httpx.AsyncClient(');
  lines.push('            base_url=base_url,');
  lines.push('            headers={"Authorization": f"Bearer {token}"},');
  lines.push('        )');
  const services = ir.services
    .map((s) => ({ prop: pyServiceProp(s.tag), cls: tagToServiceName(s.tag) }))
    .sort((a, b) => a.prop.localeCompare(b.prop));
  for (const s of services) {
    lines.push(`        self.${s.prop} = ${s.cls}(self._client)`);
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
    'from dataclasses import asdict, fields',
    'from typing import Type, TypeVar, get_args, get_origin',
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
    '    norm = {k.replace("-", "_").lower(): v for k, v in data.items()}',
    '    kwargs = {}',
    '    for k, v in norm.items():',
    '        if k not in field_map:',
    '            continue',
    '        f = field_map[k]',
    '        if isinstance(v, dict):',
    '            nested = _resolve_type(f.type)',
    '            if nested is not None:',
    '                v = deserialize(nested, v)',
    '        elif isinstance(v, list) and v:',
    '            item_tp = _resolve_list_item_type(f.type)',
    '            if item_tp is not None and _is_dataclass_type(item_tp):',
    '                v = [deserialize(item_tp, i) if isinstance(i, dict) else i for i in v]',
    '        kwargs[k] = v',
    '    return cls(**kwargs)',
    '',
    '',
    'def _strip_nones(val: object) -> object:',
    '    if isinstance(val, dict):',
    '        return {k: _strip_nones(v) for k, v in val.items() if v is not None}',
    '    if isinstance(val, list):',
    '        return [_strip_nones(v) for v in val]',
    '    return val',
    '',
    '',
    'def serialize(obj: object) -> dict:',
    '    """Convert a dataclass to a dict, recursively omitting None values."""',
    '    return _strip_nones(asdict(obj))',
    '',
  ].join('\n');
}

export class PythonGenerator implements LanguageGenerator {
  readonly dirName = 'py';

  generate(ir: IR): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    files.push({ path: '__init__.py', content: '' });
    files.push({ path: 'models.py', content: generateModels(ir) });
    const client = generateClient(ir);
    files.push({ path: 'client.py', content: client.content });
    if (client.needUtils) {
      files.push({ path: 'utils.py', content: generateUtils() });
    }
    return files;
  }
}
