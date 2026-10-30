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
import { bodyExample, buildModelIndex, collectTypeRefs, namedBodyExamples, nullableOptionalFields, requestModelNames, type GeneratedFile, type GenerateOptions, type LanguageGenerator } from './types.js';
import { snakeToCamel, tagToProperty, tagToServiceName, serviceToImplName } from '../naming.js';

const SWIFT_KEYWORDS = new Set([
  'as', 'break', 'case', 'catch', 'class', 'continue', 'default', 'defer', 'do', 'else',
  'enum', 'extension', 'fallthrough', 'false', 'for', 'func', 'guard', 'if', 'import', 'in',
  'init', 'inout', 'internal', 'is', 'let', 'nil', 'operator', 'private', 'protocol', 'public',
  'repeat', 'rethrows', 'return', 'self', 'static', 'struct', 'subscript', 'super', 'switch',
  'throw', 'throws', 'true', 'try', 'typealias', 'var', 'where', 'while',
]);

function swiftIdentifier(name: string): string {
  const camel = snakeToCamel(name.replace(/[-:]/g, '_'));
  if (SWIFT_KEYWORDS.has(camel)) return `\`${camel}\``;
  return camel;
}

function swiftType(ft: IRFieldType, opts: { nullable?: boolean } = {}): string {
  let base: string;
  switch (ft.kind) {
    case 'primitive':
      if (ft.primitive === 'integer') base = ft.format === 'int64' ? 'Int64' : 'Int';
      else if (ft.primitive === 'number') base = 'Double';
      else if (ft.primitive === 'boolean') base = 'Bool';
      else if (ft.primitive === 'any') base = 'AnyCodable';
      else base = 'String';
      break;
    case 'enum':
    case 'model':
    case 'union':
      base = ft.ref ?? 'String';
      break;
    case 'array':
      base = `[${swiftType(ft.items!)}]`;
      break;
    case 'record':
      base = `[String: ${swiftType(ft.valueType!)}]`;
      break;
    case 'literal':
      base = 'String';
      break;
    case 'binary':
      base = 'Data';
      break;
  }
  return opts.nullable ? `${base}?` : base;
}

function isOptionalField(field: IRField): boolean {
  return !field.required || field.nullable;
}

/** The enum type of `OAuthError.error`, when the spec gives that field one. */
function oauthErrorCodeEnum(ir: IR): IREnum | undefined {
  const field = ir.models.find((m) => m.name === 'OAuthError')?.fields.find((f) => f.name === 'error');
  return field?.type.kind === 'enum' ? ir.enums.find((e) => e.name === field.type.ref) : undefined;
}

/**
 * An open enum keeps a value the SDK does not list yet in its catch-all case,
 * where a `String` raw-value enum would fail the whole response. `rawValue`,
 * `init?(rawValue:)` and `allCases` keep the shape of a raw-value enum, and a
 * string literal converts into it, so a field that was a `String` still compares
 * with `"insufficient_scope"`.
 */
function emitOpenEnum(lines: string[], e: IREnum): void {
  const cases = e.members.map((m) => ({ id: swiftIdentifier(m.value), value: m.value, description: m.description }));
  const unknown = cases.some((c) => c.id === 'unknown') ? 'unknownValue' : 'unknown';
  lines.push(`public enum ${e.name}: Codable, Hashable, RawRepresentable, CaseIterable, ExpressibleByStringLiteral, Sendable {`);
  for (const c of cases) {
    if (c.description) lines.push(`    /// ${c.description}`);
    lines.push(`    case ${c.id}`);
  }
  lines.push('    /// A value this SDK version does not list yet');
  lines.push(`    case ${unknown}(String)`);
  lines.push('');
  lines.push('    /// Every value this SDK version lists');
  lines.push(`    public static let allCases: [${e.name}] = [${cases.map((c) => `.${c.id}`).join(', ')}]`);
  lines.push('');
  lines.push('    public init(_ rawValue: String) {');
  lines.push('        switch rawValue {');
  for (const c of cases) lines.push(`        case ${JSON.stringify(c.value)}: self = .${c.id}`);
  lines.push(`        default: self = .${unknown}(rawValue)`);
  lines.push('        }');
  lines.push('    }');
  lines.push('');
  lines.push('    public init?(rawValue: String) { self.init(rawValue) }');
  lines.push('');
  lines.push('    public init(stringLiteral value: String) { self.init(value) }');
  lines.push('');
  lines.push('    public var rawValue: String {');
  lines.push('        switch self {');
  for (const c of cases) lines.push(`        case .${c.id}: return ${JSON.stringify(c.value)}`);
  lines.push(`        case .${unknown}(let value): return value`);
  lines.push('        }');
  lines.push('    }');
  lines.push('');
  lines.push('    public init(from decoder: Decoder) throws {');
  lines.push('        self.init(try decoder.singleValueContainer().decode(String.self))');
  lines.push('    }');
  lines.push('');
  lines.push('    public func encode(to encoder: Encoder) throws {');
  lines.push('        var container = encoder.singleValueContainer()');
  lines.push('        try container.encode(rawValue)');
  lines.push('    }');
  lines.push('}');
}

function emitEnum(lines: string[], e: IREnum): void {
  if (e.open) {
    emitOpenEnum(lines, e);
    return;
  }
  lines.push(`public enum ${e.name}: String, Codable, CaseIterable {`);
  for (const m of e.members) {
    const id = swiftIdentifier(m.value);
    const caseDecl = id === m.value ? `case ${id}` : `case ${id} = ${JSON.stringify(m.value)}`;
    if (m.description) lines.push(`    /// ${m.description}`);
    lines.push(`    ${caseDecl}`);
  }
  lines.push('}');
}

function emitCodingKeys(lines: string[], fields: IRField[], force = false): void {
  const needs = force || fields.some((f) => swiftIdentifier(f.name) !== f.name);
  if (!needs) return;
  lines.push('');
  lines.push('    enum CodingKeys: String, CodingKey {');
  for (const f of fields) {
    const id = swiftIdentifier(f.name);
    if (id === f.name) lines.push(`        case ${id}`);
    else lines.push(`        case ${id} = ${JSON.stringify(f.name)}`);
  }
  lines.push('    }');
}

function fieldRefsModel(ft: IRFieldType, modelName: string): boolean {
  if (ft.kind === 'model' && ft.ref === modelName) return true;
  if (ft.kind === 'array' && ft.items) return fieldRefsModel(ft.items, modelName);
  if (ft.kind === 'record' && ft.valueType) return fieldRefsModel(ft.valueType, modelName);
  return false;
}

function fieldHasAny(ft: IRFieldType): boolean {
  if (ft.kind === 'primitive' && ft.primitive === 'any') return true;
  if (ft.items) return fieldHasAny(ft.items);
  if (ft.valueType) return fieldHasAny(ft.valueType);
  return false;
}

function irNeedsAnyCodable(ir: IR): boolean {
  return ir.models.some((m) => m.fields.some((f) => fieldHasAny(f.type)));
}

function isSelfReferencing(m: IRModel): boolean {
  return m.fields.some((f) => fieldRefsModel(f.type, m.name));
}

