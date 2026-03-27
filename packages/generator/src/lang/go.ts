import {
  shouldUnwrapBody,
  type IR,
  type IREnum,
  type IRField,
  type IRFieldType,
  type IRModel,
  type IROperation,
  type IRService,
  type IRUnion,
  type IRResponseType,
} from '../ir.js';
import { buildModelIndex, collectTypeRefs, type GeneratedFile, type GenerateOptions, type LanguageGenerator } from './types.js';
import { snakeToCamel, snakeToPascal, tagToServiceName, serviceToImplName, serviceToStubName } from '../naming.js';

function upperFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function goExportName(raw: string): string {
  const normalized = raw.replace(/[-:]/g, '_');
  const pascal = snakeToPascal(normalized);
  return pascal
    .replace(/Id(?=[A-Z]|s(?=[A-Z]|$)|$)/g, 'ID')
    .replace(/Ids(?=[A-Z]|$)/g, 'IDs')
    .replace(/Url(?=[A-Z]|s(?=[A-Z]|$)|$)/g, 'URL')
    .replace(/Acl(?=[A-Z]|s(?=[A-Z]|$)|$)/g, 'ACL')
    .replace(/Amz(?=[A-Z]|s(?=[A-Z]|$)|$)/g, 'AMZ')
    .replace(/Oauth/g, 'OAuth');
}

function goMethodName(op: IROperation): string {
  return upperFirst(op.methodName);
}

function goServiceField(tag: string): string {
  const words = tag.trim().split(/\s+/).map((w) => upperFirst(w.toLowerCase()));
  return words.join('');
}

function isOptionalField(field: IRField): boolean {
  return !field.required || field.nullable;
}

function goAligned(rows: string[][]): string[] {
  if (rows.length === 0) return [];
  const cols = Math.max(...rows.map((r) => r.length));
  const widths: number[] = [];
  for (let i = 0; i < cols - 1; i++) {
    widths[i] = Math.max(...rows.map((r) => (r[i] ?? '').length));
  }
  return rows.map((row) => {
    const parts = row.map((p, i) => (i < row.length - 1 ? p.padEnd(widths[i]) : p));
    return '\t' + parts.join(' ');
  });
}

function goPrimitive(
  ft: IRFieldType,
  opts: { forParam: boolean; forModelField: boolean; nullable: boolean },
): string {
  if (ft.primitive === 'integer') return ft.format === 'int64' ? 'int64' : 'int32';
  if (ft.primitive === 'number') return 'float64';
  if (ft.primitive === 'boolean') return 'bool';
  if (ft.primitive === 'any') return 'any';
  if (ft.primitive === 'string') {
    if (opts.forParam && ft.format === 'date-time') return 'time.Time';
    if (opts.forModelField && !opts.nullable && ft.format === 'date-time') {
      return 'time.Time';
    }
    return 'string';
  }
  return 'string';
}

function goType(
  ft: IRFieldType,
  opts: { forParam?: boolean; forModelField?: boolean; nullable?: boolean } = {},
): string {
  switch (ft.kind) {
    case 'primitive':
      return goPrimitive(ft, {
        forParam: !!opts.forParam,
        forModelField: !!opts.forModelField,
        nullable: !!opts.nullable,
      });
    case 'enum':
    case 'model':
    case 'union':
      return ft.ref ?? 'any';
    case 'array':
      return `[]${goType(ft.items!, opts)}`;
    case 'record':
      return `map[string]${goType(ft.valueType!, opts)}`;
    case 'literal':
      return 'string';
    case 'binary':
      return 'io.Reader';
  }
}

function goJsonTag(field: IRField): string {
  const omit = !field.nullable && isOptionalField(field);
  return omit ? `${field.name},omitempty` : field.name;
}

function goFieldInfo(field: IRField, modelName: string): { name: string; typeName: string; tag: string; comment: string } {
  const name = modelName === 'OAuthError' && field.name === 'error'
    ? 'Err'
    : goExportName(field.name);
  const base = goType(field.type, {
    forModelField: true,
    nullable: field.nullable,
  });
  const pointer =
    (field.type.kind === 'primitive' || field.type.kind === 'model' || field.type.kind === 'enum' || field.type.kind === 'union') &&
    isOptionalField(field);
  const typeName = pointer ? `*${base}` : base;
  const tag = `\`json:"${goJsonTag(field)}"\``;
  const comment = field.type.kind === 'literal' && field.type.literalValue
    ? ` // always "${field.type.literalValue}"`
    : '';
  return { name, typeName, tag, comment };
}

function emitEnum(lines: string[], e: IREnum): void {
  lines.push(`type ${e.name} string`);
  lines.push('');
  lines.push('const (');
  const rows = e.members.map((m) => {
    const cname = `${e.name}${goExportName(m.value)}`;
    const suffix = m.description ? ` // ${m.description}` : '';
    return [cname, e.name, '=', `${JSON.stringify(m.value)}${suffix}`];
  });
  for (const line of goAligned(rows)) lines.push(line);
  lines.push(')');
}

function emitModel(lines: string[], m: IRModel, allModels: IRModel[]): void {
  lines.push(`type ${m.name} struct {`);
  if (m.fields.length === 0) {
    lines.push('}');
    return;
  }
  const sorted = [...m.fields].sort((a, b) => {
    const ao = isOptionalField(a);
    const bo = isOptionalField(b);
    if (ao !== bo) return ao ? 1 : -1;
    return 0;
  });
  const infos = sorted.map((f) => goFieldInfo(f, m.name));
  const rows = infos.map((fi) => [fi.name, fi.typeName, `${fi.tag}${fi.comment}`]);
  for (const line of goAligned(rows)) lines.push(line);
  lines.push('}');

  if (m.name === 'ApiError') {
    // Find the items model for the errors array to determine which field to use
    const errorsField = m.fields.find((f) => f.name === 'errors');
    const itemsRef = errorsField?.type.kind === 'array' && errorsField.type.items?.kind === 'model'
      ? errorsField.type.items.ref
      : undefined;
    const itemsModel = itemsRef ? allModels.find((am) => am.name === itemsRef) : undefined;
    const hasMessage = itemsModel?.fields.some((f) => f.name === 'message');

    lines.push('');
    lines.push('func (e *ApiError) Error() string {');
    lines.push('\tif len(e.Errors) == 0 {');
    lines.push('\t\treturn "api error"');
    lines.push('\t}');
    lines.push('\tparts := make([]string, 0, len(e.Errors))');
    lines.push('\tfor _, item := range e.Errors {');
    if (hasMessage) {
      lines.push('\t\tparts = append(parts, item.Message)');
    } else {
      lines.push('\t\tparts = append(parts, fmt.Sprintf("%+v", item))');
    }
    lines.push('\t}');
    lines.push('\tif len(parts) == 0 {');
    lines.push('\t\treturn "api error"');
    lines.push('\t}');
    lines.push('\treturn strings.Join(parts, ", ")');
    lines.push('}');
  }
  if (m.name === 'OAuthError') {
    // Check if Err field is optional (pointer type)
    const errField = m.fields.find((f) => f.name === 'error');
    const isPointer = errField && isOptionalField(errField);

    lines.push('');
    lines.push('func (e *OAuthError) Error() string {');
    if (isPointer) {
      lines.push('\tif e.Err != nil {');
      lines.push('\t\treturn *e.Err');
    } else {
      lines.push('\tif e.Err != "" {');
      lines.push('\t\treturn e.Err');
    }
    lines.push('\t}');
    lines.push('\treturn "oauth error"');
    lines.push('}');
  }
}

