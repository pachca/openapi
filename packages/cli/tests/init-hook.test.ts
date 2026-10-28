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
