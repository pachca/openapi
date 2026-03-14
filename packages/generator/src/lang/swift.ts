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
import { snakeToCamel, tagToProperty, tagToServiceName } from '../naming.js';

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
      else if (ft.format === 'date' || ft.format === 'date-time') base = opts.nullable ? 'String' : 'Date';
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

function emitEnum(lines: string[], e: IREnum): void {
  lines.push(`public enum ${e.name}: String, Codable, CaseIterable {`);
  for (const m of e.members) {
    const id = swiftIdentifier(m.value);
    const caseDecl = id === m.value ? `case ${id}` : `case ${id} = ${JSON.stringify(m.value)}`;
    if (m.description) lines.push(`    /// ${m.description}`);
    lines.push(`    ${caseDecl}`);
  }
  lines.push('}');
}

function emitCodingKeys(lines: string[], fields: IRField[]): void {
  const needs = fields.some((f) => swiftIdentifier(f.name) !== f.name);
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

function emitModel(lines: string[], m: IRModel): void {
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
  // Generate public memberwise init
  lines.push('');
  const initParams = fieldInfos.map((fi) => {
    const defaultVal = fi.optional ? ' = nil' : '';
    return `${fi.name}: ${fi.type}${defaultVal}`;
  });
  lines.push(`    public init(${initParams.join(', ')}) {`);
  for (const fi of fieldInfos) {
    lines.push(`        self.${fi.name} = ${fi.name}`);
  }
  lines.push('    }');
  emitCodingKeys(lines, m.fields);
  lines.push('}');
}

function emitUnion(lines: string[], u: IRUnion, models: IRModel[]): void {
  const discField = u.discriminatorField;
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
  lines.push('    }');
  lines.push('');
  lines.push('    public init(from decoder: Decoder) throws {');
  lines.push('        let container = try decoder.container(keyedBy: CodingKeys.self)');
  lines.push(`        let type = try container.decode(String.self, forKey: .${discSwiftName})`);
  lines.push('        switch type {');
  const seenDiscs = new Set<string>();
  for (const ref of u.memberRefs) {
    const c = ref.charAt(0).toLowerCase() + ref.slice(1);
    const model = models.find((m) => m.name === ref);
    const typeField = model?.fields.find((f) => f.type.kind === 'literal');
    const disc = typeField?.type.literalValue ?? c;
    if (seenDiscs.has(String(disc))) continue;
    seenDiscs.add(String(disc));
    lines.push(`        case ${JSON.stringify(disc)}:`);
    lines.push(`            self = .${c}(try ${ref}(from: decoder))`);
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

function generateModels(ir: IR): string {
  const lines: string[] = [];
  const wrappers = new Set<string>();
  lines.push('import Foundation');
  lines.push('');

  for (const e of ir.enums) {
    emitEnum(lines, e);
    lines.push('');
  }
  for (const m of ir.models) {
    for (const inl of m.inlineObjects) {
      emitModel(lines, inl);
      lines.push('');
    }
    emitModel(lines, m);
    lines.push('');
  }
  for (const u of ir.unions) {
    emitUnion(lines, u, ir.models);
    lines.push('');
  }
  for (const rt of ir.responses) {
    lines.push(`public struct ${rt.name}: Codable {`);
    lines.push(`    public let data: [${rt.dataRef}]`);
    if (rt.metaRef) lines.push(`    public let meta: ${rt.metaRef}${rt.metaIsRequired ? '' : '?'}${rt.metaIsRequired ? '' : ' = nil'}`);
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
  if (!op.successResponse.hasBody) return 'Void';
  if (op.successResponse.isList) {
    const rt = ir.responses.find((r) => r.dataRef === op.successResponse.dataRef && r.dataIsArray);
    return rt?.name ?? 'String';
  }
  return op.successResponse.dataRef ?? 'String';
}

function emitOperation(lines: string[], op: IROperation, ir: IR): void {
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
  lines.push(`    public func ${op.methodName}(${args.join(', ')}) async throws -> ${opReturn(op, ir)} {`);
  if (op.queryParams.length > 0) {
    const swiftUrlBase = op.externalUrl ? `\\(${op.externalUrl})` : `\\(baseURL)${op.path}`;
    lines.push(`        var components = URLComponents(string: "${swiftUrlBase}")!`);
    lines.push('        var queryItems: [URLQueryItem] = []');
    for (const q of op.queryParams) {
      const n = snakeToCamel(q.sdkName);
      const isEnum = q.type.kind === 'enum';
      const isDate = q.type.kind === 'primitive' && (q.type.format === 'date' || q.type.format === 'date-time');
      const isModel = q.type.kind === 'model' || q.type.kind === 'record';
      function valueExpr(varName: string): string {
        if (isEnum) return `${varName}.rawValue`;
         if (isDate && q.required) return `ISO8601DateFormatter().string(from: ${varName})`;
        if (isDate) return varName; // optional dates are typed as String
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

  if (op.requestBody?.contentType === 'json') {
    const rb = op.requestBody!;
    lines.push('        request.setValue("application/json", forHTTPHeaderField: "Content-Type")');
    if (shouldUnwrapBody(rb)) {
      const f = rb.unwrapField!;
      lines.push(`        request.httpBody = try JSONSerialization.data(withJSONObject: [${JSON.stringify(f.name)}: ${swiftIdentifier(f.name)}])`);
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
    if (req) {
      for (const f of req.fields.filter((x) => x.type.kind !== 'binary')) {
        const n = swiftIdentifier(f.name);
        if (isOptionalField(f)) lines.push(`        if let v = body.${n} { appendField(${JSON.stringify(f.name)}, String(describing: v)) }`);
        else lines.push(`        appendField(${JSON.stringify(f.name)}, String(describing: body.${n}))`);
      }
      const bin = req.fields.find((x) => x.type.kind === 'binary');
      if (bin) {
        const n = swiftIdentifier(bin.name);
        lines.push('        data.append("--\\(boundary)\\r\\n".data(using: .utf8)!)');
        lines.push(`        data.append("Content-Disposition: form-data; name=\\"${bin.name}\\"; filename=\\"upload\\"\\r\\n".data(using: .utf8)!)`);
        lines.push('        data.append("Content-Type: application/octet-stream\\r\\n\\r\\n".data(using: .utf8)!)');
        lines.push(`        data.append(body.${n})`);
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
    if (op.hasOAuthError) {
      lines.push('        case 401:');
      lines.push('            throw try deserialize(OAuthError.self, from: data)');
    }
    if (op.hasApiError || ir.models.some((m) => m.name === 'ApiError')) {
      lines.push('        default:');
      lines.push('            throw try deserialize(ApiError.self, from: data)');
    } else {
      lines.push('        default:');
      lines.push('            throw URLError(.badServerResponse)');
    }
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
  if (!op.successResponse.hasBody) lines.push('            return');
  else if (op.successResponse.isList) lines.push(`            return try deserialize(${opReturn(op, ir)}.self, from: ${resVar})`);
  else if (op.successResponse.isUnwrap && op.successResponse.dataRef) lines.push(`            return try deserialize(${op.successResponse.dataRef}DataWrapper.self, from: ${resVar}).data`);
  else lines.push(`            return try deserialize(${opReturn(op, ir)}.self, from: ${resVar})`);

  if (op.hasOAuthError) {
    lines.push('        case 401:');
    lines.push(`            throw try deserialize(OAuthError.self, from: ${resVar})`);
  }
  if (op.hasApiError || ir.models.some((m) => m.name === 'ApiError')) {
    lines.push('        default:');
    lines.push(`            throw try deserialize(ApiError.self, from: ${resVar})`);
  } else {
    lines.push('        default:');
    lines.push('            throw URLError(.badServerResponse)');
  }
  lines.push('        }');
  lines.push('    }');
}

function emitPaginationMethod(lines: string[], op: IROperation, ir: IR): void {
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

  lines.push(`    public func ${op.methodName}All(${args.join(', ')}) async throws -> [${itemType}] {`);
  lines.push(`        var items: [${itemType}] = []`);
  lines.push('        var cursor: String? = nil');
  lines.push('        repeat {');

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

  lines.push(`            let response = try await ${op.methodName}(${callArgs.join(', ')})`);
  lines.push('            items.append(contentsOf: response.data)');
  lines.push('            cursor = response.meta?.paginate?.nextPage');
  lines.push('        } while cursor != nil');
  lines.push('        return items');
  lines.push('    }');
}

function generateClient(ir: IR): string {
  const lines: string[] = [];
  lines.push('import Foundation');
  lines.push('');
  for (const s of ir.services) {
    const cls = tagToServiceName(s.tag);
    lines.push(`public struct ${cls} {`);
    lines.push('    let baseURL: String');
    lines.push('    let headers: [String: String]');
    lines.push('    let session: URLSession');
    lines.push('');
    lines.push('    init(baseURL: String, headers: [String: String], session: URLSession = .shared) {');
    lines.push('        self.baseURL = baseURL');
    lines.push('        self.headers = headers');
    lines.push('        self.session = session');
    lines.push('    }');
    lines.push('');
    for (let i = 0; i < s.operations.length; i++) {
      emitOperation(lines, s.operations[i], ir);
      if (s.operations[i].isPaginated && s.operations[i].successResponse.dataRef) {
        lines.push('');
        emitPaginationMethod(lines, s.operations[i], ir);
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

  lines.push('public struct PachcaClient {');
  const svcs = ir.services
    .map((s) => ({ prop: tagToProperty(s.tag), cls: tagToServiceName(s.tag) }))
    .sort((a, b) => a.prop.localeCompare(b.prop));
  for (const s of svcs) lines.push(`    public let ${s.prop}: ${s.cls}`);
  lines.push('');
  const swiftDefault = ir.baseUrl ? ` = ${JSON.stringify(ir.baseUrl)}` : '';
  lines.push(`    public init(token: String, baseURL: String${swiftDefault}) {`);
  lines.push('        let headers = ["Authorization": "Bearer \\(token)"]');
  for (const s of svcs) lines.push(`        self.${s.prop} = ${s.cls}(baseURL: baseURL, headers: headers)`);
  lines.push('    }');
  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

function generateUtils(ir: IR): string {
  const lines = [
    'import Foundation',
    '',
    'let pachcaDecoder: JSONDecoder = {',
    '    let decoder = JSONDecoder()',
    '    decoder.dateDecodingStrategy = .iso8601',
    '    return decoder',
    '}()',
    '',
    'let pachcaEncoder: JSONEncoder = {',
    '    let encoder = JSONEncoder()',
    '    encoder.dateEncodingStrategy = .iso8601',
    '    return encoder',
    '}()',
    '',
    'func serialize<T: Encodable>(_ value: T) throws -> Data {',
    '    let data = try pachcaEncoder.encode(value)',
    '    let json = try JSONSerialization.jsonObject(with: data)',
    '    return try JSONSerialization.data(withJSONObject: stripNulls(json))',
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
    '',
    'func dataWithRetry(session: URLSession, for request: URLRequest, delegate: (any URLSessionTaskDelegate)? = nil) async throws -> (Data, URLResponse) {',
    '    for attempt in 0...maxRetries {',
    '        let (data, response) = try await session.data(for: request, delegate: delegate)',
    '        if let http = response as? HTTPURLResponse, http.statusCode == 429, attempt < maxRetries {',
    '            let delay: UInt64',
    '            if let ra = http.value(forHTTPHeaderField: "Retry-After"), let secs = UInt64(ra) {',
    '                delay = secs * 1_000_000_000',
    '            } else {',
    '                delay = UInt64(pow(2.0, Double(attempt))) * 1_000_000_000',
    '            }',
    '            try await _Concurrency.Task.sleep(nanoseconds: delay)',
    '            continue',
    '        }',
    '        return (data, response)',
    '    }',
    '    return try await session.data(for: request, delegate: delegate) // unreachable',
    '}',
    '',
  );

  lines.push(
    'private func stripNulls(_ value: Any) -> Any {',
    '    if let dict = value as? [String: Any] {',
    '        return dict.compactMapValues { v -> Any? in',
    '            if v is NSNull { return nil }',
    '            return stripNulls(v)',
    '        }',
    '    }',
    '    if let arr = value as? [Any] {',
    '        return arr.map(stripNulls)',
    '    }',
    '    return value',
    '}',
    '',
  );
  return lines.join('\n');
}

export class SwiftGenerator implements LanguageGenerator {
  readonly dirName = 'swift';

  generate(ir: IR): GeneratedFile[] {
    return [
      { path: 'Models.swift', content: generateModels(ir) },
      { path: 'Client.swift', content: generateClient(ir) },
      { path: 'Utils.swift', content: generateUtils(ir) },
    ];
  }
}