function emitUnion(lines: string[], u: IRUnion, models: IRModel[]): void {
  const discField = u.discriminatorField;
  const discGoName = goExportName(discField);
  lines.push(`type ${u.name} struct {`);
  const fieldRows = u.memberRefs.map((ref) => [ref, `*${ref}`]);
  for (const line of goAligned(fieldRows)) lines.push(line);
  lines.push('}');
  lines.push('');
  lines.push(`func (u *${u.name}) UnmarshalJSON(data []byte) error {`);
  lines.push('\tvar disc struct {');
  lines.push(`\t\t${discGoName} string \`json:"${discField}"\``);
  lines.push('\t}');
  lines.push('\tif err := json.Unmarshal(data, &disc); err != nil {');
  lines.push('\t\treturn err');
  lines.push('\t}');
  lines.push(`\tswitch disc.${discGoName} {`);
  const seenDiscs = new Set<string>();
  for (const ref of u.memberRefs) {
    const model = models.find((m) => m.name === ref);
    const typeField = model?.fields.find((f) => f.type.kind === 'literal');
    const disc = typeField?.type.literalValue ?? ref;
    if (seenDiscs.has(String(disc))) continue;
    seenDiscs.add(String(disc));
    lines.push(`\tcase ${JSON.stringify(disc)}:`);
    lines.push(`\t\tu.${ref} = &${ref}{}`);
    lines.push(`\t\treturn json.Unmarshal(data, u.${ref})`);
  }
  lines.push('\tdefault:');
  lines.push(`\t\treturn fmt.Errorf("unknown ${u.name} ${discField}: %s", disc.${discGoName})`);
  lines.push('\t}');
  lines.push('}');
  lines.push('');
  lines.push(`func (u ${u.name}) MarshalJSON() ([]byte, error) {`);
  for (const ref of u.memberRefs) {
    lines.push(`\tif u.${ref} != nil {`);
    lines.push(`\t\treturn json.Marshal(u.${ref})`);
    lines.push('\t}');
  }
  lines.push(`\treturn nil, fmt.Errorf("empty ${u.name}")`);
  lines.push('}');
}

function emitParamsType(lines: string[], name: string, params: IROperation['queryParams']): void {
  lines.push(`type ${name} struct {`);
  const sorted = [...params].sort((a, b) => {
    if (a.required !== b.required) return a.required ? -1 : 1;
    return 0;
  });
  const rows = sorted.map((p) => {
    const field = goExportName(p.sdkName);
    const t = goType(p.type, { forParam: true });
    const pointer = !p.required && (p.type.kind !== 'array' && p.type.kind !== 'record');
    return [field, pointer ? `*${t}` : t];
  });
  for (const line of goAligned(rows)) lines.push(line);
  lines.push('}');
}

function emitResponseType(lines: string[], rt: IRResponseType): void {
  lines.push(`type ${rt.name} struct {`);
  const rows: string[][] = [];
  rows.push(['Data', `[]${rt.dataRef}`, '`json:"data"`']);
  if (rt.metaRef) {
    const opt = rt.metaIsRequired ? '' : '*';
    const tag = rt.metaIsRequired ? 'meta' : 'meta,omitempty';
    rows.push(['Meta', `${opt}${rt.metaRef}`, `\`json:"${tag}"\``]);
  }
  for (const line of goAligned(rows)) lines.push(line);
  lines.push('}');
}

function generateTypes(ir: IR): string {
  const lines: string[] = [];
  lines.push('package pachca');
  lines.push('');

  const needTime = [
    ...ir.models.flatMap((m) => m.fields),
    ...ir.params.flatMap((p) => p.params),
  ].some((f) => f.type.kind === 'primitive' && f.type.primitive === 'string' && f.type.format === 'date-time');
  const needFmtStrings = ir.models.some((m) => m.name === 'ApiError');
  const needIO = ir.models.some((m) => m.fields.some((f) => f.type.kind === 'binary'));
  const hasUnions = ir.unions.length > 0;

  const imports: string[] = [];
  if (hasUnions) imports.push('"encoding/json"');
  if (needFmtStrings || hasUnions) imports.push('"fmt"');
  if (needIO) imports.push('"io"');
  if (needFmtStrings) imports.push('"strings"');
  if (needTime) imports.push('"time"');
  imports.sort();

  if (imports.length > 0) {
    lines.push('import (');
    for (const i of imports) lines.push(`\t${i}`);
    lines.push(')');
    lines.push('');
  }

  for (const e of ir.enums) {
    emitEnum(lines, e);
    lines.push('');
  }

  // Collect all models (including inlines) for cross-referencing in error helpers
  const allModels = ir.models.flatMap((m) => [...m.inlineObjects, m]);

  for (const m of ir.models) {
    for (const inl of m.inlineObjects) {
      emitModel(lines, inl, allModels);
      lines.push('');
    }
    emitModel(lines, m, allModels);
    lines.push('');
  }

  for (const u of ir.unions) {
    emitUnion(lines, u, ir.models);
    lines.push('');
  }

  for (const p of ir.params) {
    emitParamsType(lines, p.name, p.params);
    lines.push('');
  }

  for (const r of ir.responses) {
    emitResponseType(lines, r);
    lines.push('');
  }

  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  lines.push('');
  return lines.join('\n');
}

function goReturn(op: IROperation, ir: IR): string {
  if (op.successResponse.isRedirect) return '(string, error)';
  if (!op.successResponse.hasBody) return 'error';
  if (op.successResponse.isList) {
    const rt = ir.responses.find((r) => r.name === op.successResponse.responseRef);
    return `(*${rt?.name ?? 'any'}, error)`;
  }
  return `(*${op.successResponse.dataRef ?? 'any'}, error)`;
}

