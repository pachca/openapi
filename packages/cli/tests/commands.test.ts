import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runCommand } from '@oclif/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

const CLI_ROOT = path.join(__dirname, '..');

let tmpDir: string;
const originalFetch = globalThis.fetch;
const savedEnv: Record<string, string | undefined> = {};

function setEnv(key: string, value: string | undefined) {
  if (!(key in savedEnv)) savedEnv[key] = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

function mockFetch(response: { status?: number; data?: unknown; headers?: Record<string, string> }) {
  const status = response.status ?? 200;
  const headers = new Headers({ 'content-type': 'application/json', ...response.headers });
  globalThis.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 400,
    status,
    statusText: status === 200 ? 'OK' : status === 302 ? 'Found' : 'Error',
    headers,
    json: () => Promise.resolve(response.data ?? {}),
    text: () => Promise.resolve(JSON.stringify(response.data ?? {})),
  });
}

function mockPaginatedFetch(pages: { data: unknown[]; next?: string }[]) {
  let callIndex = 0;
  globalThis.fetch = vi.fn().mockImplementation(() => {
    const page = pages[callIndex++] || pages[pages.length - 1];
    return Promise.resolve({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({
        data: page.data,
        meta: { paginate: { next_page: page.next || null } },
      }),
      text: () => Promise.resolve(JSON.stringify({
        data: page.data,
        meta: { paginate: { next_page: page.next || null } },
      })),
    });
  });
}

// All scopes needed for tests
const ALL_SCOPES = [
  'users:read', 'users:create', 'users:update', 'users:delete',
  'chats:read', 'messages:create', 'search:messages',
  'uploads:write',
];

function setupProfile(scopes = ALL_SCOPES) {
  const configDir = path.join(tmpDir, 'pachca');
  fs.mkdirSync(configDir, { recursive: true });
  const scopesStr = scopes.map((s) => `"${s}"`).join(', ');
  fs.writeFileSync(
    path.join(configDir, 'config.toml'),
    `active_profile = "test"\n\n[profiles.test]\ntype = "user"\ntoken = "test-token"\nuser = "Test User"\nscopes = [${scopesStr}]\n`,
  );
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pachca-cmd-test-'));
  setEnv('XDG_CONFIG_HOME', tmpDir);
  setEnv('PACHCA_TOKEN', undefined);
  setEnv('PACHCA_PROFILE', undefined);
  Object.defineProperty(process.stdin, 'isTTY', { value: false, writable: true, configurable: true });
  Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true, configurable: true });
  Object.defineProperty(process.stderr, 'isTTY', { value: false, writable: true, configurable: true });
  setupProfile();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  for (const key of Object.keys(savedEnv)) delete savedEnv[key];
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

