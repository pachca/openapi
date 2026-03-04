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
    statusText: status === 200 ? 'OK' : 'Error',
    headers,
    json: () => Promise.resolve(response.data ?? {}),
    text: () => Promise.resolve(JSON.stringify(response.data ?? {})),
  });
}

function fetchCalls() {
  return (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
}

function setupProfile(name = 'test', opts: { scopes?: string[]; type?: string; user?: string; email?: string } = {}) {
  const configDir = path.join(tmpDir, 'pachca');
  fs.mkdirSync(configDir, { recursive: true });
  const scopes = opts.scopes ?? ['users:read', 'messages:create'];
  const type = opts.type ?? 'user';
  const user = opts.user ?? 'Test User';
  const email = opts.email ?? 'test@test.com';
  const scopesStr = scopes.map((s) => `"${s}"`).join(', ');
  fs.writeFileSync(
    path.join(configDir, 'config.toml'),
    `active_profile = "${name}"\n\n[profiles.${name}]\ntype = "${type}"\ntoken = "test-token"\nuser = "${user}"\nemail = "${email}"\nscopes = [${scopesStr}]\n`,
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
      'scopes = ["users:read"]',
      '',
      '[profiles.bot]',
      'type = "bot"',
      'token = "token-bot"',
      'user = "Bot User"',
      'scopes = ["messages:create"]',
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
      // Mock token info + profile
      let callNum = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callNum++;
        if (callNum === 1) {
          // GET /oauth/token/info
          return Promise.resolve({
            ok: true, status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ user_id: 1, scopes: ['users:read', 'messages:create'] }),
            text: () => Promise.resolve('{}'),
          });
        }
        // GET /profile
        return Promise.resolve({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ data: { first_name: 'Ivan', last_name: 'Petrov', email: 'ivan@test.com', bot: false } }),
          text: () => Promise.resolve('{}'),
        });
      });

      const { error } = await runCommand(['auth', 'login', '--token', 'my-token'], { root: CLI_ROOT });
      expect(error).toBeUndefined();
      // Profile should be saved
      const configPath = path.join(tmpDir, 'pachca', 'config.toml');
      expect(fs.existsSync(configPath)).toBe(true);
      const content = fs.readFileSync(configPath, 'utf-8');
      expect(content).toContain('my-token');
      expect(content).toContain('Ivan Petrov');
    });

    it('--token invalid → 401 error', async () => {
      mockFetch({ status: 401, data: { error: 'invalid_token', error_description: 'Token is invalid' } });
      const { error } = await runCommand(['auth', 'login', '--token', 'bad-token'], { root: CLI_ROOT });
      expect(error).toBeTruthy();
    });

    it('--profile custom → saves under custom name', async () => {
      let callNum = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callNum++;
        if (callNum === 1) {
          return Promise.resolve({
            ok: true, status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ user_id: 1, scopes: ['users:read'] }),
            text: () => Promise.resolve('{}'),
          });
        }
        return Promise.resolve({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ data: { first_name: 'Bot', last_name: '', email: null, bot: true } }),
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
      let callNum = 0;
      globalThis.fetch = vi.fn().mockImplementation(() => {
        callNum++;
        if (callNum === 1) {
          return Promise.resolve({
            ok: true, status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: () => Promise.resolve({ user_id: 1, scopes: ['messages:create'] }),
            text: () => Promise.resolve('{}'),
          });
        }
        return Promise.resolve({
          ok: true, status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: () => Promise.resolve({ data: { first_name: 'Bot', last_name: '', email: null, bot: true } }),
          text: () => Promise.resolve('{}'),
        });
      });

      const { stdout } = await runCommand(['auth', 'login', '--token', 'bot-token', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.type).toBe('bot');
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
      // active_profile should be empty or cleared
      expect(content).not.toContain('active_profile = "test"');
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
      // Don't set up profile
      const { stderr, error } = await runCommand(['auth', 'status'], { root: CLI_ROOT });
      expect(error).toBeTruthy();
      expect(stderr).toContain('No active profile');
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
      // No profiles
      const { stdout } = await runCommand(['auth', 'list', '--json'], { root: CLI_ROOT });
      expect(JSON.parse(stdout)).toEqual([]);
    });
  });

  describe('auth refresh', () => {
    it('refreshes scopes', async () => {
      setupProfile('test', { scopes: ['users:read'] });
      mockFetch({ data: { scopes: ['users:read', 'users:create'] } });
      const { stdout } = await runCommand(['auth', 'refresh', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.scopes_before).toEqual(['users:read']);
      expect(parsed.scopes_after).toContain('users:create');
      expect(parsed.added).toContain('users:create');
    });

    it('no profile → error', async () => {
      const { stderr, error } = await runCommand(['auth', 'refresh'], { root: CLI_ROOT });
      expect(error).toBeTruthy();
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
      // Mock network calls
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
            json: () => Promise.resolve({ scopes: ['users:read'] }),
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
      // Node.js check should be ok
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
      // Don't set up profile
      mockFetch({ data: {} });
      const { stdout } = await runCommand(['doctor', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      const tokenCheck = parsed.checks.find((c: { name: string }) => c.name === 'token');
      // Token check should be skipped if no profile
      expect(tokenCheck?.status).toBe('skipped');
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
      setupProfile('test', { scopes: ['users:read'] });
      const { stdout } = await runCommand(['commands', '--available', '--json'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(Array.isArray(parsed)).toBe(true);
      // Should have available flag
      const usersRead = parsed.find((c: { scope: string }) => c.scope === 'users:read');
      if (usersRead) expect(usersRead.available).toBe(true);
      const messagesCreate = parsed.find((c: { scope: string }) => c.scope === 'messages:create');
      if (messagesCreate) expect(messagesCreate.available).toBe(false);
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
      // Each entry should have command and summary
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
      mockFetch({ data: { data: { id: 1, name: 'Ivan' } } });
      const { stdout } = await runCommand(['api', 'GET', '/profile'], { root: CLI_ROOT });
      const parsed = JSON.parse(stdout);
      expect(parsed.data).toBeDefined();
      expect(fetchCalls()[0][1].method).toBe('GET');
    });

    it('api POST /messages -f message[content]=hello → nested body', async () => {
      setupProfile();
      mockFetch({ data: { data: { id: 1 } } });
      await runCommand(['api', 'POST', '/messages', '-f', 'message[content]=hello'], { root: CLI_ROOT });
      const body = JSON.parse(fetchCalls()[0][1].body);
      expect(body.message.content).toBe('hello');
    });

    it('api POST -F message[chat_id]=123 → number (not string)', async () => {
      setupProfile();
      mockFetch({ data: { data: { id: 1 } } });
      await runCommand(['api', 'POST', '/messages', '-F', 'message[chat_id]=123'], { root: CLI_ROOT });
      const body = JSON.parse(fetchCalls()[0][1].body);
      expect(body.message.chat_id).toBe(123);
    });

    it('api GET /users --query limit=5 → query ?limit=5', async () => {
      setupProfile();
      mockFetch({ data: { data: [] } });
      await runCommand(['api', 'GET', '/users', '--query', 'limit=5'], { root: CLI_ROOT });
      const url = fetchCalls()[0][0] as string;
      expect(url).toContain('limit=5');
    });

    it('api POST --input file → body from file', async () => {
      setupProfile();
      const inputFile = path.join(tmpDir, 'payload.json');
      fs.writeFileSync(inputFile, JSON.stringify({ message: { content: 'from file' } }));
      mockFetch({ data: { data: { id: 1 } } });
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
