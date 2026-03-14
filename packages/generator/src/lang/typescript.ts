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
import type { GeneratedFile, LanguageGenerator } from './types.js';
import {
  snakeToCamel,
  snakeToPascal,
  kebabToCamel,
  tagToProperty,
  tagToServiceName,
} from '../naming.js';

function fieldSdkName(field: IRField): string {
  if (field.name.includes('-')) return kebabToCamel(field.name);
  return snakeToCamel(field.name);
}

function tsPrimitive(ft: IRFieldType): string {
  if (ft.primitive === 'integer' || ft.primitive === 'number') return 'number';
  if (ft.primitive === 'boolean') return 'boolean';
  if (ft.primitive === 'any') return 'unknown';
  return 'string';
}

function isTypeNullable(field: IRField): boolean {
  return field.nullable;
}

function collectModelRefs(ft: IRFieldType, refs: string[]): void {
  if (ft.kind === 'model' && ft.ref) refs.push(ft.ref);
  if (ft.kind === 'enum' && ft.ref) refs.push(ft.ref);
  if (ft.kind === 'array' && ft.items) collectModelRefs(ft.items, refs);
  if (ft.kind === 'record' && ft.valueType) collectModelRefs(ft.valueType, refs);
  if (ft.kind === 'union' && ft.members) {
    for (const m of ft.members) collectModelRefs(m, refs);
  }
}

function tsType(
  ft: IRFieldType,
  opts: {
    parent?: IRModel;
    allModels: Map<string, IRModel>;
    inlineAsObject: Set<string>;
  },
): string {
  switch (ft.kind) {
    case 'primitive':
      return tsPrimitive(ft);
    case 'binary':
      return 'Blob';
    case 'enum':
    case 'model':
    case 'union':
      if (ft.ref && opts.parent && opts.inlineAsObject.has(ft.ref)) {
        const inl = opts.parent.inlineObjects.find((m) => m.name === ft.ref);
        if (inl) return inlineObjectType(inl, opts);
      }
      return ft.ref ?? 'unknown';
    case 'array': {
      const inner = tsType(ft.items!, opts);
      return inner.includes(' | ') ? `(${inner})[]` : `${inner}[]`;
    }
    case 'record':
      return `Record<string, ${tsType(ft.valueType!, opts)}>`;
    case 'literal':
      return JSON.stringify(ft.literalValue ?? '');
  }
}

function defaultComment(field: IRField): string | null {
  if (field.defaultValue === undefined) return null;
  return `/** @default ${String(field.defaultValue)} */`;
}

function emitField(
  lines: string[],
  field: IRField,
  opts: {
    parent?: IRModel;
    allModels: Map<string, IRModel>;
    inlineAsObject: Set<string>;
  },
  indent = '  ',
): void {
  const doc = defaultComment(field);
  if (doc) lines.push(`${indent}${doc}`);
  const name = fieldSdkName(field);
  const optional = !field.required ? '?' : '';
  const type = tsType(field.type, opts);
  const renderedType = type.includes('\n') ? type.replace(/\n/g, `\n${indent}`) : type;
  const nullable = isTypeNullable(field) ? ' | null' : '';
  lines.push(`${indent}${name}${optional}: ${renderedType}${nullable};`);
}

function inlineObjectType(
  model: IRModel,
  opts: {
    allModels: Map<string, IRModel>;
    inlineAsObject: Set<string>;
  },
): string {
  const lines: string[] = [];
  lines.push('{');
  for (const f of model.fields) {
    const doc = defaultComment(f);
    if (doc) lines.push(`  ${doc}`);
    const name = fieldSdkName(f);
    const optional = !f.required ? '?' : '';
    const type = tsType(f.type, { parent: model, ...opts });
    const nullable = isTypeNullable(f) ? ' | null' : '';
    lines.push(`  ${name}${optional}: ${type}${nullable};`);
  }
  lines.push('}');
  return lines.join('\n');
}