function goPathFormat(path: string, op: IROperation): { fmt: string; args: string[] } {
  let fmtPath = path;
  const args: string[] = [];
  for (const p of op.pathParams) {
    const varName = snakeToCamel(p.sdkName);
    fmtPath = fmtPath.replace(`{${p.name}}`, '%v');
    args.push(varName);
  }
  return { fmt: fmtPath, args };
}

function emitOp(lines: string[], op: IROperation, ir: IR): void {
  const retErr = (): string => {
    if (op.successResponse.isRedirect) return 'return "", err';
    if (!op.successResponse.hasBody) return 'return err';
    return 'return nil, err';
  };
  const retOAuth = (): string => {
    if (op.successResponse.isRedirect) return 'return "", &e';
    if (!op.successResponse.hasBody) return 'return &e';
    return 'return nil, &e';
  };
  const retApi = (): string => {
    if (op.successResponse.isRedirect) return 'return "", &e';
    if (!op.successResponse.hasBody) return 'return &e';
    return 'return nil, &e';
  };
  const retUnexpected = (): string => {
    if (op.successResponse.isRedirect) return 'return "", fmt.Errorf("unexpected status code: %d", resp.StatusCode)';
    if (op.successResponse.hasBody) return 'return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)';
    return 'return fmt.Errorf("unexpected status code: %d", resp.StatusCode)';
  };

  const args: string[] = ['ctx context.Context'];
  if (op.externalUrl) {
    args.push(`${op.externalUrl} string`);
  }
  for (const p of op.pathParams) args.push(`${snakeToCamel(p.sdkName)} ${goType(p.type)}`);

  if (op.requestBody) {
    const rb = op.requestBody;
    if (shouldUnwrapBody(rb)) {
      const f = rb.unwrapField!;
      args.push(`${snakeToCamel(f.name)} ${goType(f.type)}`);
    } else if (rb.schemaRef) {
      args.push(`request ${rb.schemaRef}`);
    }
  }
  if (op.queryParams.length > 0) {
    const pName = `${upperFirst(op.methodName)}Params`;
    const hasReq = op.queryParams.some((p) => p.required);
    args.push(`${snakeToCamel('params')} ${hasReq ? pName : `*${pName}`}`);
  }

  if (op.deprecated) lines.push(`// Deprecated: ${goMethodName(op)} is deprecated.`);
  lines.push(`func (s *${serviceToImplName(tagToServiceName(op.tag))}) ${goMethodName(op)}(${args.join(', ')}) ${goReturn(op, ir)} {`);

  const { fmt: fmtPath, args: pathArgs } = goPathFormat(op.path, op);
  const urlExpr = op.externalUrl
    ? op.externalUrl
    : pathArgs.length > 0
      ? `fmt.Sprintf("%s${fmtPath}", s.baseURL, ${pathArgs.join(', ')})`
      : `fmt.Sprintf("%s${fmtPath}", s.baseURL)`;

  const isMultipart = op.requestBody?.contentType === 'multipart';
  if (isMultipart) {
    const req = ir.models.find((m) => m.name === op.requestBody!.schemaRef);
    lines.push('\tpr, pw := io.Pipe()');
    lines.push('\twriter := multipart.NewWriter(pw)');
    lines.push('\tgo func() {');
    lines.push('\t\tdefer pw.Close()');
    lines.push('\t\tdefer writer.Close()');
    const isUnwrapped = shouldUnwrapBody(op.requestBody!);
    if (req) {
      const bin = req.fields.find((f) => f.type.kind === 'binary');
      const non = req.fields.filter((f) => f.type.kind !== 'binary');
      for (const f of non.filter((x) => isOptionalField(x))) {
        const ref = isUnwrapped ? snakeToCamel(f.name) : `request.${goExportName(f.name)}`;
        const deref = isUnwrapped ? snakeToCamel(f.name) : `*request.${goExportName(f.name)}`;
        lines.push(`\t\tif ${ref} != nil {`);
        lines.push(`\t\t\twriter.WriteField(${JSON.stringify(f.name)}, fmt.Sprintf("%v", ${deref}))`);
        lines.push('\t\t}');
      }
      for (const f of non.filter((x) => !isOptionalField(x))) {
        const ref = isUnwrapped ? snakeToCamel(f.name) : `request.${goExportName(f.name)}`;
        lines.push(`\t\twriter.WriteField(${JSON.stringify(f.name)}, fmt.Sprintf("%v", ${ref}))`);
      }
      if (bin) {
        const binRef = isUnwrapped ? snakeToCamel(bin.name) : `request.${goExportName(bin.name)}`;
        lines.push(`\t\tpart, err := writer.CreateFormFile(${JSON.stringify(bin.name)}, "upload")`);
        lines.push('\t\tif err != nil {');
        lines.push('\t\t\tpw.CloseWithError(err)');
        lines.push('\t\t\treturn');
        lines.push('\t\t}');
        lines.push(`\t\tif _, err := io.Copy(part, ${binRef}); err != nil {`);
        lines.push('\t\t\tpw.CloseWithError(err)');
        lines.push('\t\t\treturn');
        lines.push('\t\t}');
      }
    }
    lines.push('\t}()');
    lines.push(`\treq, err := http.NewRequestWithContext(ctx, "${op.method}", ${urlExpr}, pr)`);
    lines.push('\tif err != nil {');
    lines.push(`\t\t${retErr()}`);
    lines.push('\t}');
    lines.push('\treq.Header.Set("Content-Type", writer.FormDataContentType())');
  } else {
    const hasJSON = op.requestBody?.contentType === 'json';
    if (hasJSON) {
      const rb = op.requestBody!;
      if (shouldUnwrapBody(rb)) {
        const f = rb.unwrapField!;
        lines.push(`\tbody, err := json.Marshal(map[string]any{${JSON.stringify(f.name)}: ${snakeToCamel(f.name)}})`);
      } else {
        lines.push('\tbody, err := json.Marshal(request)');
      }
      lines.push('\tif err != nil {');
      lines.push(`\t\t${retErr()}`);
      lines.push('\t}');
    }

    if (op.queryParams.length > 0) {
      lines.push(`\tu, err := url.Parse(${urlExpr})`);
      lines.push('\tif err != nil {');
      lines.push(`\t\t${retErr()}`);
      lines.push('\t}');
      lines.push('\tq := u.Query()');
      const hasReqParams = op.queryParams.some((q) => q.required);
      for (const p of op.queryParams) {
        const pn = goExportName(p.sdkName);
        const isTime = p.type.kind === 'primitive' && p.type.primitive === 'string' && p.type.format === 'date-time';
        if (p.isArray) {
          const indent = hasReqParams ? '\t' : '\t\t';
          if (!hasReqParams) lines.push(`\tif params != nil {`);
          lines.push(`${indent}for _, v := range params.${pn} {`);
          lines.push(`${indent}\tq.Add(${JSON.stringify(p.name)}, fmt.Sprintf("%v", v))`);
          lines.push(`${indent}}`);
          if (!hasReqParams) lines.push('\t}');
        } else if (p.required) {
          let conv: string;
          if (isTime) conv = `params.${pn}.Format(time.RFC3339)`;
          else if (p.type.kind === 'enum') conv = `string(params.${pn})`;
          else conv = `fmt.Sprintf("%v", params.${pn})`;
          lines.push(`\tq.Set(${JSON.stringify(p.name)}, ${conv})`);
        } else {
          const guard = hasReqParams ? '' : 'params != nil && ';
          const isSlice = p.type.kind === 'array' || p.type.kind === 'record';
          lines.push(`\tif ${guard}params.${pn} != nil {`);
          let conv: string;
          if (isTime) conv = `params.${pn}.Format(time.RFC3339)`;
          else if (p.type.kind === 'enum') conv = `string(${isSlice ? '' : '*'}params.${pn})`;
          else conv = `fmt.Sprintf("%v", ${isSlice ? '' : '*'}params.${pn})`;
          lines.push(`\t\tq.Set(${JSON.stringify(p.name)}, ${conv})`);
          lines.push('\t}');
        }
      }
      lines.push('\tu.RawQuery = q.Encode()');
      lines.push(
        `\treq, err := http.NewRequestWithContext(ctx, "${op.method}", u.String(), ${
          hasJSON ? 'bytes.NewReader(body)' : 'nil'
        })`,
      );
    } else {
      lines.push(
        `\treq, err := http.NewRequestWithContext(ctx, "${op.method}", ${urlExpr}, ${
          hasJSON ? 'bytes.NewReader(body)' : 'nil'
        })`,
      );
    }
    lines.push('\tif err != nil {');
    lines.push(`\t\t${retErr()}`);
    lines.push('\t}');
    if (hasJSON) lines.push('\treq.Header.Set("Content-Type", "application/json")');
  }

  const goClient = op.noAuth ? 'http.DefaultClient' : 's.client';
  lines.push(`\tresp, err := doWithRetry(${goClient}, req)`);
  lines.push('\tif err != nil {');
  lines.push(`\t\t${retErr()}`);
  lines.push('\t}');
  lines.push('\tdefer resp.Body.Close()');
  lines.push('\tswitch resp.StatusCode {');

  if (op.successResponse.isRedirect) {
    lines.push('\tcase http.StatusFound:');
    lines.push('\t\tlocation := resp.Header.Get("Location")');
    lines.push('\t\tif location == "" {');
    lines.push('\t\t\treturn "", errors.New("missing Location header in redirect response")');
    lines.push('\t\t}');
    lines.push('\t\treturn location, nil');
  } else if (!op.successResponse.hasBody) {
    lines.push(`\tcase ${op.successResponse.statusCode === 201 ? 'http.StatusCreated' : 'http.StatusNoContent'}:`);
    lines.push('\t\treturn nil');
  } else if (op.successResponse.isList) {
    const rt = ir.responses.find((r) => r.name === op.successResponse.responseRef);
    lines.push(`\tcase ${op.successResponse.statusCode === 201 ? 'http.StatusCreated' : 'http.StatusOK'}:`);
    lines.push(`\t\tvar result ${rt?.name ?? 'any'}`);
    lines.push('\t\tif err := json.NewDecoder(resp.Body).Decode(&result); err != nil {');
    lines.push('\t\t\treturn nil, err');
    lines.push('\t\t}');
    lines.push('\t\treturn &result, nil');
  } else if (op.successResponse.isUnwrap && op.successResponse.dataRef) {
    lines.push(`\tcase ${op.successResponse.statusCode === 201 ? 'http.StatusCreated' : 'http.StatusOK'}:`);
    lines.push('\t\tvar result struct {');
    lines.push(`\t\t\tData ${op.successResponse.dataRef} \`json:"data"\``);
    lines.push('\t\t}');
    lines.push('\t\tif err := json.NewDecoder(resp.Body).Decode(&result); err != nil {');
    lines.push('\t\t\treturn nil, err');
    lines.push('\t\t}');
    lines.push('\t\treturn &result.Data, nil');
  } else {
    lines.push(`\tcase ${op.successResponse.statusCode === 201 ? 'http.StatusCreated' : 'http.StatusOK'}:`);
    lines.push(`\t\tvar result ${op.successResponse.dataRef ?? 'any'}`);
    lines.push('\t\tif err := json.NewDecoder(resp.Body).Decode(&result); err != nil {');
    lines.push('\t\t\treturn nil, err');
    lines.push('\t\t}');
    lines.push('\t\treturn &result, nil');
  }

  if (op.hasOAuthError) {
    lines.push('\tcase http.StatusUnauthorized:');
    lines.push('\t\tvar e OAuthError');
    lines.push('\t\tif err := json.NewDecoder(resp.Body).Decode(&e); err != nil {');
    lines.push('\t\t\te.Err = fmt.Sprintf("HTTP 401: %v", err)');
    lines.push('\t\t}');
    lines.push(`\t\t${retOAuth()}`);
  }

  if (op.hasApiError || ir.models.some((m) => m.name === 'ApiError')) {
    lines.push('\tdefault:');
    lines.push('\t\tvar e ApiError');
    lines.push('\t\tif err := json.NewDecoder(resp.Body).Decode(&e); err != nil {');
    const retFmt = op.successResponse.isRedirect
      ? 'return "", fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)'
      : !op.successResponse.hasBody
        ? 'return fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)'
        : 'return nil, fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)';
    lines.push(`\t\t\t${retFmt}`);
    lines.push('\t\t}');
    lines.push(`\t\t${retApi()}`);
  } else {
    lines.push('\tdefault:');
    lines.push(`\t\t${retUnexpected()}`);
  }

  lines.push('\t}');
  lines.push('}');
}

