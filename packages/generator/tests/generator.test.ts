import { describe, it, expect, afterEach, beforeAll, afterAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { generate, SUPPORTED_LANGS } from '../src/index.js';
import { classifyEnumUsage, transform } from '../src/transform.js';
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
      expect(read('py/client.py')).toContain('OAuthError(OAuthErrorCode(body["error"])');
    });

    it('Go: the OAuth code is typed and holds only a code', () => {
      expect(read('go/types.go')).toContain('Err              OAuthErrorCode `json:"error"`');
      expect(read('go/types.go')).toContain('return string(e.Err)');
      // A 401 body that does not decode comes back wrapped, not as a code.
      const client = read('go/client.go');
      expect(client).toMatch(/case http\.StatusUnauthorized:\n\t\tvar e OAuthError\n\t\tif err := json\.NewDecoder\(resp\.Body\)\.Decode\(&e\); err != nil \{\n\t\t\treturn nil, fmt\.Errorf\("HTTP %d: %w", resp\.StatusCode, err\)/);
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
