import { describe, it, expect, afterEach, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { generate, SUPPORTED_LANGS } from '../src/index.js';
import { classifyEnumUsage, transform } from '../src/transform.js';
import { unionRequiredShapes, type IRField, type IRFieldType, type IRModel } from '../src/ir.js';
import { parseOpenAPI } from '@pachca/openapi-parser';

const TESTS_DIR = path.resolve(__dirname, '.');
const SUITES = fs.readdirSync(TESTS_DIR).filter((d) => {
  const full = path.join(TESTS_DIR, d);
  return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, 'fixture.yaml'));
});

function readDirRecursive(dir: string): Map<string, string> {
  const result = new Map<string, string>();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (entry.isFile()) {
      const full = path.join(entry.parentPath, entry.name);
      const rel = path.relative(dir, full);
      result.set(rel, fs.readFileSync(full, 'utf-8'));
    }
  }
  return result;
}

describe('generator', () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  for (const suite of SUITES) {
    it(`generates correct output for ${suite}`, () => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `gen-test-${suite}-`));
      const fixtureDir = path.join(TESTS_DIR, suite);
      const specPath = path.join(fixtureDir, 'fixture.yaml');
      const snapshotsDir = path.join(fixtureDir, 'snapshots');

      generate(specPath, tmpDir, SUPPORTED_LANGS, { examples: true });

      const generated = readDirRecursive(tmpDir);
      const expected = readDirRecursive(snapshotsDir);

      // Same set of files
      expect([...generated.keys()].sort()).toEqual([...expected.keys()].sort());

      // Same content
      for (const [file, content] of expected) {
        expect(generated.get(file), `Mismatch in ${suite}/${file}`).toBe(content);
      }

      // Semantic guard: generated Python must not reference an undefined private
      // helper. Catches declaration/call name drift (e.g. `def _jitter` declared
      // but `_add_jitter()` called) that a string-only snapshot masks once the
      // broken output is re-recorded as the baseline. Every bare `_name(` call
      // must have a matching `def _name(` in the same file.
      for (const [file, content] of generated) {
        if (!file.endsWith('.py')) continue;
        const defined = new Set(
          [...content.matchAll(/def (_[A-Za-z0-9_]+)\s*\(/g)].map((m) => m[1]),
        );
        for (const m of content.matchAll(/(?<![.\w])(_[A-Za-z0-9_]+)\(/g)) {
          const name = m[1];
          expect(
            defined.has(name),
            `${suite}/${file}: call to undefined private helper ${name}()`,
          ).toBe(true);
        }
      }

      // Semantic guard: no union may be emitted with an EMPTY discriminator
      // value. That is the signature of a union whose members share no literal
      // being forced down the discriminated path — it compiles, then throws
      // (duplicate discriminators in C#/Kotlin) or silently mis-decodes at
      // runtime, which a snapshot alone cannot catch.
      for (const [file, content] of generated) {
        const emptyDiscriminators = [
          /\[JsonDerivedType\(typeof\([A-Za-z0-9_]+\), ""\)\]/, // C#
          /@SerialName\(""\)/, // Kotlin
        ];
        for (const pattern of emptyDiscriminators) {
          expect(
            pattern.test(content),
            `${suite}/${file}: union emitted with an empty discriminator value`,
          ).toBe(false);
        }
      }
    });
  }
});

// An enum a response can carry is open: a value the spec does not list decodes
// without an error and keeps the raw string. Only an enum requests alone reach
// stays closed. The snapshots record the code; these checks hold the rule itself,
// so a regenerated snapshot cannot quietly close an enum again.
describe('open enums', () => {
  const fixture = path.join(TESTS_DIR, 'open-enums', 'fixture.yaml');
  const ir = transform(parseOpenAPI(fixture));
  const isOpen = (name: string) => ir.enums.find((e) => e.name === name)?.open;

  it('keeps an enum closed only when requests alone reach it', () => {
    expect(isOpen('SortOrder')).toBe(false); // query parameter
    expect(isOpen('MemberKind')).toBe(false); // request body
    expect(isOpen('MemberRole')).toBe(true); // request and response
    expect(isOpen('Region')).toBe(true); // request and a response header
    expect(isOpen('MemberStatus')).toBe(true); // response
    expect(isOpen('ErrorCode')).toBe(true); // error body
    expect(isOpen('OAuthErrorCode')).toBe(true); // OAuthError.error
    expect(isOpen('PayloadKind')).toBe(true); // reached by no operation
  });

  // The closed set is pinned by hand: a new enum that requests alone reach, or a
  // classifier that misses a kind of response root, has to update it on purpose.
  it('classifies the Pachca spec: only the request-only enums stay closed', () => {
    const pachca = transform(parseOpenAPI(path.resolve(__dirname, '..', '..', 'spec', 'openapi.yaml')));
    const closed = pachca.enums.filter((e) => !e.open).map((e) => e.name).sort();
    expect(closed).toEqual([
      'ChatActivity',
      'ChatAvailability',
      'ChatMemberRole',
      'ChatMemberRoleFilter',
      'ChatSortField',
      'ChatSubtype',
      'DraftType',
      'FileTarget',
      'MessageSearchSort',
      'MessageSortField',
      'OAuthTokenTypeHint',
      'SearchEntityType',
      'SearchSortOrder',
      'SortOrder',
      'UserCreateRole',
      'UserRoleInput',
    ]);
    expect(pachca.enums.find((e) => e.name === 'OAuthErrorCode')?.open).toBe(true);
  });

  it('reaches response bodies, error bodies and response headers', () => {
    const spec = parseOpenAPI(fixture);
    const usage = classifyEnumUsage(spec);
    expect(usage.response.has('Region')).toBe(true); // response header
    expect(usage.response.has('MemberStatus')).toBe(true); // nested in a response body
    expect(usage.response.has('ErrorCode')).toBe(true); // nested in an error body
    expect(usage.response.has('OAuthErrorCode')).toBe(true); // through allOf
    expect(usage.request.has('MemberKind')).toBe(true); // request body
    expect(usage.request.has('SortOrder')).toBe(true); // query parameter
    expect(usage.response.has('SortOrder')).toBe(false);
  });

  describe('emitted code', () => {
    let out: string;
    const read = (file: string) => fs.readFileSync(path.join(out, file), 'utf-8');

    beforeAll(() => {
      out = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-test-open-enums-'));
      generate(fixture, out, SUPPORTED_LANGS);
    });
    afterAll(() => fs.rmSync(out, { recursive: true, force: true }));

    it('C#: an open enum is a struct whose converter never throws', () => {
      const models = read('cs/Models.cs');
      expect(models).toContain('public readonly struct MemberStatus : IEquatable<MemberStatus>');
      expect(models).not.toContain('throw new JsonException($"Unknown MemberStatus');
      expect(models).not.toContain('throw new JsonException($"Unknown OAuthErrorCode');
      expect(models).toContain('public enum SortOrder');
      expect(models).toContain('throw new JsonException($"Unknown SortOrder');
      // A constant named like a member of the struct gets a suffix; a closed enum keeps the name.
      expect(models).toContain('public static PayloadKind ValueMember { get; }');
      expect(models).toMatch(/public enum MemberKind\n\{\n(?:.*\n)*?    Value,\n\}/);
      expect(models).toContain('Values { get; } = Array.AsReadOnly(new[] {');
      expect(read('cs/Utils.cs')).toContain('Error = new OAuthErrorCode(code.GetString()!)');
      expect(read('cs/Client.cs')).toContain('Uri.EscapeDataString(role.Value.Value)');
    });

    it('Swift: an open enum has a catch-all case', () => {
      const models = read('swift/Models.swift');
      expect(models).toContain('case unknown(String)');
      // MemberStatus lists `unknown` itself, so its catch-all takes another name.
      expect(models).toContain('case unknownValue(String)');
      expect(models).toContain('public enum SortOrder: String, Codable, CaseIterable');
      expect(models).toContain('public var localizedDescription: String { error.rawValue }');
      // A string literal converts, so a field that was a String still compares with one.
      expect(models).toContain('public init(stringLiteral value: String) { self.init(value) }');
      expect(read('swift/Client.swift')).toContain('OAuthError(error: OAuthErrorCode(code)');
    });

    it('Kotlin: an open enum is a value class over the string', () => {
      const models = read('kt/Models.kt');
      expect(models).toContain('value class MemberStatus(val value: String)');
      expect(models).toContain('enum class SortOrder(val value: String)');
      expect(models).toContain('override val message: String get() = error.value');
      expect(models).toContain('fun values(): Array<MemberStatus> = entries.toTypedArray()');
      expect(read('kt/Client.kt')).toContain('OAuthError(error = OAuthErrorCode(code.content)');
    });

    it('Python: an open enum keeps an unlisted value in a member with is_known False', () => {
      const models = read('py/models.py');
      expect(models).toContain('class OpenStrEnum(StrEnum):');
      expect(models).toContain('def is_known(self) -> bool:');
      // MemberStatus lists `unknown` itself, so the unlisted member takes another name.
      expect(models).toContain('member._name_ = "UNKNOWN_VALUE" if "UNKNOWN" in cls.__members__ else "UNKNOWN"');
      expect(models).toContain('class MemberStatus(OpenStrEnum):');
      expect(models).toContain('class SortOrder(StrEnum):');
      expect(read('py/utils.py')).toContain('issubclass(raw_tp, Enum)');
      expect(read('py/client.py')).toContain('OAuthError(error=OAuthErrorCode(body["error"])');
    });

    it('Go: the OAuth code is typed and holds only a code', () => {
      expect(read('go/types.go')).toContain('Err              OAuthErrorCode `json:"error"`');
      expect(read('go/types.go')).toContain('return string(e.Err)');
      // An OAuthError comes only from a body whose `error` is a string: a body that
      // does not decode is an ApiError with the status code, not a code.
      const client = read('go/client.go');
      expect(client).toContain('if json.Unmarshal(data, &probe) == nil && probe.Errors == nil && probe.Error != nil {');
      expect(client).toContain('e.StatusCode = resp.StatusCode');
      expect(client).not.toContain('e.Err =');
    });

    it('TypeScript: an open enum says so', () => {
      const types = read('ts/types.ts');
      expect(types).toMatch(/A response may carry a value this SDK does not list yet[^\n]*\n \*\/\nexport enum MemberStatus/);
      expect(types).not.toMatch(/does not list yet[^\n]*\n \*\/\nexport enum SortOrder/);
    });
  });
});