function emitPaginationMethod(lines: string[], op: IROperation, ir: IR): void {
  const itemType = op.successResponse.dataRef ?? 'any';
  const paramsName = `${upperFirst(op.methodName)}Params`;
  const svcName = serviceToImplName(tagToServiceName(op.tag));

  const args: string[] = ['ctx context.Context'];
  if (op.externalUrl) args.push(`${op.externalUrl} string`);
  for (const p of op.pathParams) args.push(`${snakeToCamel(p.sdkName)} ${goType(p.type)}`);
  if (op.queryParams.length > 0) {
    args.push(`params *${paramsName}`);
  }

  lines.push(`func (s *${svcName}) ${goMethodName(op)}All(${args.join(', ')}) ([]${itemType}, error) {`);
  if (op.queryParams.length > 0) {
    lines.push('\tif params == nil {');
    lines.push(`\t\tparams = &${paramsName}{}`);
    lines.push('\t}');
  }
  lines.push(`\tvar items []${itemType}`);
  lines.push('\tvar cursor *string');
  lines.push('\tfor {');
  if (op.queryParams.length > 0) {
    lines.push('\t\tparams.Cursor = cursor');
  }

  // Build call args
  const callArgs: string[] = ['ctx'];
  if (op.externalUrl) callArgs.push(op.externalUrl);
  for (const p of op.pathParams) callArgs.push(snakeToCamel(p.sdkName));
  if (op.queryParams.length > 0) {
    const hasReq = op.queryParams.some((p) => p.required);
    callArgs.push(hasReq ? '*params' : 'params');
  }

  const rt = ir.responses.find((r) => r.name === op.successResponse.responseRef);
  const metaNilCheck = rt?.metaIsRequired ? '' : ' || result.Meta == nil';
  const metaAccess = rt?.metaIsRequired ? 'result.Meta.Paginate.NextPage' : 'result.Meta.Paginate.NextPage';
  lines.push(`\t\tresult, err := s.${goMethodName(op)}(${callArgs.join(', ')})`);
  lines.push('\t\tif err != nil {');
  lines.push('\t\t\treturn nil, err');
  lines.push('\t\t}');
  lines.push('\t\titems = append(items, result.Data...)');
  lines.push(`\t\tif len(result.Data) == 0${metaNilCheck} {`);
  lines.push('\t\t\treturn items, nil');
  lines.push('\t\t}');
  lines.push(`\t\tnextPage := ${metaAccess}`);
  lines.push('\t\tcursor = &nextPage');
  lines.push('\t}');
  lines.push('}');
}

