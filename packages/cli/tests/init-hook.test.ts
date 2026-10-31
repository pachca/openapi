import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import hook from '../src/hooks/init.js';

let tmpDir: string;
const saved: Record<string, string | undefined> = {};

function runHook(id: string, argv: string[]) {
  const config = { cacheDir: tmpDir, version: '0.0.0', findCommand: () => ({}) };
  return (hook as unknown as (opts: unknown) => Promise<void>).call({}, { id, argv, config });
}

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pachca-init-hook-'));
  for (const key of ['XDG_CONFIG_HOME', 'PACHCA_HOME', 'PACHCA_TOKEN', 'PACHCA_PROFILE']) saved[key] = process.env[key];
  process.env.XDG_CONFIG_HOME = tmpDir;
  delete process.env.PACHCA_HOME;
  delete process.env.PACHCA_TOKEN;
  delete process.env.PACHCA_PROFILE;
  vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`exit ${code}`);
  });
  vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('init hook without a token', () => {
  it('lets api ls and the --describe, --spec, --docs modes run', async () => {
    await expect(runHook('api', ['ls'])).resolves.toBeUndefined();
    await expect(runHook('api', ['POST', '/messages', '--describe'])).resolves.toBeUndefined();
    await expect(runHook('api', ['GET', '/messages', '--spec'])).resolves.toBeUndefined();
    await expect(runHook('api', ['POST', '/messages', '--docs'])).resolves.toBeUndefined();
  });

  it('still stops a real api request', async () => {
    await expect(runHook('api', ['GET', '/profile'])).rejects.toThrow('exit 3');
  });
});

describe('init hook with a login the server no longer renews', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  function writeOAuthProfile(name: string) {
    const configDir = path.join(tmpDir, 'pachca');
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(
      path.join(configDir, 'config.toml'),
      [
        `active_profile = "${name}"`,
        '',
        `[profiles.${name}]`,
        'type = "user"',
        'token = "old-token"',
        'user = "Test"',
        'auth = "oauth"',
        'refresh_token = "refresh-1"',
        `expires_at = "${new Date(Date.now() - 1000).toISOString()}"`,
        '',
      ].join('\n'),
    );
  }

  function refuseRefresh() {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ error: 'invalid_grant' }),
      text: () => Promise.resolve('{"error":"invalid_grant"}'),
    }) as unknown as typeof fetch;
  }

  function stderrJson(): Record<string, unknown> {
    const calls = (process.stderr.write as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    return JSON.parse(String(calls.at(-1)?.[0]).trim());
  }

  // The mocked process.exit throws, and the hook's outer catch swallows it, so the
  // exit shows up as a call rather than a rejection.
  it('names the profile in the hint to log in again', async () => {
    writeOAuthProfile('ci');
    refuseRefresh();

    await runHook('users:list', []);
    expect(process.exit).toHaveBeenCalledWith(3);
    expect(stderrJson()).toMatchObject({ type: 'PACHCA_AUTH_ERROR', hint: 'pachca auth login --profile ci' });
  });

  it('keeps the bare command for the default profile', async () => {
    writeOAuthProfile('default');
    refuseRefresh();

    await runHook('users:list', []);
    expect(process.exit).toHaveBeenCalledWith(3);
    expect(stderrJson()).toMatchObject({ hint: 'pachca auth login' });
  });
});
