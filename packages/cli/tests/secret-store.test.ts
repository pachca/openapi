import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

/**
 * The OS credential store is stubbed: a real Keychain prompt would make the
 * suite interactive, and CI has no Secret Service at all. What matters here is
 * the contract around the store — what lands in the config file, what happens
 * when the store refuses, and that a downgrade never loses the session.
 */

const store = new Map<string, string>();
let failWrites = false;
let moduleMissing = false;

const keyringStub = {
  Entry: class {
    private key: string;
    constructor(service: string, username: string) {
      if (moduleMissing) throw new Error('no native binary');
      this.key = `${service}:${username}`;
    }
    setPassword(password: string): void {
      if (failWrites) throw new Error('keyring locked');
      store.set(this.key, password);
    }
    getPassword(): string | null {
      return store.get(this.key) ?? null;
    }
    deleteCredential(): boolean {
      return store.delete(this.key);
    }
  },
};

let tmpHome: string;

/**
 * The stub is installed through the module's own seam, not `vi.mock`: the native
 * package is pulled in with `createRequire`, which module mocking does not
 * intercept — a mocked test would silently hit the real Keychain.
 */
async function loadProfiles() {
  vi.resetModules();
  const secretStore = await import('../src/secret-store.js');
  secretStore.setKeyringForTests(keyringStub);
  return import('../src/profiles.js');
}

beforeEach(() => {
  tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'pachca-secret-'));
  process.env.PACHCA_HOME = tmpHome;
  // The suite disables the store for every other test file; these tests are the
  // ones that must exercise it, against the stub.
  delete process.env.PACHCA_SECRET_STORE;
  store.clear();
  failWrites = false;
  moduleMissing = false;
});

afterEach(() => {
  delete process.env.PACHCA_HOME;
  process.env.PACHCA_SECRET_STORE = 'file';
  fs.rmSync(tmpHome, { recursive: true, force: true });
});

function configText(): string {
  return fs.readFileSync(path.join(tmpHome, 'pachca', 'config.toml'), 'utf-8');
}

describe('keyring-backed profiles', () => {
  it('keeps the token out of the config file and reads it back', async () => {
    const { setProfile, getProfile } = await loadProfiles();

    setProfile('default', {
      type: 'user',
      token: 'secret-access',
      user: 'Андрей',
      auth: 'oauth',
      refresh_token: 'secret-refresh',
      storage: 'keyring',
    });

    expect(configText()).not.toContain('secret-access');
    expect(configText()).not.toContain('secret-refresh');

    const profile = getProfile('default');
    expect(profile?.token).toBe('secret-access');
    expect(profile?.refresh_token).toBe('secret-refresh');
    expect(profile?.storage).toBe('keyring');
  });

  it('falls back to the file when the store refuses the write', async () => {
    failWrites = true;
    const { setProfile, getProfile } = await loadProfiles();

    setProfile('default', {
      type: 'user',
      token: 'secret-access',
      user: 'Андрей',
      auth: 'oauth',
      storage: 'keyring',
    });

    // Losing the just-created session would be worse than storing it as before.
    expect(getProfile('default')?.token).toBe('secret-access');
    expect(getProfile('default')?.storage).toBe('file');
    expect(configText()).toContain('secret-access');
  });

  it('falls back when the native module is absent', async () => {
    moduleMissing = true;
    const { setProfile, getProfile } = await loadProfiles();

    setProfile('default', {
      type: 'user',
      token: 'secret-access',
      user: 'Андрей',
      storage: 'keyring',
    });

    expect(getProfile('default')?.storage).toBe('file');
    expect(getProfile('default')?.token).toBe('secret-access');
  });

  it('keeps refreshed tokens in the store instead of moving them to disk', async () => {
    const { setProfile, updateProfileTokens, getProfile } = await loadProfiles();

    setProfile('default', {
      type: 'user',
      token: 'old-access',
      user: 'Андрей',
      auth: 'oauth',
      refresh_token: 'old-refresh',
      storage: 'keyring',
    });

    const updated = updateProfileTokens('default', {
      token: 'new-access',
      refresh_token: 'new-refresh',
      expires_at: '2099-01-01T00:00:00.000Z',
    });

    expect(updated?.token).toBe('new-access');
    expect(configText()).not.toContain('new-access');
    expect(configText()).not.toContain('new-refresh');
    expect(getProfile('default')?.token).toBe('new-access');
    expect(getProfile('default')?.refresh_token).toBe('new-refresh');
  });

  it('removes the stored secret on logout', async () => {
    const { setProfile, deleteProfile } = await loadProfiles();

    setProfile('default', {
      type: 'user',
      token: 'secret-access',
      user: 'Андрей',
      storage: 'keyring',
    });
    expect(store.size).toBe(1);

    deleteProfile('default');
    expect(store.size).toBe(0);
  });

  it('removes the stored secret when the profile moves back to the file', async () => {
    const { setProfile } = await loadProfiles();
    const base = { type: 'user' as const, token: 'secret-access', user: 'Андрей' };

    setProfile('default', { ...base, storage: 'keyring' });
    expect(store.size).toBe(1);

    setProfile('default', { ...base, storage: 'file' });
    expect(store.size).toBe(0);
    expect(configText()).toContain('secret-access');
  });

  it('explains an unreadable store instead of failing with an empty token', async () => {
    const { setProfile, resolveToken, SecretStoreUnavailableError } = await loadProfiles();

    setProfile('default', {
      type: 'user',
      token: 'secret-access',
      user: 'Андрей',
      storage: 'keyring',
    });

    // The entry disappears — a locked keyring, or a config copied to a machine
    // whose store never had it.
    store.clear();

    expect(() => resolveToken({ profile: 'default' })).toThrow(SecretStoreUnavailableError);
  });

  it('PACHCA_SECRET_STORE=file keeps the store out of it entirely', async () => {
    process.env.PACHCA_SECRET_STORE = 'file';
    const { setProfile, getProfile } = await loadProfiles();

    setProfile('default', {
      type: 'user',
      token: 'secret-access',
      user: 'Андрей',
      storage: 'keyring',
    });

    expect(store.size).toBe(0);
    expect(getProfile('default')?.storage).toBe('file');
    expect(getProfile('default')?.token).toBe('secret-access');
  });

  it('leaves file-backed profiles untouched', async () => {
    const { setProfile, getProfile } = await loadProfiles();

    setProfile('legacy', { type: 'user', token: 'plain-token', user: 'Андрей' });

    expect(store.size).toBe(0);
    expect(configText()).toContain('plain-token');
    expect(getProfile('legacy')?.token).toBe('plain-token');
    expect(getProfile('legacy')?.storage).toBeUndefined();
  });
});
