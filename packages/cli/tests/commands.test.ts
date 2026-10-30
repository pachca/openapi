import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runCommand } from '@oclif/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { Readable } from 'node:stream';
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

function setupProfile() {
  const configDir = path.join(tmpDir, 'pachca');
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(
    path.join(configDir, 'config.toml'),
    `active_profile = "test"\n\n[profiles.test]\ntype = "user"\ntoken = "test-token"\nuser = "Test User"\n`,
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

    it('--all → списочный метод останавливается по has_next: false', async () => {
      const entity = mockEntity('/users', 'GET');
      mockPaginatedFetch([
        { data: [{ ...entity, id: 1 }], next: 'c1', prev: 'p1', hasNext: true, hasPrev: false },
        { data: [{ ...entity, id: 2 }], next: 'c2', prev: 'p2', hasNext: true, hasPrev: true },
        { data: [{ ...entity, id: 3 }], next: 'c3', prev: 'p3', hasNext: false, hasPrev: true },
      ]);
      const { stdout } = await runCommand(['users', 'list', '--all'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.length).toBe(3);
      // Останавливается ровно на 3 запросах (4-й не нужен — has_next: false)
      expect(fetchCalls().length).toBe(3);
    });

    it('--all → списочный метод не останавливается на has_next: true даже если следующая страница пуста', async () => {
      // Защита от ранней остановки: если сервер вернул has_next: true, делаем ещё запрос
      const entity = mockEntity('/users', 'GET');
      mockPaginatedFetch([
        { data: [{ ...entity, id: 1 }], next: 'c1', hasNext: true, hasPrev: false },
        { data: [], next: 'c1', hasNext: false, hasPrev: true }, // пустой ответ — останавливаемся по empty data
      ]);
      const { stdout } = await runCommand(['users', 'list', '--all'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.length).toBe(1);
      expect(fetchCalls().length).toBe(2);
    });

    it('--all → /users с query (упрощённая meta без has_next) останавливается по пустому data', async () => {
      // Симуляция Elasticsearch-ветки: meta.paginate содержит только next_page
      const entity = mockEntity('/users', 'GET');
      mockPaginatedFetch([
        { data: [{ ...entity, id: 1 }], next: 'c1' },        // нет hasNext
        { data: [{ ...entity, id: 2 }], next: 'c2' },        // нет hasNext
        { data: [], next: 'c3' },                              // пустой ответ — break
      ]);
      const { stdout } = await runCommand(['users', 'list', '--query', 'Олег', '--all'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.length).toBe(2);
      expect(fetchCalls().length).toBe(3);
    });

    it('--all → search метод (только total + next_page) останавливается по пустому data', async () => {
      const entity = mockEntity('/search/messages', 'GET');
      mockPaginatedFetch([
        { data: [{ ...entity, id: 1 }], next: 'c1', total: 2 },
        { data: [{ ...entity, id: 2 }], next: 'c2', total: 2 },
        { data: [], next: 'c3', total: 2 },
      ]);
      const { stdout } = await runCommand(['search', 'list-messages', '--query', 'отчёт', '--all'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.length).toBe(2);
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

  // ----- nullable body fields: the literal `null` goes out as JSON null -----

  describe('null in a nullable field', () => {
    it('bots update --kind null → webhook.kind: null (deletes the incoming webhook)', async () => {
      mockFetchForEndpoint('/bots/{id}', 'PUT', { overrides: { id: 7 } });
      const { error } = await runCommand(['bots', 'update', '7', '--kind', 'null'], { root: CLI_ROOT });
      expect(error).toBeUndefined();
      const body = JSON.parse(fetchCalls()[0][1].body);
      expect(body.webhook).toHaveProperty('kind', null);
    });

    it('bots update --kind simple → the value is sent as is', async () => {
      mockFetchForEndpoint('/bots/{id}', 'PUT', { overrides: { id: 7 } });
      await runCommand(['bots', 'update', '7', '--kind', 'simple'], { root: CLI_ROOT });
      expect(JSON.parse(fetchCalls()[0][1].body).webhook.kind).toBe('simple');
    });

    // `drafts update` reads the text from a pipe when stdin is not a terminal, as at a prompt.
    function terminalStdin() {
      Object.defineProperty(process.stdin, 'isTTY', { value: true, writable: true, configurable: true });
    }

    it('drafts update --parent-message-id null → draft.parent_message_id: null (takes the reply off)', async () => {
      terminalStdin();
      mockFetchForEndpoint('/drafts/{id}', 'PUT', { overrides: { id: 5 } });
      const { error } = await runCommand(['drafts', 'update', '5', '--parent-message-id', 'null'], { root: CLI_ROOT });
      expect(error).toBeUndefined();
      expect(JSON.parse(fetchCalls()[0][1].body).draft).toHaveProperty('parent_message_id', null);
    });

    it('drafts update --parent-message-id 42 → still an integer', async () => {
      terminalStdin();
      mockFetchForEndpoint('/drafts/{id}', 'PUT', { overrides: { id: 5 } });
      await runCommand(['drafts', 'update', '5', '--parent-message-id', '42'], { root: CLI_ROOT });
      expect(JSON.parse(fetchCalls()[0][1].body).draft.parent_message_id).toBe(42);
    });

    it('drafts update --parent-message-id abc → refused before any request', async () => {
      terminalStdin();
      mockFetch({ data: {} });
      const { error } = await runCommand(['drafts', 'update', '5', '--parent-message-id', 'abc'], { root: CLI_ROOT });
      expect(error?.message).toContain('Expected an integer or null');
      expect(fetchCalls()).toHaveLength(0);
    });
  });

  // ----- text from stdin -----

  describe('text from stdin', () => {
    /** Feed `chunks` to the command as stdin, as a pipe does. */
    async function withPipe<T>(chunks: string[], run: () => Promise<T>): Promise<T> {
      const original = Object.getOwnPropertyDescriptor(process, 'stdin')!;
      Object.defineProperty(process, 'stdin', { value: Readable.from(chunks.map((c) => Buffer.from(c))), configurable: true });
      try {
        return await run();
      } finally {
        Object.defineProperty(process, 'stdin', original);
      }
    }

    it('an empty pipe leaves the text out of the body', async () => {
      // A script or an agent runs with stdin that is not a terminal and carries nothing.
      mockFetchForEndpoint('/drafts/{id}', 'PUT', { overrides: { id: 5 } });
      await withPipe([], () => runCommand(['drafts', 'update', '5', '--parent-message-id', 'null'], { root: CLI_ROOT }));
      const body = JSON.parse(fetchCalls()[0][1].body);
      expect(body.draft).toEqual({ parent_message_id: null });
    });

    it('piped text becomes the text of the message', async () => {
      mockFetchForEndpoint('/messages/{id}', 'PUT', { overrides: { id: 9 } });
      await withPipe(['Новый текст\n'], () => runCommand(['messages', 'update', '9'], { root: CLI_ROOT }));
      expect(JSON.parse(fetchCalls()[0][1].body).message.content).toBe('Новый текст');
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
    it('--file + --direct-url → FormData sent to external URL', async () => {
      mockFetch({ status: 204, data: null });
      const tmpFile = path.join(tmpDir, 'test.png');
      fs.writeFileSync(tmpFile, 'fake-png-data');

      await runCommand([
        'common', 'direct-url',
        '--direct-url', 'https://s3.example.com/upload',
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
      const [url, opts] = fetchCalls()[0];
      expect(String(url)).toContain('https://s3.example.com/upload');
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

    it('--dry-run без входа и без PACHCA_TOKEN → запрос показан, токен не нужен', async () => {
      fs.rmSync(path.join(tmpDir, 'pachca', 'config.toml'));
      mockFetch({ data: {} });
      // The init hook reads the flag from process.argv, which a test run does not carry.
      const argv = process.argv;
      process.argv = [...argv, '--dry-run'];
      try {
        const { stdout, stderr } = await runCommand(
          ['messages', 'create', '--entity-id', '123', '--content', 'Привет', '--dry-run', '--json'],
          { root: CLI_ROOT },
        );
        expect(stderr).not.toContain('Token not found');
        const parsed = JSON.parse(stdout);
        expect(parsed).toMatchObject({ dry_run: true, method: 'POST', body: { message: { entity_id: 123, content: 'Привет' } } });
        expect(parsed.headers.Authorization).toBe('Bearer ••••••••');
        expect(fetchCalls()).toHaveLength(0);
      } finally {
        process.argv = argv;
      }
    });

    it('--dry-run не показывает заголовок Authorization у запроса без авторизации', async () => {
      const { formatDryRun } = await import('../src/client.js');
      const preview = formatDryRun(
        { method: 'POST', path: 'https://storage.example.com/upload', token: '', noAuth: true },
        true,
      ) as { headers: Record<string, string> };
      expect(preview.headers.Authorization).toBeUndefined();
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

    it('401 с сохранённым токеном → подсказка сохранить новый в тот же профиль', async () => {
      mockFetch({ status: 401, data: { error: 'invalid_token', error_description: 'Access token is invalid' } });
      const { stderr } = await runCommand(['users', 'list'], { root: CLI_ROOT });
      expect(JSON.parse(stderr.trim()).hint).toBe('pachca auth login --profile test --token <token>');
    });

    it('401 после входа через браузер → подсказка войти заново, без флага для default', async () => {
      fs.writeFileSync(
        path.join(tmpDir, 'pachca', 'config.toml'),
        `active_profile = "default"\n\n[profiles.default]\ntype = "user"\nauth = "oauth"\ntoken = "test-token"\nuser = "Test User"\n`,
      );
      mockFetch({ status: 401, data: { error: 'invalid_token', error_description: 'Access token is invalid' } });
      const { stderr } = await runCommand(['users', 'list'], { root: CLI_ROOT });
      expect(JSON.parse(stderr.trim()).hint).toBe('pachca auth login');
    });

    it('401 с токеном из --token → подсказка про сам токен', async () => {
      mockFetch({ status: 401, data: { error: 'invalid_token', error_description: 'Access token is invalid' } });
      const { stderr } = await runCommand(['users', 'list', '--token', 'bad'], { root: CLI_ROOT });
      expect(JSON.parse(stderr.trim()).hint).toBe('token from --token or PACHCA_TOKEN is invalid or revoked');
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

  // ----- 403: права нет у токена или его не даёт роль -----

  describe('403 по праву и по роли', () => {
    const roleForbidden = {
      status: 403,
      data: { error: 'role_forbidden', error_description: 'The current user role does not allow this action' },
      headers: { 'www-authenticate': 'Bearer error="role_forbidden", error_description="The current user role does not allow this action"' },
    };
    const insufficientScope = {
      status: 403,
      data: { error: 'insufficient_scope', error_description: 'Insufficient scope. Required: users:create' },
      headers: {
        'www-authenticate':
          'Bearer error="insufficient_scope", error_description="Insufficient scope. Required: users:create", scope="users:create"',
      },
    };

    function writeProfile(fields: string) {
      fs.writeFileSync(
        path.join(tmpDir, 'pachca', 'config.toml'),
        `active_profile = "test"\n\n[profiles.test]\ntype = "user"\ntoken = "test-token"\nuser = "Test User"\n${fields}`,
      );
    }

    function humanTerminal() {
      Object.defineProperty(process.stderr, 'isTTY', { value: true, writable: true, configurable: true });
    }

    it('role_forbidden в JSON → PACHCA_AUTH_ERROR и код выхода 3', async () => {
      mockFetch(roleForbidden);
      const { stderr, error } = await runCommand(['users', 'create', '--email', 'olga@example.com'], { root: CLI_ROOT });
      const parsed = JSON.parse(stderr.trim());
      expect(parsed.type).toBe('PACHCA_AUTH_ERROR');
      expect(parsed.message).toBe('role_forbidden');
      expect(parsed.code).toBe(403);
      expect(error?.oclif?.exit).toBe(3);
    });

    it('role_forbidden в терминале → право команды и администратор, без совета войти заново', async () => {
      humanTerminal();
      mockFetch(roleForbidden);
      const { stderr, error } = await runCommand(
        ['users', 'create', '--email', 'olga@example.com', '-o', 'table'],
        { root: CLI_ROOT },
      );
      expect(stderr).toContain('✗ Право users:create есть у токена, но его не даёт роль.');
      expect(stderr).toContain('роль меняет администратор пространства');
      expect(stderr).not.toContain('auth login');
      expect(error?.oclif?.exit).toBe(3);
    });

    it('role_forbidden у профиля бота → роль бота', async () => {
      humanTerminal();
      fs.writeFileSync(
        path.join(tmpDir, 'pachca', 'config.toml'),
        `active_profile = "test"\n\n[profiles.test]\ntype = "bot"\ntoken = "test-token"\nuser = "Бот"\n`,
      );
      mockFetch(roleForbidden);
      const { stderr } = await runCommand(['users', 'create', '--email', 'olga@example.com', '-o', 'table'], { root: CLI_ROOT });
      expect(stderr).toContain('его не даёт роль бота');
    });

    it('insufficient_scope, права нет и в сохранённом списке → добавить право токену', async () => {
      humanTerminal();
      writeProfile('scopes = ["users:read"]\n');
      mockFetch(insufficientScope);
      const { stderr, error } = await runCommand(
        ['users', 'create', '--email', 'olga@example.com', '-o', 'table'],
        { root: CLI_ROOT },
      );
      expect(stderr).toContain('✗ Не хватает права users:create.');
      expect(stderr).toContain('У токена этого права нет.');
      expect(stderr).toContain('Добавьте право токену в Пачке');
      expect(stderr).not.toContain('администратор');
      expect(error?.oclif?.exit).toBe(3);
    });

    it('insufficient_scope, а в сохранённом списке право есть → список устарел', async () => {
      humanTerminal();
      writeProfile('scopes = ["users:create"]\n');
      mockFetch(insufficientScope);
      const { stderr } = await runCommand(['users', 'create', '--email', 'olga@example.com', '-o', 'table'], { root: CLI_ROOT });
      expect(stderr).toContain('список устарел');
      expect(stderr).toContain('pachca auth status --remote --profile test');
      expect(stderr).not.toContain('не даёт роль');
    });

    it('insufficient_scope после входа через браузер → войти заново тем же профилем', async () => {
      humanTerminal();
      writeProfile('auth = "oauth"\nscopes = ["users:read"]\n');
      mockFetch(insufficientScope);
      const { stderr } = await runCommand(['users', 'create', '--email', 'olga@example.com', '-o', 'table'], { root: CLI_ROOT });
      expect(stderr).toContain('войдите заново: pachca auth login --profile test');
    });

    it('insufficient_scope с токеном из --token → проверить права через oauth token-info', async () => {
      humanTerminal();
      mockFetch(insufficientScope);
      const { stderr } = await runCommand(
        ['users', 'create', '--email', 'olga@example.com', '--token', 'pasted', '-o', 'table'],
        { root: CLI_ROOT },
      );
      expect(stderr).toContain('pachca oauth token-info -o json');
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

  // ----- Sort query params (chats list) -----

  describe('chats list', () => {
    it('--sort last_message_at --order desc → query sort=last_message_at&order=desc', async () => {
      mockFetchForEndpoint('/chats', 'GET');
      const { stdout, stderr, error } = await runCommand(['chats', 'list', '--sort', 'last_message_at', '--order', 'desc'], { root: CLI_ROOT });
      expect(error).toBeUndefined();
      expect(fetchCalls().length).toBeGreaterThan(0);
      const url = fetchCalls()[0][0] as string;
      expect(url).toContain('sort=last_message_at');
      expect(url).toContain('order=desc');
    });
  });

  // ----- meta ответа с одним объектом (chats create → not_found_member_ids) -----

  describe('chats create', () => {
    const notAdded = '⚠ Не удалось добавить в чат: 5, 7.\n  Таких сотрудников нет в пространстве, либо они приостановлены или удалены.\n';

    it('meta.not_found_member_ids → stdout JSON прежней формы, список в stderr', async () => {
      const chat = mockEntity('/chats', 'POST', { id: 334, name: 'Релизы' });
      mockFetch({ status: 201, data: { data: chat, meta: { not_found_member_ids: [5, 7] } } });
      const { stdout, stderr, error } = await runCommand(
        ['chats', 'create', '--name', 'Релизы', '--member-ids', '[3,5,7]', '-o', 'json'],
        { root: CLI_ROOT },
      );
      expect(error).toBeUndefined();
      expect(JSON.parse(stdout)).toEqual(chat);
      expect(stderr).toBe(notAdded);
      expect(JSON.parse(fetchCalls()[0][1].body).chat.member_ids).toEqual([3, 5, 7]);
    });

    it('meta.not_found_member_ids → предупреждение и в таблице', async () => {
      mockFetch({ status: 201, data: { data: mockEntity('/chats', 'POST', { id: 334 }), meta: { not_found_member_ids: [5, 7] } } });
      Object.defineProperty(process.stdout, 'isTTY', { value: true, writable: true, configurable: true });
      Object.defineProperty(process.stderr, 'isTTY', { value: true, writable: true, configurable: true });
      const { stdout, stderr } = await runCommand(['chats', 'create', '--name', 'Релизы', '-o', 'table'], { root: CLI_ROOT });
      expect(stdout).toContain('334');
      expect(stderr).toBe(notAdded);
    });

    it('meta.not_found_group_tag_ids → своё предупреждение в stderr', async () => {
      const chat = mockEntity('/chats', 'POST', { id: 334, name: 'Релизы' });
      mockFetch({ status: 201, data: { data: chat, meta: { not_found_member_ids: [], not_found_group_tag_ids: [9] } } });
      const { stdout, stderr, error } = await runCommand(
        ['chats', 'create', '--name', 'Релизы', '--group-tag-ids', '[4,9]', '-o', 'json'],
        { root: CLI_ROOT },
      );
      expect(error).toBeUndefined();
      expect(JSON.parse(stdout)).toEqual(chat);
      expect(stderr).toBe('⚠ Не удалось подключить теги: 9.\n  Таких тегов нет в пространстве.\n');
    });

    it('пустой not_found_member_ids → stderr пуст', async () => {
      mockFetchForEndpoint('/chats', 'POST', { status: 201 });
      const { stdout, stderr } = await runCommand(['chats', 'create', '--name', 'Релизы', '--member-ids', '[3]'], { root: CLI_ROOT });
      expect(JSON.parse(stdout).id).toBeDefined();
      expect(stderr).toBe('');
    });
  });

  // ----- Array query (search list-messages) -----

  describe('search list-messages', () => {
    it('--chat-ids 1,2,3 → query chat_ids[] repeated', async () => {
      mockFetchForEndpoint('/search/messages', 'GET');
      await runCommand(['search', 'list-messages', '--chat-ids', '1,2,3'], { root: CLI_ROOT });
      expect(fetchCalls().length).toBeGreaterThan(0);
      const url = fetchCalls()[0][0] as string;
      expect(url).toContain('chat_ids%5B%5D=1');
      expect(url).toContain('chat_ids%5B%5D=2');
      expect(url).toContain('chat_ids%5B%5D=3');
    });
  });
});