function emitServiceContract(lines: string[], svc: IRService, ir: IR): void {
  const serviceName = tagToServiceName(svc.tag);
  const stubName = serviceToStubName(serviceName);
  lines.push(`type ${serviceName} interface {`);
  for (const op of svc.operations) {
    const args: string[] = ['ctx context.Context'];
    if (op.externalUrl) args.push(`${op.externalUrl} string`);
    for (const p of op.pathParams) args.push(`${snakeToCamel(p.sdkName)} ${goType(p.type)}`);
    if (op.requestBody) {
      const rb = op.requestBody;
      if (shouldUnwrapBody(rb)) args.push(`${snakeToCamel(rb.unwrapField!.name)} ${goType(rb.unwrapField!.type)}`);
      else if (rb.schemaRef) args.push(`request ${rb.schemaRef}`);
    }
    if (op.queryParams.length > 0) {
      const pName = `${upperFirst(op.methodName)}Params`;
      const hasReq = op.queryParams.some((p) => p.required);
      args.push(`${snakeToCamel('params')} ${hasReq ? pName : `*${pName}`}`);
    }
    lines.push(`\t${goMethodName(op)}(${args.join(', ')}) ${goReturn(op, ir)}`);
    if (op.isPaginated && op.successResponse.dataRef) {
      const itemType = op.successResponse.dataRef ?? 'any';
      const pageArgs: string[] = ['ctx context.Context'];
      if (op.externalUrl) pageArgs.push(`${op.externalUrl} string`);
      for (const p of op.pathParams) pageArgs.push(`${snakeToCamel(p.sdkName)} ${goType(p.type)}`);
      if (op.queryParams.length > 0) pageArgs.push(`params *${upperFirst(op.methodName)}Params`);
      lines.push(`\t${goMethodName(op)}All(${pageArgs.join(', ')}) ([]${itemType}, error)`);
    }
  }
  lines.push('}');
  lines.push('');
  lines.push(`type ${stubName} struct{}`);
  lines.push('');
  for (const op of svc.operations) {
    emitStubMethod(lines, op, ir);
    lines.push('');
    if (op.isPaginated && op.successResponse.dataRef) {
      emitStubPaginationMethod(lines, op);
      lines.push('');
    }
  }
}

function emitStubMethod(lines: string[], op: IROperation, ir: IR): void {
  const stubName = serviceToStubName(tagToServiceName(op.tag));
  const args: string[] = ['ctx context.Context'];
  if (op.externalUrl) args.push(`${op.externalUrl} string`);
  for (const p of op.pathParams) args.push(`${snakeToCamel(p.sdkName)} ${goType(p.type)}`);
  if (op.requestBody) {
    const rb = op.requestBody;
    if (shouldUnwrapBody(rb)) args.push(`${snakeToCamel(rb.unwrapField!.name)} ${goType(rb.unwrapField!.type)}`);
    else if (rb.schemaRef) args.push(`request ${rb.schemaRef}`);
  }
  if (op.queryParams.length > 0) {
    const pName = `${upperFirst(op.methodName)}Params`;
    const hasReq = op.queryParams.some((p) => p.required);
    args.push(`${snakeToCamel('params')} ${hasReq ? pName : `*${pName}`}`);
  }
  lines.push(`func (s *${stubName}) ${goMethodName(op)}(${args.join(', ')}) ${goReturn(op, ir)} {`);
  if (op.successResponse.isRedirect) lines.push(`\treturn "", fmt.Errorf(${JSON.stringify(`${op.tag}.${op.methodName} is not implemented`)})`);
  else if (!op.successResponse.hasBody) lines.push(`\treturn fmt.Errorf(${JSON.stringify(`${op.tag}.${op.methodName} is not implemented`)})`);
  else lines.push(`\treturn nil, fmt.Errorf(${JSON.stringify(`${op.tag}.${op.methodName} is not implemented`)})`);
  lines.push('}');
}

function emitStubPaginationMethod(lines: string[], op: IROperation): void {
  const stubName = serviceToStubName(tagToServiceName(op.tag));
  const itemType = op.successResponse.dataRef ?? 'any';
  const args: string[] = ['ctx context.Context'];
  if (op.externalUrl) args.push(`${op.externalUrl} string`);
  for (const p of op.pathParams) args.push(`${snakeToCamel(p.sdkName)} ${goType(p.type)}`);
  if (op.queryParams.length > 0) args.push(`params *${upperFirst(op.methodName)}Params`);
  lines.push(`func (s *${stubName}) ${goMethodName(op)}All(${args.join(', ')}) ([]${itemType}, error) {`);
  lines.push(`\treturn nil, fmt.Errorf(${JSON.stringify(`${op.tag}.${op.methodName}All is not implemented`)})`);
  lines.push('}');
}