// Backward compatibility: after the 2026-06 IA retag, operations moved to new services.
// The generator must re-expose the OLD service names as deprecated alias services so that
// existing SDK code (client.common.*, client.linkPreviews.*, client.profile.getTokenInfo) keeps
// working, while the new names are the documented ones.
describe('backward-compat alias services (IA rename)', () => {
  const spec = parseOpenAPI(path.resolve(__dirname, '..', '..', 'spec', 'openapi.yaml'));
  const ir = transform(spec);
  const svc = (tag: string) => ir.services.find((s) => s.tag === tag);

  it('re-exposes Common as a deprecated alias with the moved operations', () => {
    const common = svc('Common');
    expect(common?.deprecated).toBe(true);
    const methods = common!.operations.map((o) => o.methodName);
    expect(methods).toContain('getUploadParams');
    expect(methods).toContain('uploadFile');
    expect(methods).toContain('listProperties');
    expect(common!.operations.every((o) => o.isAlias)).toBe(true);
  });

  it('re-exposes Link Previews as a deprecated alias keeping the OLD verb (createLinkPreviews)', () => {
    const lp = svc('Link Previews');
    expect(lp?.deprecated).toBe(true);
    expect(lp!.operations.some((o) => o.methodName === 'createLinkPreviews' && o.isAlias)).toBe(true);
  });

  it('canonical Messages.unfurl uses the new verb, not the old createLinkPreviews', () => {
    const messages = svc('Messages');
    expect(messages!.operations.some((o) => o.methodName === 'unfurl' && !o.isAlias)).toBe(true);
    expect(messages!.operations.some((o) => o.methodName === 'createLinkPreviews')).toBe(false);
  });

  it('keeps getTokenInfo on the Profile service as a deprecated alias', () => {
    const profile = ir.services.find((s) => s.tag === 'Profile' && !s.deprecated);
    expect(profile!.operations.some((o) => o.path === '/oauth/token/info' && o.isAlias)).toBe(true);
  });

  it('new services own the operations as primary (not alias)', () => {
    expect(svc('Files')!.operations.some((o) => o.methodName === 'getUploadParams' && !o.isAlias)).toBe(true);
    expect(svc('OAuth')!.operations.some((o) => o.path === '/oauth/token/info' && !o.isAlias)).toBe(true);
  });
});

// A response `{ data: T, meta }` with one object in `data` is returned whole, the
// way a list is: unwrapping it to `T` would drop `meta`. A `{ data: T }` without
// meta is still unwrapped to `T`.
describe('single object with meta', () => {
  const ir = transform(parseOpenAPI(path.join(TESTS_DIR, 'single-with-meta', 'fixture.yaml')));
  const op = (name: string) => ir.services.flatMap((s) => s.operations).find((o) => o.methodName === name)!;
  const response = (name: string) => ir.responses.find((r) => r.name === name);

  it('returns the response whole, an inline meta as its own model', () => {
    const resp = op('createChat').successResponse;
    expect(resp.isSingleWithMeta).toBe(true);
    expect(resp.isUnwrap).toBe(false);
    expect(resp.responseRef).toBe('CreateChatResponse');
    expect(response('CreateChatResponse')).toEqual({
      name: 'CreateChatResponse',
      dataRef: 'Chat',
      dataIsArray: false,
      metaRef: 'CreateChatResponseMeta',
      metaIsRequired: true,
    });
    const meta = ir.models.find((m) => m.name === 'CreateChatResponseMeta');
    expect(meta?.fields.map((f) => [f.name, f.required])).toEqual([['not_found_member_ids', true]]);
  });

  it('keeps a referenced meta and its optionality', () => {
    expect(response('UpdateChatResponse')).toMatchObject({ dataIsArray: false, metaRef: 'ChatUpdateMeta', metaIsRequired: false });
    expect(ir.models.some((m) => m.name === 'UpdateChatResponseMeta')).toBe(false);
  });

  it('still unwraps { data: T } without meta', () => {
    const resp = op('getChat').successResponse;
    expect(resp.isUnwrap).toBe(true);
    expect(resp.isSingleWithMeta).toBeUndefined();
    expect(resp.responseRef).toBeUndefined();
  });

  // Pinned by hand: a method of the Pachca spec that starts answering a single
  // object with meta changes what its SDK method returns, so it is added on purpose.
  it('in the Pachca spec, only POST /chats answers a single object with meta', () => {
    const pachca = transform(parseOpenAPI(path.resolve(__dirname, '..', '..', 'spec', 'openapi.yaml')));
    const whole = pachca.services
      .flatMap((s) => s.operations)
      .filter((o) => o.successResponse.isSingleWithMeta)
      .map((o) => `${o.method} ${o.path}`);
    expect(whole).toEqual(['POST /chats']);
  });
});

