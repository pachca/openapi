import type {
  IR,
  IREnum,
  IRField,
  IRFieldType,
  IRModel,
  IROperation,
  IRResponseType,
  IRService,
  IRUnion,
} from '../ir.js';
import type { GeneratedFile, LanguageGenerator } from './types.js';
import { snakeToCamel, tagToProperty, tagToServiceName } from '../naming.js';

function swiftIdentifier(name: string): string {
  const camel = snakeToCamel(name.replace(/-/g, '_'));
  if (camel === 'public' || camel === 'private') return `\`${camel}\``;
  return camel;
}

function swiftType(ft: IRFieldType, opts: { nullable?: boolean } = {}): string {
  let base: string;
  switch (ft.kind) {
    case 'primitive':
      if (ft.primitive === 'integer') base = ft.format === 'int64' ? 'Int64' : 'Int';
      else if (ft.primitive === 'number') base = 'Double';
      else if (ft.primitive === 'boolean') base = 'Bool';
      else if (ft.format === 'date' || ft.format === 'date-time') base = opts.nullable ? 'String' : 'Date';
      else base = 'String';
      break;
    case 'enum':
    case 'model':
    case 'union':
      base = ft.ref ?? 'String';
      break;
    case 'array':
      base = `[${swiftType(ft.items!, opts)}]`;
      break;
    case 'record':
      base = `[String: ${swiftType(ft.valueType!, opts)}]`;
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
  lines.push(`enum ${e.name}: String, Codable, CaseIterable {`);
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

function emitModel(lines: string[], m: IRModel): void {
  const proto = m.isError ? 'Codable, Error' : 'Codable';
  lines.push(`struct ${m.name}: ${proto} {`);
  if (m.fields.length === 0) {
    lines.push('}');
    return;
  }
  for (const f of m.fields) {
    const name = swiftIdentifier(f.name);
    const nullable = !f.required || f.nullable;
    const t = swiftType(f.type, { nullable: nullable || f.nullable });
    const mutable = f.type.kind === 'binary' ? 'var' : 'let';
    lines.push(`    ${mutable} ${name}: ${t}`);
  }
  emitCodingKeys(lines, m.fields);
  lines.push('}');
}

function emitUnion(lines: string[], u: IRUnion): void {
  lines.push(`enum ${u.name}: Codable {`);
  for (const ref of u.memberRefs) {
    const c = ref.charAt(0).toLowerCase() + ref.slice(1);
    lines.push(`    case ${c}(${ref})`);
  }
  lines.push('');
  lines.push('    private enum CodingKeys: String, CodingKey {');
  lines.push('        case type');
  lines.push('    }');
  lines.push('');
  lines.push('    init(from decoder: Decoder) throws {');
  lines.push('        let container = try decoder.container(keyedBy: CodingKeys.self)');
  lines.push('        let type = try container.decode(String.self, forKey: .type)');
  lines.push('        switch type {');
  for (const ref of u.memberRefs) {
    const c = ref.charAt(0).toLowerCase() + ref.slice(1);
    lines.push(`        case ${JSON.stringify(c.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`).replace(/^_/, ''))}:`);
    lines.push(`            self = .${c}(try ${ref}(from: decoder))`);
  }
  lines.push('        default:');
  lines.push('            throw DecodingError.dataCorrupted(');
  lines.push('                DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Unknown type: \\(type)")');
  lines.push('            )');
  lines.push('        }');
  lines.push('    }');
  lines.push('');
  lines.push('    func encode(to encoder: Encoder) throws {');
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
    emitUnion(lines, u);
    lines.push('');
  }
  for (const rt of ir.responses) {
    lines.push(`struct ${rt.name}: Codable {`);
    lines.push(`    let data: [${rt.dataRef}]`);
    if (rt.metaRef) lines.push(`    let meta: ${rt.metaRef}${rt.metaIsRequired ? '' : '?'}${rt.metaIsRequired ? '' : ' = nil'}`);
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
  for (const p of op.pathParams) args.push(`${snakeToCamel(p.sdkName)}: ${swiftType(p.type)}`);
  if (op.requestBody) {
    const rb = op.requestBody;
    const f = rb.unwrapField;
    const shouldUnwrap =
      rb.unwrapMode === 'single' &&
      !!f &&
      f.type.kind !== 'model' &&
      f.type.kind !== 'record';
    if (shouldUnwrap) args.push(`${swiftIdentifier(f.name)}: ${swiftType(f.type)}`);
    else if (rb.schemaRef) args.push(`request body: ${rb.schemaRef}`);
  }
  for (const q of op.queryParams) {
    const t = swiftType(q.type, { nullable: !q.required });
    args.push(`${snakeToCamel(q.sdkName)}: ${t}${q.required ? '' : ' = nil'}`);
  }

  lines.push(`    func ${op.methodName}(${args.join(', ')}) async throws -> ${opReturn(op, ir)} {`);
  if (op.queryParams.length > 0) {
    lines.push(`        var components = URLComponents(string: "\\(baseURL)${op.path}")!`);
    lines.push('        var queryItems: [URLQueryItem] = []');
    for (const q of op.queryParams) {
      const n = snakeToCamel(q.sdkName);
      if (q.isArray) {
        lines.push(`        if let ${n} { ${n}.forEach { queryItems.append(URLQueryItem(name: ${JSON.stringify(q.name)}, value: String($0))) } }`);
      } else if (q.required) {
        const v = q.type.kind === 'enum' ? `${n}.rawValue` : `String(${n})`;
        lines.push(`        queryItems.append(URLQueryItem(name: ${JSON.stringify(q.name)}, value: ${v}))`);
      } else {
        const v = q.type.kind === 'enum' ? `$0.rawValue` : 'String($0)';
        lines.push(`        if let ${n} { queryItems.append(URLQueryItem(name: ${JSON.stringify(q.name)}, value: ${v})) }`);
      }
    }
    lines.push('        if !queryItems.isEmpty { components.queryItems = queryItems }');
    lines.push('        var request = URLRequest(url: components.url!)');
  } else {
    let url = `"\\(baseURL)${op.path}"`;
    for (const p of op.pathParams) {
      url = url.replace(`{${p.name}}`, `\\(${snakeToCamel(p.sdkName)})`);
    }
    lines.push(`        var request = URLRequest(url: URL(string: ${url})!)`);
  }
  if (op.method !== 'GET') lines.push(`        request.httpMethod = ${JSON.stringify(op.method)}`);
  lines.push('        headers.forEach { request.setValue($1, forHTTPHeaderField: $0) }');

  if (op.requestBody?.contentType === 'json') {
    const rb = op.requestBody!;
    const f = rb.unwrapField;
    const shouldUnwrap =
      rb.unwrapMode === 'single' &&
      !!f &&
      f.type.kind !== 'model' &&
      f.type.kind !== 'record';
    lines.push('        request.setValue("application/json", forHTTPHeaderField: "Content-Type")');
    if (shouldUnwrap) lines.push(`        request.httpBody = try JSONSerialization.data(withJSONObject: [${JSON.stringify(f.name)}: ${swiftIdentifier(f.name)}])`);
    else lines.push('        request.httpBody = try JSONEncoder().encode(body)');
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
    const req = ir.models.find((m) => m.name === op.requestBody.schemaRef);
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
        lines.push('        data.append("--\\(boundary)--\\r\\n".data(using: .utf8)!)');
      }
    }
    lines.push('        request.httpBody = data');
  }

  if (op.successResponse.isRedirect) {
    lines.push('        let delegate = RedirectPreventer()');
    lines.push('        let (data, urlResponse) = try await session.data(for: request, delegate: delegate)');
    lines.push('        let statusCode = (urlResponse as! HTTPURLResponse).statusCode');
    lines.push('        switch statusCode {');
    lines.push('        case 302:');
    lines.push('            guard let location = (urlResponse as? HTTPURLResponse)?.value(forHTTPHeaderField: "Location") else {');
    lines.push('                throw URLError(.badServerResponse)');
    lines.push('            }');
    lines.push('            return location');
    if (op.hasOAuthError) {
      lines.push('        case 401:');
      lines.push('            throw try pachcaDecoder.decode(OAuthError.self, from: data)');
    }
    if (op.hasApiError || ir.models.some((m) => m.name === 'ApiError')) {
      lines.push('        default:');
      lines.push('            throw try pachcaDecoder.decode(ApiError.self, from: data)');
    } else {
      lines.push('        default:');
      lines.push('            throw URLError(.badServerResponse)');
    }
    lines.push('        }');
    lines.push('    }');
    return;
  }

  lines.push('        let (data, urlResponse) = try await session.data(for: request)');
  lines.push('        let statusCode = (urlResponse as! HTTPURLResponse).statusCode');
  lines.push('        switch statusCode {');
  const okCode = op.successResponse.statusCode;
  lines.push(`        case ${okCode}:`);
  if (!op.successResponse.hasBody) lines.push('            return');
  else if (op.successResponse.isList) lines.push(`            return try pachcaDecoder.decode(${opReturn(op, ir)}.self, from: data)`);
  else if (op.successResponse.isUnwrap && op.successResponse.dataRef) lines.push(`            return try pachcaDecoder.decode(${op.successResponse.dataRef}DataWrapper.self, from: data).data`);
  else lines.push(`            return try pachcaDecoder.decode(${opReturn(op, ir)}.self, from: data)`);

  if (op.hasOAuthError) {
    lines.push('        case 401:');
    lines.push('            throw try pachcaDecoder.decode(OAuthError.self, from: data)');
  }
  if (op.hasApiError || ir.models.some((m) => m.name === 'ApiError')) {
    lines.push('        default:');
    lines.push('            throw try pachcaDecoder.decode(ApiError.self, from: data)');
  } else {
    lines.push('        default:');
    lines.push('            throw URLError(.badServerResponse)');
  }
  lines.push('        }');
  lines.push('    }');
}

function generateClient(ir: IR): string {
  const lines: string[] = [];
  lines.push('import Foundation');
  lines.push('');
  for (const s of ir.services) {
    const cls = tagToServiceName(s.tag);
    lines.push(`struct ${cls} {`);
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

  lines.push('struct PachcaClient {');
  const svcs = ir.services
    .map((s) => ({ prop: tagToProperty(s.tag), cls: tagToServiceName(s.tag) }))
    .sort((a, b) => a.prop.localeCompare(b.prop));
  for (const s of svcs) lines.push(`    let ${s.prop}: ${s.cls}`);
  lines.push('');
  lines.push('    init(baseURL: String, token: String) {');
  lines.push('        let headers = ["Authorization": "Bearer \\(token)"]');
  for (const s of svcs) lines.push(`        self.${s.prop} = ${s.cls}(baseURL: baseURL, headers: headers)`);
  lines.push('    }');
  lines.push('}');
  lines.push('');
  return lines.join('\n');
}

function generateUtils(): string {
  return [
    'import Foundation',
    '',
    'let pachcaDecoder: JSONDecoder = {',
    '    let decoder = JSONDecoder()',
    '    decoder.dateDecodingStrategy = .iso8601',
    '    return decoder',
    '}()',
    '',
  ].join('\n');
}

export class SwiftGenerator implements LanguageGenerator {
  readonly dirName = 'swift';

  generate(ir: IR): GeneratedFile[] {
    return [
      { path: 'Models.swift', content: generateModels(ir) },
      { path: 'Client.swift', content: generateClient(ir) },
      { path: 'Utils.swift', content: generateUtils() },
    ];
  }
}