function generateClient(ir: IR): string {
  const lines: string[] = [];
  lines.push('package pachca');
  lines.push('');

  if (ir.services.length === 0) {
    return lines.join('\n');
  }

  const needBytes = ir.services.some((s) => s.operations.some((o) => o.requestBody?.contentType === 'json'));
  const needURL = ir.services.some((s) => s.operations.some((o) => o.queryParams.length > 0));
  const needErrors = ir.services.some((s) => s.operations.some((o) => o.successResponse.isRedirect));
  const needMultipart = ir.services.some((s) => s.operations.some((o) => o.requestBody?.contentType === 'multipart'));
  const imports: string[] = ['"context"', '"encoding/json"', '"fmt"', '"math/rand"', '"net/http"', '"strconv"', '"time"'];
  if (needBytes) imports.push('"bytes"');
  if (needURL) imports.push('"net/url"');
  if (needErrors) imports.push('"errors"');
  if (needMultipart) {
    imports.push('"io"');
    imports.push('"mime/multipart"');
  }
  imports.sort();

  lines.push('import (');
  for (const imp of imports) lines.push(`\t${imp}`);
  lines.push(')');
  lines.push('');

  lines.push('type authTransport struct {');
  lines.push('\ttoken string');
  lines.push('\tbase  http.RoundTripper');
  lines.push('}');
  lines.push('');
  lines.push('func (t *authTransport) RoundTrip(req *http.Request) (*http.Response, error) {');
  lines.push('\treq.Header.Set("Authorization", "Bearer "+t.token)');
  lines.push('\treturn t.base.RoundTrip(req)');
  lines.push('}');
  lines.push('');
  lines.push('const maxRetries = 3');
  lines.push('');
  lines.push('var retryable5xx = map[int]bool{500: true, 502: true, 503: true, 504: true}');
  lines.push('');
  lines.push('func jitter(d time.Duration) time.Duration {');
  lines.push('\treturn time.Duration(float64(d) * (0.5 + rand.Float64()*0.5))');
  lines.push('}');
  lines.push('');
  lines.push('func doWithRetry(client *http.Client, req *http.Request) (*http.Response, error) {');
  lines.push('\tfor attempt := 0; ; attempt++ {');
  lines.push('\t\tif attempt > 0 && req.GetBody != nil {');
  lines.push('\t\t\treq.Body, _ = req.GetBody()');
  lines.push('\t\t}');
  lines.push('\t\tresp, err := client.Do(req)');
  lines.push('\t\tif err != nil {');
  lines.push('\t\t\treturn nil, err');
  lines.push('\t\t}');
  lines.push('\t\tif resp.StatusCode == http.StatusTooManyRequests && attempt < maxRetries {');
  lines.push('\t\t\tresp.Body.Close()');
  lines.push('\t\t\tdelay := time.Duration(1<<uint(attempt)) * time.Second');
  lines.push('\t\t\tif ra := resp.Header.Get("Retry-After"); ra != "" {');
  lines.push('\t\t\t\tif secs, err := strconv.Atoi(ra); err == nil {');
  lines.push('\t\t\t\t\tdelay = time.Duration(secs) * time.Second');
  lines.push('\t\t\t\t}');
  lines.push('\t\t\t}');
  lines.push('\t\t\ttime.Sleep(delay)');
  lines.push('\t\t\tcontinue');
  lines.push('\t\t}');
  lines.push('\t\tif retryable5xx[resp.StatusCode] && attempt < maxRetries {');
  lines.push('\t\t\tresp.Body.Close()');
  lines.push('\t\t\tdelay := jitter(10 * time.Duration(1<<uint(attempt)) * time.Second)');
  lines.push('\t\t\ttime.Sleep(delay)');
  lines.push('\t\t\tcontinue');
  lines.push('\t\t}');
  lines.push('\t\treturn resp, nil');
  lines.push('\t}');
  lines.push('}');
  lines.push('');

  for (const s of ir.services) {
    const cls = tagToServiceName(s.tag);
    const implName = serviceToImplName(cls);
    emitServiceContract(lines, s, ir);
    lines.push(`type ${implName} struct {`);
    lines.push('\tbaseURL string');
    lines.push('\tclient  *http.Client');
    lines.push('}');
    lines.push('');
    for (const op of s.operations) {
      emitOp(lines, op, ir);
      lines.push('');
      if (op.isPaginated && op.successResponse.dataRef) {
        emitPaginationMethod(lines, op, ir);
        lines.push('');
      }
    }
  }

  lines.push('type PachcaClient struct {');
  const fields = ir.services
    .map((s) => ({ f: goServiceField(s.tag), cls: tagToServiceName(s.tag) }))
    .sort((a, b) => a.f.localeCompare(b.f));
  const clientRows = fields.map((f) => [f.f, f.cls]);
  for (const line of goAligned(clientRows)) lines.push(line);
  lines.push('}');
  lines.push('');
  lines.push('type clientConfig struct {');
  if (ir.baseUrl) {
    lines.push('\tbaseURL string');
  } else {
    lines.push('\tbaseURL string');
  }
  for (const f of fields) lines.push(`\t${f.f.charAt(0).toLowerCase() + f.f.slice(1)} ${f.cls}`);
  lines.push('}');
  lines.push('');
  lines.push('type ClientOption func(*clientConfig)');
  lines.push('');

  // stubClientConfig struct
  lines.push('type stubClientConfig struct {');
  for (const f of fields) lines.push(`\t${f.f.charAt(0).toLowerCase() + f.f.slice(1)} ${f.cls}`);
  lines.push('}');
  lines.push('');
  lines.push('type StubClientOption func(*stubClientConfig)');
  lines.push('');

  if (ir.baseUrl) {
    lines.push(`const DefaultBaseURL = ${JSON.stringify(ir.baseUrl)}`);
    lines.push('');
  }
  lines.push('func WithBaseURL(baseURL string) ClientOption {');
  lines.push('\treturn func(cfg *clientConfig) { cfg.baseURL = baseURL }');
  lines.push('}');
  lines.push('');
  for (const f of fields) {
    lines.push(`func With${f.f}(service ${f.cls}) ClientOption {`);
    lines.push(`\treturn func(cfg *clientConfig) { cfg.${f.f.charAt(0).toLowerCase() + f.f.slice(1)} = service }`);
    lines.push('}');
    lines.push('');
  }

  // WithStub* option functions
  for (const f of fields) {
    lines.push(`func WithStub${f.f}(service ${f.cls}) StubClientOption {`);
    lines.push(`\treturn func(cfg *stubClientConfig) { cfg.${f.f.charAt(0).toLowerCase() + f.f.slice(1)} = service }`);
    lines.push('}');
    lines.push('');
  }

  lines.push('func NewPachcaClient(token string, opts ...ClientOption) *PachcaClient {');
  if (ir.baseUrl) {
    lines.push(`\tcfg := clientConfig{baseURL: DefaultBaseURL}`);
  } else {
    lines.push('\tcfg := clientConfig{}');
  }
  lines.push('\tfor _, opt := range opts {');
  lines.push('\t\topt(&cfg)');
  lines.push('\t}');
  lines.push('\tclient := &http.Client{');
  lines.push('\t\tTransport: &authTransport{token: token, base: http.DefaultTransport},');
  if (needErrors) {
    lines.push('\t\tCheckRedirect: func(req *http.Request, via []*http.Request) error {');
    lines.push('\t\t\treturn http.ErrUseLastResponse');
    lines.push('\t\t},');
  }
  lines.push('\t}');
  lines.push('\treturn &PachcaClient{');
  const maxField = Math.max(...fields.map((f) => f.f.length));
  for (const f of fields) {
    const cfgField = `cfg.${f.f.charAt(0).toLowerCase() + f.f.slice(1)}`;
    const impl = `&${serviceToImplName(f.cls)}{baseURL: cfg.baseURL, client: client}`;
    lines.push(`\t\t${f.f.padEnd(maxField)}: func() ${f.cls} { if ${cfgField} != nil { return ${cfgField} }; return ${impl} }(),`);
  }
  lines.push('\t}');
  lines.push('}');
  lines.push('');

  // NewStubPachcaClient function
  lines.push('func NewStubPachcaClient(opts ...StubClientOption) *PachcaClient {');
  lines.push('\tcfg := stubClientConfig{}');
  lines.push('\tfor _, opt := range opts {');
  lines.push('\t\topt(&cfg)');
  lines.push('\t}');
  lines.push('\treturn &PachcaClient{');
  for (const f of fields) {
    const cfgField = `cfg.${f.f.charAt(0).toLowerCase() + f.f.slice(1)}`;
    const stub = `&${serviceToStubName(f.cls)}{}`;
    lines.push(`\t\t${f.f.padEnd(maxField)}: func() ${f.cls} { if ${cfgField} != nil { return ${cfgField} }; return ${stub} }(),`);
  }
  lines.push('\t}');
  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

function generateUtils(): string {
  return [
    'package pachca',
    '',
    '// Ptr returns a pointer to the given value.',
    'func Ptr[T any](v T) *T {',
    '\treturn &v',
    '}',
    '',
  ].join('\n');
}

// ── Examples ──────────────────────────────────────────────────────────

function goLiteral(
  ft: IRFieldType,
  ir: IR,
  models: Map<string, IRModel>,
  visited: Set<string> = new Set(),
  indent: number = 0,
): string {
  if (ft.example !== undefined) {
    if (ft.kind === 'primitive') {
      if ((ft.primitive === 'integer' || ft.primitive === 'number') && typeof ft.example === 'number') {
        if (ft.primitive === 'integer') return ft.format === 'int64' ? `int64(${ft.example})` : `int32(${ft.example})`;
        return String(ft.example);
      }
      if (ft.primitive === 'boolean' && typeof ft.example === 'boolean') return String(ft.example);
      if (ft.primitive === 'string' && typeof ft.example === 'string') return JSON.stringify(ft.example);
    }
    if (ft.kind === 'enum' && typeof ft.example === 'string') {
      const e = ir.enums.find((en) => en.name === ft.ref);
      const member = e?.members.find((m) => m.value === ft.example);
      if (e && member) return `${e.name}${goExportName(member.value)}`;
    }
  }
  switch (ft.kind) {
    case 'primitive': {
      if (ft.primitive === 'integer') return ft.format === 'int64' ? 'int64(123)' : 'int32(123)';
      if (ft.primitive === 'number') return '1.5';
      if (ft.primitive === 'boolean') return 'true';
      if (ft.primitive === 'any') return 'map[string]any{}';
      if (ft.primitive === 'string') {
        if (ft.format === 'date-time') return '"2024-01-01T00:00:00Z"';
        if (ft.format === 'date') return '"2024-01-01"';
      }
      return '"example"';
    }
    case 'enum': {
      const e = ir.enums.find((en) => en.name === ft.ref);
      if (e && e.members.length > 0) {
        return `${e.name}${goExportName(e.members[0].value)}`;
      }
      return `${ft.ref ?? 'any'}`;
    }
    case 'model': {
      const u = ir.unions.find((un) => un.name === ft.ref);
      if (u && u.memberRefs.length > 0) {
        return goModelLiteral(u.memberRefs[0], ir, models, visited, indent);
      }
      return goModelLiteral(ft.ref ?? 'any', ir, models, visited, indent);
    }
    case 'array':
      return `[]${goType(ft.items!)}{${goLiteral(ft.items!, ir, models, visited, indent)}}`;
    case 'record':
      return `map[string]${goType(ft.valueType!)}{"key": ${goLiteral(ft.valueType!, ir, models, visited, indent)}}`;
    case 'union': {
      const u = ir.unions.find((un) => un.name === ft.ref);
      if (u && u.memberRefs.length > 0) {
        return goModelLiteral(u.memberRefs[0], ir, models, visited, indent);
      }
      return `${ft.ref ?? 'any'}{}`;
    }
    case 'literal':
      return `"${ft.literalValue}"`;
    case 'binary':
      return 'bytes.NewReader(nil)';
  }
}

function goModelLiteral(
  modelName: string,
  ir: IR,
  models: Map<string, IRModel>,
  visited: Set<string>,
  indent: number = 0,
): string {
  if (visited.has(modelName)) return `${modelName}{}`;
  const model = models.get(modelName);
  if (!model || model.fields.length === 0) return `${modelName}{}`;

  const nextVisited = new Set(visited);
  nextVisited.add(modelName);

  const isCyclic = (f: IRField) =>
    f.type.kind === 'model' && f.type.ref != null && nextVisited.has(f.type.ref);
  const fields = model.fields.filter(
    (f) => (f.type.kind !== 'binary' || f.required) && !(isCyclic(f) && (!f.required || f.nullable)),
  );
  if (fields.length === 0) return `${modelName}{}`;

  const childIndent = indent + 1;
  const pad = '\t'.repeat(childIndent);
  const closePad = '\t'.repeat(indent);

  const entries = fields.map((f) => {
    const name = goExportName(f.name);
    const opt = isOptionalField(f) &&
      (f.type.kind === 'primitive' || f.type.kind === 'model' || f.type.kind === 'enum' || f.type.kind === 'union');
    const value = goLiteral(f.type, ir, models, nextVisited, childIndent);
    if (opt) {
      return `${name}: Ptr(${value})`;
    }
    return `${name}: ${value}`;
  });

  return `${modelName}{\n${entries.map((e) => `${pad}${e},`).join('\n')}\n${closePad}}`;
}

function goFingerprint(
  ft: IRFieldType,
  ir: IR,
  models: Map<string, IRModel>,
  visited: Set<string> = new Set(),
): string {
  switch (ft.kind) {
    case 'primitive':
      return goType(ft);
    case 'enum':
      return ft.ref ?? 'any';
    case 'model': {
      const model = models.get(ft.ref!);
      if (!model || visited.has(ft.ref!)) return ft.ref ?? 'any';
      return goModelFp(model, ir, models, visited);
    }
    case 'array':
      return `[]${goFingerprint(ft.items!, ir, models, visited)}`;
    case 'record':
      return `map[string]${goFingerprint(ft.valueType!, ir, models, visited)}`;
    case 'union':
      return ft.ref ?? 'any';
    case 'literal':
      return 'string';
    case 'binary':
      return 'io.Reader';
  }
}

function goModelFp(
  model: IRModel,
  ir: IR,
  models: Map<string, IRModel>,
  visited: Set<string>,
): string {
  const nextVisited = new Set(visited);
  nextVisited.add(model.name);

  const fields = model.fields.map((f) => {
    const name = goExportName(f.name);
    const type = goFingerprint(f.type, ir, models, nextVisited);
    const opt = isOptionalField(f) ? '*' : '';
    return `${name}: ${opt}${type}`;
  });

  return `${model.name}{${fields.join(', ')}}`;
}

function goBuildOutputFingerprint(
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
      parts.push(`Data: []${rt.dataRef}`);
      if (rt.metaRef) {
        const opt = rt.metaIsRequired ? '' : '*';
        parts.push(`Meta: ${opt}${rt.metaRef}`);
      }
      return `${rt.name}{${parts.join(', ')}}`;
    }
  }

  if (resp.dataRef) {
    const model = models.get(resp.dataRef);
    if (model) return goModelFp(model, ir, models, new Set());
    return resp.dataRef;
  }

  return 'any';
}