/** The name a caller writes in nullFields: the property name, without the backticks a keyword takes. */
function nullFieldName(f: IRField): string {
  return swiftIdentifier(f.name).replace(/`/g, '');
}

/**
 * A request model with fields the API takes as null carries nullFields and its own
 * encode(to:): an unset field stays out of the body, a field named in nullFields
 * goes out as null whatever value it holds, and a name the model does not take as
 * null throws EncodingError before the request is sent.
 */
function emitNullFieldsEncode(lines: string[], m: IRModel, nullable: IRField[]): void {
  const names = nullable.map((f) => JSON.stringify(nullFieldName(f))).join(', ');
  lines.push('');
  lines.push('    public func encode(to encoder: Encoder) throws {');
  lines.push(`        if let unknown = nullFields.subtracting([${names}]).sorted().first {`);
  lines.push('            throw EncodingError.invalidValue(nullFields, EncodingError.Context(');
  lines.push('                codingPath: encoder.codingPath,');
  lines.push(`                debugDescription: "${m.name}: field \\"\\(unknown)\\" cannot be sent as null"`);
  lines.push('            ))');
  lines.push('        }');
  lines.push('        var container = encoder.container(keyedBy: CodingKeys.self)');
  for (const f of m.fields) {
    const id = swiftIdentifier(f.name);
    const optional = !f.required || f.nullable;
    const write = optional
      ? `try container.encodeIfPresent(${id}, forKey: .${id})`
      : `try container.encode(${id}, forKey: .${id})`;
    if (nullable.includes(f)) {
      lines.push(`        if nullFields.contains("${nullFieldName(f)}") {`);
      lines.push(`            try container.encodeNil(forKey: .${id})`);
      lines.push('        } else {');
      lines.push(`            ${write}`);
      lines.push('        }');
    } else {
      lines.push(`        ${write}`);
    }
  }
  lines.push('    }');
}

function emitModel(lines: string[], m: IRModel, allModels: IRModel[], withNullFields = false): void {
  const nullable = withNullFields ? nullableOptionalFields(m) : [];
  const proto = m.isError ? 'Codable, Error' : 'Codable';
  const keyword = isSelfReferencing(m) ? 'class' : 'struct';
  lines.push(`public ${keyword} ${m.name}: ${proto} {`);
  if (m.fields.length === 0) {
    lines.push('}');
    return;
  }
  const fieldInfos: { name: string; type: string; optional: boolean; mutable: boolean }[] = [];
  for (const f of m.fields) {
    const name = swiftIdentifier(f.name);
    const optional = !f.required || f.nullable;
    const t = swiftType(f.type, { nullable: optional || f.nullable });
    const mutable = f.type.kind === 'binary';
    lines.push(`    public ${mutable ? 'var' : 'let'} ${name}: ${t}`);
    fieldInfos.push({ name, type: t, optional, mutable });
  }
  if (m.name === 'ApiError') {
    // Not in the body: the client sets it, so CodingKeys below leave it out.
    lines.push('    /// HTTP status code of the answer, set by the client. An empty body or one that is not JSON leaves errors empty.');
    lines.push('    public var statusCode: Int?');
    fieldInfos.push({ name: 'statusCode', type: 'Int?', optional: true, mutable: true });
  }
  if (nullable.length > 0) {
    // Not in the body: CodingKeys below leave it out.
    lines.push(`    /// Fields to send as null: ${nullable.map(nullFieldName).join(', ')}. An unset field stays out of the body.`);
    lines.push('    public var nullFields: Set<String> = []');
  }
  // Generate public memberwise init
  lines.push('');
  const initParams = fieldInfos.map((fi) => {
    const defaultVal = fi.optional ? ' = nil' : '';
    return `${fi.name}: ${fi.type}${defaultVal}`;
  });
  if (nullable.length > 0) initParams.push('nullFields: Set<String> = []');
  lines.push(`    public init(${initParams.join(', ')}) {`);
  for (const fi of fieldInfos) {
    lines.push(`        self.${fi.name} = ${fi.name}`);
  }
  if (nullable.length > 0) lines.push('        self.nullFields = nullFields');
  lines.push('    }');
  if (nullable.length > 0) emitNullFieldsEncode(lines, m, nullable);

  if (m.name === 'ApiError') {
    const errorsField = m.fields.find((f) => f.name === 'errors');
    const itemsRef = errorsField?.type.kind === 'array' && errorsField.type.items?.kind === 'model'
      ? errorsField.type.items.ref
      : undefined;
    const itemsModel = itemsRef ? allModels.find((am) => am.name === itemsRef) : undefined;
    const hasMessage = itemsModel?.fields.some((f) => f.name === 'message');

    if (hasMessage) {
      lines.push('');
      lines.push('    public var localizedDescription: String {');
      lines.push('        guard !errors.isEmpty else { return statusCode.map { "HTTP \\($0)" } ?? "api error" }');
      lines.push('        if errors.count == 1 { return errors[0].message }');
      lines.push('        return "Errors: " + errors.map(\\.message).joined(separator: "; ")');
      lines.push('    }');
    }
  }
  if (m.name === 'OAuthError') {
    const errField = m.fields.find((f) => f.name === 'error');
    if (errField) {
      lines.push('');
      const code = errField.type.kind === 'enum' ? `${swiftIdentifier(errField.name)}.rawValue` : swiftIdentifier(errField.name);
      lines.push(`    public var localizedDescription: String { ${code} }`);
    }
  }

  emitCodingKeys(lines, m.fields, m.name === 'ApiError' || nullable.length > 0);
  lines.push('}');
}

/** Union whose members share no discriminator: try the members in the order they match the payload keys. */
function emitStructuralUnion(lines: string[], u: IRUnion, models: IRModel[]): void {
  lines.push(`public enum ${u.name}: Codable {`);
  for (const ref of u.memberRefs) {
    const c = ref.charAt(0).toLowerCase() + ref.slice(1);
    lines.push(`    case ${c}(${ref})`);
  }
  lines.push('');
  // The same order as the other SDKs: most payload keys recognised, then fewest
  // unrecognised, then fewest declared, a tie keeping the declared order. A
  // member that fits the keys but misses a required one or holds a value of
  // another type gives way to the next.
  lines.push('    private struct AnyKey: CodingKey {');
  lines.push('        let stringValue: String');
  lines.push('        var intValue: Int? { nil }');
  lines.push('        init?(stringValue: String) { self.stringValue = stringValue }');
  lines.push('        init?(intValue: Int) { nil }');
  lines.push('    }');
  lines.push('');
  lines.push('    public init(from decoder: Decoder) throws {');
  lines.push(`        // ${u.name} carries no discriminator field: members are tried in the order`);
  lines.push('        // they match the payload keys, and the first one that decodes wins.');
  lines.push(`        let shapes: [(keys: Set<String>, decode: (Decoder) throws -> ${u.name})] = [`);
  for (const ref of u.memberRefs) {
    const c = ref.charAt(0).toLowerCase() + ref.slice(1);
    const keys = (models.find((m) => m.name === ref)?.fields ?? []).map((f) => JSON.stringify(f.name));
    const set = keys.length > 0 ? `[${keys.join(', ')}]` : '[]';
    lines.push(`            (${set}, { .${c}(try ${ref}(from: $0)) }),`);
  }
  lines.push('        ]');
  lines.push('        let keys = Set((try? decoder.container(keyedBy: AnyKey.self))?.allKeys.map(\\.stringValue) ?? [])');
  lines.push('        let ranked = shapes.indices.sorted { a, b in');
  lines.push('            let matchedA = keys.intersection(shapes[a].keys).count');
  lines.push('            let matchedB = keys.intersection(shapes[b].keys).count');
  lines.push('            if matchedA != matchedB { return matchedA > matchedB }');
  lines.push('            if shapes[a].keys.count != shapes[b].keys.count { return shapes[a].keys.count < shapes[b].keys.count }');
  lines.push('            return a < b');
  lines.push('        }');
  lines.push('        var firstError: Error?');
  lines.push('        for index in ranked {');
  lines.push('            do {');
  lines.push('                self = try shapes[index].decode(decoder)');
  lines.push('                return');
  lines.push('            } catch {');
  lines.push('                if firstError == nil { firstError = error }');
  lines.push('            }');
  lines.push('        }');
  lines.push('        throw firstError ?? DecodingError.dataCorrupted(');
  lines.push(`            DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "No ${u.name} member matched the payload")`);
  lines.push('        )');
  lines.push('    }');
  lines.push('');
  lines.push('    public func encode(to encoder: Encoder) throws {');
  lines.push('        switch self {');
  for (const ref of u.memberRefs) {
    const c = ref.charAt(0).toLowerCase() + ref.slice(1);
    lines.push(`        case .${c}(let value):`);
    lines.push('            try value.encode(to: encoder)');
  }
  lines.push('        }');
  lines.push('    }');
  lines.push('}');
}

function emitUnion(lines: string[], u: IRUnion, models: IRModel[]): void {
  const discField = u.discriminatorField;
  if (!discField) {
    emitStructuralUnion(lines, u, models);
    return;
  }
  const discSwiftName = snakeToCamel(discField.replace(/[-:]/g, '_'));
  lines.push(`public enum ${u.name}: Codable {`);
  for (const ref of u.memberRefs) {
    const c = ref.charAt(0).toLowerCase() + ref.slice(1);
    lines.push(`    case ${c}(${ref})`);
  }
  lines.push('');
  lines.push('    private enum CodingKeys: String, CodingKey {');
  if (discSwiftName === discField) {
    lines.push(`        case ${discSwiftName}`);
  } else {
    lines.push(`        case ${discSwiftName} = ${JSON.stringify(discField)}`);
  }
  if (u.unionDeserializer === 'webhook-payload') {
    lines.push('        case event');
  }
  lines.push('    }');
  lines.push('');
  lines.push('    public init(from decoder: Decoder) throws {');
  lines.push('        let container = try decoder.container(keyedBy: CodingKeys.self)');
  lines.push(`        let type = try container.decode(String.self, forKey: .${discSwiftName})`);
  if (u.unionDeserializer === 'webhook-payload') {
    lines.push('        let event = try? container.decode(String.self, forKey: .event)');
    lines.push('        switch (type, event) {');
    lines.push('        case ("message", "link_shared"):');
    lines.push('            self = .linkSharedWebhookPayload(try LinkSharedWebhookPayload(from: decoder))');
    lines.push('        case ("message", _):');
    lines.push('            self = .messageWebhookPayload(try MessageWebhookPayload(from: decoder))');
    for (const ref of u.memberRefs.filter((ref) => ref !== 'MessageWebhookPayload' && ref !== 'LinkSharedWebhookPayload')) {
      const c = ref.charAt(0).toLowerCase() + ref.slice(1);
      const model = models.find((m) => m.name === ref);
      const typeField = model?.fields.find(
        (f) => f.name === discField && f.type.kind === 'literal',
      ) ?? model?.fields.find((f) => f.type.kind === 'literal');
      const disc = typeField?.type.literalValue ?? c;
      lines.push(`        case (${JSON.stringify(disc)}, _):`);
      lines.push(`            self = .${c}(try ${ref}(from: decoder))`);
    }
  } else {
    lines.push('        switch type {');
    const seenDiscs = new Set<string>();
    for (const ref of u.memberRefs) {
      const c = ref.charAt(0).toLowerCase() + ref.slice(1);
      const model = models.find((m) => m.name === ref);
      const typeField = model?.fields.find(
        (f) => f.name === discField && f.type.kind === 'literal',
      ) ?? model?.fields.find((f) => f.type.kind === 'literal');
      const disc = typeField?.type.literalValue ?? c;
      if (seenDiscs.has(String(disc))) continue;
      seenDiscs.add(String(disc));
      lines.push(`        case ${JSON.stringify(disc)}:`);
      lines.push(`            self = .${c}(try ${ref}(from: decoder))`);
    }
  }
  lines.push('        default:');
  lines.push('            throw DecodingError.dataCorrupted(');
  lines.push('                DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Unknown type: \\(type)")');
  lines.push('            )');
  lines.push('        }');
  lines.push('    }');
  lines.push('');
  lines.push('    public func encode(to encoder: Encoder) throws {');
  lines.push('        switch self {');
  for (const ref of u.memberRefs) {
    const c = ref.charAt(0).toLowerCase() + ref.slice(1);
    lines.push(`        case .${c}(let value):`);
    lines.push('            try value.encode(to: encoder)');
  }
  lines.push('        }');
  lines.push('    }');
  lines.push('}');
}

const FOUNDATION_IMPORTS = [
  'import Foundation',
  '#if canImport(FoundationNetworking)',
  'import FoundationNetworking',
  '#endif',
];

function generateModels(ir: IR): string {
  const lines: string[] = [];
  const wrappers = new Set<string>();
  lines.push(...FOUNDATION_IMPORTS);
  lines.push('');

  for (const e of ir.enums) {
    emitEnum(lines, e);
    lines.push('');
  }
  const requestModels = requestModelNames(ir);
  for (const m of ir.models) {
    for (const inl of m.inlineObjects) {
      emitModel(lines, inl, ir.models, requestModels.has(inl.name));
      lines.push('');
    }
    emitModel(lines, m, ir.models, requestModels.has(m.name));
    lines.push('');
  }
  for (const u of ir.unions) {
    emitUnion(lines, u, ir.models);
    lines.push('');
  }
  for (const rt of ir.responses) {
    const dataType = rt.dataIsArray ? `[${rt.dataRef}]` : rt.dataRef;
    const metaType = rt.metaRef ? `${rt.metaRef}${rt.metaIsRequired ? '' : '?'}` : undefined;
    lines.push(`public struct ${rt.name}: Codable {`);
    lines.push(`    public let data: ${dataType}`);
    // No default for an optional meta: Codable skips a `let` that has an initial value.
    if (metaType) lines.push(`    public let meta: ${metaType}`);
    // Public memberwise init, as every model has: a service stub in tests builds the response with it.
    lines.push('');
    const initParams = [`data: ${dataType}`];
    if (metaType) initParams.push(`meta: ${metaType}${rt.metaIsRequired ? '' : ' = nil'}`);
    lines.push(`    public init(${initParams.join(', ')}) {`);
    lines.push('        self.data = data');
    if (metaType) lines.push('        self.meta = meta');
    lines.push('    }');
    lines.push('}');
    lines.push('');
  }
  for (const s of ir.services) {
    for (const op of s.operations) {
      if (op.successResponse.isUnwrap && op.successResponse.dataRef) wrappers.add(op.successResponse.dataRef);
    }
  }
  for (const ref of wrappers) {
    lines.push(`struct ${ref}DataWrapper: Codable {`);
    lines.push(`    let data: ${ref}`);
    lines.push('}');
    lines.push('');
  }

  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  lines.push('');
  return lines.join('\n');
}

function opReturn(op: IROperation, ir: IR): string {
  if (op.successResponse.isRedirect) return 'String';
  if (op.successResponse.isBinary) return 'Data';
  if (!op.successResponse.hasBody) return 'Void';
  if (op.successResponse.isList || op.successResponse.isSingleWithMeta) {
    const rt = ir.responses.find((r) => r.name === op.successResponse.responseRef);
    return rt?.name ?? 'String';
  }
  return op.successResponse.dataRef ?? 'String';
}

function emitOperation(lines: string[], op: IROperation, ir: IR, fnPrefix = 'public func'): void {
  const args: string[] = [];
  if (op.externalUrl) {
    args.push(`${op.externalUrl}: String`);
  }
  for (const p of op.pathParams) args.push(`${snakeToCamel(p.sdkName)}: ${swiftType(p.type)}`);
  if (op.requestBody) {
    const rb = op.requestBody;
    if (shouldUnwrapBody(rb)) {
      const f = rb.unwrapField!;
      args.push(`${swiftIdentifier(f.name)}: ${swiftType(f.type)}`);
    } else if (rb.schemaRef) {
      args.push(`request body: ${rb.schemaRef}`);
    }
  }
  for (const q of op.queryParams) {
    const t = swiftType(q.type, { nullable: !q.required });
    args.push(`${snakeToCamel(q.sdkName)}: ${t}${q.required ? '' : ' = nil'}`);
  }

  if (op.deprecated) lines.push('    @available(*, deprecated)');
  lines.push(`    ${fnPrefix} ${op.methodName}(${args.join(', ')}) async throws -> ${opReturn(op, ir)} {`);
  if (op.queryParams.length > 0) {
    let swiftUrlBase = op.externalUrl ? `\\(${op.externalUrl})` : `\\(baseURL)${op.path}`;
    for (const p of op.pathParams) {
      swiftUrlBase = swiftUrlBase.replace(`{${p.name}}`, `\\(${snakeToCamel(p.sdkName)})`);
    }
    lines.push(`        var components = URLComponents(string: "${swiftUrlBase}")!`);
    lines.push('        var queryItems: [URLQueryItem] = []');
    for (const q of op.queryParams) {
      const n = snakeToCamel(q.sdkName);
      const isEnum = q.type.kind === 'enum';
      const isModel = q.type.kind === 'model' || q.type.kind === 'record';
      function valueExpr(varName: string): string {
        if (isEnum) return `${varName}.rawValue`;
        if (isModel) return `String(data: try serialize(${varName}), encoding: .utf8)!`;
        return `String(${varName})`;
      }
      const isArray = q.type.kind === 'array';
      if (q.isArray || isArray) {
        const itemIsEnum = q.type.kind === 'array' && q.type.items?.kind === 'enum';
        const itemExpr = itemIsEnum ? '$0.rawValue' : 'String($0)';
        if (q.required) {
          lines.push(`        ${n}.forEach { queryItems.append(URLQueryItem(name: ${JSON.stringify(q.name)}, value: ${itemExpr})) }`);
        } else {
          lines.push(`        if let ${n} { ${n}.forEach { queryItems.append(URLQueryItem(name: ${JSON.stringify(q.name)}, value: ${itemExpr})) } }`);
        }
      } else if (q.required) {
        lines.push(`        queryItems.append(URLQueryItem(name: ${JSON.stringify(q.name)}, value: ${valueExpr(n)}))`);
      } else {
        lines.push(`        if let ${n} { queryItems.append(URLQueryItem(name: ${JSON.stringify(q.name)}, value: ${valueExpr(n)})) }`);
      }
    }
    lines.push('        if !queryItems.isEmpty { components.queryItems = queryItems }');
    lines.push('        var request = URLRequest(url: components.url!)');
  } else {
    let url: string;
    if (op.externalUrl) {
      url = `"\\(${op.externalUrl})"`;
    } else {
      url = `"\\(baseURL)${op.path}"`;
      for (const p of op.pathParams) {
        url = url.replace(`{${p.name}}`, `\\(${snakeToCamel(p.sdkName)})`);
      }
    }
    lines.push(`        var request = URLRequest(url: URL(string: ${url})!)`);
  }
  if (op.method !== 'GET') lines.push(`        request.httpMethod = ${JSON.stringify(op.method)}`);
  if (!op.noAuth) lines.push('        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }');
  for (const h of op.requestHeaders ?? []) {
    lines.push(`        request.setValue(${JSON.stringify(h.value)}, forHTTPHeaderField: ${JSON.stringify(h.name)})`);
  }

  if (op.requestBody?.contentType === 'form') {
    const rb = op.requestBody!;
    lines.push('        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")');
    if (shouldUnwrapBody(rb)) {
      const f = rb.unwrapField!;
      lines.push(`        request.httpBody = Data("${f.name}=\\(pachcaFormEncode(String(describing: ${swiftIdentifier(f.name)})))".utf8)`);
    } else {
      lines.push('        request.httpBody = try pachcaFormBody(body)');
    }
  }

  if (op.requestBody?.contentType === 'json') {
    const rb = op.requestBody!;
    lines.push('        request.setValue("application/json", forHTTPHeaderField: "Content-Type")');
    if (shouldUnwrapBody(rb)) {
      const f = rb.unwrapField!;
      const varName = swiftIdentifier(f.name);
      let valueExpr = varName;
      if (f.type.kind === 'enum') {
        valueExpr = `${varName}.rawValue`;
      } else if (f.type.kind === 'array' && f.type.items?.kind === 'enum') {
        valueExpr = `${varName}.map { $0.rawValue }`;
      }
      lines.push(`        request.httpBody = try JSONSerialization.data(withJSONObject: [${JSON.stringify(f.name)}: ${valueExpr}])`);
    } else {
      lines.push('        request.httpBody = try serialize(body)');
    }
  }

  if (op.requestBody?.contentType === 'multipart') {
    lines.push('        let boundary = UUID().uuidString');
    lines.push('        request.setValue("multipart/form-data; boundary=\\(boundary)", forHTTPHeaderField: "Content-Type")');
    lines.push('        var data = Data()');
    lines.push('        func appendField(_ name: String, _ value: String) {');
    lines.push('            data.append("--\\(boundary)\\r\\n".data(using: .utf8)!)');
    lines.push('            data.append("Content-Disposition: form-data; name=\\"\\(name)\\"\\r\\n\\r\\n".data(using: .utf8)!)');
    lines.push('            data.append("\\(value)\\r\\n".data(using: .utf8)!)');
    lines.push('        }');
    const req = ir.models.find((m) => m.name === op.requestBody!.schemaRef);
    const isUnwrapped = shouldUnwrapBody(op.requestBody!);
    if (req) {
      for (const f of req.fields.filter((x) => x.type.kind !== 'binary')) {
        const n = swiftIdentifier(f.name);
        const ref = isUnwrapped ? n : `body.${n}`;
        if (isOptionalField(f)) lines.push(`        if let v = ${ref} { appendField(${JSON.stringify(f.name)}, String(describing: v)) }`);
        else lines.push(`        appendField(${JSON.stringify(f.name)}, String(describing: ${ref}))`);
      }
      const bin = req.fields.find((x) => x.type.kind === 'binary');
      if (bin) {
        const n = swiftIdentifier(bin.name);
        const binRef = isUnwrapped ? n : `body.${n}`;
        lines.push('        data.append("--\\(boundary)\\r\\n".data(using: .utf8)!)');
        lines.push(`        data.append("Content-Disposition: form-data; name=\\"${bin.name}\\"; filename=\\"upload\\"\\r\\n".data(using: .utf8)!)`);
        lines.push('        data.append("Content-Type: application/octet-stream\\r\\n\\r\\n".data(using: .utf8)!)');
        lines.push(`        data.append(${binRef})`);
        lines.push('        data.append("\\r\\n".data(using: .utf8)!)');
      }
    }
    lines.push('        data.append("--\\(boundary)--\\r\\n".data(using: .utf8)!)');
    lines.push('        request.httpBody = data');
  }

  if (op.successResponse.isRedirect) {
    lines.push('        let delegate = RedirectPreventer()');
    lines.push('        let (data, urlResponse) = try await dataWithRetry(session: session, for: request, delegate: delegate)');
    lines.push('        let statusCode = (urlResponse as! HTTPURLResponse).statusCode');
    lines.push('        switch statusCode {');
    lines.push('        case 302:');
    lines.push('            guard let location = (urlResponse as? HTTPURLResponse)?.value(forHTTPHeaderField: "Location") else {');
    lines.push('                throw URLError(.badServerResponse)');
    lines.push('            }');
    lines.push('            return location');
    emitSwiftErrorCases(lines, op, ir, 'data');
    lines.push('        }');
    lines.push('    }');
    return;
  }

  const resVar = op.requestBody?.contentType === 'multipart' ? 'responseData' : 'data';
  lines.push(`        let (${resVar}, urlResponse) = try await dataWithRetry(session: session, for: request)`);
  lines.push('        let statusCode = (urlResponse as! HTTPURLResponse).statusCode');
  lines.push('        switch statusCode {');
  const okCode = op.successResponse.statusCode;
  lines.push(`        case ${okCode}:`);
  if (op.successResponse.isBinary) lines.push(`            return ${resVar}`);
  else if (!op.successResponse.hasBody) lines.push('            return');
  else if (op.successResponse.isList || op.successResponse.isSingleWithMeta) lines.push(`            return try deserialize(${opReturn(op, ir)}.self, from: ${resVar})`);
  else if (op.successResponse.isUnwrap && op.successResponse.dataRef) lines.push(`            return try deserialize(${op.successResponse.dataRef}DataWrapper.self, from: ${resVar}).data`);
  else lines.push(`            return try deserialize(${opReturn(op, ir)}.self, from: ${resVar})`);

  emitSwiftErrorCases(lines, op, ir, resVar);
  lines.push('        }');
  lines.push('    }');
}

/** The error cases of a response switch. With both error models the body decides the type, a 401 included. */
function emitSwiftErrorCases(lines: string[], op: IROperation, ir: IR, dataVar: string): void {
  if (op.hasOAuthError && !swHasApiError(ir)) {
    lines.push('        case 401:');
    lines.push(`            throw pachcaOAuthErrorFromBody(${dataVar})`);
  }
  lines.push('        default:');
  if (swHasApiError(ir)) {
    lines.push(`            throw pachcaErrorFromResponse(statusCode, ${dataVar})`);
  } else {
    lines.push('            throw URLError(.badServerResponse)');
  }
}

function emitPaginationMethod(lines: string[], op: IROperation, ir: IR, fnPrefix = 'public func'): void {
  const itemType = op.successResponse.dataRef ?? 'Any';

  // Build params minus cursor
  const args: string[] = [];
  if (op.externalUrl) args.push(`${op.externalUrl}: String`);
  for (const p of op.pathParams) args.push(`${snakeToCamel(p.sdkName)}: ${swiftType(p.type)}`);
  for (const q of op.queryParams) {
    if (q.name === 'cursor') continue;
    const t = swiftType(q.type, { nullable: !q.required });
    args.push(`${snakeToCamel(q.sdkName)}: ${t}${q.required ? '' : ' = nil'}`);
  }

  lines.push(`    ${fnPrefix} ${op.methodName}All(${args.join(', ')}) async throws -> [${itemType}] {`);
  lines.push(`        var items: [${itemType}] = []`);
  lines.push('        var cursor: String? = nil');

  // Build call args for original method
  const callArgs: string[] = [];
  if (op.externalUrl) callArgs.push(`${op.externalUrl}: ${op.externalUrl}`);
  for (const p of op.pathParams) {
    const n = snakeToCamel(p.sdkName);
    callArgs.push(`${n}: ${n}`);
  }
  for (const q of op.queryParams) {
    const n = snakeToCamel(q.sdkName);
    if (q.name === 'cursor') {
      callArgs.push('cursor: cursor');
    } else {
      callArgs.push(`${n}: ${n}`);
    }
  }

  const rt = ir.responses.find((r) => r.name === op.successResponse.responseRef);
  const useHasNext = rt?.metaRef === 'PaginationMeta';

  if (useHasNext) {
    const cursorExpr = rt?.metaIsRequired ? 'response.meta.paginate.nextPage' : 'response.meta?.paginate.nextPage';
    const hasNextExpr = rt?.metaIsRequired ? 'response.meta.paginate.hasNext ?? true' : 'response.meta?.paginate.hasNext ?? true';
    lines.push('        var hasNext = true');
    lines.push('        while hasNext {');
    lines.push(`            let response = try await ${op.methodName}(${callArgs.join(', ')})`);
    lines.push('            items.append(contentsOf: response.data)');
    lines.push('            if response.data.isEmpty { break }');
    lines.push(`            cursor = ${cursorExpr}`);
    lines.push(`            hasNext = ${hasNextExpr}`);
    lines.push('        }');
  } else {
    const metaAccess = rt?.metaIsRequired ? 'response.meta.paginate.nextPage' : 'response.meta?.paginate.nextPage';
    lines.push('        repeat {');
    lines.push(`            let response = try await ${op.methodName}(${callArgs.join(', ')})`);
    lines.push('            items.append(contentsOf: response.data)');
    lines.push('            if response.data.isEmpty { break }');
    lines.push(`            cursor = ${metaAccess}`);
    lines.push(rt?.metaIsRequired ? '        } while true' : '        } while cursor != nil');
  }
  lines.push('        return items');
  lines.push('    }');
}

function hasWebhookPolling(svc: IRService): boolean {
  return svc.operations.some((op) => op.methodName === 'getWebhookEvents' && op.successResponse.dataRef === 'WebhookEvent');
}

function emitThrowingOperation(lines: string[], op: IROperation, ir: IR): void {
  const args: string[] = [];
  if (op.externalUrl) args.push(`${op.externalUrl}: String`);
  for (const p of op.pathParams) args.push(`${snakeToCamel(p.sdkName)}: ${swiftType(p.type)}`);
  if (op.requestBody) {
    const rb = op.requestBody;
    if (shouldUnwrapBody(rb)) args.push(`${swiftIdentifier(rb.unwrapField!.name)}: ${swiftType(rb.unwrapField!.type)}`);
    else if (rb.schemaRef) args.push(`request body: ${rb.schemaRef}`);
  }
  for (const q of op.queryParams) {
    const t = swiftType(q.type, { nullable: !q.required });
    args.push(`${snakeToCamel(q.sdkName)}: ${t}${q.required ? '' : ' = nil'}`);
  }
  if (op.deprecated) lines.push('    @available(*, deprecated)');
  lines.push(`    open func ${op.methodName}(${args.join(', ')}) async throws -> ${opReturn(op, ir)} {`);
  lines.push(`        throw pachcaNotImplemented(${JSON.stringify(`${op.tag}.${op.methodName}`)})`);
  lines.push('    }');
}

function emitThrowingPaginationMethod(lines: string[], op: IROperation): void {
  const itemType = op.successResponse.dataRef ?? 'Any';
  const args: string[] = [];
  if (op.externalUrl) args.push(`${op.externalUrl}: String`);
  for (const p of op.pathParams) args.push(`${snakeToCamel(p.sdkName)}: ${swiftType(p.type)}`);
  for (const q of op.queryParams) {
    if (q.name === 'cursor') continue;
    const t = swiftType(q.type, { nullable: !q.required });
    args.push(`${snakeToCamel(q.sdkName)}: ${t}${q.required ? '' : ' = nil'}`);
  }
  lines.push(`    open func ${op.methodName}All(${args.join(', ')}) async throws -> [${itemType}] {`);
  lines.push(`        throw pachcaNotImplemented(${JSON.stringify(`${op.tag}.${op.methodName}All`)})`);
  lines.push('    }');
}

function emitWebhookPollingMethods(lines: string[], prefix: string): void {
  lines.push(`    ${prefix} pollWebhookEvents(`);
  lines.push('        limit: Int? = 50,');
  lines.push('        interval: TimeInterval = 5,');
  lines.push('        createdAfter: Date? = nil,');
  lines.push('        maxSeenDeliveryIds: Int = 5_000');
  lines.push('    ) -> AsyncThrowingStream<WebhookEvent, Error> {');
  lines.push('        AsyncThrowingStream { continuation in');
  lines.push('            let task = _Concurrency.Task {');
  lines.push('                do {');
  lines.push('                    guard maxSeenDeliveryIds > 0 else {');
  lines.push('                        throw NSError(domain: "PachcaClient", code: 1, userInfo: [NSLocalizedDescriptionKey: "maxSeenDeliveryIds must be greater than 0"])');
  lines.push('                    }');
  lines.push('');
  lines.push('                    let effectiveCreatedAfter = createdAfter ?? Date()');
  lines.push('                    var seenIdOrder: [String] = []');
  lines.push('                    var seenIds = Set<String>()');
  lines.push('');
  lines.push('                    func remember(_ id: String) -> Bool {');
  lines.push('                        guard seenIds.insert(id).inserted else { return false }');
  lines.push('                        seenIdOrder.append(id)');
  lines.push('                        while seenIdOrder.count > maxSeenDeliveryIds {');
  lines.push('                            seenIds.remove(seenIdOrder.removeFirst())');
  lines.push('                        }');
  lines.push('                        return true');
  lines.push('                    }');
  lines.push('');
  lines.push('                    while !_Concurrency.Task.isCancelled {');
  lines.push('                        var cursor: String? = nil');
  lines.push('                        var hasNext = true');
  lines.push('                        while hasNext && !_Concurrency.Task.isCancelled {');
  lines.push('                            let response = try await getWebhookEvents(limit: limit, cursor: cursor)');
  lines.push('                            var pageHasRecentEvents = false');
  lines.push('                            for event in response.data.reversed() {');
  lines.push('                                let matchesCreatedAfter = pachcaParseWebhookDate(event.createdAt).map { $0 >= effectiveCreatedAfter } == true');
  lines.push('                                if matchesCreatedAfter {');
  lines.push('                                    pageHasRecentEvents = true');
  lines.push('                                }');
  lines.push('                                if matchesCreatedAfter && remember(event.id) {');
  lines.push('                                    continuation.yield(event)');
  lines.push('                                }');
  lines.push('                            }');
  lines.push('                            hasNext = (response.meta.paginate.hasNext ?? !response.data.isEmpty) && pageHasRecentEvents');
  lines.push('                            cursor = response.meta.paginate.nextPage');
  lines.push('                        }');
  lines.push('                        try await _Concurrency.Task.sleep(nanoseconds: UInt64(max(interval, 0) * 1_000_000_000))');
  lines.push('                    }');
  lines.push('                    continuation.finish()');
  lines.push('                } catch {');
  lines.push('                    continuation.finish(throwing: error)');
  lines.push('                }');
  lines.push('            }');
  lines.push('            continuation.onTermination = { _ in task.cancel() }');
  lines.push('        }');
  lines.push('    }');
  lines.push('');
  lines.push(`    ${prefix} pollWebhookPayloads(`);
  lines.push('        limit: Int? = 50,');
  lines.push('        interval: TimeInterval = 5,');
  lines.push('        createdAfter: Date? = nil,');
  lines.push('        maxSeenDeliveryIds: Int = 5_000,');
  lines.push('        includePayload: @escaping (WebhookPayloadUnion) -> Bool = { _ in true }');
  lines.push('    ) -> AsyncThrowingStream<WebhookPayloadUnion, Error> {');
  lines.push('        AsyncThrowingStream { continuation in');
  lines.push('            let task = _Concurrency.Task {');
  lines.push('                do {');
  lines.push('                    for try await event in pollWebhookEvents(');
  lines.push('                        limit: limit,');
  lines.push('                        interval: interval,');
  lines.push('                        createdAfter: createdAfter,');
  lines.push('                        maxSeenDeliveryIds: maxSeenDeliveryIds');
  lines.push('                    ) {');
  lines.push('                        if includePayload(event.payload) {');
  lines.push('                            continuation.yield(event.payload)');
  lines.push('                        }');
  lines.push('                    }');
  lines.push('                    continuation.finish()');
  lines.push('                } catch {');
  lines.push('                    continuation.finish(throwing: error)');
  lines.push('                }');
  lines.push('            }');
  lines.push('            continuation.onTermination = { _ in task.cancel() }');
  lines.push('        }');
  lines.push('    }');
}

/** Both error models exist, so an error's class is read off its body. */
function swHasApiError(ir: IR): boolean {
  return ir.models.some((m) => m.name === 'ApiError');
}

/** Only OAuthError exists: a 401 is read by its own helper, other errors stay a URLError. */
function swReadsOAuthErrorAlone(ir: IR): boolean {
  return !swHasApiError(ir) && ir.services.some((s) => s.operations.some((o) => o.hasOAuthError));
}

function swPicksErrorByBody(ir: IR): boolean {
  return swHasApiError(ir) && ir.models.some((m) => m.name === 'OAuthError');
}

/** The authorization link and the PKCE pair for the OAuth flow (`x-oauth-authorize-url`). */
function emitSwiftOAuthHelpers(lines: string[], authorizeUrl: string): void {
  lines.push('/// The authorization link and the PKCE pair of the OAuth flow.');
  lines.push('public enum PachcaOAuth {');
  lines.push(`    public static let authorizeURL = ${JSON.stringify(authorizeUrl)}`);
  lines.push('');
  lines.push('    /// Keep `codeVerifier` until the code exchange, put `codeChallenge` into the link.');
  lines.push('    public struct PKCE {');
  lines.push('        public let codeVerifier: String');
  lines.push('        public let codeChallenge: String');
  lines.push('    }');
  lines.push('');
  lines.push('    /// The authorization link for a message button: the consent screen with PKCE (S256).');
  lines.push('    public static func buildAuthorizeURL(');
  lines.push('        clientId: String,');
  lines.push('        redirectUri: String,');
  lines.push('        state: String,');
  lines.push('        codeChallenge: String,');
  lines.push('        authorizeURL: String = PachcaOAuth.authorizeURL');
  lines.push('    ) -> String {');
  lines.push('        let query = [');
  lines.push('            ("client_id", clientId),');
  lines.push('            ("redirect_uri", redirectUri),');
  lines.push('            ("response_type", "code"),');
  lines.push('            ("state", state),');
  lines.push('            ("code_challenge", codeChallenge),');
  lines.push('            ("code_challenge_method", "S256"),');
  lines.push('        ].map { "\\($0.0)=\\(pachcaFormEncode($0.1))" }.joined(separator: "&")');
  lines.push('        return "\\(authorizeURL)?\\(query)"');
  lines.push('    }');
  lines.push('');
  lines.push('    #if canImport(CryptoKit) || canImport(Crypto)');
  lines.push('    /// A random code verifier and its SHA-256 challenge.');
  lines.push('    public static func createPKCE() -> PKCE {');
  lines.push('        var generator = SystemRandomNumberGenerator()');
  lines.push('        let bytes = (0..<32).map { _ in UInt8.random(in: .min ... .max, using: &generator) }');
  lines.push('        let verifier = base64URL(Data(bytes))');
  lines.push('        let digest = SHA256.hash(data: Data(verifier.utf8))');
  lines.push('        return PKCE(codeVerifier: verifier, codeChallenge: base64URL(Data(digest)))');
  lines.push('    }');
  lines.push('    #endif');
  lines.push('');
  lines.push('    private static func base64URL(_ data: Data) -> String {');
  lines.push('        data.base64EncodedString()');
  lines.push('            .replacingOccurrences(of: "+", with: "-")');
  lines.push('            .replacingOccurrences(of: "/", with: "_")');
  lines.push('            .replacingOccurrences(of: "=", with: "")');
  lines.push('    }');
  lines.push('}');
  lines.push('');
}

function generateClient(ir: IR): string {
  const lines: string[] = [];
  lines.push(...FOUNDATION_IMPORTS);
  if (ir.oauthAuthorizeUrl) {
    lines.push('#if canImport(CryptoKit)');
    lines.push('import CryptoKit');
    lines.push('#elseif canImport(Crypto)');
    lines.push('import Crypto');
    lines.push('#endif');
  }
  lines.push('');
  const hasServices = ir.services.length > 0;
  if (hasServices) {
    lines.push('private func pachcaNotImplemented(_ method: String) -> Error {');
    lines.push('    NSError(domain: "PachcaClient", code: 1, userInfo: [NSLocalizedDescriptionKey: method + " is not implemented"])');
    lines.push('}');
    lines.push('');
  }
  const hasForm = ir.services.some((s) => s.operations.some((o) => o.requestBody?.contentType === 'form'));
  if (hasForm || ir.oauthAuthorizeUrl) {
    lines.push('/// Percent-encodes a form or query value: only unreserved ASCII stays as is.');
    lines.push('func pachcaFormEncode(_ value: String) -> String {');
    lines.push('    let unreserved = CharacterSet(charactersIn: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~")');
    lines.push('    return value.addingPercentEncoding(withAllowedCharacters: unreserved) ?? value');
    lines.push('}');
    lines.push('');
  }
  if (hasForm) {
    lines.push('/// A form body (application/x-www-form-urlencoded): the fields go by their wire names, empty ones are left out.');
    lines.push('func pachcaFormBody<T: Encodable>(_ value: T) throws -> Data {');
    lines.push('    let object = try JSONSerialization.jsonObject(with: serialize(value)) as? [String: Any] ?? [:]');
    lines.push('    let pairs = object.compactMap { key, item -> String? in');
    lines.push('        if item is NSNull { return nil }');
    lines.push('        // Numbers and booleans go as their JSON text: true, not 1');
    lines.push('        let text = item as? String');
    lines.push('            ?? (try? JSONSerialization.data(withJSONObject: item, options: .fragmentsAllowed))');
    lines.push('                .flatMap { String(data: $0, encoding: .utf8) }');
    lines.push('            ?? "\\(item)"');
    lines.push('        return "\\(key)=\\(pachcaFormEncode(text))"');
    lines.push('    }');
    lines.push('    return Data(pairs.joined(separator: "&").utf8)');
    lines.push('}');
    lines.push('');
  }
  if (hasServices && swHasApiError(ir)) {
    const picks = swPicksErrorByBody(ir);
    if (picks) {
      lines.push('/// An error body is either {"errors": [...]} or the OAuth form {"error", "error_description"},');
      lines.push('/// which also comes with 400 and 403 (insufficient_scope, invalid_grant). The body decides the type.');
    }
    lines.push('/// An empty body or one that is not JSON gives an ApiError with no errors. The status code stays in statusCode.');
    lines.push('func pachcaErrorFromResponse(_ statusCode: Int, _ data: Data) -> Error {');
    if (picks) {
      const codeEnum = oauthErrorCodeEnum(ir);
      lines.push('    if let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any],');
      if (codeEnum && !codeEnum.open) {
        // A closed enum takes only the values it lists: the decoder refuses the rest.
        lines.push('       object["errors"] == nil, object["error"] is String,');
        lines.push('       let oauthError = try? deserialize(OAuthError.self, from: data) {');
        lines.push('        return oauthError');
      } else {
        const code = codeEnum ? `${codeEnum.name}(code)` : 'code';
        lines.push('       object["errors"] == nil, let code = object["error"] as? String {');
        lines.push(`        return OAuthError(error: ${code}, errorDescription: object["error_description"] as? String ?? "")`);
      }
      lines.push('    }');
    }
    lines.push('    var apiError = (try? deserialize(ApiError.self, from: data)) ?? ApiError(errors: [])');
    lines.push('    apiError.statusCode = statusCode');
    lines.push('    return apiError');
    lines.push('}');
    lines.push('');
  }
  if (hasServices && swReadsOAuthErrorAlone(ir)) {
    lines.push('/// A 401 body that is empty or not the OAuth form gives URLError(.badServerResponse).');
    lines.push('func pachcaOAuthErrorFromBody(_ data: Data) -> Error {');
    lines.push('    if let oauthError = try? deserialize(OAuthError.self, from: data) { return oauthError }');
    lines.push('    return URLError(.badServerResponse)');
    lines.push('}');
    lines.push('');
  }
  if (ir.oauthAuthorizeUrl) emitSwiftOAuthHelpers(lines, ir.oauthAuthorizeUrl);
  if (ir.services.some(hasWebhookPolling)) {
    lines.push('private func pachcaParseWebhookDate(_ value: String) -> Date? {');
    lines.push('    let fractionalFormatter = ISO8601DateFormatter()');
    lines.push('    fractionalFormatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]');
    lines.push('    if let date = fractionalFormatter.date(from: value) { return date }');
    lines.push('    return ISO8601DateFormatter().date(from: value)');
    lines.push('}');
    lines.push('');
  }
  for (const s of ir.services) {
    const cls = tagToServiceName(s.tag);
    const implName = serviceToImplName(cls);
    lines.push(`open class ${cls} {`);
    lines.push('    public init() {}');
    lines.push('');
    for (let i = 0; i < s.operations.length; i++) {
      emitThrowingOperation(lines, s.operations[i], ir);
      if (s.operations[i].isPaginated && s.operations[i].successResponse.dataRef) {
        lines.push('');
        emitThrowingPaginationMethod(lines, s.operations[i]);
      }
      if (s.operations[i].methodName === 'getWebhookEvents' && s.operations[i].successResponse.dataRef === 'WebhookEvent') {
        lines.push('');
        emitWebhookPollingMethods(lines, 'open func');
      }
      if (i < s.operations.length - 1) lines.push('');
    }
    lines.push('}');
    lines.push('');
    lines.push(`public final class ${implName}: ${cls} {`);
    lines.push('    let baseURL: String');
    lines.push('    let headers: [String: String]');
    lines.push('    let session: URLSession');
    lines.push('');
    lines.push('    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {');
    lines.push('        self.baseURL = baseURL');
    lines.push('        self.headers = headers');
    lines.push('        self.session = session');
    lines.push('        super.init()');
    lines.push('    }');
    lines.push('');
    for (let i = 0; i < s.operations.length; i++) {
      emitOperation(lines, s.operations[i], ir, 'public override func');
      if (s.operations[i].isPaginated && s.operations[i].successResponse.dataRef) {
        lines.push('');
        emitPaginationMethod(lines, s.operations[i], ir, 'public override func');
      }
      if (i < s.operations.length - 1) lines.push('');
    }
    lines.push('}');
    lines.push('');
  }

  if (ir.services.some((s) => s.operations.some((o) => o.successResponse.isRedirect))) {
    lines.push('private final class RedirectPreventer: NSObject, URLSessionTaskDelegate {');
    lines.push('    func urlSession(');
    lines.push('        _ session: URLSession,');
    lines.push('        task: URLSessionTask,');
    lines.push('        willPerformHTTPRedirection response: HTTPURLResponse,');
    lines.push('        newRequest request: URLRequest,');
    lines.push('        completionHandler: @escaping (URLRequest?) -> Void');
    lines.push('    ) {');
    lines.push('        completionHandler(nil)');
    lines.push('    }');
    lines.push('}');
    lines.push('');
  }

  const svcs = ir.services
    .map((s) => ({ prop: tagToProperty(s.tag), cls: tagToServiceName(s.tag) }))
    .sort((a, b) => a.prop.localeCompare(b.prop));
  if (ir.baseUrl) {
    lines.push(`public let pachcaAPIURL = ${JSON.stringify(ir.baseUrl)}`);
    lines.push('');
  }
  lines.push('public struct PachcaClient {');
  for (const s of svcs) lines.push(`    public let ${s.prop}: ${s.cls}`);
  lines.push('');

  // Private init taking only services (for stub)
  const privateInitArgs = svcs.map((s) => `${s.prop}: ${s.cls}`);
  lines.push(`    private init(${privateInitArgs.join(', ')}) {`);
  for (const s of svcs) {
    lines.push(`        self.${s.prop} = ${s.prop}`);
  }
  lines.push('    }');
  lines.push('');

  // Public init with token/baseURL delegating to private init
  const swiftDefault = ir.baseUrl ? ' = pachcaAPIURL' : '';
  const initArgs = [`token: String`, `baseURL: String${swiftDefault}`];
  for (const s of svcs) initArgs.push(`${s.prop}: ${s.cls}? = nil`);
  lines.push(`    public init(${initArgs.join(', ')}) {`);
  lines.push('        let headers = ["Authorization": "Bearer \\(token)"]');
  lines.push('        self.init(');
  for (let i = 0; i < svcs.length; i++) {
    const s = svcs[i];
    const suffix = i < svcs.length - 1 ? ',' : '';
    lines.push(`            ${s.prop}: ${s.prop} ?? ${serviceToImplName(s.cls)}(baseURL: baseURL, headers: headers)${suffix}`);
  }
  lines.push('        )');
  lines.push('    }');
  lines.push('');

  // Public init with headers/baseURL/session (no token)
  const headersInitArgs = [`baseURL: String${swiftDefault}`, 'headers: [String: String]', 'session: URLSession = .shared'];
  for (const s of svcs) headersInitArgs.push(`${s.prop}: ${s.cls}? = nil`);
  lines.push(`    public init(${headersInitArgs.join(', ')}) {`);
  lines.push('        self.init(');
  for (let i = 0; i < svcs.length; i++) {
    const s = svcs[i];
    const suffix = i < svcs.length - 1 ? ',' : '';
    lines.push(`            ${s.prop}: ${s.prop} ?? ${serviceToImplName(s.cls)}(baseURL: baseURL, headers: headers, session: session)${suffix}`);
  }
  lines.push('        )');
  lines.push('    }');
  lines.push('');

  // Static stub() factory
  const stubArgs = svcs.map((s) => `${s.prop}: ${s.cls} = ${s.cls}()`);
  lines.push(`    public static func stub(${stubArgs.join(', ')}) -> PachcaClient {`);
  lines.push('        PachcaClient(');
  for (let i = 0; i < svcs.length; i++) {
    const s = svcs[i];
    const suffix = i < svcs.length - 1 ? ',' : '';
    lines.push(`            ${s.prop}: ${s.prop}${suffix}`);
  }
  lines.push('        )');
  lines.push('    }');
  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

function generateUtils(ir: IR): string {
  const lines = [
    ...FOUNDATION_IMPORTS,
    '',
    'let pachcaDecoder: JSONDecoder = {',
    '    let decoder = JSONDecoder()',
    '    return decoder',
    '}()',
    '',
    'let pachcaEncoder: JSONEncoder = {',
    '    let encoder = JSONEncoder()',
    '    return encoder',
    '}()',
    '',
    '// The encoder leaves out every optional field that is not set. A null in the',
    '// body is one the caller asked for: a field named in nullFields of a request',
    '// model, or a null inside a free-form value.',
    'func serialize<T: Encodable>(_ value: T) throws -> Data {',
    '    return try pachcaEncoder.encode(value)',
    '}',
    '',
    'func deserialize<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {',
    '    return try pachcaDecoder.decode(type, from: data)',
    '}',
    '',
  ];

  if (irNeedsAnyCodable(ir)) {
    lines.push(
      'public struct AnyCodable: Codable {',
      '    public let value: Any',
      '',
      '    public init(_ value: Any) { self.value = value }',
      '',
      '    public init(from decoder: Decoder) throws {',
      '        let container = try decoder.singleValueContainer()',
      '        if container.decodeNil() { value = NSNull() }',
      '        else if let b = try? container.decode(Bool.self) { value = b }',
      '        else if let i = try? container.decode(Int.self) { value = i }',
      '        else if let d = try? container.decode(Double.self) { value = d }',
      '        else if let s = try? container.decode(String.self) { value = s }',
      '        else if let a = try? container.decode([AnyCodable].self) { value = a.map { $0.value } }',
      '        else if let o = try? container.decode([String: AnyCodable].self) { value = o.mapValues { $0.value } }',
      '        else { value = NSNull() }',
      '    }',
      '',
      '    public func encode(to encoder: Encoder) throws {',
      '        var container = encoder.singleValueContainer()',
      '        switch value {',
      '        case is NSNull: try container.encodeNil()',
      '        case let b as Bool: try container.encode(b)',
      '        case let i as Int: try container.encode(i)',
      '        case let d as Double: try container.encode(d)',
      '        case let s as String: try container.encode(s)',
      '        case let a as [Any]: try container.encode(a.map { AnyCodable($0) })',
      '        case let o as [String: Any]: try container.encode(o.mapValues { AnyCodable($0) })',
      '        default: try container.encodeNil()',
      '        }',
      '    }',
      '}',
      '',
    );
  }

  lines.push(
    'private let maxRetries = 3',
    'private let retryable5xx: Set<Int> = [500, 502, 503, 504]',
    '',
    '// A 5xx says nothing about whether the server already applied the request.',
    '// These methods are safe to repeat. A retried POST or PATCH could apply',
    '// twice: POST /messages would send the message again, and the API has no',
    '// idempotency key. 429 is safe for any method: the request was rejected',
    '// before it was processed.',
    'private let idempotentMethods: Set<String> = ["GET", "HEAD", "OPTIONS", "PUT", "DELETE"]',
    '',
    '// Retry-After is a minimum, not an estimate: waiting less lands the retry',
    '// inside a window that is still closed. Jitter only upwards.',
    'private func jitter(_ delay: UInt64) -> UInt64 {',
    '    return UInt64(Double(delay) * (1 + Double.random(in: 0..<0.25)))',
    '}',
    '',
    '// Only the daily chat limit and the hour-long ban wait longer than a minute.',
    'private let maxRetryAfterSeconds: UInt64 = 60',
    '',
    '// A 504 with the code timeout is a search the server stopped because the',
    '// query is too heavy: the same query would time out again, so it goes back',
    '// to the caller at once. A 504 from a proxy has no such code and is retried.',
    'private func isQueryTimeout(_ statusCode: Int, _ data: Data) -> Bool {',
    '    guard statusCode == 504,',
    '          let body = try? JSONSerialization.jsonObject(with: data) as? [String: Any],',
    '          let errors = body["errors"] as? [Any] else { return false }',
    '    return errors.contains { ($0 as? [String: Any])?["code"] as? String == "timeout" }',
    '}',
    '',
    'func dataWithRetry(session: URLSession, for request: URLRequest, delegate: (any URLSessionTaskDelegate)? = nil) async throws -> (Data, URLResponse) {',
    '    let idempotent = idempotentMethods.contains((request.httpMethod ?? "GET").uppercased())',
    '    for attempt in 0...maxRetries {',
    '        let (data, response) = try await session.data(for: request, delegate: delegate)',
    '        if let http = response as? HTTPURLResponse {',
    '            if http.statusCode == 429, attempt < maxRetries {',
    '                let delay: UInt64',
    '                if let ra = http.value(forHTTPHeaderField: "Retry-After"), let secs = UInt64(ra) {',
    '                    // A long pause is the daily chat limit or an hour-long ban. Retrying',
    '                    // it is pointless, and an early retry doubles the pause: hand the',
    '                    // response back so the caller can schedule the work itself.',
    '                    if secs > maxRetryAfterSeconds {',
    '                        return (data, response)',
    '                    }',
    '                    delay = secs * 1_000_000_000',
    '                } else {',
    '                    delay = UInt64(pow(2.0, Double(attempt))) * 1_000_000_000',
    '                }',
    '                try await _Concurrency.Task.sleep(nanoseconds: jitter(delay))',
    '                continue',
    '            }',
    '            if retryable5xx.contains(http.statusCode), idempotent, attempt < maxRetries, !isQueryTimeout(http.statusCode, data) {',
    '                let delay = UInt64(attempt + 1) * 1_000_000_000',
    '                try await _Concurrency.Task.sleep(nanoseconds: jitter(delay))',
    '                continue',
    '            }',
    '        }',
    '        return (data, response)',
    '    }',
    '    return try await session.data(for: request, delegate: delegate) // unreachable',
    '}',
    '',
  );

  return lines.join('\n');
}

// ── Examples ──────────────────────────────────────────────────────────

function swiftLiteral(
  ft: IRFieldType,
  ir: IR,
  models: Map<string, IRModel>,
  visited: Set<string> = new Set(),
  indent: number = 0,
): string {
  if (ft.example !== undefined) {
    if (ft.kind === 'primitive') {
      if ((ft.primitive === 'integer' || ft.primitive === 'number') && typeof ft.example === 'number') {
        if (ft.primitive === 'integer') return ft.format === 'int64' ? `Int64(${ft.example})` : String(ft.example);
        return String(ft.example);
      }
      if (ft.primitive === 'boolean' && typeof ft.example === 'boolean') return String(ft.example);
      if (ft.primitive === 'string' && typeof ft.example === 'string') return JSON.stringify(ft.example);
    }
    if (ft.kind === 'enum' && typeof ft.example === 'string') {
      const e = ir.enums.find((en) => en.name === ft.ref);
      const member = e?.members.find((m) => m.value === ft.example);
      if (e && member) return `.${swiftIdentifier(member.value)}`;
    }
  }
  switch (ft.kind) {
    case 'primitive': {
      if (ft.primitive === 'integer') return ft.format === 'int64' ? 'Int64(123)' : '123';
      if (ft.primitive === 'number') return '1.5';
      if (ft.primitive === 'boolean') return 'true';
      if (ft.primitive === 'any') return 'AnyCodable([:])';
      if (ft.primitive === 'string') {
        if (ft.format === 'date-time') return '"2024-01-01T00:00:00Z"';
        if (ft.format === 'date') return '"2024-01-01"';
      }
      return '"example"';
    }
    case 'enum': {
      const e = ir.enums.find((en) => en.name === ft.ref);
      if (e && e.members.length > 0) {
        return `.${swiftIdentifier(e.members[0].value)}`;
      }
      return `${ft.ref ?? 'String'}`;
    }
    case 'model': {
      const u = ir.unions.find((un) => un.name === ft.ref);
      if (u && u.memberRefs.length > 0) {
        return swiftUnionLiteral(u.memberRefs[0], ir, models, visited, indent);
      }
      return swiftModelLiteral(ft.ref ?? 'String', ir, models, visited, indent);
    }
    case 'array':
      return `[${swiftLiteral(ft.items!, ir, models, visited, indent)}]`;
    case 'record':
      return `["key": ${swiftLiteral(ft.valueType!, ir, models, visited, indent)}]`;
    case 'union': {
      const u = ir.unions.find((un) => un.name === ft.ref);
      if (u && u.memberRefs.length > 0) {
        return swiftUnionLiteral(u.memberRefs[0], ir, models, visited, indent);
      }
      return `${ft.ref ?? 'String'}`;
    }
    case 'literal':
      return `"${ft.literalValue}"`;
    case 'binary':
      return 'Data()';
  }
}

/** A union value is an enum case wrapping its member: `.viewBlockHeader(ViewBlockHeader(...))` (see emitUnion). */
function swiftUnionLiteral(
  memberRef: string,
  ir: IR,
  models: Map<string, IRModel>,
  visited: Set<string>,
  indent: number,
): string {
  const caseName = memberRef.charAt(0).toLowerCase() + memberRef.slice(1);
  return `.${caseName}(${swiftModelLiteral(memberRef, ir, models, visited, indent)})`;
}

function swiftModelLiteral(
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
    const name = swiftIdentifier(f.name);
    const value = swiftLiteral(f.type, ir, models, nextVisited, childIndent);
    return `${name}: ${value}`;
  });

  const hasMultiLineChild = entries.some((e) => e.includes('\n'));
  if (multiLine || hasMultiLineChild) {
    return `${modelName}(\n${entries.map((e) => `${pad}${e}`).join(',\n')}\n${closePad})`;
  }
  return `${modelName}(${entries.join(', ')})`;
}

function swiftFingerprint(
  ft: IRFieldType,
  ir: IR,
  models: Map<string, IRModel>,
  visited: Set<string> = new Set(),
): string {
  switch (ft.kind) {
    case 'primitive': {
      if (ft.primitive === 'integer') return ft.format === 'int64' ? 'Int64' : 'Int';
      if (ft.primitive === 'number') return 'Double';
      if (ft.primitive === 'boolean') return 'Bool';
      if (ft.primitive === 'any') return 'AnyCodable';
      return 'String';
    }
    case 'enum':
      return ft.ref ?? 'String';
    case 'model': {
      const model = models.get(ft.ref!);
      if (!model || visited.has(ft.ref!)) return ft.ref ?? 'String';
      return swiftModelFp(model, ir, models, visited);
    }
    case 'array':
      return `[${swiftFingerprint(ft.items!, ir, models, visited)}]`;
    case 'record':
      return `[String: ${swiftFingerprint(ft.valueType!, ir, models, visited)}]`;
    case 'union':
      return ft.ref ?? 'String';
    case 'literal':
      return 'String';
    case 'binary':
      return 'Data';
  }
}

function swiftModelFp(
  model: IRModel,
  ir: IR,
  models: Map<string, IRModel>,
  visited: Set<string>,
): string {
  const nextVisited = new Set(visited);
  nextVisited.add(model.name);

  const fields = model.fields.map((f) => {
    const name = swiftIdentifier(f.name);
    const type = swiftFingerprint(f.type, ir, models, nextVisited);
    const opt = isOptionalField(f) ? '?' : '';
    return `${name}: ${type}${opt}`;
  });

  return `${model.name}(${fields.join(', ')})`;
}

function swiftBuildOutputFingerprint(
  op: IROperation,
  ir: IR,
  models: Map<string, IRModel>,
): string | null {
  const resp = op.successResponse;
  if (resp.isRedirect) return 'String';
  if (resp.isBinary) return 'Data';
  if (!resp.hasBody) return null;

  if (resp.isList && resp.responseRef) {
    const rt = ir.responses.find((r) => r.name === resp.responseRef);
    if (rt) {
      const parts: string[] = [];
      parts.push(`data: [${rt.dataRef}]`);
      if (rt.metaRef) {
        const opt = rt.metaIsRequired ? '' : '?';
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
        return model ? swiftModelFp(model, ir, models, new Set()) : ref;
      };
      const parts: string[] = [`data: ${fp(rt.dataRef)}`];
      if (rt.metaRef) {
        const opt = rt.metaIsRequired ? '' : '?';
        parts.push(`meta: ${fp(rt.metaRef)}${opt}`);
      }
      return `${rt.name}(${parts.join(', ')})`;
    }
  }

  if (resp.dataRef) {
    const model = models.get(resp.dataRef);
    if (model) return swiftModelFp(model, ir, models, new Set());
    return resp.dataRef;
  }

  return 'String';
}

function swiftBuildOperationExample(
  op: IROperation,
  ir: IR,
  models: Map<string, IRModel>,
  serviceProp: string,
): { usage: string; output: string | null; imports: string[] } {
  const callArgs: { label: string; value: string; type?: IRFieldType }[] = [];
  const imports = new Set<string>();

  if (op.externalUrl) {
    callArgs.push({ label: op.externalUrl, value: '"https://example.com"' });
  }

  for (const p of op.pathParams) {
    callArgs.push({ label: snakeToCamel(p.sdkName), value: swiftLiteral(p.type, ir, models), type: p.type });
    for (const r of collectTypeRefs(p.type, ir, models)) imports.add(r);
  }

  if (op.requestBody) {
    const rb = op.requestBody;
    const body = bodyExample(rb, ir, models);
    if (shouldUnwrapBody(rb) && rb.unwrapField) {
      const sdkName = swiftIdentifier(rb.unwrapField.name);
      callArgs.push({ label: sdkName, value: swiftLiteral(body.type, body.ir, body.models), type: body.type });
      for (const r of collectTypeRefs(body.type, body.ir, body.models)) imports.add(r);
    } else if (rb.schemaRef) {
      callArgs.push({ label: 'request', value: swiftLiteral(body.type, body.ir, body.models) });
      for (const r of collectTypeRefs(body.type, body.ir, body.models)) imports.add(r);
    }
  }

  for (const q of op.queryParams) {
    callArgs.push({ label: snakeToCamel(q.sdkName), value: swiftLiteral(q.type, ir, models), type: q.type });
    for (const r of collectTypeRefs(q.type, ir, models)) imports.add(r);
  }

  const declarations: string[] = [];
  const finalArgs: string[] = [];

  for (const { label, value, type } of callArgs) {
    if ((value.includes('(') || value.includes('[')) && !value.startsWith('.') && !value.startsWith('"')) {
      // An array or a dictionary of enum cases (`[.admin]`) has no type of its own: it is spelled out.
      const annotation = type && (type.kind === 'array' || type.kind === 'record') ? `: ${swiftType(type)}` : '';
      declarations.push(`let ${label}${annotation} = ${value}`);
      finalArgs.push(`${label}: ${label}`);
    } else {
      finalArgs.push(`${label}: ${value}`);
    }
  }

  const output = swiftBuildOutputFingerprint(op, ir, models);
  const rawCall = `try await client.${serviceProp}.${op.methodName}(${finalArgs.join(', ')})`;
  const call = output ? `let response = ${rawCall}` : rawCall;
  const usage = declarations.length > 0
    ? [...declarations, call].join('\n')
    : call;

  return { usage, output, imports: [...imports].sort() };
}

function swiftGenerateExamples(ir: IR): string {
  const models = buildModelIndex(ir);
  const result: Record<string, object> = {};

  result['Client_Init'] = {
    usage: 'let client = PachcaClient(token: "YOUR_TOKEN")',
    imports: ['PachcaClient'],
  };

  for (const svc of ir.services) {
    if (svc.deprecated) continue; // backward-compat alias service — document new names only
    const serviceProp = tagToProperty(svc.tag);
    for (const op of svc.operations) {
      if (op.isAlias) continue; // alias op — documented under its new service
      const ex = swiftBuildOperationExample(op, ir, models, serviceProp);
      const entry: Record<string, unknown> = { usage: ex.usage };
      if (ex.output) entry.output = ex.output;
      if (ex.imports.length > 0) entry.imports = ex.imports;
      const named = namedBodyExamples(op, (o) => swiftBuildOperationExample(o, ir, models, serviceProp));
      if (named) entry.examples = named;
      result[op.operationId] = entry;
      if (op.methodName === 'getWebhookEvents' && op.successResponse.dataRef === 'WebhookEvent') {
        result[`${op.operationId}_pollWebhookEvents`] = {
          usage: `for try await event in client.${serviceProp}.pollWebhookEvents(interval: 5) {\n    print(event)\n}`,
        };
        result[`${op.operationId}_pollWebhookPayloads`] = {
          usage: `for try await payload in client.${serviceProp}.pollWebhookPayloads(interval: 5) {\n    print(payload)\n}`,
        };
      }
    }
  }

  return JSON.stringify(result, null, 2) + '\n';
}

// ── Main ─────────────────────────────────────────────────────────────

export class SwiftGenerator implements LanguageGenerator {
  readonly dirName = 'swift';

  generate(ir: IR, options?: GenerateOptions): GeneratedFile[] {
    const files: GeneratedFile[] = [
      { path: 'Models.swift', content: generateModels(ir) },
      { path: 'Client.swift', content: generateClient(ir) },
      { path: 'Utils.swift', content: generateUtils(ir) },
    ];
    if (options?.examples) {
      files.push({ path: 'examples.json', content: swiftGenerateExamples(ir) });
    }
    return files;
  }
}