/** Get fetch mock calls */
function fetchCalls() {
  return (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
}

describe('generated commands — functional tests', () => {
  // ----- GET list (users list) -----

  describe('users list', () => {
    it('GET /users → JSON array', async () => {
      mockFetch({ data: { data: [{ id: 1, first_name: 'Ivan' }] } });
      const { stdout } = await runCommand(['users', 'list'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed).toEqual([{ id: 1, first_name: 'Ivan' }]);
      expect(fetchCalls()[0][0]).toContain('/users');
      expect(fetchCalls()[0][1].method).toBe('GET');
    });

    it('--limit 5 → query limit=5', async () => {
      mockFetch({ data: { data: [{ id: 1 }] } });
      await runCommand(['users', 'list', '--limit', '5'], { root: CLI_ROOT });
      expect(fetchCalls()[0][0]).toContain('limit=5');
    });

    it('--cursor abc → query cursor=abc', async () => {
      mockFetch({ data: { data: [{ id: 1 }] } });
      await runCommand(['users', 'list', '--cursor', 'abc'], { root: CLI_ROOT });
      expect(fetchCalls()[0][0]).toContain('cursor=abc');
    });

    it('--all → auto-paginate (2 pages)', async () => {
      mockPaginatedFetch([
        { data: [{ id: 1 }], next: 'cursor2' },
        { data: [{ id: 2 }] },
      ]);
      const { stdout } = await runCommand(['users', 'list', '--all'], { root: CLI_ROOT });
      expect(JSON.parse(stdout)).toEqual([{ id: 1 }, { id: 2 }]);
      expect(fetchCalls().length).toBe(2);
    });

    it('--all stops on cursor cycle', async () => {
      mockPaginatedFetch([
        { data: [{ id: 1 }], next: 'same' },
        { data: [{ id: 2 }], next: 'same' },
      ]);
      const { stdout } = await runCommand(['users', 'list', '--all'], { root: CLI_ROOT });
      expect(JSON.parse(stdout)).toEqual([{ id: 1 }, { id: 2 }]);
      expect(fetchCalls().length).toBe(2);
    });

    it('--quiet → empty stdout', async () => {
      mockFetch({ data: { data: [{ id: 1 }] } });
      const { stdout } = await runCommand(['users', 'list', '--quiet'], { root: CLI_ROOT });
      expect(stdout.trim()).toBe('');
    });
  });

  // ----- GET list output formats -----

  describe('users list output formats', () => {
    it('--output table → table with header', async () => {
      mockFetch({ data: { data: [{ id: 1, first_name: 'Ivan', last_name: 'Petrov' }] } });
      Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true, configurable: true });
      const { stdout } = await runCommand(['users', 'list', '--output', 'table'], { root: CLI_ROOT });
      // Table output has uppercased column headers
      expect(stdout).toContain('ID');
      expect(stdout).toContain('Ivan');
    });

    it('--output csv → CSV with header row', async () => {
      mockFetch({ data: { data: [{ id: 1, first_name: 'Ivan', email: 'ivan@test.com' }] } });
      const { stdout } = await runCommand(['users', 'list', '--output', 'csv'], { root: CLI_ROOT });
      const lines = stdout.trim().split('\n');
      // First line is CSV header
      expect(lines[0]).toContain('id');
      // Data row
      expect(lines[1]).toContain('1');
      expect(lines[1]).toContain('Ivan');
    });
  });

  // ----- GET single (users get) -----

  describe('users get', () => {
    it('users get 123 → GET /users/123', async () => {
      mockFetch({ data: { data: { id: 123, first_name: 'Ivan' } } });
      const { stdout } = await runCommand(['users', 'get', '123'], { root: CLI_ROOT });
      expect(JSON.parse(stdout)).toEqual({ id: 123, first_name: 'Ivan' });
      expect(fetchCalls()[0][0]).toContain('/users/123');
    });
  });

  // ----- POST create (messages create) -----

  describe('messages create', () => {
    it('--entity-id 456 --content hello → POST /messages with wrapper', async () => {
      mockFetch({ data: { data: { id: 1, content: 'hello' } } });
      await runCommand(['messages', 'create', '--entity-id', '456', '--content', 'hello'], { root: CLI_ROOT });
      expect(fetchCalls().length).toBeGreaterThan(0);
      const [url, opts] = fetchCalls()[0];
      expect(url).toContain('/messages');
      expect(opts.method).toBe('POST');
      const body = JSON.parse(opts.body);
      expect(body.message.entity_id).toBe(456);
      expect(body.message.content).toBe('hello');
    });

    it('--files JSON array → body contains parsed array', async () => {
      mockFetch({ data: { data: { id: 1 } } });
      const filesJson = '[{"key":"file.png","name":"photo.png"}]';
      await runCommand(['messages', 'create', '--entity-id', '456', '--content', 'hello', '--files', filesJson], { root: CLI_ROOT });
      const body = JSON.parse(fetchCalls()[0][1].body);
      expect(body.message.files).toEqual([{ key: 'file.png', name: 'photo.png' }]);
    });

    it('missing required + --no-input → stderr error', async () => {
      mockFetch({ data: {} });
      // Pass --content to avoid stdin read hang, but omit required --entity-id
      const { stderr, error } = await runCommand(['messages', 'create', '--content', 'hello', '--no-input'], { root: CLI_ROOT });
      expect(error).toBeTruthy();
      expect(stderr).toContain('Обязательный флаг');
    });
  });

  // ----- POST create with wrapper unwrap (users create) -----

  describe('users create', () => {
    it('--email test@test.com → body has user wrapper', async () => {
      mockFetch({ data: { data: { id: 1 } } });
      await runCommand(['users', 'create', '--email', 'test@test.com'], { root: CLI_ROOT });
      const body = JSON.parse(fetchCalls()[0][1].body);
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe('test@test.com');
    });

    it('--skip-email-notify → sibling at top level', async () => {
      mockFetch({ data: { data: { id: 1 } } });
      await runCommand(['users', 'create', '--email', 'test@test.com', '--skip-email-notify'], { root: CLI_ROOT });
      const body = JSON.parse(fetchCalls()[0][1].body);
      expect(body.user).toBeDefined();
      expect(body.skip_email_notify).toBe(true);
      expect(body.user.skip_email_notify).toBeUndefined();
    });
  });

  // ----- PUT update (users update) -----

  describe('users update', () => {
    it('123 --first-name Ivan → PUT /users/123', async () => {
      mockFetch({ data: { data: { id: 123 } } });
      await runCommand(['users', 'update', '123', '--first-name', 'Ivan'], { root: CLI_ROOT });
      const [url, opts] = fetchCalls()[0];
      expect(url).toContain('/users/123');
      expect(opts.method).toBe('PUT');
      const body = JSON.parse(opts.body);
      expect(body.user.first_name).toBe('Ivan');
    });

    it('no fields → stderr warning, no fetch', async () => {
      mockFetch({ data: {} });
      const { stderr } = await runCommand(['users', 'update', '123'], { root: CLI_ROOT });
      expect(stderr).toContain('Не указаны поля для обновления');
      expect(fetchCalls().length).toBe(0);
    });

    it('undefined fields stripped from body', async () => {
      mockFetch({ data: { data: { id: 123 } } });
      await runCommand(['users', 'update', '123', '--first-name', 'Ivan'], { root: CLI_ROOT });
      const body = JSON.parse(fetchCalls()[0][1].body);
      expect(body.user.first_name).toBe('Ivan');
      expect(body.user.last_name).toBeUndefined();
      expect(body.user.email).toBeUndefined();
    });
  });

  // ----- DELETE -----

  describe('users delete', () => {
    it('123 --force → DELETE /users/123', async () => {
      mockFetch({ status: 204, data: null });
      await runCommand(['users', 'delete', '123', '--force'], { root: CLI_ROOT });
      expect(fetchCalls()[0][0]).toContain('/users/123');
      expect(fetchCalls()[0][1].method).toBe('DELETE');
    });

    it('no --force + --no-input → error', async () => {
      const { stderr, error } = await runCommand(['users', 'delete', '123', '--no-input'], { root: CLI_ROOT });
      expect(error).toBeTruthy();
      expect(stderr).toContain('--force');
    });

    it('--force + --json → stdout {ok:true}', async () => {
      mockFetch({ status: 204, data: null });
      const { stdout } = await runCommand(['users', 'delete', '123', '--force', '--json'], { root: CLI_ROOT });
      expect(stdout).toContain('"ok"');
    });
  });

  // ----- Multipart (common direct-url) -----

  describe('common direct-url', () => {
    it('--file → FormData with wire name Content-Disposition', async () => {
      mockFetch({ data: { data: { url: 'https://cdn.example.com/file.png' } } });
      // Create a temp file to upload
      const tmpFile = path.join(tmpDir, 'test.png');
      fs.writeFileSync(tmpFile, 'fake-png-data');

      await runCommand([
        'common', 'direct-url',
        '--content-disposition', 'inline',
        '--acl', 'public-read',
        '--policy', 'abc',
        '--x-amz-credential', 'cred',
        '--x-amz-algorithm', 'AWS4-HMAC-SHA256',
        '--x-amz-date', '20240101T000000Z',
        '--x-amz-signature', 'sig',
        '--key', 'uploads/file.png',
        '--file', tmpFile,
      ], { root: CLI_ROOT });

      expect(fetchCalls().length).toBeGreaterThan(0);
      const [, opts] = fetchCalls()[0];
      expect(opts.method).toBe('POST');
      // Body should be FormData (not JSON)
      expect(opts.body).toBeInstanceOf(FormData);
      const fd = opts.body as FormData;
      // Wire name: 'Content-Disposition' (not 'contentDisposition')
      expect(fd.get('Content-Disposition')).toBe('inline');
      expect(fd.get('key')).toBe('uploads/file.png');
      expect(fd.get('file')).toBeTruthy();
    });
  });

  // ----- Dry-run -----

  describe('dry-run', () => {
    it('--dry-run → stdout method + URL, no fetch', async () => {
      const { stdout } = await runCommand(['users', 'list', '--dry-run'], { root: CLI_ROOT });
      expect(stdout).toContain('GET');
      expect(stdout).toContain('/users');
    });

    it('--dry-run --json → JSON with dry_run: true', async () => {
      const { stdout } = await runCommand(['users', 'list', '--dry-run', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.dry_run).toBe(true);
      expect(parsed.method).toBe('GET');
    });
  });

  // ----- API errors -----

  describe('API errors', () => {
    it('401 → PACHCA_AUTH_ERROR', async () => {
      mockFetch({
        status: 401,
        data: { error: 'invalid_token', error_description: 'Token is invalid' },
      });
      const { stderr, error } = await runCommand(['users', 'list'], { root: CLI_ROOT });
      expect(error).toBeTruthy();
      expect(stderr).toContain('PACHCA_AUTH_ERROR');
    });

    it('404 → PACHCA_API_ERROR', async () => {
      mockFetch({
        status: 404,
        data: { errors: [{ message: 'Not found' }] },
      });
      const { stderr, error } = await runCommand(['users', 'get', '999'], { root: CLI_ROOT });
      expect(error).toBeTruthy();
      expect(stderr).toContain('PACHCA_API_ERROR');
    });

    it('429 → retry (2 fetch calls)', async () => {
      let callCount = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false, status: 429, statusText: 'Too Many Requests',
            headers: new Headers({ 'content-type': 'application/json', 'retry-after': '0' }),
            json: () => Promise.resolve({ error: 'rate_limit' }),
            text: () => Promise.resolve('{"error":"rate_limit"}'),
          });
        }
        return Promise.resolve({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ data: [{ id: 1 }] }),
          text: () => Promise.resolve('{"data":[{"id":1}]}'),
        });
      });
      const { stdout } = await runCommand(['users', 'list'], { root: CLI_ROOT });
      expect(callCount).toBe(2);
      expect(JSON.parse(stdout)).toEqual([{ id: 1 }]);
    });
  });

  // ----- Redirect (common uploads) -----

  describe('common uploads', () => {
    it('POST /uploads → response data', async () => {
      mockFetch({ data: { data: { key: 'abc', url: 'https://cdn.example.com' } } });
      const { stdout } = await runCommand(['common', 'uploads'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.key).toBe('abc');
    });
  });

  // ----- Scope check -----

  describe('scope check', () => {
    it('missing scope → PACHCA_SCOPE_ERROR', async () => {
      setupProfile(['users:read']);
      mockFetch({ data: {} });
      const { stderr, error } = await runCommand(['users', 'create', '--email', 'test@test.com'], { root: CLI_ROOT });
      expect(error).toBeTruthy();
      expect(stderr).toContain('PACHCA_SCOPE_ERROR');
    });
  });

  // ----- Composite query params (chats list) -----

  describe('chats list', () => {
    it('--sort-last-message-at desc → query sort[last_message_at]=desc', async () => {
      mockFetch({ data: { data: [{ id: 1 }] } });
      const { stdout, stderr, error } = await runCommand(['chats', 'list', '--sort-last-message-at', 'desc'], { root: CLI_ROOT });
      // The mock might have been replaced if the init hook ran and modified fetch
      // Check that the command ran successfully
      expect(error).toBeUndefined();
      expect(fetchCalls().length).toBeGreaterThan(0);
      const url = fetchCalls()[0][0] as string;
      expect(url).toContain('sort%5Blast_message_at%5D=desc');
    });
  });

  // ----- Array query (search list-messages) -----

  describe('search list-messages', () => {
    it('--chat-ids 1,2,3 → query chat_ids', async () => {
      mockFetch({ data: { data: [] } });
      await runCommand(['search', 'list-messages', '--chat-ids', '1,2,3'], { root: CLI_ROOT });
      expect(fetchCalls().length).toBeGreaterThan(0);
      const url = fetchCalls()[0][0] as string;
      expect(url).toContain('chat_ids=');
    });
  });
});