function goBuildOperationExample(
  op: IROperation,
  ir: IR,
  models: Map<string, IRModel>,
  serviceField: string,
): { usage: string; output: string | null; imports: string[] } {
  const params: { name: string; value: string; isNamed: boolean }[] = [];
  const imports = new Set<string>();

  // ctx is always first
  params.push({ name: 'ctx', value: 'ctx', isNamed: false });

  if (op.externalUrl) {
    params.push({ name: op.externalUrl, value: '"https://example.com"', isNamed: false });
  }

  for (const p of op.pathParams) {
    params.push({ name: snakeToCamel(p.sdkName), value: goLiteral(p.type, ir, models), isNamed: false });
    for (const r of collectTypeRefs(p.type, ir, models)) imports.add(r);
  }

  if (op.requestBody) {
    const rb = op.requestBody;
    if (shouldUnwrapBody(rb) && rb.unwrapField) {
      const sdkName = snakeToCamel(rb.unwrapField.name);
      params.push({ name: sdkName, value: goLiteral(rb.unwrapField.type, ir, models), isNamed: false });
      for (const r of collectTypeRefs(rb.unwrapField.type, ir, models)) imports.add(r);
    } else if (rb.schemaRef) {
      params.push({ name: 'request', value: goLiteral({ kind: 'model', ref: rb.schemaRef }, ir, models), isNamed: false });
      for (const r of collectTypeRefs({ kind: 'model', ref: rb.schemaRef }, ir, models)) imports.add(r);
    }
  }

  if (op.queryParams.length > 0) {
    const pName = `${upperFirst(op.methodName)}Params`;
    imports.add(pName);
    const hasReq = op.queryParams.some((p) => p.required);

    const qEntries = op.queryParams.map((p) => {
      const name = goExportName(p.sdkName);
      const opt = !p.required && (p.type.kind !== 'array' && p.type.kind !== 'record');
      const value = goLiteral(p.type, ir, models);
      for (const r of collectTypeRefs(p.type, ir, models)) imports.add(r);
      if (opt) {
        return `${name}: Ptr(${value})`;
      }
      return `${name}: ${value}`;
    });

    const paramsLiteral = `${hasReq ? '' : '&'}${pName}{\n${qEntries.map((e) => `\t${e},`).join('\n')}\n}`;
    params.push({ name: 'params', value: paramsLiteral, isNamed: false });
  }

  const declarations: string[] = [];
  const callArgs: string[] = [];

  for (const { name, value } of params) {
    if (name === 'ctx') {
      callArgs.push('ctx');
      continue;
    }
    if (value.includes('{') || value.includes('[')) {
      declarations.push(`${name} := ${value}`);
      callArgs.push(name);
    } else {
      callArgs.push(value);
    }
  }

  const output = goBuildOutputFingerprint(op, ir, models);
  const rawCall = `client.${serviceField}.${goMethodName(op)}(${callArgs.join(', ')})`;
  const call = output ? `response, err := ${rawCall}` : rawCall;
  const usage = declarations.length > 0
    ? [...declarations, call].join('\n')
    : call;

  return { usage, output, imports: [...imports].sort() };
}

