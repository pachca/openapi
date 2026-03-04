import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runCommand } from '@oclif/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  mockFetch, mockPaginatedFetch, mockFetchForEndpoint, mockResponse, mockEntity, fetchCalls,
} from './mock-helpers.js';

const CLI_ROOT = path.join(__dirname, '..');

let tmpDir: string;
const originalFetch = globalThis.fetch;
const savedEnv: Record<string, string | undefined> = {};

function setEnv(key: string, value: string | undefined) {
  if (!(key in savedEnv)) savedEnv[key] = process.env[key];
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
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

describe('generated commands — functional tests', () => {
  // ----- GET list (users list) -----

  describe('users list', () => {
    it('GET /users → JSON array', async () => {
      mockFetchForEndpoint('/users', 'GET');
      const { stdout } = await runCommand(['users', 'list'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed[0].id).toBeDefined();
      expect(parsed[0].first_name).toBeDefined();
      expect(fetchCalls()[0][0]).toContain('/users');
      expect(fetchCalls()[0][1].method).toBe('GET');
    });

    it('--limit 5 → query limit=5', async () => {
      mockFetchForEndpoint('/users', 'GET');
      await runCommand(['users', 'list', '--limit', '5'], { root: CLI_ROOT });
      expect(fetchCalls()[0][0]).toContain('limit=5');
    });

    it('--cursor abc → query cursor=abc', async () => {
      mockFetchForEndpoint('/users', 'GET');
      await runCommand(['users', 'list', '--cursor', 'abc'], { root: CLI_ROOT });
      expect(fetchCalls()[0][0]).toContain('cursor=abc');
    });

    it('--all → auto-paginate (2 pages)', async () => {
      const entity = mockEntity('/users', 'GET');
      mockPaginatedFetch([
        { data: [{ ...entity, id: 1 }], next: 'cursor2' },
        { data: [{ ...entity, id: 2 }] },
      ]);
      const { stdout } = await runCommand(['users', 'list', '--all'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.length).toBe(2);
      expect(parsed[0].id).toBe(1);
      expect(parsed[1].id).toBe(2);
      expect(fetchCalls().length).toBe(2);
    });

    it('--all stops on cursor cycle', async () => {
      const entity = mockEntity('/users', 'GET');
      mockPaginatedFetch([
        { data: [{ ...entity, id: 1 }], next: 'same' },
        { data: [{ ...entity, id: 2 }], next: 'same' },
      ]);
      const { stdout } = await runCommand(['users', 'list', '--all'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.length).toBe(2);
      expect(fetchCalls().length).toBe(2);
    });

    it('--quiet → empty stdout', async () => {
      mockFetchForEndpoint('/users', 'GET');
      const { stdout } = await runCommand(['users', 'list', '--quiet'], { root: CLI_ROOT });
      expect(stdout.trim()).toBe('');
    });
  });

  // ----- GET list output formats -----

  describe('users list output formats', () => {
    it('--output table → table with header', async () => {
      mockFetch({ data: mockResponse('/users', 'GET', { count: 1, overrides: { id: 1, first_name: 'Ivan', last_name: 'Petrov' } }) });
      Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true, configurable: true });
      const { stdout } = await runCommand(['users', 'list', '--output', 'table'], { root: CLI_ROOT });
      expect(stdout).toContain('ID');
      expect(stdout).toContain('Ivan');
    });

    it('--output csv → CSV with header row', async () => {
      mockFetch({ data: mockResponse('/users', 'GET', { count: 1, overrides: { id: 1, first_name: 'Ivan', email: 'ivan@test.com' } }) });
      const { stdout } = await runCommand(['users', 'list', '--output', 'csv'], { root: CLI_ROOT });
      const lines = stdout.trim().split('\n');
      expect(lines[0]).toContain('id');
      expect(lines[1]).toContain('1');
      expect(lines[1]).toContain('Ivan');
    });
  });

  // ----- GET single (users get) -----

  describe('users get', () => {
    it('users get 123 → GET /users/123', async () => {
      mockFetchForEndpoint('/users/{id}', 'GET', { overrides: { id: 123 } });
      const { stdout } = await runCommand(['users', 'get', '123'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.id).toBe(123);
      expect(parsed.first_name).toBeDefined();
      expect(fetchCalls()[0][0]).toContain('/users/123');
    });
  });

  // ----- POST create (messages create) -----

  describe('messages create', () => {
    it('--entity-id 456 --content hello → POST /messages with wrapper', async () => {
      mockFetchForEndpoint('/messages', 'POST');
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
      mockFetchForEndpoint('/messages', 'POST');
      const filesJson = '[{"key":"file.png","name":"photo.png"}]';
      await runCommand(['messages', 'create', '--entity-id', '456', '--content', 'hello', '--files', filesJson], { root: CLI_ROOT });
      const body = JSON.parse(fetchCalls()[0][1].body);
      expect(body.message.files).toEqual([{ key: 'file.png', name: 'photo.png' }]);
    });

    it('missing required + --no-input → stderr error', async () => {
      mockFetch({ data: {} });
      const { stderr, error } = await runCommand(['messages', 'create', '--content', 'hello', '--no-input'], { root: CLI_ROOT });
      expect(error).toBeTruthy();
      expect(stderr).toContain('Обязательный флаг');
    });
  });

  // ----- POST create with wrapper unwrap (users create) -----

  describe('users create', () => {
    it('--email test@test.com → body has user wrapper', async () => {
      mockFetchForEndpoint('/users', 'POST');
      await runCommand(['users', 'create', '--email', 'test@test.com'], { root: CLI_ROOT });
      const body = JSON.parse(fetchCalls()[0][1].body);
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe('test@test.com');
    });

    it('--skip-email-notify → sibling at top level', async () => {
      mockFetchForEndpoint('/users', 'POST');
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
      mockFetchForEndpoint('/users/{id}', 'PUT', { overrides: { id: 123 } });
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
      mockFetchForEndpoint('/users/{id}', 'PUT', { overrides: { id: 123 } });
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
      mockFetchForEndpoint('/direct_url', 'POST');
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
      expect(opts.body).toBeInstanceOf(FormData);
      const fd = opts.body as FormData;
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
      const successResponse = mockResponse('/users', 'GET');
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
          json: () => Promise.resolve(successResponse),
          text: () => Promise.resolve(JSON.stringify(successResponse)),
        });
      });
      const { stdout } = await runCommand(['users', 'list'], { root: CLI_ROOT });
      expect(callCount).toBe(2);
      const parsed = JSON.parse(stdout);
      expect(Array.isArray(parsed)).toBe(true);
    });
  });

  // ----- Redirect (common uploads) -----

  describe('common uploads', () => {
    it('POST /uploads → response data', async () => {
      mockFetchForEndpoint('/uploads', 'POST');
      const { stdout } = await runCommand(['common', 'uploads'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.key).toBeDefined();
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
      mockFetchForEndpoint('/chats', 'GET');
      const { stdout, stderr, error } = await runCommand(['chats', 'list', '--sort-last-message-at', 'desc'], { root: CLI_ROOT });
      expect(error).toBeUndefined();
      expect(fetchCalls().length).toBeGreaterThan(0);
      const url = fetchCalls()[0][0] as string;
      expect(url).toContain('sort%5Blast_message_at%5D=desc');
    });
  });

  // ----- Array query (search list-messages) -----

  describe('search list-messages', () => {
    it('--chat-ids 1,2,3 → query chat_ids', async () => {
      mockFetchForEndpoint('/search/messages', 'GET');
      await runCommand(['search', 'list-messages', '--chat-ids', '1,2,3'], { root: CLI_ROOT });
      expect(fetchCalls().length).toBeGreaterThan(0);
      const url = fetchCalls()[0][0] as string;
      expect(url).toContain('chat_ids=');
    });
  });
});
