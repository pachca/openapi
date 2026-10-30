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
  type IRValueUnion,
  jsonKindOf,
  unionRequiredShapes,
  valueUnionMemberName,
  paginateModel,
} from '../ir.js';
import { bodyExample, buildModelIndex, collectTypeRefs, namedBodyExamples, nullableOptionalFields, requestModelNames, type GeneratedFile, type GenerateOptions, type LanguageGenerator } from './types.js';
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

/** An open JSON value is `any`: nil already stands for null and for an absent field, so it takes no pointer. */
function isOpenValue(field: IRField): boolean {
  return field.type.kind === 'primitive' && field.type.primitive === 'any';
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
      // Inline (unnamed) enums have no ref. They are strings on the wire, so
      // emit `string` — `any` would make the `string(params.X)` conversion the
      // query builder emits a compile error.
      return ft.ref ?? 'string';
    case 'model':
    case 'union':
      return ft.valueUnion ?? ft.ref ?? 'any';
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

/**
 * An optional field the caller left unset stays out of the body: for a nullable
 * one `null` means something (it switches a setting off or deletes an object),
 * so an unset field must not turn into `null`. A model a request reaches takes
 * an explicit `null` through NullFields (see emitModel). A required nullable
 * field keeps the key and goes out as `null` when nil.
 */
function goJsonTag(field: IRField): string {
  return field.required ? field.name : `${field.name},omitempty`;
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
    isOptionalField(field) &&
    !isOpenValue(field);
  const typeName = pointer ? `*${base}` : base;
  const tag = `\`json:"${goJsonTag(field)}"\``;
  const comment = field.type.kind === 'literal' && field.type.literalValue
    ? ` // always "${field.type.literalValue}"`
    : '';
  return { name, typeName, tag, comment };
}

function emitEnum(lines: string[], e: IREnum): void {
  // A string type already takes any value: an open enum only says so.
  if (e.open) lines.push(`// ${e.name} may hold a value this SDK does not list yet: a response keeps it as is.`);
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

function emitModel(lines: string[], m: IRModel, allModels: IRModel[], requestModels: Set<string>): void {
  const nullable = requestModels.has(m.name) ? nullableOptionalFields(m) : [];
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
  if (m.name === 'ApiError') {
    // Not in the body: the client sets it. An answer with an empty body or one
    // that is not JSON comes with Errors empty.
    rows.push(['StatusCode', 'int', '`json:"-"` // HTTP status code of the answer']);
  }
  if (nullable.length > 0) {
    const names = nullable.map((f) => goFieldInfo(f, m.name).name).join(', ');
    rows.push(['NullFields', '[]string', `\`json:"-"\` // fields to send as null: ${names}`]);
  }
  for (const line of goAligned(rows)) lines.push(line);
  lines.push('}');

  // omitempty drops an empty slice or map too: one the caller set (even empty)
  // goes back into the body.
  const optionalContainers = m.fields.filter(
    (f) => !f.required && (f.type.kind === 'array' || f.type.kind === 'record'),
  );
  if (optionalContainers.length > 0 || nullable.length > 0) {
    lines.push('');
    if (nullable.length > 0) {
      lines.push(`// MarshalJSON leaves out every optional field that is not set. A field named`);
      lines.push(`// in NullFields goes out as null, whatever value it holds.`);
    }
    lines.push(`func (m ${m.name}) MarshalJSON() ([]byte, error) {`);
    lines.push(`\ttype Alias ${m.name}`);
    lines.push('\tdata, err := json.Marshal(Alias(m))');
    lines.push('\tif err != nil {');
    lines.push('\t\treturn nil, err');
    lines.push('\t}');
    lines.push('\tvar raw map[string]json.RawMessage');
    lines.push('\tif err := json.Unmarshal(data, &raw); err != nil {');
    lines.push('\t\treturn nil, err');
    lines.push('\t}');
    for (const field of optionalContainers) {
      const goName = goExportName(field.name);
      lines.push(`\tif m.${goName} != nil {`);
      lines.push(`\t\tif raw[${JSON.stringify(field.name)}], err = json.Marshal(m.${goName}); err != nil {`);
      lines.push('\t\t\treturn nil, err');
      lines.push('\t\t}');
      lines.push('\t}');
    }
    if (nullable.length > 0) {
      lines.push('\tfor _, name := range m.NullFields {');
      lines.push('\t\tswitch name {');
      for (const field of nullable) {
        lines.push(`\t\tcase ${JSON.stringify(goFieldInfo(field, m.name).name)}:`);
        lines.push(`\t\t\traw[${JSON.stringify(field.name)}] = json.RawMessage("null")`);
      }
      lines.push('\t\tdefault:');
      lines.push(`\t\t\treturn nil, fmt.Errorf("${m.name}: field %q cannot be sent as null", name)`);
      lines.push('\t\t}');
      lines.push('\t}');
    }
    lines.push('\treturn json.Marshal(raw)');
    lines.push('}');
  }

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
    lines.push('\t\tif e.StatusCode != 0 {');
    lines.push('\t\t\treturn fmt.Sprintf("HTTP %d", e.StatusCode)');
    lines.push('\t\t}');
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
    const isEnum = errField?.type.kind === 'enum';
    if (isPointer) {
      lines.push('\tif e.Err != nil {');
      lines.push(isEnum ? '\t\treturn string(*e.Err)' : '\t\treturn *e.Err');
    } else {
      lines.push('\tif e.Err != "" {');
      lines.push(isEnum ? '\t\treturn string(e.Err)' : '\t\treturn e.Err');
    }
    lines.push('\t}');
    lines.push('\treturn "oauth error"');
    lines.push('}');
  }
}

/**
 * A field that takes values of different JSON kinds is a struct with a field per
 * member: the one the value fills is set, the others stay nil. The first byte of
 * the JSON value picks the member, and an object that does not fit its model is
 * an error, so a union member gives way to the next.
 */
function emitValueUnion(lines: string[], vu: IRValueUnion): void {
  const fieldType = (m: IRFieldType) => (m.kind === 'array' ? goType(m) : `*${goType(m)}`);
  if (vu.description) lines.push(`// ${vu.name}: ${vu.description.replace(/\n/g, ' ')}`);
  lines.push(`// One field is set: the member of the JSON kind the value has.`);
  lines.push(`type ${vu.name} struct {`);
  for (const line of goAligned(vu.members.map((m) => [valueUnionMemberName(m), fieldType(m)]))) lines.push(line);
  lines.push('}');
  lines.push('');
  const bytes: Record<string, string> = {
    array: "'['",
    object: "'{'",
    string: "'\"'",
    boolean: "'t', 'f'",
    number: "'-', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'",
  };
  const expected = vu.members.map((m) => valueUnionMemberName(m)).join(' or ');
  lines.push(`func (u *${vu.name}) UnmarshalJSON(data []byte) error {`);
  // encoding/json calls UnmarshalJSON with null for a field that is not a pointer
  // (a required one): null leaves it as is, as it does for any other struct.
  lines.push("\tif jsonValueKind(data) == 'n' {");
  lines.push('\t\treturn nil');
  lines.push('\t}');
  lines.push(`\t*u = ${vu.name}{}`);
  lines.push('\tswitch jsonValueKind(data) {');
  for (const m of vu.members) {
    const name = valueUnionMemberName(m);
    lines.push(`\tcase ${bytes[jsonKindOf(m)!]}:`);
    if (m.kind === 'array') {
      lines.push(`\t\treturn json.Unmarshal(data, &u.${name})`);
    } else {
      lines.push(`\t\tu.${name} = new(${goType(m)})`);
      lines.push(`\t\treturn json.Unmarshal(data, u.${name})`);
    }
  }
  lines.push('\t}');
  lines.push(`\treturn fmt.Errorf("${vu.name} takes ${expected}, got %s", data)`);
  lines.push('}');
  lines.push('');
  lines.push(`func (u ${vu.name}) MarshalJSON() ([]byte, error) {`);
  for (const m of vu.members) {
    const name = valueUnionMemberName(m);
    lines.push(`\tif u.${name} != nil {`);
    lines.push(`\t\treturn json.Marshal(u.${name})`);
    lines.push('\t}');
  }
  lines.push('\treturn []byte("null"), nil');
  lines.push('}');
}

function emitValueKindHelper(lines: string[]): void {
  lines.push("// jsonValueKind is the first byte of a JSON value: '[', '{', '\"', 't' or 'f',");
  lines.push("// or '-' or a digit for a number.");
  lines.push('func jsonValueKind(data []byte) byte {');
  lines.push('\tfor _, b := range data {');
  lines.push("\t\tif b != ' ' && b != '\\t' && b != '\\n' && b != '\\r' {");
  lines.push('\t\t\treturn b');
  lines.push('\t\t}');
  lines.push('\t}');
  lines.push('\treturn 0');
  lines.push('}');
}

/** Shared helper for unions with no discriminator on the wire. */
function emitUnionShapeHelper(lines: string[], ir: IR): void {
  lines.push('// unionMemberShape lists the JSON keys one member of an undiscriminated union');
  lines.push('// declares.');
  lines.push('type unionMemberShape struct {');
  lines.push('\tname string');
  lines.push('\tkeys map[string]struct{}');
  lines.push('}');
  lines.push('');
  lines.push('// requiredShape lists the keys a model cannot do without, and the fields that');
  lines.push('// hold a model (or a list of them) with required keys of its own. A required');
  lines.push('// field that may hold null is not listed: its key may be missing.');
  lines.push('type requiredShape struct {');
  lines.push('\tkeys   []string');
  lines.push('\tnested []nestedRequiredShape');
  lines.push('}');
  lines.push('');
  lines.push('type nestedRequiredShape struct {');
  lines.push('\tkey   string');
  lines.push('\tmodel string');
  lines.push('}');
  lines.push('');
  lines.push('// requiredShapes holds the members of undiscriminated unions and the models');
  lines.push('// nested in them that have a required key, here or deeper.');
  const shapes = unionRequiredShapes(ir.unions, ir.models);
  if (shapes.length === 0) {
    lines.push('var requiredShapes = map[string]requiredShape{}');
  } else {
    lines.push('var requiredShapes = map[string]requiredShape{');
    const rows = shapes.map((shape) => {
      const parts: string[] = [];
      if (shape.required.length > 0) parts.push(`keys: []string{${shape.required.map((k) => JSON.stringify(k)).join(', ')}}`);
      if (shape.nested.length > 0) {
        const nested = shape.nested.map((n) => `{key: ${JSON.stringify(n.key)}, model: ${JSON.stringify(n.model)}}`);
        parts.push(`nested: []nestedRequiredShape{${nested.join(', ')}}`);
      }
      return [`${JSON.stringify(shape.model)}:`, `{${parts.join(', ')}},`];
    });
    for (const line of goAligned(rows)) lines.push(line);
    lines.push('}');
  }
  lines.push('');
  lines.push('// missingRequired reports the first required key the payload of a model lacks,');
  lines.push('// in the model or in a model nested in it: encoding/json leaves a missing field');
  lines.push('// at its zero value, so a union member that misses one gives way to the next.');
  lines.push('// It runs only when a union picks a member: decoding a model on its own stays as');
  lines.push('// lenient as encoding/json.');
  lines.push('func missingRequired(model string, raw map[string]json.RawMessage) error {');
  lines.push('\tshape := requiredShapes[model]');
  lines.push('\tfor _, k := range shape.keys {');
  lines.push('\t\tif _, ok := raw[k]; !ok {');
  lines.push('\t\t\treturn fmt.Errorf("%s requires %q", model, k)');
  lines.push('\t\t}');
  lines.push('\t}');
  lines.push('\tfor _, n := range shape.nested {');
  lines.push('\t\tif v, ok := raw[n.key]; ok {');
  lines.push('\t\t\tif err := missingRequiredIn(n.model, v); err != nil {');
  lines.push('\t\t\t\treturn err');
  lines.push('\t\t\t}');
  lines.push('\t\t}');
  lines.push('\t}');
  lines.push('\treturn nil');
  lines.push('}');
  lines.push('');
  lines.push('// missingRequiredIn checks a field value: an object of the model, a list of them,');
  lines.push('// or a value of another kind, which the decoder itself takes or refuses.');
  lines.push('func missingRequiredIn(model string, data json.RawMessage) error {');
  lines.push('\tswitch jsonValueKind(data) {');
  lines.push("\tcase '{':");
  lines.push('\t\tvar raw map[string]json.RawMessage');
  lines.push('\t\tif json.Unmarshal(data, &raw) == nil {');
  lines.push('\t\t\treturn missingRequired(model, raw)');
  lines.push('\t\t}');
  lines.push("\tcase '[':");
  lines.push('\t\tvar items []json.RawMessage');
  lines.push('\t\tif json.Unmarshal(data, &items) == nil {');
  lines.push('\t\t\tfor _, item := range items {');
  lines.push('\t\t\t\tif err := missingRequiredIn(model, item); err != nil {');
  lines.push('\t\t\t\t\treturn err');
  lines.push('\t\t\t\t}');
  lines.push('\t\t\t}');
  lines.push('\t\t}');
  lines.push('\t}');
  lines.push('\treturn nil');
  lines.push('}');
  lines.push('');
  lines.push('// rankUnionMembers orders the members by how well they fit the payload: most');
  lines.push('// keys recognised, then fewest unrecognised, then fewest declared, a tie keeping');
  lines.push('// the declared order. Returns the payload keys too, and nothing when the payload');
  lines.push('// is not a JSON object.');
  lines.push('func rankUnionMembers(data []byte, shapes []unionMemberShape) ([]int, map[string]json.RawMessage) {');
  lines.push('\tvar raw map[string]json.RawMessage');
  lines.push('\tif err := json.Unmarshal(data, &raw); err != nil {');
  lines.push('\t\treturn nil, nil');
  lines.push('\t}');
  lines.push('\tmatched := make([]int, len(shapes))');
  lines.push('\torder := make([]int, len(shapes))');
  lines.push('\tfor i, shape := range shapes {');
  lines.push('\t\torder[i] = i');
  lines.push('\t\tfor k := range raw {');
  lines.push('\t\t\tif _, ok := shape.keys[k]; ok {');
  lines.push('\t\t\t\tmatched[i]++');
  lines.push('\t\t\t}');
  lines.push('\t\t}');
  lines.push('\t}');
  lines.push('\tsort.SliceStable(order, func(a, b int) bool {');
  lines.push('\t\tx, y := order[a], order[b]');
  lines.push('\t\tif matched[x] != matched[y] {');
  lines.push('\t\t\treturn matched[x] > matched[y]');
  lines.push('\t\t}');
  lines.push('\t\t// Same keys recognised means the same number unrecognised.');
  lines.push('\t\treturn len(shapes[x].keys) < len(shapes[y].keys)');
  lines.push('\t})');
  lines.push('\treturn order, raw');
  lines.push('}');
}

/** Union whose members share no discriminator: decode by matching the payload shape. */
function emitStructuralUnion(lines: string[], u: IRUnion, models: IRModel[]): void {
  const shapesVar = `${u.name.charAt(0).toLowerCase()}${u.name.slice(1)}Shapes`;
  lines.push(`type ${u.name} struct {`);
  const fieldRows = u.memberRefs.map((ref) => [ref, `*${ref}`]);
  // Raw keeps the original payload so nothing is lost when no member fits.
  fieldRows.push(['Raw', 'json.RawMessage']);
  for (const line of goAligned(fieldRows)) lines.push(line);
  lines.push('}');
  lines.push('');
  lines.push(`var ${shapesVar} = []unionMemberShape{`);
  for (const ref of u.memberRefs) {
    const model = models.find((m) => m.name === ref);
    const keys = (model?.fields ?? []).map((f) => `${JSON.stringify(f.name)}: {}`);
    lines.push(`\t{name: ${JSON.stringify(ref)}, keys: map[string]struct{}{${keys.join(', ')}}},`);
  }
  lines.push('}');
  lines.push('');
  lines.push(`// UnmarshalJSON decodes ${u.name}, which carries no discriminator field:`);
  lines.push('// members are tried in the order they match the payload keys, and the first one');
  lines.push('// that decodes wins. The raw payload is always kept in Raw, so a payload that is');
  lines.push('// not an object is not a decode error. A member that misses a required key, in');
  lines.push('// itself or in a model nested in it, gives way to the next. When no member');
  lines.push('// decodes, the error is the one of the member that fits the keys best.');
  lines.push(`func (u *${u.name}) UnmarshalJSON(data []byte) error {`);
  lines.push('\tu.Raw = append(json.RawMessage(nil), data...)');
  lines.push('\tvar firstErr error');
  lines.push(`\torder, raw := rankUnionMembers(data, ${shapesVar})`);
  lines.push('\tfor _, i := range order {');
  lines.push(`\t\terr := missingRequired(${shapesVar}[i].name, raw)`);
  lines.push('\t\tswitch {');
  lines.push('\t\tcase err != nil:');
  u.memberRefs.forEach((ref, i) => {
    lines.push(`\t\tcase i == ${i}:`);
    lines.push(`\t\t\tv := &${ref}{}`);
    lines.push('\t\t\tif err = json.Unmarshal(data, v); err == nil {');
    lines.push(`\t\t\t\tu.${ref} = v`);
    lines.push('\t\t\t\treturn nil');
    lines.push('\t\t\t}');
  });
  lines.push('\t\t}');
  lines.push('\t\tif firstErr == nil {');
  lines.push('\t\t\tfirstErr = err');
  lines.push('\t\t}');
  lines.push('\t}');
  lines.push('\treturn firstErr');
  lines.push('}');
  lines.push('');
  lines.push(`func (u ${u.name}) MarshalJSON() ([]byte, error) {`);
  for (const ref of u.memberRefs) {
    lines.push(`\tif u.${ref} != nil {`);
    lines.push(`\t\treturn json.Marshal(u.${ref})`);
    lines.push('\t}');
  }
  lines.push('\tif len(u.Raw) > 0 {');
  lines.push('\t\treturn u.Raw, nil');
  lines.push('\t}');
  lines.push(`\treturn nil, fmt.Errorf("empty ${u.name}")`);
  lines.push('}');
}

function emitUnion(lines: string[], u: IRUnion, models: IRModel[]): void {
  const discField = u.discriminatorField;
  if (!discField) {
    emitStructuralUnion(lines, u, models);
    return;
  }
  const discGoName = goExportName(discField);
  lines.push(`type ${u.name} struct {`);
  const fieldRows = u.memberRefs.map((ref) => [ref, `*${ref}`]);
  for (const line of goAligned(fieldRows)) lines.push(line);
  lines.push('}');
  lines.push('');
  lines.push(`func (u *${u.name}) UnmarshalJSON(data []byte) error {`);
  lines.push('\tvar disc struct {');
  lines.push(`\t\t${discGoName} string \`json:"${discField}"\``);
  if (u.unionDeserializer === 'webhook-payload') {
    lines.push('\t\tEvent string `json:"event"`');
  }
  lines.push('\t}');
  lines.push('\tif err := json.Unmarshal(data, &disc); err != nil {');
  lines.push('\t\treturn err');
  lines.push('\t}');
  if (u.unionDeserializer === 'webhook-payload') {
    lines.push('\tswitch {');
    lines.push('\tcase disc.Type == "message" && disc.Event == "link_shared":');
    lines.push('\t\tu.LinkSharedWebhookPayload = &LinkSharedWebhookPayload{}');
    lines.push('\t\treturn json.Unmarshal(data, u.LinkSharedWebhookPayload)');
    lines.push('\tcase disc.Type == "message":');
    lines.push('\t\tu.MessageWebhookPayload = &MessageWebhookPayload{}');
    lines.push('\t\treturn json.Unmarshal(data, u.MessageWebhookPayload)');
    for (const ref of u.memberRefs.filter((ref) => ref !== 'MessageWebhookPayload' && ref !== 'LinkSharedWebhookPayload')) {
      const model = models.find((m) => m.name === ref);
      const typeField = model?.fields.find(
        (f) => f.name === discField && f.type.kind === 'literal',
      ) ?? model?.fields.find((f) => f.type.kind === 'literal');
      const disc = typeField?.type.literalValue ?? ref;
      lines.push(`\tcase disc.${discGoName} == ${JSON.stringify(disc)}:`);
      lines.push(`\t\tu.${ref} = &${ref}{}`);
      lines.push(`\t\treturn json.Unmarshal(data, u.${ref})`);
    }
  } else {
    lines.push(`\tswitch disc.${discGoName} {`);
    const seenDiscs = new Set<string>();
    for (const ref of u.memberRefs) {
      const model = models.find((m) => m.name === ref);
      const typeField = model?.fields.find(
        (f) => f.name === discField && f.type.kind === 'literal',
      ) ?? model?.fields.find((f) => f.type.kind === 'literal');
      const disc = typeField?.type.literalValue ?? ref;
      if (seenDiscs.has(String(disc))) continue;
      seenDiscs.add(String(disc));
      lines.push(`\tcase ${JSON.stringify(disc)}:`);
      lines.push(`\t\tu.${ref} = &${ref}{}`);
      lines.push(`\t\treturn json.Unmarshal(data, u.${ref})`);
    }
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
  rows.push(['Data', `${rt.dataIsArray ? '[]' : ''}${rt.dataRef}`, '`json:"data"`']);
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
  const hasUnions = ir.unions.length > 0 || ir.valueUnions.length > 0;
  const allModels = ir.models.flatMap((m) => [...m.inlineObjects, m]);
  const requestModels = requestModelNames(ir);
  const hasOptionalContainers = allModels.some((m) => m.fields.some(
    (f) => !f.required && (f.type.kind === 'array' || f.type.kind === 'record'),
  ));
  const hasNullFields = allModels.some((m) => requestModels.has(m.name) && nullableOptionalFields(m).length > 0);

  const imports: string[] = [];
  if (hasUnions || hasOptionalContainers || hasNullFields) imports.push('"encoding/json"');
  if (needFmtStrings || hasUnions || hasNullFields) imports.push('"fmt"');
  if (needIO) imports.push('"io"');
  if (ir.unions.some((u) => !u.discriminatorField)) imports.push('"sort"');
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

  for (const m of ir.models) {
    for (const inl of m.inlineObjects) {
      emitModel(lines, inl, allModels, requestModels);
      lines.push('');
    }
    emitModel(lines, m, allModels, requestModels);
    lines.push('');
  }

  const hasStructuralUnions = ir.unions.some((u) => !u.discriminatorField);
  if (hasStructuralUnions) {
    emitUnionShapeHelper(lines, ir);
    lines.push('');
  }

  for (const u of ir.unions) {
    emitUnion(lines, u, ir.models);
    lines.push('');
  }

  if (ir.valueUnions.length > 0 || hasStructuralUnions) {
    emitValueKindHelper(lines);
    lines.push('');
  }

  for (const vu of ir.valueUnions) {
    emitValueUnion(lines, vu);
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
  if (op.successResponse.isBinary) return '([]byte, error)';
  if (!op.successResponse.hasBody) return 'error';
  if (op.successResponse.isList || op.successResponse.isSingleWithMeta) {
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
  // A file answers with its bytes, so it returns a value like a JSON body does.
  const returnsValue = op.successResponse.hasBody || op.successResponse.isBinary;
  const retErr = (): string => {
    if (op.successResponse.isRedirect) return 'return "", err';
    if (!returnsValue) return 'return err';
    return 'return nil, err';
  };
  const retOAuth = (): string => {
    if (op.successResponse.isRedirect) return 'return "", &e';
    if (!returnsValue) return 'return &e';
    return 'return nil, &e';
  };
  // An error body that does not decode comes back wrapped with its status.
  const retDecodeFailure = (): string => {
    const wrapped = 'fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)';
    if (op.successResponse.isRedirect) return `return "", ${wrapped}`;
    if (!returnsValue) return `return ${wrapped}`;
    return `return nil, ${wrapped}`;
  };
  const retUnexpected = (): string => {
    if (op.successResponse.isRedirect) return 'return "", fmt.Errorf("unexpected status code: %d", resp.StatusCode)';
    if (returnsValue) return 'return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)';
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
    const hasForm = op.requestBody?.contentType === 'form';
    if (hasForm) {
      const rb = op.requestBody!;
      if (shouldUnwrapBody(rb)) {
        const f = rb.unwrapField!;
        lines.push(`\tform, err := formValues(map[string]any{${JSON.stringify(f.name)}: ${snakeToCamel(f.name)}})`);
      } else {
        lines.push('\tform, err := formValues(request)');
      }
      lines.push('\tif err != nil {');
      lines.push(`\t\t${retErr()}`);
      lines.push('\t}');
    }
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
          hasJSON ? 'bytes.NewReader(body)' : hasForm ? 'strings.NewReader(form.Encode())' : 'nil'
        })`,
      );
    } else {
      lines.push(
        `\treq, err := http.NewRequestWithContext(ctx, "${op.method}", ${urlExpr}, ${
          hasJSON ? 'bytes.NewReader(body)' : hasForm ? 'strings.NewReader(form.Encode())' : 'nil'
        })`,
      );
    }
    lines.push('\tif err != nil {');
    lines.push(`\t\t${retErr()}`);
    lines.push('\t}');
    if (hasJSON) lines.push('\treq.Header.Set("Content-Type", "application/json")');
    if (hasForm) lines.push('\treq.Header.Set("Content-Type", "application/x-www-form-urlencoded")');
    for (const h of op.requestHeaders ?? []) lines.push(`\treq.Header.Set(${JSON.stringify(h.name)}, ${JSON.stringify(h.value)})`);
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
  } else if (op.successResponse.isBinary) {
    lines.push(`\tcase ${goStatus(op.successResponse.statusCode)}:`);
    lines.push('\t\tbody, err := io.ReadAll(resp.Body)');
    lines.push('\t\tif err != nil {');
    lines.push('\t\t\treturn nil, err');
    lines.push('\t\t}');
    lines.push('\t\treturn body, nil');
  } else if (!op.successResponse.hasBody) {
    lines.push(`\tcase ${goStatus(op.successResponse.statusCode)}:`);
    lines.push('\t\treturn nil');
  } else if (op.successResponse.isList || op.successResponse.isSingleWithMeta) {
    const rt = ir.responses.find((r) => r.name === op.successResponse.responseRef);
    lines.push(`\tcase ${goStatus(op.successResponse.statusCode)}:`);
    lines.push(`\t\tvar result ${rt?.name ?? 'any'}`);
    lines.push('\t\tif err := json.NewDecoder(resp.Body).Decode(&result); err != nil {');
    lines.push('\t\t\treturn nil, err');
    lines.push('\t\t}');
    lines.push('\t\treturn &result, nil');
  } else if (op.successResponse.isUnwrap && op.successResponse.dataRef) {
    lines.push(`\tcase ${goStatus(op.successResponse.statusCode)}:`);
    lines.push('\t\tvar result struct {');
    lines.push(`\t\t\tData ${op.successResponse.dataRef} \`json:"data"\``);
    lines.push('\t\t}');
    lines.push('\t\tif err := json.NewDecoder(resp.Body).Decode(&result); err != nil {');
    lines.push('\t\t\treturn nil, err');
    lines.push('\t\t}');
    lines.push('\t\treturn &result.Data, nil');
  } else {
    lines.push(`\tcase ${goStatus(op.successResponse.statusCode)}:`);
    lines.push(`\t\tvar result ${op.successResponse.dataRef ?? 'any'}`);
    lines.push('\t\tif err := json.NewDecoder(resp.Body).Decode(&result); err != nil {');
    lines.push('\t\t\treturn nil, err');
    lines.push('\t\t}');
    lines.push('\t\treturn &result, nil');
  }

  // With both error models the body decides the type, a 401 included.
  if (op.hasOAuthError && !goPicksErrorByBody(ir)) {
    lines.push('\tcase http.StatusUnauthorized:');
    lines.push('\t\tvar e OAuthError');
    lines.push('\t\tif err := json.NewDecoder(resp.Body).Decode(&e); err != nil {');
    // A body that does not decode is no OAuth error: it comes back wrapped, the
    // way the other statuses report one, and `Err` only ever holds a code.
    lines.push(`\t\t\t${retDecodeFailure()}`);
    lines.push('\t\t}');
    lines.push(`\t\t${retOAuth()}`);
  }

  lines.push('\tdefault:');
  if (goHasApiError(ir)) {
    if (op.successResponse.isRedirect) lines.push('\t\treturn "", errorFromResponse(resp)');
    else if (!returnsValue) lines.push('\t\treturn errorFromResponse(resp)');
    else lines.push('\t\treturn nil, errorFromResponse(resp)');
  } else {
    lines.push(`\t\t${retUnexpected()}`);
  }

  lines.push('\t}');
  lines.push('}');
}

function goHasApiError(ir: IR): boolean {
  return ir.models.some((m) => m.name === 'ApiError');
}

/** Both error models exist, so an error's class is read off its body. */
function goPicksErrorByBody(ir: IR): boolean {
  return goHasApiError(ir) && ir.models.some((m) => m.name === 'OAuthError');
}

function emitGoFormValues(lines: string[]): void {
  lines.push('// formValues turns a request into a form body (application/x-www-form-urlencoded):');
  lines.push('// the fields go by their JSON names, empty ones are left out.');
  lines.push('func formValues(v any) (url.Values, error) {');
  lines.push('\tdata, err := json.Marshal(v)');
  lines.push('\tif err != nil {');
  lines.push('\t\treturn nil, err');
  lines.push('\t}');
  lines.push('\tvar fields map[string]any');
  lines.push('\tif err := json.Unmarshal(data, &fields); err != nil {');
  lines.push('\t\treturn nil, err');
  lines.push('\t}');
  lines.push('\tform := url.Values{}');
  lines.push('\tfor key, value := range fields {');
  lines.push('\t\tif value != nil {');
  lines.push('\t\t\tform.Set(key, fmt.Sprintf("%v", value))');
  lines.push('\t\t}');
  lines.push('\t}');
  lines.push('\treturn form, nil');
  lines.push('}');
  lines.push('');
}

function emitGoErrorFromResponse(lines: string[], picksByBody: boolean): void {
  if (picksByBody) {
    lines.push('// errorFromResponse reads an error answer. Its body is either {"errors": [...]} or');
    lines.push('// the OAuth form {"error", "error_description"}, which also comes with 400 and 403');
    lines.push('// (insufficient_scope, invalid_grant): the body decides the type. An empty body or');
  } else {
    lines.push('// errorFromResponse reads an error answer, an ApiError. An empty body or');
  }
  lines.push('// one that is not JSON (a 404 without a body, a proxy page) gives an ApiError with');
  lines.push('// no errors. The status code stays in StatusCode.');
  lines.push('func errorFromResponse(resp *http.Response) error {');
  lines.push('\tdata, err := io.ReadAll(resp.Body)');
  lines.push('\tif err != nil {');
  lines.push('\t\treturn fmt.Errorf("HTTP %d: %w", resp.StatusCode, err)');
  lines.push('\t}');
  if (picksByBody) {
    lines.push('\tvar probe struct {');
    lines.push('\t\tErrors json.RawMessage `json:"errors"`');
    lines.push('\t\tError  *string         `json:"error"`');
    lines.push('\t}');
    lines.push('\tif json.Unmarshal(data, &probe) == nil && probe.Errors == nil && probe.Error != nil {');
    lines.push('\t\tvar e OAuthError');
    lines.push('\t\tif err := json.Unmarshal(data, &e); err == nil {');
    lines.push('\t\t\treturn &e');
    lines.push('\t\t}');
    lines.push('\t}');
  }
  lines.push('\tvar e ApiError');
  lines.push('\tif json.Unmarshal(data, &e) != nil {');
  lines.push('\t\te = ApiError{}');
  lines.push('\t}');
  lines.push('\te.StatusCode = resp.StatusCode');
  lines.push('\treturn &e');
  lines.push('}');
  lines.push('');
}

function emitGoOAuthHelpers(lines: string[], authorizeUrl: string): void {
  lines.push(`const PachcaAuthorizeURL = ${JSON.stringify(authorizeUrl)}`);
  lines.push('');
  lines.push('// AuthorizeURLParams describes the authorization link of the OAuth flow.');
  lines.push('type AuthorizeURLParams struct {');
  lines.push('\t// ClientID of the bot');
  lines.push('\tClientID string');
  lines.push("\t// RedirectURI is one of the bot's redirect addresses, matched exactly");
  lines.push('\tRedirectURI string');
  lines.push('\t// State is a random value you keep to recognise the return; each one is valid once');
  lines.push('\tState string');
  lines.push('\t// CodeChallenge of a pair from CreatePKCE');
  lines.push('\tCodeChallenge string');
  lines.push('\t// AuthorizeURL of another installation; PachcaAuthorizeURL when empty');
  lines.push('\tAuthorizeURL string');
  lines.push('}');
  lines.push('');
  lines.push('// BuildAuthorizeURL returns the authorization link for a message button: the consent screen with PKCE (S256).');
  lines.push('func BuildAuthorizeURL(p AuthorizeURLParams) string {');
  lines.push('\tbase := p.AuthorizeURL');
  lines.push('\tif base == "" {');
  lines.push('\t\tbase = PachcaAuthorizeURL');
  lines.push('\t}');
  lines.push('\tquery := url.Values{}');
  lines.push('\tquery.Set("client_id", p.ClientID)');
  lines.push('\tquery.Set("redirect_uri", p.RedirectURI)');
  lines.push('\tquery.Set("response_type", "code")');
  lines.push('\tquery.Set("state", p.State)');
  lines.push('\tquery.Set("code_challenge", p.CodeChallenge)');
  lines.push('\tquery.Set("code_challenge_method", "S256")');
  lines.push('\treturn base + "?" + query.Encode()');
  lines.push('}');
  lines.push('');
  lines.push('// PKCE is a pair for the OAuth flow: keep CodeVerifier until the code exchange, put CodeChallenge into the link.');
  lines.push('type PKCE struct {');
  lines.push('\tCodeVerifier  string');
  lines.push('\tCodeChallenge string');
  lines.push('}');
  lines.push('');
  lines.push('// CreatePKCE returns a random code verifier and its SHA-256 challenge.');
  lines.push('func CreatePKCE() (PKCE, error) {');
  lines.push('\tbuf := make([]byte, 32)');
  lines.push('\tif _, err := rand.Read(buf); err != nil {');
  lines.push('\t\treturn PKCE{}, err');
  lines.push('\t}');
  lines.push('\tverifier := base64.RawURLEncoding.EncodeToString(buf)');
  lines.push('\tsum := sha256.Sum256([]byte(verifier))');
  lines.push('\treturn PKCE{CodeVerifier: verifier, CodeChallenge: base64.RawURLEncoding.EncodeToString(sum[:])}, nil');
  lines.push('}');
  lines.push('');
}

/** The net/http constant for a success status the spec declares. */
function goStatus(code: number): string {
  const names: Record<number, string> = {
    200: 'http.StatusOK',
    201: 'http.StatusCreated',
    202: 'http.StatusAccepted',
    204: 'http.StatusNoContent',
  };
  const name = names[code];
  if (!name) throw new Error(`Go: no net/http constant for success status ${code}`);
  return name;
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

  // Build call args
  const callArgs: string[] = ['ctx'];
  if (op.externalUrl) callArgs.push(op.externalUrl);
  for (const p of op.pathParams) callArgs.push(snakeToCamel(p.sdkName));
  if (op.queryParams.length > 0) {
    const hasReq = op.queryParams.some((p) => p.required);
    callArgs.push(hasReq ? '*params' : 'params');
  }

  const rt = ir.responses.find((r) => r.name === op.successResponse.responseRef);
  // The meta of another API may lack has_next or carry next_page as an optional
  // field: take both from the paginate model instead of assuming Pachca's shape.
  const paginate = paginateModel(ir, rt?.metaRef);
  const hasNextField = paginate?.fields.find((f) => f.name === 'has_next');
  const nextPageField = paginate?.fields.find((f) => f.name === 'next_page');
  const nextPageIsPointer = nextPageField ? isOptionalField(nextPageField) : false;
  const useHasNext = hasNextField !== undefined;
  const pushNextCursor = (indent: string): void => {
    if (nextPageIsPointer) {
      lines.push(`${indent}if result.Meta.Paginate.NextPage == nil {`);
      lines.push(`${indent}\treturn items, nil`);
      lines.push(`${indent}}`);
      lines.push(`${indent}cursor = result.Meta.Paginate.NextPage`);
    } else {
      lines.push(`${indent}nextPage := result.Meta.Paginate.NextPage`);
      lines.push(`${indent}cursor = &nextPage`);
    }
  };

  if (useHasNext) {
    lines.push('\thasNext := true');
    lines.push('\tfor hasNext {');
    if (op.queryParams.length > 0) {
      lines.push('\t\tparams.Cursor = cursor');
    }
    lines.push(`\t\tresult, err := s.${goMethodName(op)}(${callArgs.join(', ')})`);
    lines.push('\t\tif err != nil {');
    lines.push('\t\t\treturn nil, err');
    lines.push('\t\t}');
    lines.push('\t\titems = append(items, result.Data...)');
    lines.push('\t\tif len(result.Data) == 0 {');
    lines.push('\t\t\treturn items, nil');
    lines.push('\t\t}');
    pushNextCursor('\t\t');
    if (hasNextField && isOptionalField(hasNextField)) {
      lines.push('\t\tif result.Meta.Paginate.HasNext != nil {');
      lines.push('\t\t\thasNext = *result.Meta.Paginate.HasNext');
      lines.push('\t\t}');
    } else {
      lines.push('\t\thasNext = result.Meta.Paginate.HasNext');
    }
    lines.push('\t}');
    lines.push('\treturn items, nil');
  } else {
    const metaNilCheck = rt?.metaIsRequired ? '' : ' || result.Meta == nil';
    lines.push('\tfor {');
    if (op.queryParams.length > 0) {
      lines.push('\t\tparams.Cursor = cursor');
    }
    lines.push(`\t\tresult, err := s.${goMethodName(op)}(${callArgs.join(', ')})`);
    lines.push('\t\tif err != nil {');
    lines.push('\t\t\treturn nil, err');
    lines.push('\t\t}');
    lines.push('\t\titems = append(items, result.Data...)');
    lines.push(`\t\tif len(result.Data) == 0${metaNilCheck} {`);
    lines.push('\t\t\treturn items, nil');
    lines.push('\t\t}');
    pushNextCursor('\t\t');
    lines.push('\t}');
  }
  lines.push('}');
}

function hasWebhookPolling(svc: IRService): boolean {
  return svc.operations.some((op) => op.methodName === 'getWebhookEvents' && op.successResponse.dataRef === 'WebhookEvent');
}

function emitServiceContract(lines: string[], svc: IRService, ir: IR): void {
  const serviceName = tagToServiceName(svc.tag);
  const stubName = serviceToStubName(serviceName);
  if (svc.deprecated) lines.push(`// Deprecated: ${serviceName} is kept for backward compatibility — use the new service(s).`);
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
    if (op.methodName === 'getWebhookEvents' && op.successResponse.dataRef === 'WebhookEvent') {
      lines.push('\tPollWebhookEvents(ctx context.Context, options *PollWebhookEventsOptions, handler func(WebhookEvent) error) error');
      lines.push('\tPollWebhookPayloads(ctx context.Context, options *PollWebhookEventsOptions, handler func(WebhookPayloadUnion) error) error');
    }
  }
  lines.push('}');
  if (hasWebhookPolling(svc)) {
    lines.push('');
    lines.push('type PollWebhookEventsOptions struct {');
    lines.push('\tLimit              *int32');
    lines.push('\tInterval           time.Duration');
    lines.push('\tCreatedAfter       *time.Time');
    lines.push('\tMaxSeenDeliveryIDs int');
    lines.push('}');
  }
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
    if (op.methodName === 'getWebhookEvents' && op.successResponse.dataRef === 'WebhookEvent') {
      emitStubWebhookPollingMethods(lines, svc);
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
  const methodRef = JSON.stringify(`${op.tag}.${op.methodName}`);
  lines.push(`func (s *${stubName}) ${goMethodName(op)}(${args.join(', ')}) ${goReturn(op, ir)} {`);
  if (op.successResponse.isRedirect) lines.push(`\treturn "", NotImplementedError{Method: ${methodRef}}`);
  else if (!op.successResponse.hasBody && !op.successResponse.isBinary) lines.push(`\treturn NotImplementedError{Method: ${methodRef}}`);
  else lines.push(`\treturn nil, NotImplementedError{Method: ${methodRef}}`);
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
  lines.push(`\treturn nil, NotImplementedError{Method: ${JSON.stringify(`${op.tag}.${op.methodName}All`)}}`);
  lines.push('}');
}

function emitStubWebhookPollingMethods(lines: string[], svc: IRService): void {
  const stubName = serviceToStubName(tagToServiceName(svc.tag));
  lines.push(`func (s *${stubName}) PollWebhookEvents(ctx context.Context, options *PollWebhookEventsOptions, handler func(WebhookEvent) error) error {`);
  lines.push(`\treturn NotImplementedError{Method: ${JSON.stringify(`${svc.tag}.pollWebhookEvents`)}}`);
  lines.push('}');
  lines.push('');
  lines.push(`func (s *${stubName}) PollWebhookPayloads(ctx context.Context, options *PollWebhookEventsOptions, handler func(WebhookPayloadUnion) error) error {`);
  lines.push(`\treturn NotImplementedError{Method: ${JSON.stringify(`${svc.tag}.pollWebhookPayloads`)}}`);
  lines.push('}');
}

function emitWebhookPollingMethods(lines: string[], implName: string): void {
  lines.push(`func (s *${implName}) PollWebhookEvents(ctx context.Context, options *PollWebhookEventsOptions, handler func(WebhookEvent) error) error {`);
  lines.push('\tif handler == nil {');
  lines.push('\t\treturn errors.New("handler must not be nil")');
  lines.push('\t}');
  lines.push('\tif options == nil {');
  lines.push('\t\toptions = &PollWebhookEventsOptions{}');
  lines.push('\t}');
  lines.push('\tinterval := options.Interval');
  lines.push('\tif interval == 0 {');
  lines.push('\t\tinterval = 5 * time.Second');
  lines.push('\t}');
  lines.push('\tcreatedAfter := options.CreatedAfter');
  lines.push('\tif createdAfter == nil {');
  lines.push('\t\tnow := time.Now()');
  lines.push('\t\tcreatedAfter = &now');
  lines.push('\t}');
  lines.push('\tmaxSeenDeliveryIDs := options.MaxSeenDeliveryIDs');
  lines.push('\tif maxSeenDeliveryIDs == 0 {');
  lines.push('\t\tmaxSeenDeliveryIDs = 5000');
  lines.push('\t}');
  lines.push('\tif maxSeenDeliveryIDs < 0 {');
  lines.push('\t\treturn errors.New("MaxSeenDeliveryIDs must be greater than 0")');
  lines.push('\t}');
  lines.push('');
  lines.push('\tseenIDOrder := make([]string, 0, maxSeenDeliveryIDs)');
  lines.push('\tseenIDs := make(map[string]struct{}, maxSeenDeliveryIDs)');
  lines.push('\tremember := func(id string) bool {');
  lines.push('\t\tif _, ok := seenIDs[id]; ok {');
  lines.push('\t\t\treturn false');
  lines.push('\t\t}');
  lines.push('\t\tseenIDs[id] = struct{}{}');
  lines.push('\t\tseenIDOrder = append(seenIDOrder, id)');
  lines.push('\t\tfor len(seenIDOrder) > maxSeenDeliveryIDs {');
  lines.push('\t\t\toldest := seenIDOrder[0]');
  lines.push('\t\t\tseenIDOrder = seenIDOrder[1:]');
  lines.push('\t\t\tdelete(seenIDs, oldest)');
  lines.push('\t\t}');
  lines.push('\t\treturn true');
  lines.push('\t}');
  lines.push('');
  lines.push('\tfor {');
  lines.push('\t\tvar cursor *string');
  lines.push('\t\thasNext := true');
  lines.push('\t\tfor hasNext {');
  lines.push('\t\t\tparams := &GetWebhookEventsParams{Limit: options.Limit, Cursor: cursor}');
  lines.push('\t\t\tresponse, err := s.GetWebhookEvents(ctx, params)');
  lines.push('\t\t\tif err != nil {');
  lines.push('\t\t\t\treturn err');
  lines.push('\t\t\t}');
  lines.push('\t\t\tpageHasRecentEvents := false');
  lines.push('\t\t\tfor i := len(response.Data) - 1; i >= 0; i-- {');
  lines.push('\t\t\t\tevent := response.Data[i]');
  lines.push('\t\t\t\tmatchesCreatedAfter := !event.CreatedAt.Before(*createdAfter)');
  lines.push('\t\t\t\tif matchesCreatedAfter {');
  lines.push('\t\t\t\t\tpageHasRecentEvents = true');
  lines.push('\t\t\t\t}');
  lines.push('\t\t\t\tif matchesCreatedAfter && remember(event.ID) {');
  lines.push('\t\t\t\t\tif err := handler(event); err != nil {');
  lines.push('\t\t\t\t\t\treturn err');
  lines.push('\t\t\t\t\t}');
  lines.push('\t\t\t\t}');
  lines.push('\t\t\t}');
  lines.push('\t\t\tnextPage := response.Meta.Paginate.NextPage');
  lines.push('\t\t\tcursor = &nextPage');
  lines.push('\t\t\tif response.Meta.Paginate.HasNext != nil {');
  lines.push('\t\t\t\thasNext = *response.Meta.Paginate.HasNext');
  lines.push('\t\t\t} else {');
  lines.push('\t\t\t\thasNext = len(response.Data) > 0');
  lines.push('\t\t\t}');
  lines.push('\t\t\thasNext = hasNext && pageHasRecentEvents');
  lines.push('\t\t}');
  lines.push('');
  lines.push('\t\ttimer := time.NewTimer(interval)');
  lines.push('\t\tselect {');
  lines.push('\t\tcase <-ctx.Done():');
  lines.push('\t\t\ttimer.Stop()');
  lines.push('\t\t\treturn ctx.Err()');
  lines.push('\t\tcase <-timer.C:');
  lines.push('\t\t}');
  lines.push('\t}');
  lines.push('}');
  lines.push('');
  lines.push(`func (s *${implName}) PollWebhookPayloads(ctx context.Context, options *PollWebhookEventsOptions, handler func(WebhookPayloadUnion) error) error {`);
  lines.push('\tif handler == nil {');
  lines.push('\t\treturn errors.New("handler must not be nil")');
  lines.push('\t}');
  lines.push('\treturn s.PollWebhookEvents(ctx, options, func(event WebhookEvent) error {');
  lines.push('\t\treturn handler(event.Payload)');
  lines.push('\t})');
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
  const needPolling = ir.services.some(hasWebhookPolling);
  const needMultipart = ir.services.some((s) => s.operations.some((o) => o.requestBody?.contentType === 'multipart'));
  const needForm = ir.services.some((s) => s.operations.some((o) => o.requestBody?.contentType === 'form'));
  const needIO =
    needMultipart || goHasApiError(ir) || ir.services.some((s) => s.operations.some((o) => o.successResponse.isBinary));
  const imports: string[] = ['"context"', '"encoding/json"', '"fmt"', '"net/http"', '"time"'];
  if (needBytes) imports.push('"bytes"');
  if (needURL || needForm || ir.oauthAuthorizeUrl) imports.push('"net/url"');
  if (needForm) imports.push('"strings"');
  if (ir.oauthAuthorizeUrl) imports.push('"crypto/rand"', '"crypto/sha256"', '"encoding/base64"');
  if (needErrors || needPolling) imports.push('"errors"');
  if (needIO) imports.push('"io"');
  if (needMultipart) imports.push('"mime/multipart"');
  imports.sort();

  lines.push('import (');
  for (const imp of imports) lines.push(`\t${imp}`);
  lines.push(')');
  lines.push('');

  if (needForm) emitGoFormValues(lines);
  if (goHasApiError(ir)) emitGoErrorFromResponse(lines, goPicksErrorByBody(ir));
  if (ir.oauthAuthorizeUrl) emitGoOAuthHelpers(lines, ir.oauthAuthorizeUrl);

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
      if (op.methodName === 'getWebhookEvents' && op.successResponse.dataRef === 'WebhookEvent') {
        emitWebhookPollingMethods(lines, implName);
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
    lines.push(`const PachcaAPIURL = ${JSON.stringify(ir.baseUrl)}`);
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
    lines.push(`\tcfg := clientConfig{baseURL: PachcaAPIURL}`);
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
  const maxField = Math.max(...fields.map((f) => f.f.length));
  for (const f of fields) {
    const cfgField = `cfg.${f.f.charAt(0).toLowerCase() + f.f.slice(1)}`;
    const varName = f.f.charAt(0).toLowerCase() + f.f.slice(1);
    const impl = `&${serviceToImplName(f.cls)}{baseURL: cfg.baseURL, client: client}`;
    lines.push(`\tvar ${varName} ${f.cls} = ${impl}`);
    lines.push(`\tif ${cfgField} != nil {`);
    lines.push(`\t\t${varName} = ${cfgField}`);
    lines.push('\t}');
  }
  lines.push('\treturn &PachcaClient{');
  for (const f of fields) {
    const varName = f.f.charAt(0).toLowerCase() + f.f.slice(1);
    lines.push(`\t\t${f.f.padEnd(maxField)}: ${varName},`);
  }
  lines.push('\t}');
  lines.push('}');
  lines.push('');

  // NewPachcaClientWithHTTP function
  lines.push('func NewPachcaClientWithHTTP(baseURL string, client *http.Client, opts ...ClientOption) *PachcaClient {');
  lines.push('\tcfg := clientConfig{baseURL: baseURL}');
  lines.push('\tfor _, opt := range opts {');
  lines.push('\t\topt(&cfg)');
  lines.push('\t}');
  for (const f of fields) {
    const cfgField = `cfg.${f.f.charAt(0).toLowerCase() + f.f.slice(1)}`;
    const varName = f.f.charAt(0).toLowerCase() + f.f.slice(1);
    const impl = `&${serviceToImplName(f.cls)}{baseURL: cfg.baseURL, client: client}`;
    lines.push(`\tvar ${varName} ${f.cls} = ${impl}`);
    lines.push(`\tif ${cfgField} != nil {`);
    lines.push(`\t\t${varName} = ${cfgField}`);
    lines.push('\t}');
  }
  lines.push('\treturn &PachcaClient{');
  for (const f of fields) {
    const varName = f.f.charAt(0).toLowerCase() + f.f.slice(1);
    lines.push(`\t\t${f.f.padEnd(maxField)}: ${varName},`);
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
  for (const f of fields) {
    const cfgField = `cfg.${f.f.charAt(0).toLowerCase() + f.f.slice(1)}`;
    const varName = f.f.charAt(0).toLowerCase() + f.f.slice(1);
    const stub = `&${serviceToStubName(f.cls)}{}`;
    lines.push(`\tvar ${varName} ${f.cls} = ${stub}`);
    lines.push(`\tif ${cfgField} != nil {`);
    lines.push(`\t\t${varName} = ${cfgField}`);
    lines.push('\t}');
  }
  lines.push('\treturn &PachcaClient{');
  for (const f of fields) {
    const varName = f.f.charAt(0).toLowerCase() + f.f.slice(1);
    lines.push(`\t\t${f.f.padEnd(maxField)}: ${varName},`);
  }
  lines.push('\t}');
  lines.push('}');
  lines.push('');
  // "time" is imported up front; a client without timeouts, pauses or dates never uses it,
  // and Go refuses to compile an unused import.
  const source = lines.join('\n');
  const importEnd = source.indexOf('\n)\n');
  return /\btime\./.test(source.slice(importEnd)) ? source : source.replace('\t"time"\n', '');
}

function generateUtils(): string {
  return [
    'package pachca',
    '',
    'import (',
    '\t"bytes"',
    '\t"encoding/json"',
    '\t"io"',
    '\t"math/rand"',
    '\t"net/http"',
    '\t"strconv"',
    '\t"time"',
    ')',
    '',
    '// Ptr returns a pointer to the given value.',
    'func Ptr[T any](v T) *T {',
    '\treturn &v',
    '}',
    '',
    '// NotImplementedError is returned by stub methods that have not been implemented.',
    'type NotImplementedError struct {',
    '\tMethod string',
    '}',
    '',
    'func (e NotImplementedError) Error() string {',
    '\treturn e.Method + " is not implemented"',
    '}',
    '',
    'const maxRetries = 3',
    '',
    'var retryable5xx = map[int]bool{500: true, 502: true, 503: true, 504: true}',
    '',
    '// isIdempotent reports whether a request is safe to repeat after a 5xx. A 5xx',
    '// says nothing about whether the server already applied the request: a',
    '// retried POST or PATCH could apply twice, POST /messages would send the',
    '// message again, and the API has no idempotency key. 429 is safe for any',
    '// method: the request was rejected before it was processed.',
    'func isIdempotent(method string) bool {',
    '\tswitch method {',
    '\tcase "", http.MethodGet, http.MethodHead, http.MethodOptions, http.MethodPut, http.MethodDelete:',
    '\t\treturn true',
    '\t}',
    '\treturn false',
    '}',
    '',
    '// isQueryTimeout reports whether a 504 carries the error code "timeout": the',
    '// server stopped a search because the query is too heavy, and the same query',
    '// would time out again, so it goes back to the caller at once. A 504 from a',
    '// proxy has no such code and is retried. The body is put back for the caller.',
    'func isQueryTimeout(resp *http.Response) bool {',
    '\tif resp.StatusCode != http.StatusGatewayTimeout {',
    '\t\treturn false',
    '\t}',
    '\tbody, err := io.ReadAll(resp.Body)',
    '\tresp.Body.Close()',
    '\tresp.Body = io.NopCloser(bytes.NewReader(body))',
    '\tif err != nil {',
    '\t\treturn false',
    '\t}',
    '\tvar parsed struct {',
    '\t\tErrors []struct {',
    '\t\t\tCode string `json:"code"`',
    '\t\t} `json:"errors"`',
    '\t}',
    '\tif json.Unmarshal(body, &parsed) != nil {',
    '\t\treturn false',
    '\t}',
    '\tfor _, e := range parsed.Errors {',
    '\t\tif e.Code == "timeout" {',
    '\t\t\treturn true',
    '\t\t}',
    '\t}',
    '\treturn false',
    '}',
    '',
    '// Retry-After is a minimum, not an estimate: waiting less lands the retry',
    '// inside a window that is still closed. Jitter only upwards.',
    'func jitter(d time.Duration) time.Duration {',
    '\treturn time.Duration(float64(d) * (1 + rand.Float64()*0.25))',
    '}',
    '',
    '// Only the daily chat limit and the hour-long ban wait longer than a minute.',
    'const maxRetryAfter = 60 * time.Second',
    '',
    'func doWithRetry(client *http.Client, req *http.Request) (*http.Response, error) {',
    '\tfor attempt := 0; ; attempt++ {',
    '\t\tif attempt > 0 && req.GetBody != nil {',
    '\t\t\treq.Body, _ = req.GetBody()',
    '\t\t}',
    '\t\tresp, err := client.Do(req)',
    '\t\tif err != nil {',
    '\t\t\treturn nil, err',
    '\t\t}',
    '\t\tif resp.StatusCode == http.StatusTooManyRequests && attempt < maxRetries {',
    '\t\t\tdelay := time.Duration(1<<uint(attempt)) * time.Second',
    '\t\t\tif ra := resp.Header.Get("Retry-After"); ra != "" {',
    '\t\t\t\tif secs, err := strconv.Atoi(ra); err == nil {',
    '\t\t\t\t\t// A long pause is the daily chat limit or an hour-long ban. Retrying',
    '\t\t\t\t\t// it is pointless, and an early retry doubles the pause: hand the',
    '\t\t\t\t\t// response back so the caller can schedule the work itself.',
    '\t\t\t\t\tif time.Duration(secs)*time.Second > maxRetryAfter {',
    '\t\t\t\t\t\treturn resp, nil',
    '\t\t\t\t\t}',
    '\t\t\t\t\tdelay = time.Duration(secs) * time.Second',
    '\t\t\t\t}',
    '\t\t\t}',
    '\t\t\tresp.Body.Close()',
    '\t\t\ttime.Sleep(jitter(delay))',
    '\t\t\tcontinue',
    '\t\t}',
    '\t\tif retryable5xx[resp.StatusCode] && isIdempotent(req.Method) && attempt < maxRetries && !isQueryTimeout(resp) {',
    '\t\t\tresp.Body.Close()',
    '\t\t\tdelay := jitter(10 * time.Duration(1<<uint(attempt)) * time.Second)',
    '\t\t\ttime.Sleep(delay)',
    '\t\t\tcontinue',
    '\t\t}',
    '\t\treturn resp, nil',
    '\t}',
    '}',
    '',
  ].join('\n');
}

// ── Examples ──────────────────────────────────────────────────────────

// Examples run outside the package: they import it as `pachca`, so every
// SDK name in a literal is qualified.
const GO_PKG = 'pachca.';

/** The type of a literal as an example spells it: SDK names qualified. */
function goExampleType(ft: IRFieldType, asTime = false): string {
  switch (ft.kind) {
    case 'primitive':
      return goPrimitive(ft, { forParam: asTime, forModelField: false, nullable: false });
    case 'enum':
      return ft.ref ? `${GO_PKG}${ft.ref}` : 'string';
    case 'model':
    case 'union':
      if (ft.valueUnion) return `${GO_PKG}${ft.valueUnion}`;
      return ft.ref ? `${GO_PKG}${ft.ref}` : 'any';
    case 'array':
      return `[]${goExampleType(ft.items!, asTime)}`;
    case 'record':
      return `map[string]${goExampleType(ft.valueType!, asTime)}`;
    case 'literal':
      return 'string';
    case 'binary':
      return 'io.Reader';
  }
}

/** A date-time example as a time.Time expression: the SDK types these fields as time.Time. */
function goTimeLiteral(value: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})?$/.exec(value);
  if (!m) return 'time.Now()';
  const [, y, mo, d, h, mi, se, frac, zone] = m;
  const nsec = frac ? Number(frac.padEnd(9, '0').slice(0, 9)) : 0;
  let loc = 'time.UTC';
  if (zone && zone !== 'Z') {
    const sign = zone[0] === '-' ? -1 : 1;
    const zh = Number(zone.slice(1, 3));
    const zm = Number(zone.slice(4, 6));
    if (zh !== 0 || zm !== 0) {
      const secs = zm === 0 ? `${sign < 0 ? '-' : ''}${zh}*60*60` : String(sign * (zh * 3600 + zm * 60));
      loc = `time.FixedZone("", ${secs})`;
    }
  }
  return `time.Date(${Number(y)}, ${Number(mo)}, ${Number(d)}, ${Number(h)}, ${Number(mi)}, ${Number(se)}, ${nsec}, ${loc})`;
}

/** A union literal: the union struct with its first member set. */
function goUnionLiteral(
  unionName: string,
  memberRef: string,
  ir: IR,
  models: Map<string, IRModel>,
  visited: Set<string>,
  indent: number,
): string {
  return `${GO_PKG}${unionName}{${memberRef}: &${goModelLiteral(memberRef, ir, models, visited, indent)}}`;
}

/**
 * `asTime`: a date-time string here is a time.Time in the SDK — a query
 * parameter, or a model field that is not nullable (see goPrimitive).
 */
function goLiteral(
  ft: IRFieldType,
  ir: IR,
  models: Map<string, IRModel>,
  visited: Set<string> = new Set(),
  indent: number = 0,
  asTime: boolean = false,
): string {
  const isTime = ft.kind === 'primitive' && ft.primitive === 'string' && ft.format === 'date-time' && asTime;
  if (ft.example !== undefined) {
    if (ft.kind === 'primitive') {
      if ((ft.primitive === 'integer' || ft.primitive === 'number') && typeof ft.example === 'number') {
        if (ft.primitive === 'integer') return ft.format === 'int64' ? `int64(${ft.example})` : `int32(${ft.example})`;
        return String(ft.example);
      }
      if (ft.primitive === 'boolean' && typeof ft.example === 'boolean') return String(ft.example);
      if (ft.primitive === 'string' && typeof ft.example === 'string') {
        return isTime ? goTimeLiteral(ft.example) : JSON.stringify(ft.example);
      }
    }
    if (ft.kind === 'enum' && typeof ft.example === 'string') {
      const e = ir.enums.find((en) => en.name === ft.ref);
      const member = e?.members.find((m) => m.value === ft.example);
      if (e && member) return `${GO_PKG}${e.name}${goExportName(member.value)}`;
    }
  }
  switch (ft.kind) {
    case 'primitive': {
      if (ft.primitive === 'integer') return ft.format === 'int64' ? 'int64(123)' : 'int32(123)';
      if (ft.primitive === 'number') return '1.5';
      if (ft.primitive === 'boolean') return 'true';
      if (ft.primitive === 'any') return 'map[string]any{}';
      if (ft.primitive === 'string') {
        if (ft.format === 'date-time') return isTime ? goTimeLiteral('2024-01-01T00:00:00Z') : '"2024-01-01T00:00:00Z"';
        if (ft.format === 'date') return '"2024-01-01"';
      }
      return '"example"';
    }
    case 'enum': {
      const e = ir.enums.find((en) => en.name === ft.ref);
      if (e && e.members.length > 0) {
        return `${GO_PKG}${e.name}${goExportName(e.members[0].value)}`;
      }
      return ft.ref ? `${GO_PKG}${ft.ref}("example")` : '"example"';
    }
    case 'model': {
      const u = ir.unions.find((un) => un.name === ft.ref);
      if (u && u.memberRefs.length > 0) {
        return goUnionLiteral(u.name, u.memberRefs[0], ir, models, visited, indent);
      }
      return goModelLiteral(ft.ref ?? 'any', ir, models, visited, indent);
    }
    case 'array':
      return `[]${goExampleType(ft.items!, asTime)}{${goLiteral(ft.items!, ir, models, visited, indent, asTime)}}`;
    case 'record':
      return `map[string]${goExampleType(ft.valueType!, asTime)}{"key": ${goLiteral(ft.valueType!, ir, models, visited, indent, asTime)}}`;
    case 'union': {
      if (ft.valueUnion && ft.members) {
        const m = ft.members[0];
        const value = goLiteral(m, ir, models, visited, indent, false);
        const member = m.kind === 'array' ? value : m.kind === 'model' ? `&${value}` : `${GO_PKG}Ptr(${value})`;
        return `${GO_PKG}${ft.valueUnion}{${valueUnionMemberName(m)}: ${member}}`;
      }
      const u = ir.unions.find((un) => un.name === ft.ref);
      if (u && u.memberRefs.length > 0) {
        return goUnionLiteral(u.name, u.memberRefs[0], ir, models, visited, indent);
      }
      return `${GO_PKG}${ft.ref ?? 'any'}{}`;
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
  if (visited.has(modelName)) return `${GO_PKG}${modelName}{}`;
  const model = models.get(modelName);
  if (!model || model.fields.length === 0) return `${GO_PKG}${modelName}{}`;

  const nextVisited = new Set(visited);
  nextVisited.add(modelName);

  const isCyclic = (f: IRField) =>
    f.type.kind === 'model' && f.type.ref != null && nextVisited.has(f.type.ref);
  const fields = model.fields.filter(
    (f) => (f.type.kind !== 'binary' || f.required) && !(isCyclic(f) && (!f.required || f.nullable)),
  );
  if (fields.length === 0) return `${GO_PKG}${modelName}{}`;

  const childIndent = indent + 1;
  const pad = '\t'.repeat(childIndent);
  const closePad = '\t'.repeat(indent);

  const entries = fields.map((f) => {
    const name = goExportName(f.name);
    const opt = isOptionalField(f) &&
      !isOpenValue(f) &&
      (f.type.kind === 'primitive' || f.type.kind === 'model' || f.type.kind === 'enum' || f.type.kind === 'union');
    // A model field holds time.Time unless it is nullable (goFieldInfo).
    const value = goLiteral(f.type, ir, models, nextVisited, childIndent, !f.nullable);
    if (opt) {
      return `${name}: ${GO_PKG}Ptr(${value})`;
    }
    return `${name}: ${value}`;
  });

  return `${GO_PKG}${modelName}{\n${entries.map((e) => `${pad}${e},`).join('\n')}\n${closePad}}`;
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
      return ft.valueUnion ?? ft.ref ?? 'any';
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
    // A date-time field is time.Time unless nullable, as in the struct itself (goFieldInfo).
    const type = f.type.kind === 'primitive'
      ? goType(f.type, { forModelField: true, nullable: f.nullable })
      : goFingerprint(f.type, ir, models, nextVisited);
    const opt = isOptionalField(f) && !isOpenValue(f) ? '*' : '';
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
  if (resp.isBinary) return '[]byte';
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

  // A single object with meta: both sides spelled out, the object as an unwrapped method shows it.
  if (resp.isSingleWithMeta && resp.responseRef) {
    const rt = ir.responses.find((r) => r.name === resp.responseRef);
    if (rt) {
      const fp = (ref: string): string => {
        const model = models.get(ref);
        return model ? goModelFp(model, ir, models, new Set()) : ref;
      };
      const parts: string[] = [`Data: ${fp(rt.dataRef)}`];
      if (rt.metaRef) {
        const opt = rt.metaIsRequired ? '' : '*';
        parts.push(`Meta: ${opt}${fp(rt.metaRef)}`);
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
    const body = bodyExample(rb, ir, models);
    if (shouldUnwrapBody(rb) && rb.unwrapField) {
      const sdkName = snakeToCamel(rb.unwrapField.name);
      params.push({ name: sdkName, value: goLiteral(body.type, body.ir, body.models), isNamed: false });
      for (const r of collectTypeRefs(body.type, body.ir, body.models)) imports.add(r);
    } else if (rb.schemaRef) {
      params.push({ name: 'request', value: goLiteral(body.type, body.ir, body.models), isNamed: false });
      for (const r of collectTypeRefs(body.type, body.ir, body.models)) imports.add(r);
    }
  }

  if (op.queryParams.length > 0) {
    const pName = `${upperFirst(op.methodName)}Params`;
    imports.add(pName);
    const hasReq = op.queryParams.some((p) => p.required);

    const qEntries = op.queryParams.map((p) => {
      const name = goExportName(p.sdkName);
      const opt = !p.required && (p.type.kind !== 'array' && p.type.kind !== 'record');
      // A date-time query parameter is a time.Time in the params struct.
      const value = goLiteral(p.type, ir, models, new Set(), 0, true);
      for (const r of collectTypeRefs(p.type, ir, models)) imports.add(r);
      if (opt) {
        return `${name}: ${GO_PKG}Ptr(${value})`;
      }
      return `${name}: ${value}`;
    });

    const paramsLiteral = `${hasReq ? '' : '&'}${GO_PKG}${pName}{\n${qEntries.map((e) => `\t${e},`).join('\n')}\n}`;
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

  // Every method takes a context first: the init gives the examples their ctx.
  result['Client_Init'] = {
    usage: 'client := pachca.NewPachcaClient("YOUR_TOKEN")\nctx := context.Background()',
    imports: ['PachcaClient'],
  };

  for (const svc of ir.services) {
    if (svc.deprecated) continue; // backward-compat alias service — document new names only
    const serviceField = goServiceField(svc.tag);
    for (const op of svc.operations) {
      if (op.isAlias) continue; // alias op — documented under its new service
      const ex = goBuildOperationExample(op, ir, models, serviceField);
      const entry: Record<string, unknown> = { usage: ex.usage };
      if (ex.output) entry.output = ex.output;
      if (ex.imports.length > 0) entry.imports = ex.imports;
      const named = namedBodyExamples(op, (o) => goBuildOperationExample(o, ir, models, serviceField));
      if (named) entry.examples = named;
      result[op.operationId] = entry;
      if (op.methodName === 'getWebhookEvents' && op.successResponse.dataRef === 'WebhookEvent') {
        result[`${op.operationId}_pollWebhookEvents`] = {
          usage: `err := client.${serviceField}.PollWebhookEvents(ctx, nil, func(event pachca.WebhookEvent) error {\n\t_ = event\n\treturn nil\n})`,
        };
        result[`${op.operationId}_pollWebhookPayloads`] = {
          usage: `err := client.${serviceField}.PollWebhookPayloads(ctx, nil, func(payload pachca.WebhookPayloadUnion) error {\n\t_ = payload\n\treturn nil\n})`,
        };
      }
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