function generateExamples(ir: IR): string {
  const models = buildModelIndex(ir);
  const result: Record<string, object> = {};

  result['Client_Init'] = {
    usage: 'client := pachca.NewPachcaClient("YOUR_TOKEN")',
    imports: ['PachcaClient'],
  };

  for (const svc of ir.services) {
    const serviceField = goServiceField(svc.tag);
    for (const op of svc.operations) {
      const ex = goBuildOperationExample(op, ir, models, serviceField);
      const entry: Record<string, unknown> = { usage: ex.usage };
      if (ex.output) entry.output = ex.output;
      if (ex.imports.length > 0) entry.imports = ex.imports;
      result[op.operationId] = entry;
    }
  }

  return JSON.stringify(result, null, 2) + '\n';
}

// ── Main ─────────────────────────────────────────────────────────────

export class GoGenerator implements LanguageGenerator {
  readonly dirName = 'go';

  generate(ir: IR, options?: GenerateOptions): GeneratedFile[] {
    const files: GeneratedFile[] = [
      { path: 'types.go', content: generateTypes(ir) },
      { path: 'client.go', content: generateClient(ir) },
      { path: 'utils.go', content: generateUtils() },
    ];
    if (options?.examples) {
      files.push({ path: 'examples.json', content: generateExamples(ir) });
    }
    return files;
  }
}
