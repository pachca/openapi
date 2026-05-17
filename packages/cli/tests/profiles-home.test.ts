import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// C8 — PACHCA_HOME overrides the config directory. The key guarantee:
// when PACHCA_HOME is unset, the path is byte-identical to before.
let tmpHome: string;
let tmpXdg: string;
const originalEnv = { ...process.env };

beforeEach(() => {
  tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'pachca-home-'));
  tmpXdg = fs.mkdtempSync(path.join(os.tmpdir(), 'pachca-xdg-'));
  delete process.env.PACHCA_HOME;
  delete process.env.PACHCA_TOKEN;
  delete process.env.PACHCA_PROFILE;
  process.env.XDG_CONFIG_HOME = tmpXdg;
});

afterEach(() => {
  process.env = { ...originalEnv };
  fs.rmSync(tmpHome, { recursive: true, force: true });
  fs.rmSync(tmpXdg, { recursive: true, force: true });
});

describe('C8 — PACHCA_HOME', () => {
  it('without PACHCA_HOME the path is unchanged (XDG regression)', async () => {
    const { getConfigFilePath } = await import('../src/profiles.js');
    expect(getConfigFilePath()).toBe(path.join(tmpXdg, 'pachca', 'config.toml'));
  });

  it('PACHCA_HOME overrides and takes priority over XDG_CONFIG_HOME', async () => {
    process.env.PACHCA_HOME = tmpHome;
    const { getConfigFilePath } = await import('../src/profiles.js');
    expect(getConfigFilePath()).toBe(path.join(tmpHome, 'pachca', 'config.toml'));
  });

  it('profiles are written to and read from the PACHCA_HOME directory', async () => {
    process.env.PACHCA_HOME = tmpHome;
    const { setProfile, getProfile } = await import('../src/profiles.js');
    setProfile('ci', { type: 'user', token: 'secret', user: 'CI' });
    expect(fs.existsSync(path.join(tmpHome, 'pachca', 'config.toml'))).toBe(true);
    expect(getProfile('ci')?.token).toBe('secret');
  });
});