// A 5xx says nothing about whether the server already applied the request, and
// the API has no idempotency key: a retried POST /messages sends the message
// twice. Every runtime retries a 5xx only for GET, HEAD, OPTIONS, PUT and
// DELETE, and a 429 for any method. A 504 with the error code `timeout` is a
// search the server stopped because the query is too heavy: no runtime repeats
// it. The snapshots record the code; these checks hold the rule itself, so a
// regenerated snapshot cannot quietly drop it.
describe('retries', () => {
  const fixture = path.join(TESTS_DIR, 'crud', 'fixture.yaml');
  let out: string;
  const read = (file: string) => fs.readFileSync(path.join(out, file), 'utf-8');

  beforeAll(() => {
    out = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-test-retries-'));
    generate(fixture, out, SUPPORTED_LANGS);
  });
  afterAll(() => fs.rmSync(out, { recursive: true, force: true }));

  it('every runtime gates the 5xx retry on an idempotent method', () => {
    const tsUtils = read('ts/utils.ts');
    expect(tsUtils).toContain('const IDEMPOTENT_METHODS = new Set(["GET", "HEAD", "OPTIONS", "PUT", "DELETE"]);');
    expect(tsUtils).toMatch(/RETRYABLE_5XX\.has\(response\.status\) &&\n\s+IDEMPOTENT_METHODS\.has\(method\) &&\n\s+attempt < MAX_RETRIES &&/);

    const py = read('py/utils.py');
    expect(py).toContain('_IDEMPOTENT_METHODS = {"GET", "HEAD", "OPTIONS", "PUT", "DELETE"}');
    expect(py).toMatch(/response\.status_code in _RETRYABLE_5XX\n\s+and request\.method in _IDEMPOTENT_METHODS\n/);

    const go = read('go/utils.go');
    expect(go).toContain('case "", http.MethodGet, http.MethodHead, http.MethodOptions, http.MethodPut, http.MethodDelete:');
    expect(go).toContain('if retryable5xx[resp.StatusCode] && isIdempotent(req.Method) && attempt < maxRetries && !isQueryTimeout(resp) {');

    const kt = read('kt/Client.kt');
    expect(kt).toContain('setOf(HttpMethod.Get, HttpMethod.Head, HttpMethod.Options, HttpMethod.Put, HttpMethod.Delete)');
    expect(kt).toMatch(/val serverError = status in setOf\(500, 502, 503, 504\) &&\n\s+request\.method in idempotentMethods &&/);
    // Ktor retries a failed request for any method unless told otherwise.
    expect(kt).toMatch(/retryOnExceptionIf \{ request, cause ->\n\s+request\.method in idempotentMethods &&/);

    const cs = read('cs/Utils.cs');
    expect(cs).toContain('HttpMethod.Get, HttpMethod.Head, HttpMethod.Options, HttpMethod.Put, HttpMethod.Delete,');
    expect(cs).toMatch(/Retryable5xx\.Contains\(\(int\)response\.StatusCode\)\n\s+&& IdempotentMethods\.Contains\(request\.Method\)/);

    const swift = read('swift/Utils.swift');
    expect(swift).toContain('private let idempotentMethods: Set<String> = ["GET", "HEAD", "OPTIONS", "PUT", "DELETE"]');
    expect(swift).toContain('if retryable5xx.contains(http.statusCode), idempotent, attempt < maxRetries, !isQueryTimeout(http.statusCode, data) {');
  });

  it('every runtime hands a 504 with the code timeout back at once', () => {
    const tsUtils = read('ts/utils.ts');
    expect(tsUtils).toContain('async function isQueryTimeout(response: Response): Promise<boolean> {');
    expect(tsUtils).toContain('const body = (await response.clone().json()) as { errors?: unknown } | null;');
    expect(tsUtils).toMatch(/attempt < MAX_RETRIES &&\n\s+!\(await isQueryTimeout\(response\)\)\n/);

    const py = read('py/utils.py');
    expect(py).toContain('async def _is_query_timeout(response: httpx.Response) -> bool:');
    expect(py).toContain('error.get("code") == "timeout"');
    expect(py).toMatch(/and attempt < self\._max_retries\n\s+and not await _is_query_timeout\(response\)\n/);

    const go = read('go/utils.go');
    expect(go).toContain('func isQueryTimeout(resp *http.Response) bool {');
    // The body is put back, so the caller can still decode the error.
    expect(go).toContain('resp.Body = io.NopCloser(bytes.NewReader(body))');
    expect(go).toContain('if e.Code == "timeout" {');

    // retryIf cannot read the body: an interceptor under the retry plugin reads
    // it and marks the call, and retryIf checks the mark.
    const kt = read('kt/Client.kt');
    expect(kt).toContain('private val queryTimeoutKey = io.ktor.util.AttributeKey<Unit>("PachcaQueryTimeout")');
    expect(kt).toContain('client.plugin(HttpSend).intercept { request ->');
    expect(kt).toContain('call.attributes.put(queryTimeoutKey, Unit)');
    expect(kt).toMatch(/request\.method in idempotentMethods &&\n\s+!response\.call\.attributes\.contains\(queryTimeoutKey\)/);
    expect(kt).toContain('}.also(::markQueryTimeouts)');

    const cs = read('cs/Utils.cs');
    expect(cs).toContain('private static async Task<bool> IsQueryTimeoutAsync(HttpResponseMessage response, CancellationToken cancellationToken)');
    expect(cs).toContain('&& code.GetString() == "timeout")');
    expect(cs).toMatch(/&& attempt < MaxRetries\n\s+&& !await IsQueryTimeoutAsync\(response, cancellationToken\)\.ConfigureAwait\(false\)\)/);

    const swift = read('swift/Utils.swift');
    expect(swift).toContain('private func isQueryTimeout(_ statusCode: Int, _ data: Data) -> Bool {');
    expect(swift).toContain('return errors.contains { ($0 as? [String: Any])?["code"] as? String == "timeout" }');
  });

  describe('TypeScript fetchWithRetry at runtime', () => {
    type FetchWithRetry = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
    let fetchWithRetry: FetchWithRetry;
    const realFetch = globalThis.fetch;
    let calls: string[] = [];
    const timeoutBody = JSON.stringify({
      errors: [{ key: 'system', value: null, message: 'Search timed out', code: 'timeout', payload: null }],
    });

    beforeAll(async () => {
      const js = ts.transpileModule(read('ts/utils.ts'), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText;
      const file = path.join(out, 'ts', 'utils.mjs');
      fs.writeFileSync(file, js);
      ({ fetchWithRetry } = await import(pathToFileURL(file).href));
    });

    afterEach(() => {
      globalThis.fetch = realFetch;
    });

    // Answers each request with the next status (and body, if given) and
    // records its method.
    async function send(answers: (number | [number, string])[], input: string | Request, init?: RequestInit) {
      calls = [];
      const queue = [...answers];
      globalThis.fetch = (async (req: string | Request, opts?: RequestInit) => {
        calls.push(opts?.method ?? (typeof req === 'object' ? req.method : 'GET'));
        const next = queue.shift()!;
        const [status, body] = typeof next === 'number' ? [next, null] : next;
        return new Response(body, { status, headers: status === 429 ? { 'Retry-After': '1' } : {} });
      }) as typeof fetch;
      // The pauses between attempts run at once. A stub of setTimeout instead of
      // fake timers: CI runs this file with bun test, which has no runAllTimersAsync.
      const realSetTimeout = globalThis.setTimeout;
      globalThis.setTimeout = ((fn: () => void) => {
        queueMicrotask(fn);
        return 0;
      }) as unknown as typeof setTimeout;
      try {
        return await fetchWithRetry(input, init);
      } finally {
        globalThis.setTimeout = realSetTimeout;
      }
    }

    async function run(answers: (number | [number, string])[], input: string | Request, init?: RequestInit) {
      return (await send(answers, input, init)).status;
    }

    it('does not retry a 5xx for POST or PATCH', async () => {
      expect(await run([503, 201], 'https://api.test/messages', { method: 'POST' })).toBe(503);
      expect(calls).toEqual(['POST']);
      expect(await run([500, 200], 'https://api.test/messages/1', { method: 'PATCH' })).toBe(500);
      expect(calls).toEqual(['PATCH']);
      expect(await run([502, 201], new Request('https://api.test/messages', { method: 'POST' }))).toBe(502);
      expect(calls).toHaveLength(1);
    });

    it('retries a 5xx for GET, PUT and DELETE', async () => {
      expect(await run([503, 200], 'https://api.test/chats')).toBe(200);
      expect(calls).toEqual(['GET', 'GET']);
      expect(await run([502, 200], 'https://api.test/chats/1', { method: 'PUT' })).toBe(200);
      expect(calls).toEqual(['PUT', 'PUT']);
      expect(await run([504, 204], 'https://api.test/chats/1', { method: 'delete' })).toBe(204);
      expect(calls).toEqual(['delete', 'delete']);
      expect(await run([500, 500, 500, 500], 'https://api.test/chats')).toBe(500);
      expect(calls).toHaveLength(4);
    });

    it('retries a 429 for any method', async () => {
      expect(await run([429, 201], 'https://api.test/messages', { method: 'POST' })).toBe(201);
      expect(calls).toEqual(['POST', 'POST']);
    });

    it('hands a 504 with the code timeout back at once, body intact', async () => {
      const response = await send([[504, timeoutBody], 200], 'https://api.test/search/messages?query=report');
      expect(response.status).toBe(504);
      expect(calls).toEqual(['GET']);
      // The check reads a clone: the caller still gets the whole error body.
      expect(await response.json()).toEqual(JSON.parse(timeoutBody));
    });

    it('retries a 504 without the code timeout', async () => {
      expect(await run([[504, '<html>Gateway Timeout</html>'], 200], 'https://api.test/chats')).toBe(200);
      expect(calls).toEqual(['GET', 'GET']);
      const other = JSON.stringify({ errors: [{ code: 'unavailable', message: 'Try later' }] });
      expect(await run([[504, other], 200], 'https://api.test/chats')).toBe(200);
      expect(calls).toEqual(['GET', 'GET']);
      // The code decides only for a 504: a 503 that names it is still retried.
      expect(await run([[503, timeoutBody], 200], 'https://api.test/chats')).toBe(200);
      expect(calls).toEqual(['GET', 'GET']);
    });
  });
});

// Some answers come without a JSON body: GET /webhooks/events/stream answers 404
// with no body when the event history is off, and a proxy answers 502 or 504 with
// an HTML page. Every runtime reads such an answer as its normal ApiError with the
// status code and no errors, instead of failing to parse it. Only the success
// answer is parsed strictly. With both error models the body decides the class,
// a 401 included: a 401 without the OAuth form is an ApiError with status 401.
describe('error bodies', () => {
  const read = (dir: string, file: string) => fs.readFileSync(path.join(dir, file), 'utf-8');
  let crud: string;
  let oauthOnly: string;

  beforeAll(() => {
    crud = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-test-error-bodies-'));
    generate(path.join(TESTS_DIR, 'crud', 'fixture.yaml'), crud, SUPPORTED_LANGS);
    oauthOnly = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-test-error-bodies-oauth-'));
    generate(path.join(TESTS_DIR, 'search', 'fixture.yaml'), oauthOnly, SUPPORTED_LANGS);
  });
  afterAll(() => {
    fs.rmSync(crud, { recursive: true, force: true });
    fs.rmSync(oauthOnly, { recursive: true, force: true });
  });

  it('every runtime keeps the status code on ApiError', () => {
    expect(read(crud, 'ts/types.ts')).toContain('  status?: number;');
    expect(read(crud, 'py/models.py')).toContain('    status_code: int | None = None');
    expect(read(crud, 'go/types.go')).toMatch(/StatusCode int\s+`json:"-"`/);
    expect(read(crud, 'kt/Models.kt')).toContain('    @Transient val statusCode: Int? = null,');
    expect(read(crud, 'cs/Models.cs')).toContain('    [JsonIgnore]\n    public int? StatusCode { get; set; }');
    const swiftModels = read(crud, 'swift/Models.swift');
    expect(swiftModels).toContain('    public var statusCode: Int?');
    // The status code is not in the body: CodingKeys leave it out.
    expect(swiftModels).toMatch(/public struct ApiError: Codable, Error \{[\s\S]*?enum CodingKeys: String, CodingKey \{\n        case errors\n    \}/);
  });

  it('every runtime reads an empty or non-JSON error body as an ApiError', () => {
    const ts = read(crud, 'ts/client.ts');
    expect(ts).toContain('return JSON.parse(await response.text());');
    expect(ts).toContain('return new ApiError(Array.isArray(body?.errors) ? body.errors : [], response.status);');
    // The success answer alone is parsed strictly, inside its own case.
    expect(ts).toMatch(/case 200: \{\n\s+const body = await response\.json\(\);/);
    expect(ts).not.toMatch(/const body = await response\.json\(\);\n\s+switch/);

    const py = read(crud, 'py/client.py');
    expect(py).toContain('def _error_body(response: httpx.Response) -> object:');
    expect(py).toMatch(/return response\.json\(\)\n\s+except ValueError:\n\s+return None/);
    // Items that are not objects (a list of strings) would break str(error): such a list stays empty.
    expect(py).toContain('    error = ApiError(errors=[])\n    errors = body.get("errors") if isinstance(body, dict) else None\n    if isinstance(errors, list) and all(isinstance(item, dict) for item in errors):');
    expect(py).toContain('error.status_code = response.status_code');
    expect(py).not.toContain('body = response.json()');

    const go = read(crud, 'go/client.go');
    expect(go).toContain('if json.Unmarshal(data, &e) != nil {\n\t\te = ApiError{}\n\t}\n\te.StatusCode = resp.StatusCode');

    const kt = read(crud, 'kt/Client.kt');
    expect(kt).toContain('val decoded = runCatching { pachcaJson.decodeFromString(ApiError.serializer(), text) }.getOrNull()');
    expect(kt).toContain('?: ApiError(errors = emptyList(), statusCode = response.status.value)');
    expect(kt).not.toContain('response.body<ApiError>()');

    const cs = read(crud, 'cs/Utils.cs');
    expect(cs).toContain('internal static Exception ErrorFromResponse(int statusCode, string json)');
    expect(cs).toContain('error ??= new ApiError();');
    expect(cs).toContain('error.StatusCode = statusCode;');
    expect(read(crud, 'cs/Client.cs')).toContain('throw PachcaUtils.ErrorFromResponse((int)response.StatusCode, json);');

    const swift = read(crud, 'swift/Client.swift');
    expect(swift).toContain('func pachcaErrorFromResponse(_ statusCode: Int, _ data: Data) -> Error {');
    expect(swift).toContain('var apiError = (try? deserialize(ApiError.self, from: data)) ?? ApiError(errors: [])');
    expect(swift).toContain('throw pachcaErrorFromResponse(statusCode, data)');
    expect(swift).not.toContain('URLError(.badServerResponse)\n}');
  });

  it('with both error models no runtime forces a 401 into OAuthError', () => {
    expect(read(crud, 'ts/client.ts')).not.toContain('case 401:');
    expect(read(crud, 'py/client.py')).not.toContain('case 401:');
    expect(read(crud, 'go/client.go')).not.toContain('case http.StatusUnauthorized:');
    expect(read(crud, 'kt/Client.kt')).not.toContain('401 ->');
    expect(read(crud, 'cs/Client.cs')).not.toContain('case 401:');
    expect(read(crud, 'swift/Client.swift')).not.toContain('case 401:');
  });

  it('with OAuthError alone a 401 that does not decode is the plain error with its status', () => {
    expect(read(oauthOnly, 'ts/client.ts')).toContain('throw typeof body?.error === "string" ? new OAuthError(body.error) : new Error(`HTTP ${response.status}`);');
    const py = read(oauthOnly, 'py/client.py');
    expect(py).toContain('raise _oauth_error_from_response(response)');
    expect(py).toContain('return RuntimeError(f"Unexpected status code: {response.status_code}")');
    expect(read(oauthOnly, 'go/client.go')).toMatch(/case http\.StatusUnauthorized:\n\t\tvar e OAuthError\n\t\tif err := json\.NewDecoder\(resp\.Body\)\.Decode\(&e\); err != nil \{\n\t\t\treturn nil, fmt\.Errorf\("HTTP %d: %w", resp\.StatusCode, err\)/);
    expect(read(oauthOnly, 'kt/Client.kt')).toContain('401 -> throw oauthErrorFromResponse(response)');
    expect(read(oauthOnly, 'cs/Client.cs')).toContain('throw PachcaUtils.OAuthErrorFromResponse((int)response.StatusCode, json);');
    expect(read(oauthOnly, 'swift/Client.swift')).toContain('throw pachcaOAuthErrorFromBody(data)');
  });

  describe('TypeScript client at runtime', () => {
    type ApiErrorLike = Error & { status?: number; errors?: { key: string; value: string }[] };
    type Chats = {
      getChat(id: number): Promise<unknown>;
      createChat(request: Record<string, unknown>): Promise<unknown>;
      deleteChat(id: number): Promise<void>;
    };
    let chats: Chats;
    let ApiError: new (...args: unknown[]) => ApiErrorLike;
    let OAuthError: new (...args: unknown[]) => Error & { error?: string };
    const realFetch = globalThis.fetch;

    beforeAll(async () => {
      const dir = path.join(crud, 'ts-run');
      fs.mkdirSync(dir);
      for (const name of ['types', 'utils', 'client']) {
        const js = ts.transpileModule(read(crud, `ts/${name}.ts`), {
          compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
        }).outputText;
        fs.writeFileSync(path.join(dir, `${name}.js`), js);
      }
      fs.writeFileSync(path.join(dir, 'package.json'), '{"type":"module"}');
      const client = await import(pathToFileURL(path.join(dir, 'client.js')).href);
      ({ ApiError, OAuthError } = await import(pathToFileURL(path.join(dir, 'types.js')).href));
      chats = new client.PachcaClient('test-token', 'https://api.test').chats;
    });

    afterEach(() => {
      globalThis.fetch = realFetch;
    });

    function answer(status: number, body: string | null, contentType?: string): void {
      globalThis.fetch = (async () =>
        new Response(body, { status, headers: contentType ? { 'Content-Type': contentType } : {} })) as typeof fetch;
    }

    async function failure(call: () => Promise<unknown>): Promise<unknown> {
      try {
        await call();
      } catch (error) {
        return error;
      }
      throw new Error('the call did not fail');
    }

    it('reads a 404 with no body as an ApiError with the status code', async () => {
      answer(404, null);
      const error = (await failure(() => chats.getChat(1))) as ApiErrorLike;
      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(404);
      expect(error.errors).toEqual([]);
      expect(error.message).toBe('HTTP 404');
    });

    it('reads a proxy page as an ApiError, for a call with no answer body too', async () => {
      answer(502, '<html><body>Bad Gateway</body></html>', 'text/html');
      const posted = (await failure(() => chats.createChat({ name: 'Отчёты' }))) as ApiErrorLike;
      expect(posted).toBeInstanceOf(ApiError);
      expect(posted.status).toBe(502);
      answer(404, '<html>Not Found</html>', 'text/html');
      const deleted = (await failure(() => chats.deleteChat(1))) as ApiErrorLike;
      expect(deleted).toBeInstanceOf(ApiError);
      expect(deleted.status).toBe(404);
    });

    it('keeps the errors and the status code of a JSON error body', async () => {
      answer(422, JSON.stringify({ errors: [{ key: 'name', value: 'blank' }] }), 'application/json');
      const error = (await failure(() => chats.getChat(1))) as ApiErrorLike;
      expect(error).toBeInstanceOf(ApiError);
      expect(error.status).toBe(422);
      expect(error.errors).toEqual([{ key: 'name', value: 'blank' }]);
    });

    it('reads a 401 by its body: the OAuth form is an OAuthError, an empty body an ApiError', async () => {
      answer(401, JSON.stringify({ error: 'invalid_token', error_description: 'Access token is missing' }), 'application/json');
      const oauth = (await failure(() => chats.getChat(1))) as Error & { error?: string };
      expect(oauth).toBeInstanceOf(OAuthError);
      expect(oauth.error).toBe('invalid_token');
      answer(401, null);
      const empty = (await failure(() => chats.getChat(1))) as ApiErrorLike;
      expect(empty).toBeInstanceOf(ApiError);
      expect(empty.status).toBe(401);
    });

    it('still parses the success answer', async () => {
      answer(200, JSON.stringify({ data: { id: 7, name: 'Отчёты' } }), 'application/json');
      expect(await chats.getChat(7)).toMatchObject({ id: 7, name: 'Отчёты' });
    });
  });
});

// Go sends an optional field only when the caller set it: for a nullable one
// `null` switches a setting off or deletes an object (oauth_client, webhook.kind,
// parent_message_id), so an unset field must never go out as null. NullFields
// sends an explicit null.
describe('Go request bodies', () => {
  let types: string;

  beforeAll(() => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-test-go-bodies-'));
    generate(path.resolve(__dirname, '..', '..', 'spec', 'openapi.yaml'), out, ['go']);
    types = fs.readFileSync(path.join(out, 'go', 'types.go'), 'utf-8');
    fs.rmSync(out, { recursive: true, force: true });
  });

  const struct = (name: string) => types.match(new RegExp(`\\ntype ${name} struct \\{\\n[\\s\\S]*?\\n\\}`))?.[0] ?? '';

  it('leaves out every optional field that is not set, nullable or not', () => {
    expect(struct('BotUpdateRequest')).toMatch(/OAuthClient \*BotOAuthClientRequest +`json:"oauth_client,omitempty"`/);
    expect(struct('BotUpdateRequestWebhook')).toMatch(/Kind +\*BotWebhookKind +`json:"kind,omitempty"`/);
    expect(struct('DraftUpdateRequestDraft')).toMatch(/ParentMessageID \*int32 +`json:"parent_message_id,omitempty"`/);
    expect(struct('DraftUpdateRequestDraft')).toMatch(/Schedule +\*DraftScheduleRequest +`json:"schedule,omitempty"`/);
  });

  it('keeps a required nullable field in the body', () => {
    expect(struct('AuditEvent')).toMatch(/IpAddress +\*string +`json:"ip_address"`/);
  });

  it('sends null for a field named in NullFields, on request models only', () => {
    expect(struct('BotUpdateRequest')).toContain('NullFields  []string                 `json:"-"` // fields to send as null: OAuthClient');
    expect(struct('DraftUpdateRequestDraft')).toContain('// fields to send as null: ParentMessageID, Schedule');
    expect(types).toContain('\t\tcase "Kind":\n\t\t\traw["kind"] = json.RawMessage("null")');
    expect(types).toContain('return nil, fmt.Errorf("BotUpdateRequest: field %q cannot be sent as null", name)');
    // A response model has nothing to send.
    expect(struct('BotWebhook')).not.toContain('NullFields');
    expect(struct('Message')).not.toContain('NullFields');
  });
});

// Kotlin, Python, C# and Swift: a field named in nullFields goes out as null, on
// request models only. Each SDK checks the bodies at runtime in sdk/*/tests.
describe('null fields of request models', () => {
  let out: string;
  const read = (file: string) => fs.readFileSync(path.join(out, file), 'utf-8');

  beforeAll(() => {
    out = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-test-null-fields-'));
    generate(path.resolve(__dirname, '..', '..', 'spec', 'openapi.yaml'), out, ['kotlin', 'python', 'csharp', 'swift']);
  });
  afterAll(() => fs.rmSync(out, { recursive: true, force: true }));

  it('Kotlin: nullFields and a serializer that writes null', () => {
    const kt = read('kt/Models.kt');
    expect(kt).toContain('@Serializable(with = BotUpdateRequestWebhookSerializer::class)');
    expect(kt).toContain('    @Transient val nullFields: Set<String> = emptySet(),');
    expect(kt).toContain('mapOf("parentMessageId" to "parent_message_id", "schedule" to "schedule")');
    expect(kt).toContain('cannot be sent as null');
    expect(kt).not.toMatch(/data class BotWebhook\([^)]*nullFields/);
  });

  it('Python: null_fields and the fields each model takes as null', () => {
    expect(read('py/models.py')).toContain('    null_fields: Sequence[str] = ()');
    const utils = read('py/utils.py');
    expect(utils).toContain('    BotUpdateRequest: frozenset({"oauth_client"}),');
    expect(utils).toContain('cannot be sent as null');
  });

  it('C#: NullFields and a contract modifier', () => {
    expect(read('cs/Models.cs')).toContain('public class BotUpdateRequestWebhook : INullFields');
    const utils = read('cs/Utils.cs');
    expect(utils).toContain('[typeof(BotUpdateRequest)] = new() { "OauthClient" },');
    expect(utils).toContain('TypeInfoResolver = new DefaultJsonTypeInfoResolver { Modifiers = { SendNullFields } },');
  });

  it('Swift: nullFields and its own encode(to:)', () => {
    const swift = read('swift/Models.swift');
    expect(swift).toContain('    public var nullFields: Set<String> = []');
    expect(swift).toContain('            try container.encodeNil(forKey: .kind)');
    expect(read('swift/Utils.swift')).not.toContain('stripNulls');
  });

  it('a keyword-named field goes by the name the caller writes, without the escape', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-test-null-keyword-'));
    try {
      const spec = {
        openapi: '3.0.0',
        info: { title: 'Test API', version: '1.0.0' },
        paths: {
          '/items/{id}': {
            put: {
              operationId: 'updateItem',
              summary: 'Изменение элемента',
              tags: ['Items'],
              parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
              requestBody: {
                required: true,
                content: { 'application/json': { schema: { $ref: '#/components/schemas/ItemUpdateRequest' } } },
              },
              responses: { '204': { description: 'Нет содержимого' } },
            },
          },
        },
        components: {
          schemas: {
            ItemUpdateRequest: {
              type: 'object',
              properties: {
                class: { type: 'string', nullable: true, description: 'Класс элемента.' },
                name: { type: 'string', description: 'Название элемента.' },
              },
            },
          },
        },
      };
      const file = path.join(dir, 'spec.yaml');
      fs.writeFileSync(file, JSON.stringify(spec));
      const gen = path.join(dir, 'out');
      generate(file, gen, ['kotlin', 'python', 'csharp', 'swift']);
      const at = (f: string) => fs.readFileSync(path.join(gen, f), 'utf-8');
      expect(at('kt/Models.kt')).toContain('mapOf("class" to "class")');
      expect(at('py/utils.py')).toContain('    ItemUpdateRequest: frozenset({"class_"}),');
      expect(at('cs/Utils.cs')).toContain('[typeof(ItemUpdateRequest)] = new() { "Class" },');
      const swift = at('swift/Models.swift');
      expect(swift).toContain('nullFields.subtracting(["class"])');
      expect(swift).toContain('if nullFields.contains("class") {');
      expect(swift).toContain('try container.encodeNil(forKey: .`class`)');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

// A union with no discriminator ranks its members by the payload keys and takes
// the first one that decodes: a member that fits the keys but not the types (an
// older record) gives way to the next instead of failing the whole page.
describe('unions without a discriminator', () => {
  const fixture = path.join(TESTS_DIR, 'union-no-discriminator', 'fixture.yaml');
  let out: string;
  const read = (file: string) => fs.readFileSync(path.join(out, file), 'utf-8');

  beforeAll(() => {
    out = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-test-union-fallback-'));
    generate(fixture, out, SUPPORTED_LANGS);
  });
  afterAll(() => fs.rmSync(out, { recursive: true, force: true }));

  it('every runtime falls through to the next member when one does not decode', () => {
    const go = read('go/types.go');
    expect(go).toContain('func rankUnionMembers(data []byte, shapes []unionMemberShape) ([]int, map[string]json.RawMessage) {');
    expect(go).toMatch(/if err = json\.Unmarshal\(data, v\); err == nil \{/);
    expect(go).toContain('return firstErr');
    const kt = read('kt/Models.kt');
    expect(kt).toContain('for (shape in ranked) {');
    expect(kt).toContain('} catch (e: IllegalArgumentException) {');
    const cs = read('cs/Models.cs');
    expect(cs).toContain('foreach (var candidate in ranked)');
    expect(cs).toContain('catch (JsonException e)');
    const py = read('py/utils.py');
    expect(py).toContain('for member in _rank_union_members(members, value):');
    expect(py).toContain('raise errors[0]');
    const swift = read('swift/Models.swift');
    expect(swift).toContain('for index in ranked {');
    expect(swift).toContain('let keys = Set((try? decoder.container(keyedBy: AnyKey.self))?.allKeys.map(\\.stringValue) ?? [])');
  });

  it('Kotlin: a required nullable field of a member may hold null', () => {
    const pachca = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-test-kt-members-'));
    try {
      generate(path.resolve(__dirname, '..', '..', 'spec', 'openapi.yaml'), pachca, ['kotlin']);
      const models = fs.readFileSync(path.join(pachca, 'kt', 'Models.kt'), 'utf-8');
      expect(models).toContain('@SerialName("token_name") val tokenName: String? = null,');
      expect(models).toContain('@SerialName("action_message") val actionMessage: String? = null,');
      expect(models).toContain('val limit: Int? = null,');
    } finally {
      fs.rmSync(pachca, { recursive: true, force: true });
    }
  });
});

// encoding/json and System.Text.Json fill a missing field with its zero value, so
// Go and C# check the required keys themselves before they try a member, the way
// Kotlin and Python fail on a missing required field.
describe('unions without a discriminator: required keys', () => {
  const fixture = path.join(TESTS_DIR, 'union-type-mismatch', 'fixture.yaml');
  let out: string;
  const read = (file: string) => fs.readFileSync(path.join(out, file), 'utf-8');

  beforeAll(() => {
    out = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-test-union-required-'));
    generate(fixture, out, ['go', 'csharp']);
  });
  afterAll(() => fs.rmSync(out, { recursive: true, force: true }));

  it('Go lists the required keys of a member and skips a member that misses one', () => {
    const go = read('go/types.go');
    expect(go).toContain(
      '{name: "DetailsBotTokenUpdated", keys: map[string]struct{}{"token_kind": {}, "resource_owner_id": {}, "current_scopes": {}, "access_token_id": {}, "bot_id": {}, "webhook_id": {}, "scopes": {}}},',
    );
    expect(go).toContain(
      '\t"DetailsBotTokenUpdated": {keys: []string{"token_kind", "resource_owner_id", "access_token_id"}, nested: []nestedRequiredShape{{key: "scopes", model: "ScopesChange"}}},',
    );
    // A required field that may hold null is not listed: Kotlin and Swift take a missing one as null.
    expect(go).toContain('\t"DetailsBot":             {keys: []string{"bot_id"}},');
    expect(go).not.toContain('"DetailsEmpty": {');
    expect(go).toContain('err := missingRequired(eventDetailsUnionShapes[i].name, raw)');
  });

  it('C# lists the required keys of a member and skips a member that misses one', () => {
    const cs = read('cs/Models.cs');
    expect(cs).toContain(
      '(typeof(DetailsBotTokenUpdated), new HashSet<string> { "token_kind", "resource_owner_id", "current_scopes", "access_token_id", "bot_id", "webhook_id", "scopes" }),',
    );
    expect(cs).toContain('(typeof(DetailsEmpty), new HashSet<string>()),');
    expect(cs).toContain(
      '["DetailsBotTokenUpdated"] = (new[] { "token_kind", "resource_owner_id", "access_token_id" }, new[] { ("scopes", "ScopesChange") }),',
    );
    expect(cs).toContain('["DetailsBot"] = (new[] { "bot_id" }, Array.Empty<(string, string)>()),');
    expect(cs).toContain('var missing = UnionRequiredKeys.Missing(candidate.Type.Name, root);');
  });
});

// Kotlin, Python and Swift fail on a missing required field anywhere in a member,
// so a union goes on to the next member. Go and C# check the keys of the models
// nested in a member too (a model, a list of them, a field that takes a list or
// an object), but only when a union picks a member: a model decoded on its own
// stays as lenient as encoding/json and System.Text.Json.
describe('unions without a discriminator: nested required keys', () => {
  const fixture = path.join(TESTS_DIR, 'union-value-field', 'fixture.yaml');
  let out: string;
  const read = (file: string) => fs.readFileSync(path.join(out, file), 'utf-8');
  const hasGo = (() => {
    try {
      execFileSync('go', ['version'], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  })();

  beforeAll(() => {
    out = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-test-union-nested-required-'));
    generate(fixture, out, ['go', 'csharp']);
  });
  afterAll(() => fs.rmSync(out, { recursive: true, force: true }));

  it('lists the members and the models nested in them, each once, members first', () => {
    const ir = transform(parseOpenAPI(fixture));
    expect(unionRequiredShapes(ir.unions, ir.models)).toEqual([
      { model: 'DetailsBot', required: ['bot_id'], nested: [{ key: 'scopes', model: 'ScopesChange' }] },
      { model: 'DetailsBotScopes', required: ['bot_id', 'scopes'], nested: [] },
      {
        model: 'DetailsBotTokenUpdated',
        required: ['token_kind', 'resource_owner_id', 'access_token_id'],
        nested: [{ key: 'scopes', model: 'ScopesChange' }],
      },
      { model: 'DetailsToken', required: ['token_kind', 'resource_owner_id', 'scopes', 'access_token_id'], nested: [] },
      { model: 'ScopesChange', required: ['previous', 'new'], nested: [] },
    ]);
  });

  it('follows lists of models and a model that holds itself, and leaves out what has nothing to check', () => {
    const field = (name: string, type: IRFieldType, required = false, nullable = false): IRField => ({ name, type, required, nullable });
    const model = (name: string, fields: IRField[]): IRModel => ({ name, fields, isError: false, inlineObjects: [] });
    const models = [
      model('Folder', [
        field('id', { kind: 'primitive', primitive: 'integer' }, true),
        field('children', { kind: 'array', items: { kind: 'model', ref: 'Folder' } }),
        field('owner', { kind: 'model', ref: 'Owner' }),
        field('note', { kind: 'model', ref: 'Note' }),
      ]),
      model('Owner', [field('name', { kind: 'primitive', primitive: 'string' }, true, true)]),
      model('Note', [field('text', { kind: 'primitive', primitive: 'string' })]),
      model('Wrapper', [field('items', { kind: 'array', items: { kind: 'array', items: { kind: 'model', ref: 'Leaf' } } })]),
      model('Leaf', [field('key', { kind: 'primitive', primitive: 'string' }, true)]),
    ];
    const unions = [{ name: 'Item', memberRefs: ['Folder', 'Wrapper'] }];
    expect(unionRequiredShapes(unions, models)).toEqual([
      { model: 'Folder', required: ['id'], nested: [{ key: 'children', model: 'Folder' }] },
      { model: 'Wrapper', required: [], nested: [{ key: 'items', model: 'Leaf' }] },
      { model: 'Leaf', required: ['key'], nested: [] },
    ]);
    // A union with a discriminator decodes by it: nothing to list.
    expect(unionRequiredShapes([{ ...unions[0], discriminatorField: 'type' }], models)).toEqual([]);
  });

  it('Go and C# check the nested model of a field that takes a list or an object', () => {
    const go = read('go/types.go');
    expect(go).toContain(
      '\t"DetailsBot":             {keys: []string{"bot_id"}, nested: []nestedRequiredShape{{key: "scopes", model: "ScopesChange"}}},',
    );
    expect(go).toContain('\t"ScopesChange":           {keys: []string{"previous", "new"}},');
    expect(go).toContain('if err := missingRequiredIn(n.model, v); err != nil {');
    const cs = read('cs/Models.cs');
    expect(cs).toContain('["DetailsBot"] = (new[] { "bot_id" }, new[] { ("scopes", "ScopesChange") }),');
    expect(cs).toContain('["ScopesChange"] = (new[] { "previous", "new" }, Array.Empty<(string, string)>()),');
    expect(cs).toContain('if (value.TryGetProperty(key, out var inner) && MissingIn(nested, inner) is { } missing) return missing;');
  });

  it.skipIf(!hasGo)('Go: scopes {} gives way, a model on its own stays lenient', () => {
    const mod = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-test-union-nested-go-'));
    try {
      fs.mkdirSync(path.join(mod, 'pachca'));
      // The models alone: the client of a fixture without a time field imports time unused.
      for (const file of ['types.go', 'utils.go']) {
        fs.copyFileSync(path.join(out, 'go', file), path.join(mod, 'pachca', file));
      }
      fs.writeFileSync(path.join(mod, 'go.mod'), 'module fixture\n\ngo 1.21\n');
      fs.writeFileSync(
        path.join(mod, 'main.go'),
        [
          'package main',
          '',
          'import (',
          '\t"encoding/json"',
          '\t"fmt"',
          '',
          '\t"fixture/pachca"',
          ')',
          '',
          'func pick(payload string) string {',
          '\tvar u pachca.EventDetailsUnion',
          '\tif err := json.Unmarshal([]byte(payload), &u); err != nil {',
          '\t\treturn "error: " + err.Error()',
          '\t}',
          '\tswitch {',
          '\tcase u.DetailsBot != nil:',
          '\t\treturn "DetailsBot"',
          '\tcase u.DetailsBotScopes != nil:',
          '\t\treturn "DetailsBotScopes"',
          '\tcase u.DetailsBotTokenUpdated != nil:',
          '\t\treturn "DetailsBotTokenUpdated"',
          '\tcase u.DetailsToken != nil:',
          '\t\treturn "DetailsToken"',
          '\tcase u.DetailsEmpty != nil:',
          '\t\treturn "DetailsEmpty"',
          '\t}',
          '\treturn "none"',
          '}',
          '',
          'func main() {',
          '\tfmt.Println(pick(`{"bot_id":7,"actor_id":12,"scopes":{}}`))',
          '\tfmt.Println(pick(`{"bot_id":7,"actor_id":12,"scopes":{"previous":["a"],"new":["a","b"]}}`))',
          '\tfmt.Println(pick(`{"bot_id":7,"actor_id":12,"scopes":["a"]}`))',
          '\tfmt.Println(pick(`{"token_kind":"bot","resource_owner_id":7,"access_token_id":4827,"bot_id":7,"scopes":{"previous":[]}}`))',
          '\tfmt.Println(pick(`{"token_kind":"bot","resource_owner_id":7,"access_token_id":4827,"bot_id":7,"scopes":{"previous":[],"new":["a"]}}`))',
          '\tvar bot pachca.DetailsBot',
          '\terr := json.Unmarshal([]byte(`{"bot_id":7,"scopes":{}}`), &bot)',
          '\tfmt.Println(err == nil && bot.Scopes != nil && bot.Scopes.ScopesChange != nil)',
          '}',
          '',
        ].join('\n'),
      );
      const output = execFileSync('go', ['run', '.'], { cwd: mod, encoding: 'utf-8' });
      expect(output.trim().split('\n')).toEqual([
        'DetailsEmpty',
        'DetailsBot',
        'DetailsBot',
        'DetailsEmpty',
        'DetailsBotTokenUpdated',
        'true',
      ]);
    } finally {
      fs.rmSync(mod, { recursive: true, force: true });
    }
  }, 120_000);
});

// A field that takes a list or an object (`string[] | ScopesChange`, as TypeSpec
// emits it: anyOf of an array and a $ref) is typed in every SDK and decoded by the
// JSON kind of its value. Inside an undiscriminated union, the member that holds
// such a field takes both kinds.
describe('value unions', () => {
  const fixture = path.join(TESTS_DIR, 'union-value-field', 'fixture.yaml');
  let out: string;
  const read = (file: string) => fs.readFileSync(path.join(out, file), 'utf-8');
  const hasPython = (() => {
    try {
      execFileSync('python3', ['--version'], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  })();

  beforeAll(() => {
    out = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-test-value-union-'));
    generate(fixture, out, SUPPORTED_LANGS);
  });
  afterAll(() => fs.rmSync(out, { recursive: true, force: true }));

  it('names the union after the model and the field, with Value when a schema has the name', () => {
    const ir = transform(parseOpenAPI(fixture));
    expect(ir.valueUnions.map((vu) => vu.name)).toEqual(['DetailsBotScopesValue', 'EventActor']);
    const scopes = ir.models.find((m) => m.name === 'DetailsBot')!.fields.find((f) => f.name === 'scopes')!;
    expect(scopes.type.valueUnion).toBe('DetailsBotScopesValue');
    expect(scopes.type.members?.map((m) => m.kind)).toEqual(['array', 'model']);
  });

  it('a union whose members share a JSON kind stays an open value', () => {
    const ir = transform(parseOpenAPI(path.join(TESTS_DIR, 'union-no-discriminator', 'fixture.yaml')));
    expect(ir.valueUnions).toEqual([]);
  });

  it('every SDK types the field', () => {
    expect(read('ts/types.ts')).toContain('scopes?: string[] | ScopesChange;');
    expect(read('py/models.py')).toContain('scopes: list[str] | ScopesChange | None = None');
    expect(read('go/types.go')).toMatch(/Scopes\s+\*DetailsBotScopesValue\s+`json:"scopes,omitempty"`/);
    expect(read('go/types.go')).toContain("case '[':\n\t\treturn json.Unmarshal(data, &u.StringList)");
    // A field that is not a pointer gets UnmarshalJSON with null: it stays as it is.
    expect(read('go/types.go')).toContain("if jsonValueKind(data) == 'n' {\n\t\treturn nil\n\t}");
    expect(read('kt/Models.kt')).toContain('val scopes: DetailsBotScopesValue? = null,');
    expect(read('kt/Models.kt')).toContain('data class StringList(val value: kotlin.collections.List<kotlin.String>) : DetailsBotScopesValue');
    expect(read('kt/Models.kt')).toContain('element is JsonObject -> DetailsBotScopesValue.ScopesChange(json.decodeFromJsonElement<com.pachca.sdk.ScopesChange>(element))');
    expect(read('cs/Models.cs')).toContain('public DetailsBotScopesValue? Scopes { get; set; }');
    expect(read('cs/Models.cs')).toContain('case JsonTokenType.StartArray:');
    expect(read('swift/Models.swift')).toContain('public let scopes: DetailsBotScopesValue?');
    expect(read('swift/Models.swift')).toContain('case stringList([String])');
  });

  it.skipIf(!hasPython)('Python: an old record with scopes as an object stays in DetailsBot', () => {
    const pkg = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-test-value-union-py-'));
    try {
      fs.cpSync(path.join(out, 'py'), path.join(pkg, 'pachca'), { recursive: true });
      const script = [
        'import sys, types',
        'stub = types.ModuleType("httpx")',
        'stub.__getattr__ = lambda name: type(name, (), {})',
        'sys.modules["httpx"] = stub',
        `sys.path.insert(0, ${JSON.stringify(pkg)})`,
        'from pachca.models import Actor, DetailsBot, DetailsBotTokenUpdated, DetailsToken, Event, ScopesChange',
        'from pachca.utils import deserialize, serialize',
        'def event(d, actor=None): return deserialize(Event, {"id": 1, "event_key": "bot_token_updated", "actor": actor, "details": d})',
        'old = event({"bot_id": 7, "actor_id": 12, "webhook_id": 31, "scopes": {"previous": ["a"], "new": ["a", "b"]}}).details',
        'assert isinstance(old, DetailsBot) and isinstance(old.scopes, ScopesChange) and old.scopes.new == ["a", "b"], old',
        'created = event({"bot_id": 7, "actor_id": 12, "webhook_id": 31, "scopes": ["a"]}).details',
        'assert isinstance(created, DetailsBot) and created.scopes == ["a"], created',
        'token = event({"token_kind": "user", "resource_owner_id": 12, "scopes": ["a"], "access_token_id": 4828}).details',
        'assert isinstance(token, DetailsToken), token',
        'updated = event({"token_kind": "bot", "resource_owner_id": 7, "access_token_id": 4827, "bot_id": 7, "scopes": {"previous": [], "new": ["a"]}}).details',
        'assert isinstance(updated, DetailsBotTokenUpdated), updated',
        // A value deep inside the object has another type: the nested model is checked too.
        'broken = event({"bot_id": 7, "actor_id": 12, "scopes": {"previous": "a", "new": []}}).details',
        'assert not isinstance(broken, DetailsBot), broken',
        'assert event({}, actor="system").actor == "system"',
        'assert isinstance(event({}, actor={"id": 3}).actor, Actor)',
        'assert serialize(old)["scopes"] == {"previous": ["a"], "new": ["a", "b"]}',
        'print("ok")',
      ].join('\n');
      expect(execFileSync('python3', ['-c', script], { encoding: 'utf-8' }).trim()).toBe('ok');
    } finally {
      fs.rmSync(pkg, { recursive: true, force: true });
    }
  });
});

// Members that share a key with another type (scopes as a list or an object): the
// member that fits the keys best but not the value's type gives way to the next.
describe('unions without a discriminator: value types', () => {
  const fixture = path.join(TESTS_DIR, 'union-type-mismatch', 'fixture.yaml');
  let out: string;
  const hasPython = (() => {
    try {
      execFileSync('python3', ['--version'], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  })();

  beforeAll(() => {
    out = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-test-union-types-'));
    generate(fixture, out, ['python']);
  });
  afterAll(() => fs.rmSync(out, { recursive: true, force: true }));

  it('Python checks the value types when it picks a member', () => {
    const py = fs.readFileSync(path.join(out, 'py', 'utils.py'), 'utf-8');
    expect(py).toContain('return _deserialize_dataclass(member, value, strict=True)');
    expect(py).toContain('if strict and not _fits(hints[f.name], v):');
  });

  it.skipIf(!hasPython)('Python: a token record goes past the member that takes scopes as an object', () => {
    fs.renameSync(path.join(out, 'py'), path.join(out, 'pachca'));
    const script = [
      'import sys, types',
      'stub = types.ModuleType("httpx")',
      'stub.__getattr__ = lambda name: type(name, (), {})',
      'sys.modules["httpx"] = stub',
      `sys.path.insert(0, ${JSON.stringify(out)})`,
      'from pachca.models import DetailsBot, DetailsBotTokenUpdated, DetailsToken, Event',
      'from pachca.utils import deserialize',
      'def details(d): return deserialize(Event, {"id": 1, "event_key": "bot_updated", "details": d}).details',
      'token = details({"token_kind": "user", "resource_owner_id": 12, "scopes": ["messages:read"], "access_token_id": 4828})',
      'assert isinstance(token, DetailsToken) and token.scopes == ["messages:read"], token',
      'updated = details({"token_kind": "bot", "resource_owner_id": 7, "current_scopes": ["chats:read"], "scopes": {"previous": ["messages:read"], "new": ["chats:read"]}, "access_token_id": 4827, "webhook_id": 31})',
      'assert isinstance(updated, DetailsBotTokenUpdated) and updated.scopes.new == ["chats:read"], updated',
      'old = details({"bot_id": 7, "webhook_id": 31, "scopes": {"previous": [], "new": []}})',
      'assert not isinstance(old, DetailsBot), old',
      // A nested model is checked too: scopes.new is not a list, so DetailsBotTokenUpdated gives way.
      'nested = details({"token_kind": "bot", "resource_owner_id": 7, "access_token_id": 4827, "scopes": {"previous": [], "new": "chats:read"}})',
      'assert not isinstance(nested, DetailsBotTokenUpdated), nested',
      'bot = details({"bot_id": 7, "webhook_id": 31, "scopes": ["messages:read"]})',
      'assert isinstance(bot, DetailsBot), bot',
      'print("ok")',
    ].join('\n');
    expect(execFileSync('python3', ['-c', script], { encoding: 'utf-8' }).trim()).toBe('ok');
  });
});

// A .NET project sees System.Threading.Tasks.TaskStatus, Task, Thread and
// System.IO.File through the default implicit usings: a C# example spells the
// SDK type in full, or the short name fails with CS0104.
describe('C# examples', () => {
  it('spell in full an SDK type that the implicit usings also bring', () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-test-cs-examples-'));
    try {
      generate(path.resolve(__dirname, '..', '..', 'spec', 'openapi.yaml'), out, ['csharp'], { examples: true });
      const examples = JSON.parse(fs.readFileSync(path.join(out, 'cs', 'examples.json'), 'utf-8')) as Record<
        string,
        { usage: string; examples?: Record<string, { usage: string }> }
      >;
      // The named request examples are shown in the guides too.
      const usages = Object.values(examples)
        .flatMap((e) => [e.usage, ...Object.values(e.examples ?? {}).map((named) => named.usage)])
        .join('\n');
      expect(usages).toContain('Pachca.Sdk.TaskStatus.Undone');
      expect(usages).not.toMatch(/(?<![.\w])TaskStatus\./);
    } finally {
      fs.rmSync(out, { recursive: true, force: true });
    }
  });
});

// A request body with named examples gets the usage of each under the
// operation's entry (`examples`), so a guide can show the SDK call of any of
// them. Every top-level key stays an operation: readers that look one up or
// walk the keys see the same file as before.
describe('named body examples', () => {
  const DIRS: Record<string, string> = {
    typescript: 'ts',
    python: 'py',
    go: 'go',
    kotlin: 'kt',
    swift: 'swift',
    csharp: 'cs',
  };
  type Entry = {
    usage: string;
    output?: string;
    imports?: string[];
    examples?: Record<string, { summary?: string; usage: string; imports?: string[] }>;
  };
  const read = (out: string, lang: string) =>
    JSON.parse(fs.readFileSync(path.join(out, DIRS[lang], 'examples.json'), 'utf-8')) as Record<string, Entry>;

  it('writes each named example of the body under its key, the first one as the entry itself', () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-test-named-examples-'));
    try {
      generate(path.join(TESTS_DIR, 'body-example', 'fixture.yaml'), out, SUPPORTED_LANGS, { examples: true });
      for (const lang of SUPPORTED_LANGS) {
        const examples = read(out, lang);
        expect(Object.keys(examples), lang).toEqual([
          'Client_Init',
          'MessageOperations_createMessage',
          'MessageOperations_updateMessage',
        ]);
        const entry = examples.MessageOperations_createMessage;
        expect(Object.keys(entry.examples ?? {}), lang).toEqual(['minimal', 'full']);
        const { minimal, full } = entry.examples!;
        expect(minimal.usage, lang).toBe(entry.usage);
        expect(minimal.imports, lang).toEqual(entry.imports);
        expect(minimal.summary, lang).toBe('Текст с кнопкой');
        expect(full.summary, lang).toBe('Сообщение с файлом');
        expect(full.usage, lang).toContain('report.pdf');
        expect(full.usage, lang).not.toContain('accept');
        expect(full, lang).not.toHaveProperty('output');
        // A single unnamed example has nothing to choose from.
        expect(examples.MessageOperations_updateMessage, lang).not.toHaveProperty('examples');
      }
    } finally {
      fs.rmSync(out, { recursive: true, force: true });
    }
  });

  // guides/buttons.mdx shows the button message in every SDK language.
  it('gives the Pachca button message to every language', () => {
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-test-named-examples-pachca-'));
    try {
      generate(path.resolve(__dirname, '..', '..', 'spec', 'openapi.yaml'), out, SUPPORTED_LANGS, { examples: true });
      for (const lang of SUPPORTED_LANGS) {
        const named = read(out, lang).MessageOperations_createMessage.examples ?? {};
        expect(Object.keys(named), lang).toEqual(['Минимальный запрос', 'Сообщение с кнопкой']);
        expect(named['Сообщение с кнопкой'].usage, lang).toContain('https://example.com/details');
        expect(named['Сообщение с кнопкой'], lang).not.toHaveProperty('summary');
      }
    } finally {
      fs.rmSync(out, { recursive: true, force: true });
    }
  });
});

// Every Go snapshot compiles: an unused "time" import in client.go and a
// pagination loop that assumed Pachca's meta (has_next, a required next_page)
// used to break the client of another API's spec.
describe('Go snapshots compile', () => {
  const hasGo = (() => {
    try {
      execFileSync('go', ['version'], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  })();
  const fixtures = fs
    .readdirSync(TESTS_DIR)
    .filter((name) => fs.existsSync(path.join(TESTS_DIR, name, 'snapshots', 'go', 'client.go')));

  it.skipIf(!hasGo).each(fixtures)('%s', (name) => {
    const mod = fs.mkdtempSync(path.join(os.tmpdir(), `gen-test-go-vet-${name}-`));
    try {
      const dir = path.join(TESTS_DIR, name, 'snapshots', 'go');
      for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.go'))) {
        fs.copyFileSync(path.join(dir, file), path.join(mod, file));
      }
      fs.writeFileSync(path.join(mod, 'go.mod'), `module example.com/fixture\n\ngo 1.22\n`);
      execFileSync('go', ['vet', './...'], { cwd: mod, stdio: 'pipe' });
    } finally {
      fs.rmSync(mod, { recursive: true, force: true });
    }
  });
});