function enumMemberName(value: string): string {
  return value
    .split(/[_\-:\s]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

function emitEnum(lines: string[], e: IREnum): void {
  if (e.description && e.hasDescriptions && e.members.length > 1) {
    lines.push(`/** ${e.description} */`);
  }
  lines.push(`export enum ${e.name} {`);
  for (const m of e.members) {
    if (m.description) lines.push(`  /** ${m.description} */`);
    lines.push(`  ${enumMemberName(m.value)} = ${JSON.stringify(m.value)},`);
  }
  lines.push('}');
}

function emitErrorClass(lines: string[], m: IRModel): void {
  if (m.name === 'ApiError') {
    lines.push('export class ApiError extends Error {');
    lines.push('  errors?: ApiErrorItem[];');
    lines.push('  constructor(errors?: ApiErrorItem[]) {');
    lines.push('    super(errors?.map((e) => `${e.key}: ${e.value}`).join(", "));');
    lines.push('    this.errors = errors;');
    lines.push('  }');
    lines.push('}');
    return;
  }
  if (m.name === 'OAuthError') {
    lines.push('export class OAuthError extends Error {');
    lines.push('  error?: string;');
    lines.push('  constructor(error?: string) {');
    lines.push('    super(error);');
    lines.push('    this.error = error;');
    lines.push('  }');
    lines.push('}');
    return;
  }

  lines.push(`export class ${m.name} extends Error {`);
  for (const f of m.fields) {
    lines.push(`  ${fieldSdkName(f)}${f.required ? '' : '?'}: ${tsType(f.type, { allModels: new Map(), inlineAsObject: new Set() })}${f.nullable ? ' | null' : ''};`);
  }
  lines.push(`  constructor(init: Partial<${m.name}> = {}) {`);
  lines.push('    super();');
  for (const f of m.fields) {
    lines.push(`    this.${fieldSdkName(f)} = init.${fieldSdkName(f)};`);
  }
  lines.push('  }');
  lines.push('}');
}

function emitModel(
  lines: string[],
  m: IRModel,
  opts: {
    allModels: Map<string, IRModel>;
    inlineAsObject: Set<string>;
  },
): void {
  if (m.isError) {
    emitErrorClass(lines, m);
    return;
  }

  lines.push(`export interface ${m.name} {`);
  for (const f of m.fields) {
    emitField(lines, f, { parent: m, ...opts });
  }
  lines.push('}');
}

function emitUnion(lines: string[], u: IRUnion): void {
  lines.push(`export type ${u.name} = ${u.memberRefs.join(' | ')};`);
}

function emitParamsType(lines: string[], p: { name: string; params: IRParam[] }): void {
  lines.push(`export interface ${p.name} {`);
  for (const param of p.params) {
    const type = tsType(param.type, {
      allModels: new Map(),
      inlineAsObject: new Set(),
    });
    const opt = param.required ? '' : '?';
    lines.push(`  ${param.sdkName}${opt}: ${type};`);
  }
  lines.push('}');
}

function emitResponseType(lines: string[], rt: IRResponseType): void {
  lines.push(`export interface ${rt.name} {`);
  lines.push(`  data: ${rt.dataRef}[];`);
  if (rt.metaRef) {
    const opt = rt.metaIsRequired ? '' : '?';
    lines.push(`  meta${opt}: ${rt.metaRef};`);
  }
  lines.push('}');
}

function buildInlineAsObjectSet(ir: IR): Set<string> {
  const refCounts = new Map<string, number>();
  for (const m of ir.models) {
    for (const f of m.fields) {
      const refs: string[] = [];
      collectModelRefs(f.type, refs);
      for (const ref of refs) {
        refCounts.set(ref, (refCounts.get(ref) ?? 0) + 1);
      }
    }
  }

  const inlineAsObject = new Set<string>();
  for (const m of ir.models) {
    const inlineNames = new Set(m.inlineObjects.map((x) => x.name));
    for (const f of m.fields) {
      if (f.type.kind === 'model' && f.type.ref && inlineNames.has(f.type.ref)) {
        if ((refCounts.get(f.type.ref) ?? 0) === 1) {
          inlineAsObject.add(f.type.ref);
        }
      }
    }
  }
  return inlineAsObject;
}

function generateTypes(ir: IR): string {
  const lines: string[] = [];
  const allModels = new Map(ir.models.map((m) => [m.name, m]));
  const inlineAsObject = buildInlineAsObjectSet(ir);
  const unionMembers = new Set<string>();
  for (const u of ir.unions) for (const ref of u.memberRefs) unionMembers.add(ref);

  for (const e of ir.enums) {
    emitEnum(lines, e);
    lines.push('');
  }

  for (const m of ir.models) {
    for (const inl of m.inlineObjects) {
      if (inlineAsObject.has(inl.name)) continue;
      emitModel(lines, inl, { allModels, inlineAsObject });
      lines.push('');
    }
    if (unionMembers.has(m.name)) {
      emitModel(lines, m, { allModels, inlineAsObject });
      lines.push('');
      continue;
    }
    emitModel(lines, m, { allModels, inlineAsObject });
    lines.push('');
  }

  for (const u of ir.unions) {
    emitUnion(lines, u);
    lines.push('');
  }

  for (const p of ir.params) {
    emitParamsType(lines, p);
    lines.push('');
  }

  for (const rt of ir.responses) {
    emitResponseType(lines, rt);
    lines.push('');
  }

  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  lines.push('');
  return lines.join('\n');
}

function methodArgs(op: IROperation): string {
  const args: string[] = [];
  if (op.externalUrl) {
    args.push(`${op.externalUrl}: string`);
  }
  for (const p of op.pathParams) {
    args.push(`${p.sdkName}: ${tsType(p.type, { allModels: new Map(), inlineAsObject: new Set() })}`);
  }
  if (op.requestBody) {
    const rb = op.requestBody;
    if (shouldUnwrapBody(rb)) {
      const unwrapField = rb.unwrapField!;
      args.push(
        `${snakeToCamel(unwrapField.name)}: ${tsType(unwrapField.type, {
          allModels: new Map(),
          inlineAsObject: new Set(),
        })}`,
      );
    } else if (rb.schemaRef) {
      args.push(`request: ${rb.schemaRef}`);
    }
  }
  if (op.queryParams.length > 0) {
    const p = irParamTypeName(op);
    const hasRequired = op.queryParams.some((q) => q.required);
    args.push(hasRequired ? `params: ${p}` : `params?: ${p}`);
  }
  return args.join(', ');
}

function irParamTypeName(op: IROperation): string {
  const pascal = op.methodName.charAt(0).toUpperCase() + op.methodName.slice(1);
  return `${pascal}Params`;
}

function responseTypeName(op: IROperation, ir: IR): string {
  if (op.successResponse.isRedirect) return 'string';
  if (!op.successResponse.hasBody) return 'void';
  if (op.successResponse.isList) {
    const rt = ir.responses.find(
      (r) =>
        r.dataRef === op.successResponse.dataRef &&
        r.dataIsArray,
    );
    return rt?.name ?? 'unknown';
  }
  return op.successResponse.dataRef ?? 'unknown';
}

function escapeTemplatePath(path: string, op: IROperation): string {
  let p = path;
  for (const param of op.pathParams) {
    p = p.replace(`{${param.name}}`, `\${${param.sdkName}}`);
  }
  return p;
}

function queryValueExpr(p: IRParam, valueExpr: string): string {
  if (p.type.kind === 'primitive' && p.type.primitive === 'string') {
    return valueExpr;
  }
  if (p.type.kind === 'enum') {
    return valueExpr;
  }
  return `String(${valueExpr})`;
}

function generateClient(ir: IR): { content: string; needsUtils: boolean } {
  const lines: string[] = [];
  const importedTypes: string[] = [];
  const importedSet = new Set<string>();
  const TS_BUILTINS = new Set(['unknown', 'string', 'number', 'boolean', 'void', 'never', 'any', 'object']);
  const addImport = (name: string): void => {
    if (!importedSet.has(name) && !TS_BUILTINS.has(name)) {
      importedSet.add(name);
      importedTypes.push(name);
    }
  };
  let needsDeserialize = false;
  let needsSerialize = false;
  const hasServices = ir.services.length > 0;
  const inlineAsObject = buildInlineAsObjectSet(ir);

  if (hasServices) {
    for (const svc of ir.services) {
      for (const op of svc.operations) {
        for (const p of op.pathParams) {
          const refs: string[] = [];
          collectModelRefs(p.type, refs);
          for (const r of refs) addImport(r);
        }
        if (op.requestBody?.schemaRef) {
          const rb = op.requestBody;
          if (shouldUnwrapBody(rb) && rb.unwrapField) {
            const refs: string[] = [];
            collectModelRefs(rb.unwrapField.type, refs);
            for (const r of refs) addImport(r);
          } else {
            addImport(rb.schemaRef);
          }
          if (!shouldUnwrapBody(rb) && rb.contentType === 'json') needsSerialize = true;
        }
        if (op.queryParams.length > 0) addImport(irParamTypeName(op));
        if (op.successResponse.hasBody && !op.successResponse.isRedirect) {
          needsDeserialize = true;
          if (op.successResponse.isList) {
            addImport(responseTypeName(op, ir));
            if (op.isPaginated && op.successResponse.dataRef) {
              addImport(op.successResponse.dataRef);
            }
          } else if (op.successResponse.dataRef) {
            addImport(op.successResponse.dataRef);
          }
        }
        if (op.hasOAuthError || ir.models.some((m) => m.name === 'OAuthError')) {
          addImport('OAuthError');
        }
        if (op.hasApiError || ir.models.some((m) => m.name === 'ApiError')) {
          addImport('ApiError');
        }
      }
    }
  } else {
    for (const e of ir.enums) addImport(e.name);
    for (const m of ir.models) {
      for (const inl of m.inlineObjects) {
        if (!inlineAsObject.has(inl.name)) addImport(inl.name);
      }
      addImport(m.name);
    }
    for (const u of ir.unions) addImport(u.name);
    for (const p of ir.params) addImport(p.name);
    for (const r of ir.responses) addImport(r.name);
  }

  const typesList = importedTypes;
  if (typesList.length > 0) {
    if (typesList.length <= 3) {
      lines.push(`import { ${typesList.join(', ')} } from "./types";`);
    } else {
      lines.push('import {');
      for (const t of typesList) lines.push(`  ${t},`);
      lines.push('} from "./types";');
    }
  }

  if (needsDeserialize || needsSerialize || hasServices) {
    const utils = [
      needsDeserialize ? 'deserialize' : null,
      needsSerialize ? 'serialize' : null,
      hasServices ? 'fetchWithRetry' : null,
    ]
      .filter((x): x is string => !!x)
      .join(', ');
    lines.push(`import { ${utils} } from "./utils";`);
  }

  if (hasServices) lines.push('');

  for (const svc of ir.services) {
    emitService(lines, svc, ir);
    lines.push('');
  }

  if (hasServices) {
    lines.push('export class PachcaClient {');
    const serviceEntries = ir.services
      .map((s) => ({ prop: tagToProperty(s.tag), cls: tagToServiceName(s.tag) }))
      .sort((a, b) => a.prop.localeCompare(b.prop));
    for (const s of serviceEntries) lines.push(`  readonly ${s.prop}: ${s.cls};`);
    lines.push('');
    const defaultUrl = ir.baseUrl ? ` = ${JSON.stringify(ir.baseUrl)}` : '';
    lines.push(`  constructor(token: string, baseUrl: string${defaultUrl}) {`);
    lines.push('    const headers = { Authorization: `Bearer ${token}` };');
    for (const s of serviceEntries) {
      lines.push(`    this.${s.prop} = new ${s.cls}(baseUrl, headers);`);
    }
    lines.push('  }');
    lines.push('}');
  }

  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  lines.push('');
  return { content: lines.join('\n'), needsUtils: needsDeserialize || needsSerialize || hasServices };
}

function emitService(lines: string[], svc: IRService, ir: IR): void {
  const serviceName = tagToServiceName(svc.tag);
  lines.push(`class ${serviceName} {`);
  lines.push('  constructor(');
  lines.push('    private baseUrl: string,');
  lines.push('    private headers: Record<string, string>,');
  lines.push('  ) {}');
  lines.push('');
  for (let i = 0; i < svc.operations.length; i++) {
    emitOperation(lines, svc.operations[i], ir);
    if (svc.operations[i].isPaginated && svc.operations[i].successResponse.dataRef) {
      lines.push('');
      emitPaginationMethod(lines, svc.operations[i], ir);
    }
    if (i < svc.operations.length - 1) lines.push('');
  }
  lines.push('}');
}

function emitOperation(lines: string[], op: IROperation, ir: IR): void {
  const args = methodArgs(op);
  const ret = responseTypeName(op, ir);
  const path = escapeTemplatePath(op.path, op);
  if (op.deprecated) lines.push('  /** @deprecated */');
  lines.push(`  async ${op.methodName}(${args}): Promise<${ret}> {`);

  if (op.requestBody?.contentType === 'multipart') {
    lines.push('    const form = new FormData();');
    const reqModel = ir.models.find((m) => m.name === op.requestBody!.schemaRef);
    if (reqModel) {
      const nonBinary = reqModel.fields.filter((f) => f.type.kind !== 'binary');
      const binary = reqModel.fields.find((f) => f.type.kind === 'binary');
      for (const f of nonBinary) {
        const sdk = fieldSdkName(f);
        const optional = !f.required || f.nullable;
        if (optional) {
          lines.push(
            `    if (request.${sdk} !== undefined) form.set(${JSON.stringify(f.name)}, request.${sdk});`,
          );
        }
      }
      for (const f of nonBinary) {
        const sdk = fieldSdkName(f);
        const optional = !f.required || f.nullable;
        if (!optional) {
          lines.push(`    form.set(${JSON.stringify(f.name)}, request.${sdk});`);
        }
      }
      if (binary) {
        const sdk = fieldSdkName(binary);
        lines.push(`    form.set(${JSON.stringify(binary.name)}, request.${sdk}, "upload");`);
      }
    }
    const fetchUrl = op.externalUrl
      ? op.externalUrl
      : `\`${'${this.baseUrl}'}${path}\``;
    lines.push(`    const response = await fetchWithRetry(${fetchUrl}, {`);
    lines.push(`      method: ${JSON.stringify(op.method)},`);
    if (!op.noAuth) lines.push('      headers: this.headers,');
    lines.push('      body: form,');
    lines.push('    });');
    emitResponseSwitch(lines, op, ir, false);
    lines.push('  }');
    return;
  }

  const hasQuery = op.queryParams.length > 0;
  if (hasQuery) {
    lines.push('    const query = new URLSearchParams();');
    for (const p of op.queryParams) {
      if (p.isArray) {
        const cond = p.required ? `params.${p.sdkName}` : `params?.${p.sdkName}`;
        const arr = `params.${p.sdkName}`;
        lines.push(`    if (${cond} !== undefined) {`);
        lines.push(`      ${arr}.forEach((v) => query.append(${JSON.stringify(p.name)}, String(v)));`);
        lines.push('    }');
      } else {
        const value = `params.${p.sdkName}`;
        const setVal = queryValueExpr(p, value);
        if (p.required) {
          lines.push(`    query.set(${JSON.stringify(p.name)}, ${setVal});`);
        } else {
          lines.push(`    if (params?.${p.sdkName} !== undefined) query.set(${JSON.stringify(p.name)}, ${setVal});`);
        }
      }
    }
  }

  const hasRequiredQuery = op.queryParams.some((p) => p.required);
  const baseUrlExpr = op.externalUrl
    ? op.externalUrl
    : `\`${'${this.baseUrl}'}${path}\``;
  const fetchTarget = hasQuery
    ? hasRequiredQuery
      ? op.externalUrl
        ? `\`${'${' + op.externalUrl + '}'}?${'${query}'}\``
        : `\`${'${this.baseUrl}'}${path}?${'${query}'}\``
      : 'url'
    : baseUrlExpr;
  if (hasQuery && !hasRequiredQuery) {
    const urlBase = op.externalUrl
      ? `${'${' + op.externalUrl + '}'}`
      : `${'${this.baseUrl}'}${path}`;
    lines.push(`    const url = \`${urlBase}${'${query.toString() ? `?${query}` : ""}'}\`;`);
  }

  lines.push(`    const response = await fetchWithRetry(${fetchTarget}, {`);
  if (op.method !== 'GET') lines.push(`      method: ${JSON.stringify(op.method)},`);
  if (op.noAuth) {
    if (op.requestBody?.contentType === 'json') {
      lines.push('      headers: { "Content-Type": "application/json" },');
    }
  } else {
    lines.push(
      `      headers: ${
        op.requestBody?.contentType === 'json'
          ? '{ ...this.headers, "Content-Type": "application/json" }'
          : 'this.headers'
      },`,
    );
  }

  if (op.successResponse.isRedirect) {
    lines.push('      redirect: "manual",');
  }

  if (op.requestBody?.contentType === 'json') {
    const rb = op.requestBody;
    if (shouldUnwrapBody(rb)) {
      const f = rb.unwrapField!;
      const sdk = snakeToCamel(f.name);
      lines.push(`      body: JSON.stringify({ ${f.name}: ${sdk} }),`);
    } else {
      lines.push('      body: JSON.stringify(serialize(request)),');
    }
  }
  lines.push('    });');

  const preloadBody = op.successResponse.hasBody && !op.successResponse.isRedirect;
  if (preloadBody) lines.push('    const body = await response.json();');
  emitResponseSwitch(lines, op, ir, preloadBody);
  lines.push('  }');
}

function emitPaginationMethod(lines: string[], op: IROperation, ir: IR): void {
  const itemType = op.successResponse.dataRef ?? 'unknown';
  const respType = responseTypeName(op, ir);
  const paramsType = op.queryParams.length > 0 ? irParamTypeName(op) : null;

  const args: string[] = [];
  if (op.externalUrl) args.push(`${op.externalUrl}: string`);
  for (const p of op.pathParams) {
    args.push(`${p.sdkName}: ${tsType(p.type, { allModels: new Map(), inlineAsObject: new Set() })}`);
  }
  if (paramsType) {
    const hasRequired = op.queryParams.some((q) => q.required && q.name !== 'cursor');
    args.push(hasRequired ? `params: Omit<${paramsType}, 'cursor'>` : `params?: Omit<${paramsType}, 'cursor'>`);
  }

  lines.push(`  async ${op.methodName}All(${args.join(', ')}): Promise<${itemType}[]> {`);
  lines.push(`    const items: ${itemType}[] = [];`);
  lines.push('    let cursor: string | undefined;');
  lines.push('    do {');

  // Build call args
  const callArgs: string[] = [];
  if (op.externalUrl) callArgs.push(op.externalUrl);
  for (const p of op.pathParams) callArgs.push(p.sdkName);
  if (paramsType) callArgs.push('{ ...params, cursor } as ' + paramsType);
  lines.push(`      const response = await this.${op.methodName}(${callArgs.join(', ')});`);
  lines.push('      items.push(...response.data);');
  lines.push('      cursor = response.meta?.paginate?.nextPage;');
  lines.push('    } while (cursor);');
  lines.push('    return items;');
  lines.push('  }');
}

function emitResponseSwitch(
  lines: string[],
  op: IROperation,
  ir: IR,
  preloadBody: boolean,
): void {
  lines.push('    switch (response.status) {');
  if (op.successResponse.isRedirect) {
    lines.push(`      case ${op.successResponse.statusCode}: {`);
    lines.push('        const location = response.headers.get("location");');
    lines.push('        if (!location) {');
    lines.push('          throw new Error("Missing Location header in redirect response");');
    lines.push('        }');
    lines.push('        return location;');
    lines.push('      }');
  } else if (!op.successResponse.hasBody) {
    lines.push(`      case ${op.successResponse.statusCode}:`);
    lines.push('        return;');
  } else if (op.successResponse.isList) {
    lines.push(`      case ${op.successResponse.statusCode}:`);
    lines.push(`        return deserialize(body) as ${responseTypeName(op, ir)};`);
  } else if (op.successResponse.isUnwrap && op.successResponse.dataRef) {
    lines.push(`      case ${op.successResponse.statusCode}:`);
    lines.push(`        return deserialize(body.data) as ${op.successResponse.dataRef};`);
  } else {
    lines.push(`      case ${op.successResponse.statusCode}:`);
    lines.push(`        return deserialize(body) as ${responseTypeName(op, ir)};`);
  }

  if (op.hasOAuthError) {
    lines.push('      case 401:');
    lines.push(
      `        throw new OAuthError(${preloadBody ? 'body.error' : '((await response.json()) as any).error'});`,
    );
  }

  const hasApiError = op.hasApiError || ir.models.some((m) => m.name === 'ApiError');
  lines.push('      default:');
  if (hasApiError) {
    lines.push(
      `        throw new ApiError(${preloadBody ? 'body.errors' : '((await response.json()) as any).errors'});`,
    );
  } else {
    lines.push(
      `        throw new Error(\`HTTP \${response.status}${preloadBody ? ': ${JSON.stringify(body)}' : ''}\`);`,
    );
  }
  lines.push('    }');
}

function collectRecordKeys(ir: IR): Set<string> {
  const keys = new Set<string>();
  for (const m of ir.models) {
    for (const f of m.fields) {
      if (f.type.kind === 'record') {
        keys.add(f.name);
        keys.add(snakeToCamel(f.name));
      }
    }
  }
  return keys;
}

function generateUtils(ir: IR): string {
  const recordKeys = collectRecordKeys(ir);
  const lines: string[] = [
    'function snakeToCamel(str: string): string {',
    '  const camel = str.replace(/[-_]([a-zA-Z])/g, (_, c) => c.toUpperCase());',
    '  return camel.charAt(0).toLowerCase() + camel.slice(1);',
    '}',
    '',
    'function camelToSnake(str: string): string {',
    '  return str',
    '    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")',
    '    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")',
    '    .toLowerCase();',
    '}',
    '',
  ];
  const hasRecords = recordKeys.size > 0;
  if (hasRecords) {
    const keyList = [...recordKeys].map((k) => JSON.stringify(k)).join(', ');
    lines.push(`const RECORD_KEYS = new Set([${keyList}]);`);
    lines.push('');
    lines.push('function deserializeRecord(obj: unknown): unknown {');
    lines.push('  if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {');
    lines.push('    return Object.fromEntries(');
    lines.push('      Object.entries(obj).map(([k, v]) => [k, deserialize(v)]),');
    lines.push('    );');
    lines.push('  }');
    lines.push('  return deserialize(obj);');
    lines.push('}');
    lines.push('');
    lines.push('function serializeRecord(obj: unknown): unknown {');
    lines.push('  if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {');
    lines.push('    return Object.fromEntries(');
    lines.push('      Object.entries(obj)');
    lines.push('        .filter(([, v]) => v !== undefined)');
    lines.push('        .map(([k, v]) => [k, serialize(v)]),');
    lines.push('    );');
    lines.push('  }');
    lines.push('  return serialize(obj);');
    lines.push('}');
    lines.push('');
  }
  const deserializeValue = hasRecords
    ? '([k, v]) => {\n        const ck = snakeToCamel(k);\n        return [ck, RECORD_KEYS.has(ck) ? deserializeRecord(v) : deserialize(v)];\n      }'
    : '([k, v]) => [snakeToCamel(k), deserialize(v)]';
  const serializeValue = hasRecords
    ? '([k, v]) => {\n          return [camelToSnake(k), RECORD_KEYS.has(k) ? serializeRecord(v) : serialize(v)];\n        }'
    : '([k, v]) => [camelToSnake(k), serialize(v)]';
  lines.push(
    'export function deserialize(obj: unknown): unknown {',
    '  if (Array.isArray(obj)) return obj.map(deserialize);',
    '  if (obj !== null && typeof obj === "object") {',
    '    return Object.fromEntries(',
    `      Object.entries(obj).map(${deserializeValue}),`,
    '    );',
    '  }',
    '  return obj;',
    '}',
    '',
    'export function serialize(obj: unknown): unknown {',
    '  if (Array.isArray(obj)) return obj.map(serialize);',
    '  if (obj !== null && typeof obj === "object") {',
    '    return Object.fromEntries(',
    '      Object.entries(obj)',
    '        .filter(([, v]) => v !== undefined)',
    `        .map(${serializeValue}),`,
    '    );',
    '  }',
    '  return obj;',
    '}',
  );
  return [...lines,
    '',
    'const MAX_RETRIES = 3;',
    '',
    'export async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {',
    '  for (let attempt = 0; ; attempt++) {',
    '    const response = await fetch(input, init);',
    '    if (response.status === 429 && attempt < MAX_RETRIES) {',
    '      const retryAfter = response.headers.get("retry-after");',
    '      const delay = retryAfter ? Number(retryAfter) * 1000 : 1000 * Math.pow(2, attempt);',
    '      await new Promise((r) => setTimeout(r, delay));',
    '      continue;',
    '    }',
    '    return response;',
    '  }',
    '}',
    '',
  ].join('\n');
}

export class TypeScriptGenerator implements LanguageGenerator {
  readonly dirName = 'ts';

  generate(ir: IR): GeneratedFile[] {
    const files: GeneratedFile[] = [];
    files.push({ path: 'types.ts', content: generateTypes(ir) });
    const client = generateClient(ir);
    files.push({ path: 'client.ts', content: client.content });
    if (client.needsUtils) files.push({ path: 'utils.ts', content: generateUtils(ir) });
    return files;
  }
}
