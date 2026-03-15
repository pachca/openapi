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
import { buildModelIndex, type GeneratedFile, type GenerateOptions, type LanguageGenerator } from './types.js';
import { snakeToCamel, snakeToPascal, tagToServiceName } from '../naming.js';

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
    if (opts.forParam && (ft.format === 'date' || ft.format === 'date-time')) return 'time.Time';
    if (opts.forModelField && !opts.nullable && (ft.format === 'date' || ft.format === 'date-time')) {
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
  ].some((f) => f.type.kind === 'primitive' && f.type.primitive === 'string' && (f.type.format === 'date' || f.type.format === 'date-time'));
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
    const rt = ir.responses.find((r) => r.dataRef === op.successResponse.dataRef && r.dataIsArray);
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
  lines.push(`func (s *${tagToServiceName(op.tag)}) ${goMethodName(op)}(${args.join(', ')}) ${goReturn(op, ir)} {`);

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
    if (req) {
      const bin = req.fields.find((f) => f.type.kind === 'binary');
      const non = req.fields.filter((f) => f.type.kind !== 'binary');
      for (const f of non.filter((x) => isOptionalField(x))) {
        lines.push(`\t\tif request.${goExportName(f.name)} != nil {`);
        lines.push(`\t\t\twriter.WriteField(${JSON.stringify(f.name)}, fmt.Sprintf("%v", *request.${goExportName(f.name)}))`);
        lines.push('\t\t}');
      }
      for (const f of non.filter((x) => !isOptionalField(x))) {
        lines.push(`\t\twriter.WriteField(${JSON.stringify(f.name)}, fmt.Sprintf("%v", request.${goExportName(f.name)}))`);
      }
      if (bin) {
        lines.push(`\t\tpart, err := writer.CreateFormFile(${JSON.stringify(bin.name)}, "upload")`);
        lines.push('\t\tif err != nil {');
        lines.push('\t\t\tpw.CloseWithError(err)');
        lines.push('\t\t\treturn');
        lines.push('\t\t}');
        lines.push(`\t\tif _, err := io.Copy(part, request.${goExportName(bin.name)}); err != nil {`);
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
        const isTime = p.type.kind === 'primitive' && p.type.primitive === 'string' && (p.type.format === 'date' || p.type.format === 'date-time');
        if (p.isArray) {
          lines.push(`\tfor _, v := range params.${pn} {`);
          lines.push(`\t\tq.Add(${JSON.stringify(p.name)}, fmt.Sprintf("%v", v))`);
          lines.push('\t}');
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
    const rt = ir.responses.find((r) => r.dataRef === op.successResponse.dataRef && r.dataIsArray);
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
    lines.push('\t\tjson.NewDecoder(resp.Body).Decode(&e)');
    lines.push(`\t\t${retOAuth()}`);
  }

  if (op.hasApiError || ir.models.some((m) => m.name === 'ApiError')) {
    lines.push('\tdefault:');
    lines.push('\t\tvar e ApiError');
    lines.push('\t\tjson.NewDecoder(resp.Body).Decode(&e)');
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
  const svcName = tagToServiceName(op.tag);

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

  lines.push(`\t\tresult, err := s.${goMethodName(op)}(${callArgs.join(', ')})`);
  lines.push('\t\tif err != nil {');
  lines.push('\t\t\treturn nil, err');
  lines.push('\t\t}');
  lines.push('\t\titems = append(items, result.Data...)');
  lines.push('\t\tif result.Meta == nil || result.Meta.Paginate == nil || result.Meta.Paginate.NextPage == nil {');
  lines.push('\t\t\treturn items, nil');
  lines.push('\t\t}');
  lines.push('\t\tcursor = result.Meta.Paginate.NextPage');
  lines.push('\t}');
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
  const imports: string[] = ['"context"', '"encoding/json"', '"fmt"', '"net/http"', '"strconv"', '"time"'];
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
  lines.push('\t\treturn resp, nil');
  lines.push('\t}');
  lines.push('}');
  lines.push('');

  for (const s of ir.services) {
    const cls = tagToServiceName(s.tag);
    lines.push(`type ${cls} struct {`);
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
  const clientRows = fields.map((f) => [f.f, `*${f.cls}`]);
  for (const line of goAligned(clientRows)) lines.push(line);
  lines.push('}');
  lines.push('');
  if (ir.baseUrl) {
    lines.push(`const DefaultBaseURL = ${JSON.stringify(ir.baseUrl)}`);
    lines.push('');
  }
  lines.push('func NewPachcaClient(token string, baseURL ...string) *PachcaClient {');
  if (ir.baseUrl) {
    lines.push(`\turl := DefaultBaseURL`);
  } else {
    lines.push('\turl := ""');
  }
  lines.push('\tif len(baseURL) > 0 { url = baseURL[0] }');
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
  for (const f of fields) lines.push(`\t\t${f.f.padEnd(maxField)}: &${f.cls}{baseURL: url, client: client},`);
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
  switch (ft.kind) {
    case 'primitive': {
      if (ft.primitive === 'integer') return ft.format === 'int64' ? 'int64(1)' : 'int32(1)';
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
    case 'model':
      return goModelLiteral(ft.ref ?? 'any', ir, models, visited, indent);
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

  const fields = model.fields.filter((f) => f.type.kind !== 'binary' || f.required);
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

  if (resp.isList) {
    const rt = ir.responses.find(
      (r) => r.dataRef === resp.dataRef && r.dataIsArray,
    );
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
): { usage: string; output: string | null } {
  const params: { name: string; value: string; isNamed: boolean }[] = [];

  // ctx is always first
  params.push({ name: 'ctx', value: 'ctx', isNamed: false });

  if (op.externalUrl) {
    params.push({ name: op.externalUrl, value: '"https://example.com"', isNamed: false });
  }

  for (const p of op.pathParams) {
    params.push({ name: snakeToCamel(p.sdkName), value: goLiteral(p.type, ir, models), isNamed: false });
  }

  if (op.requestBody) {
    const rb = op.requestBody;
    if (shouldUnwrapBody(rb) && rb.unwrapField) {
      const sdkName = snakeToCamel(rb.unwrapField.name);
      params.push({ name: sdkName, value: goLiteral(rb.unwrapField.type, ir, models), isNamed: false });
    } else if (rb.schemaRef) {
      params.push({ name: 'request', value: goLiteral({ kind: 'model', ref: rb.schemaRef }, ir, models), isNamed: false });
    }
  }

  if (op.queryParams.length > 0) {
    const pName = `${upperFirst(op.methodName)}Params`;
    const hasReq = op.queryParams.some((p) => p.required);

    const qEntries = op.queryParams.map((p) => {
      const name = goExportName(p.sdkName);
      const opt = !p.required && (p.type.kind !== 'array' && p.type.kind !== 'record');
      const value = goLiteral(p.type, ir, models);
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

  const call = `client.${serviceField}.${goMethodName(op)}(${callArgs.join(', ')})`;
  const usage = declarations.length > 0
    ? [...declarations, call].join('\n')
    : call;

  const output = goBuildOutputFingerprint(op, ir, models);

  return { usage, output };
}

function generateExamples(ir: IR): string {
  const models = buildModelIndex(ir);
  const result: Record<string, { usage: string; output: string | null }> = {};

  for (const svc of ir.services) {
    const serviceField = goServiceField(svc.tag);
    for (const op of svc.operations) {
      result[op.operationId] = goBuildOperationExample(op, ir, models, serviceField);
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
