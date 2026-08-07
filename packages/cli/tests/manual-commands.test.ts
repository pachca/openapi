import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runCommand } from '@oclif/test';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  mockFetch, mockFetchForEndpoint, mockEntity, fetchCalls,
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

function setupProfile(name = 'test', opts: { type?: string; user?: string; email?: string } = {}) {
  const configDir = path.join(tmpDir, 'pachca');
  fs.mkdirSync(configDir, { recursive: true });
  const type = opts.type ?? 'user';
  const user = opts.user ?? 'Test User';
  const email = opts.email ?? 'test@test.com';
  fs.writeFileSync(
    path.join(configDir, 'config.toml'),
    `active_profile = "${name}"\n\n[profiles.${name}]\ntype = "${type}"\ntoken = "test-token"\nuser = "${user}"\nemail = "${email}"\n`,
  );
}

function setupMultiProfiles() {
  const configDir = path.join(tmpDir, 'pachca');
  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(
    path.join(configDir, 'config.toml'),
    [
      'active_profile = "default"',
      '',
      '[profiles.default]',
      'type = "user"',
      'token = "token-default"',
      'user = "Default User"',
      'email = "default@test.com"',
      '',
      '[profiles.bot]',
      'type = "bot"',
      'token = "token-bot"',
      'user = "Bot User"',
    ].join('\n') + '\n',
  );
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pachca-manual-test-'));
  setEnv('XDG_CONFIG_HOME', tmpDir);
  setEnv('PACHCA_TOKEN', undefined);
  setEnv('PACHCA_PROFILE', undefined);
  Object.defineProperty(process.stdin, 'isTTY', { value: false, writable: true, configurable: true });
  Object.defineProperty(process.stdout, 'isTTY', { value: false, writable: true, configurable: true });
  Object.defineProperty(process.stderr, 'isTTY', { value: false, writable: true, configurable: true });
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

describe('manual commands — functional tests', () => {
  // ===== Auth commands =====

  describe('auth login', () => {
    it('--token valid → profile saved', async () => {
      const tokenInfo = mockEntity('/oauth/token/info', 'GET', { user_id: 1, scopes: ['users:read', 'messages:create'] });
      const profileData = mockEntity('/profile', 'GET', { first_name: 'Ivan', last_name: 'Petrov', email: 'ivan@test.com', bot: false });

      let callNum = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callNum++;
        if (callNum === 1) {
          return Promise.resolve({
            ok: true, status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ data: tokenInfo }),
            text: () => Promise.resolve('{}'),
          });
        }
        return Promise.resolve({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ data: profileData }),
          text: () => Promise.resolve('{}'),
        });
      });

      const { error } = await runCommand(['auth', 'login', '--token', 'my-token'], { root: CLI_ROOT });
      expect(error).toBeUndefined();
      const configPath = path.join(tmpDir, 'pachca', 'config.toml');
      expect(fs.existsSync(configPath)).toBe(true);
      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content).toContain('my-token');
      expect(content).toContain('Ivan Petrov');
    });

    describe('--token - (чтение из потока ввода)', () => {
      const originalStdin = Object.getOwnPropertyDescriptor(process, 'stdin')!;

      /** Replace stdin with a stream that yields `chunks`, or with a bare TTY. */
      function stubStdin(options: { isTTY: boolean; chunks?: string[] }): void {
        const stream = {
          isTTY: options.isTTY,
          async *[Symbol.asyncIterator]() {
            for (const chunk of options.chunks ?? []) yield Buffer.from(chunk);
          },
        };
        Object.defineProperty(process, 'stdin', { value: stream, configurable: true });
      }

      afterEach(() => {
        Object.defineProperty(process, 'stdin', originalStdin);
      });

      it('принимает токен из пайпа и не оставляет его в аргументах', async () => {
        stubStdin({ isTTY: false, chunks: ['piped-token\n'] });

        const tokenInfo = mockEntity('/oauth/token/info', 'GET', { user_id: 1, scopes: ['users:read'] });
        const profileData = mockEntity('/profile', 'GET', { first_name: 'Ivan', last_name: '', email: null, bot: false });
        let callNum = 0;
        globalThis.fetch = vi.fn().mockImplementation(() => {
          callNum += 1;
          return Promise.resolve({
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ data: callNum === 1 ? tokenInfo : profileData }),
            text: () => Promise.resolve('{}'),
          });
        });

        const { error } = await runCommand(['auth', 'login', '--token', '-'], { root: CLI_ROOT });

        expect(error).toBeUndefined();
        const content = fs.readFileSync(path.join(tmpDir, 'pachca', 'config.toml'), 'utf-8');
        // Trailing newline from `echo` must not become part of the token.
        expect(content).toContain('piped-token');
        expect(content).not.toContain('piped-token\\n');
      });

      it('без пайпа не виснет, а объясняет, что ожидался поток', async () => {
        // A terminal never reaches EOF on its own: reading it would hang with no
        // output until the person guesses to press Ctrl-D.
        stubStdin({ isTTY: true });

        const { error, stderr } = await runCommand(['auth', 'login', '--token', '-'], { root: CLI_ROOT });

        expect(error).toBeTruthy();
        expect(stderr).toContain('stdin');
      });

      it('пустой ввод — ошибка, а не вход с пустым токеном', async () => {
        stubStdin({ isTTY: false, chunks: ['   \n'] });

        const { error } = await runCommand(['auth', 'login', '--token', '-'], { root: CLI_ROOT });

        expect(error).toBeTruthy();
        expect(fs.existsSync(path.join(tmpDir, 'pachca', 'config.toml'))).toBe(false);
      });
    });

    it('--token invalid → 401 error', async () => {
      mockFetch({ status: 401, data: { error: 'invalid_token', error_description: 'Token is invalid' } });
      const { error } = await runCommand(['auth', 'login', '--token', 'bad-token'], { root: CLI_ROOT });
      expect(error).toBeTruthy();
    });

    it('--profile custom → saves under custom name', async () => {
      const tokenInfo = mockEntity('/oauth/token/info', 'GET', { user_id: 1, scopes: ['users:read'] });
      const profileData = mockEntity('/profile', 'GET', { first_name: 'Bot', last_name: '', email: null, bot: true });

      let callNum = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callNum++;
        if (callNum === 1) {
          return Promise.resolve({
            ok: true, status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ data: tokenInfo }),
            text: () => Promise.resolve('{}'),
          });
        }
        return Promise.resolve({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ data: profileData }),
          text: () => Promise.resolve('{}'),
        });
      });

      const { error } = await runCommand(['auth', 'login', '--token', 'bot-token', '--profile', 'my-bot'], { root: CLI_ROOT });
      expect(error).toBeUndefined();
      const content = fs.readFileSync(path.join(tmpDir, 'pachca', 'config.toml'), 'utf-8');
      expect(content).toContain('my-bot');
    });

    it('no --token + --no-input → error', async () => {
      const { stderr, error } = await runCommand(['auth', 'login', '--no-input'], { root: CLI_ROOT });
      expect(error).toBeTruthy();
      expect(stderr).toContain('Token required');
    });

    it('bot token → type: bot', async () => {
      const tokenInfo = mockEntity('/oauth/token/info', 'GET', { user_id: 1, scopes: ['messages:create'] });
      const profileData = mockEntity('/profile', 'GET', { first_name: 'Bot', last_name: '', email: null, bot: true });

      let callNum = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callNum++;
        if (callNum === 1) {
          return Promise.resolve({
            ok: true, status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ data: tokenInfo }),
            text: () => Promise.resolve('{}'),
          });
        }
        return Promise.resolve({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ data: profileData }),
          text: () => Promise.resolve('{}'),
        });
      });

      const { stdout } = await runCommand(['auth', 'login', '--token', 'bot-token', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.type).toBe('bot');
    });

    it('--token → profile marked as pasted, without expiry', async () => {
      const tokenInfo = mockEntity('/oauth/token/info', 'GET', { user_id: 1, scopes: ['users:read'] });
      const profileData = mockEntity('/profile', 'GET', { first_name: 'Ivan', last_name: 'P', email: null, bot: false });

      let callNum = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callNum++;
        return Promise.resolve({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ data: callNum === 1 ? tokenInfo : profileData }),
          text: () => Promise.resolve('{}'),
        });
      });

      const { stdout } = await runCommand(['auth', 'login', '--token', 'pasted', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.auth).toBe('token');
      expect(parsed.expires_at).toBeNull();
    });

  });

  describe('auth logout', () => {
    it('logout profileName → deleted', async () => {
      setupProfile();
      const { error } = await runCommand(['auth', 'logout', 'test'], { root: CLI_ROOT });
      expect(error).toBeUndefined();
      const content = fs.readFileSync(path.join(tmpDir, 'pachca', 'config.toml'), 'utf-8');
      expect(content).not.toContain('[profiles.test]');
    });

    it('logout nonexistent → error', async () => {
      setupProfile();
      const { stderr, error } = await runCommand(['auth', 'logout', 'nonexistent'], { root: CLI_ROOT });
      expect(error).toBeTruthy();
      expect(stderr).toContain('not found');
    });

    it('logout single → active_profile cleared', async () => {
      setupProfile();
      await runCommand(['auth', 'logout', 'test'], { root: CLI_ROOT });
      const content = fs.readFileSync(path.join(tmpDir, 'pachca', 'config.toml'), 'utf-8');
      expect(content).not.toContain('active_profile = "test"');
    });

    it('says the pasted token stays alive on the server', async () => {
      setupProfile();
      const { stderr } = await runCommand(['auth', 'logout', 'test', '-o', 'table'], { root: CLI_ROOT });
      expect(stderr).toContain('продолжает действовать');
    });

    it('reports that nothing was revoked', async () => {
      setupProfile();
      const { stdout } = await runCommand(['auth', 'logout', 'test', '--json'], { root: CLI_ROOT });
      expect(JSON.parse(stdout).token_revoked).toBe(false);
    });
  });

  describe('auth status', () => {
    it('shows profile info', async () => {
      setupProfile();
      const { stdout } = await runCommand(['auth', 'status', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.profile).toBe('test');
      expect(parsed.type).toBe('user');
      expect(parsed.user).toBe('Test User');
    });

    it('no profile → error', async () => {
      const { stderr, error } = await runCommand(['auth', 'status'], { root: CLI_ROOT });
      expect(error).toBeTruthy();
      expect(stderr).toContain('No active profile');
    });

    it('pasted token → auth: token, no expiry', async () => {
      setupProfile();
      const { stdout } = await runCommand(['auth', 'status', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.auth).toBe('token');
      expect(parsed.expires_at).toBeNull();
    });

    it('browser login → auth: oauth with expiry and scopes', async () => {
      const configDir = path.join(tmpDir, 'pachca');
      fs.mkdirSync(configDir, { recursive: true });
      const expiresAt = new Date(Date.now() + 3_600_000).toISOString();
      fs.writeFileSync(
        path.join(configDir, 'config.toml'),
        [
          'active_profile = "test"',
          '',
          '[profiles.test]',
          'type = "user"',
          'token = "oauth-token"',
          'user = "Test User"',
          'auth = "oauth"',
          'refresh_token = "refresh-1"',
          `expires_at = "${expiresAt}"`,
          'scopes = [ "chats:read", "messages:create" ]',
        ].join('\n') + '\n',
      );

      const { stdout } = await runCommand(['auth', 'status', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.auth).toBe('oauth');
      expect(parsed.expires_at).toBe(expiresAt);
      expect(parsed.scopes).toEqual(['chats:read', 'messages:create']);
    });
  });

  describe('auth list', () => {
    it('shows all profiles with active marker', async () => {
      setupMultiProfiles();
      const { stdout } = await runCommand(['auth', 'list', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed).toHaveLength(2);
      const defaultProfile = parsed.find((p: { name: string }) => p.name === 'default');
      expect(defaultProfile.active).toBe(true);
      const botProfile = parsed.find((p: { name: string }) => p.name === 'bot');
      expect(botProfile.active).toBe(false);
    });

    it('empty → empty array in JSON', async () => {
      const { stdout } = await runCommand(['auth', 'list', '--json'], { root: CLI_ROOT });
      expect(JSON.parse(stdout)).toEqual([]);
    });
  });

  describe('auth switch', () => {
    it('switch name → active_profile changed', async () => {
      setupMultiProfiles();
      const { stdout } = await runCommand(['auth', 'switch', 'bot', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.active_profile).toBe('bot');
    });

    it('nonexistent → error', async () => {
      setupMultiProfiles();
      const { stderr, error } = await runCommand(['auth', 'switch', 'nonexistent'], { root: CLI_ROOT });
      expect(error).toBeTruthy();
      expect(stderr).toContain('not found');
    });

    it('reports a working profile as readable and not expired', async () => {
      setupMultiProfiles();
      const { stdout } = await runCommand(['auth', 'switch', 'bot', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.secret_readable).toBe(true);
      expect(parsed.expired).toBe(false);
    });

    it('flags an expired profile at the moment of switching, not on the next command', async () => {
      const configDir = path.join(tmpDir, 'pachca');
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        path.join(configDir, 'config.toml'),
        [
          'active_profile = "default"',
          '',
          '[profiles.default]',
          'type = "user"',
          'token = "tok"',
          'user = "Андрей"',
          '',
          '[profiles.stale]',
          'type = "user"',
          'token = "tok"',
          'user = "Андрей"',
          'auth = "oauth"',
          'expires_at = "2020-01-01T00:00:00.000Z"',
        ].join('\n'),
      );

      const { stdout } = await runCommand(['auth', 'switch', 'stale', '--json'], { root: CLI_ROOT });
      expect(JSON.parse(stdout).expired).toBe(true);
    });
  });

  // ===== Config commands =====

  describe('config set', () => {
    it('set defaults.output json → saved', async () => {
      setupProfile();
      const { stdout } = await runCommand(['config', 'set', 'defaults.output', 'json', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.key).toBe('defaults.output');
      expect(parsed.value).toBe('json');
    });

    it('set unknown.key → error', async () => {
      setupProfile();
      const { error } = await runCommand(['config', 'set', 'unknown.key', 'value'], { root: CLI_ROOT });
      expect(error).toBeTruthy();
    });

    it('set defaults.timeout 60 → number saved', async () => {
      setupProfile();
      await runCommand(['config', 'set', 'defaults.timeout', '60'], { root: CLI_ROOT });
      const content = fs.readFileSync(path.join(tmpDir, 'pachca', 'config.toml'), 'utf-8');
      expect(content).toContain('timeout = 60');
    });
  });

  describe('config get', () => {
    it('get existing key → outputs value', async () => {
      setupProfile();
      await runCommand(['config', 'set', 'defaults.output', 'yaml'], { root: CLI_ROOT });
      const { stdout } = await runCommand(['config', 'get', 'defaults.output', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.value).toBe('yaml');
    });

    it('get missing key → null', async () => {
      setupProfile();
      const { stdout } = await runCommand(['config', 'get', 'defaults.output', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.value).toBeNull();
    });
  });

  describe('config list', () => {
    it('JSON mode → object without profiles', async () => {
      setupProfile();
      await runCommand(['config', 'set', 'defaults.output', 'json'], { root: CLI_ROOT });
      const { stdout } = await runCommand(['config', 'list', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.defaults).toBeDefined();
      expect(parsed.profiles).toBeUndefined();
    });
  });

  // ===== Utility commands =====

  describe('doctor', () => {
    it('JSON mode → array of checks', async () => {
      setupProfile();
      const tokenInfo = mockEntity('/oauth/token/info', 'GET', { scopes: ['users:read'] });
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('profile')) {
          return Promise.resolve({
            ok: true, status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({}),
            text: () => Promise.resolve('{}'),
          });
        }
        if (typeof url === 'string' && url.includes('token/info')) {
          return Promise.resolve({
            ok: true, status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ data: tokenInfo }),
            text: () => Promise.resolve('{}'),
          });
        }
        if (typeof url === 'string' && url.includes('npmjs')) {
          return Promise.resolve({
            ok: true, status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ 'dist-tags': { latest: '0.0.0' } }),
            text: () => Promise.resolve('{}'),
          });
        }
        return Promise.resolve({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({}),
          text: () => Promise.resolve('{}'),
        });
      });

      const { stdout } = await runCommand(['doctor', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.checks).toBeDefined();
      expect(Array.isArray(parsed.checks)).toBe(true);
      const nodeCheck = parsed.checks.find((c: { name: string }) => c.name === 'node');
      expect(nodeCheck?.status).toBe('ok');
    });

    it('no network → error/warning for network check', async () => {
      setupProfile();
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      const { stdout, error } = await runCommand(['doctor', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      const networkCheck = parsed.checks.find((c: { name: string }) => c.name === 'network');
      expect(networkCheck?.status).toBe('error');
    });

    it('no profile → skipped for token check', async () => {
      mockFetch({ data: {} });
      const { stdout } = await runCommand(['doctor', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      const tokenCheck = parsed.checks.find((c: { name: string }) => c.name === 'token');
      expect(tokenCheck?.status).toBe('skipped');
    });

    it('истёкший, но обновляемый токен — не ошибка', async () => {
      // `doctor` skips the init hook, so it is the one command that sees a token
      // after it expired but before the next command renews it. Calling that
      // "invalid" sent people to log in again for nothing.
      const configDir = path.join(tmpDir, 'pachca');
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        path.join(configDir, 'config.toml'),
        [
          'active_profile = "oauth"',
          '',
          '[profiles.oauth]',
          'type = "user"',
          'token = "expired-token"',
          'user = "Test User"',
          'auth = "oauth"',
          'refresh_token = "refresh-1"',
          `expires_at = "${new Date(Date.now() - 60_000).toISOString()}"`,
          '',
        ].join('\n'),
      );

      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        const unauthorized = typeof url === 'string' && url.includes('token/info');
        return Promise.resolve({
          ok: !unauthorized,
          status: unauthorized ? 401 : 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(unauthorized ? {} : { 'dist-tags': { latest: '0.0.0' } }),
          text: () => Promise.resolve('{}'),
        });
      });

      const { stdout } = await runCommand(['doctor', '--json'], { root: CLI_ROOT });
      const tokenCheck = JSON.parse(stdout).checks.find((c: { name: string }) => c.name === 'token');

      expect(tokenCheck?.status).toBe('ok');
      expect(tokenCheck?.renewable).toBe(true);
    });

    it('истёкший вставленный токен — по-прежнему ошибка', async () => {
      // No refresh token means nothing will renew it; here "log in again" is right.
      setupProfile();
      globalThis.fetch = vi.fn().mockImplementation((url: string) => {
        const unauthorized = typeof url === 'string' && url.includes('token/info');
        return Promise.resolve({
          ok: !unauthorized,
          status: unauthorized ? 401 : 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve(unauthorized ? {} : { 'dist-tags': { latest: '0.0.0' } }),
          text: () => Promise.resolve('{}'),
        });
      });

      const { stdout } = await runCommand(['doctor', '--json'], { root: CLI_ROOT });
      const tokenCheck = JSON.parse(stdout).checks.find((c: { name: string }) => c.name === 'token');

      expect(tokenCheck?.status).toBe('error');
    });
  });

  describe('guide', () => {
    it('no query → list all workflows', async () => {
      const { stdout } = await runCommand(['guide', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
    });

    it('query "сообщение" → found workflows', async () => {
      const { stdout } = await runCommand(['guide', 'сообщение', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('query "xyznonexistent" → empty array', async () => {
      const { stdout } = await runCommand(['guide', 'xyznonexistent123', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed).toEqual([]);
    });
  });

  describe('commands', () => {
    it('lists all commands', async () => {
      const { stdout } = await runCommand(['commands', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(10);
    });

    it('--available → filter by scopes', async () => {
      setupProfile('test');
      // commands --available now calls GET /oauth/token/info to get scopes
      mockFetch({ data: { data: { scopes: ['users:read'] } } });
      const { stdout } = await runCommand(['commands', '--available', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(Array.isArray(parsed)).toBe(true);
      // Commands with users:read scope should be included
      const usersRead = parsed.find((c: { scope: string }) => c.scope === 'users:read');
      expect(usersRead).toBeDefined();
      // Commands with other scopes should be filtered out
      const messagesCreate = parsed.find((c: { scope: string }) => c.scope === 'messages:create');
      expect(messagesCreate).toBeUndefined();
    });
  });

  describe('changelog', () => {
    it('outputs changelog data', async () => {
      const { stdout } = await runCommand(['changelog', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(Array.isArray(parsed)).toBe(true);
    });
  });

  describe('version', () => {
    it('outputs version string', async () => {
      const { stdout } = await runCommand(['version'], { root: CLI_ROOT });
      expect(stdout).toContain('version');
    });

    it('JSON → { version: "..." }', async () => {
      const { stdout } = await runCommand(['version', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.version).toBeDefined();
    });
  });

  describe('introspect', () => {
    it('no args → list all commands with meta', async () => {
      const { stdout } = await runCommand(['introspect', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(10);
      expect(parsed[0].command).toBeDefined();
    });

    it('introspect "messages create" → flags list', async () => {
      const { stdout } = await runCommand(['introspect', 'messages', 'create', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.command).toContain('messages');
      expect(parsed.flags).toBeDefined();
      expect(Array.isArray(parsed.flags)).toBe(true);
    });
  });

  describe('api', () => {
    it('api GET /profile → fetch GET + JSON output', async () => {
      setupProfile();
      mockFetchForEndpoint('/profile', 'GET');
      const { stdout } = await runCommand(['api', 'GET', '/profile'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.data).toBeDefined();
      expect(fetchCalls()[0][1].method).toBe('GET');
    });

    it('api POST /messages -f message[content]=hello → nested body', async () => {
      setupProfile();
      mockFetchForEndpoint('/messages', 'POST');
      await runCommand(['api', 'POST', '/messages', '-f', 'message[content]=hello'], { root: CLI_ROOT });
      const body = JSON.parse(fetchCalls()[0][1].body);
      expect(body.message.content).toBe('hello');
    });

    it('api POST -F message[chat_id]=123 → number (not string)', async () => {
      setupProfile();
      mockFetchForEndpoint('/messages', 'POST');
      await runCommand(['api', 'POST', '/messages', '-F', 'message[chat_id]=123'], { root: CLI_ROOT });
      const body = JSON.parse(fetchCalls()[0][1].body);
      expect(body.message.chat_id).toBe(123);
    });

    it('api GET /users --query limit=5 → query ?limit=5', async () => {
      setupProfile();
      mockFetchForEndpoint('/users', 'GET');
      await runCommand(['api', 'GET', '/users', '--query', 'limit=5'], { root: CLI_ROOT });
      const url = fetchCalls()[0][0] as string;
      expect(url).toContain('limit=5');
    });

    it('api POST --input file → body from file', async () => {
      setupProfile();
      const inputFile = path.join(tmpDir, 'payload.json');
      fs.writeFileSync(inputFile, JSON.stringify({ message: { content: 'from file' } }));
      mockFetchForEndpoint('/messages', 'POST');
      await runCommand(['api', 'POST', '/messages', '--input', inputFile], { root: CLI_ROOT });
      const body = JSON.parse(fetchCalls()[0][1].body);
      expect(body.message.content).toBe('from file');
    });

    it('-f and --input → mutually exclusive error', async () => {
      setupProfile();
      const inputFile = path.join(tmpDir, 'payload.json');
      fs.writeFileSync(inputFile, '{}');
      const { stderr, error } = await runCommand(['api', 'POST', '/messages', '-f', 'key=val', '--input', inputFile], { root: CLI_ROOT });
      expect(error).toBeTruthy();
      expect(stderr).toContain('mutually exclusive');
    });
  });
});
