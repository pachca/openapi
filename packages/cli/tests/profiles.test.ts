import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

// We test profiles by setting XDG_CONFIG_HOME to a temp directory
let tmpDir: string;
const originalEnv = { ...process.env };

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pachca-cli-test-'));
  process.env.XDG_CONFIG_HOME = tmpDir;
  delete process.env.PACHCA_TOKEN;
  delete process.env.PACHCA_PROFILE;
});

afterEach(() => {
  process.env = { ...originalEnv };
  process.env.XDG_CONFIG_HOME = undefined;
  delete process.env.PACHCA_TOKEN;
  delete process.env.PACHCA_PROFILE;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('profiles', () => {
  it('should read empty config when no file exists', async () => {
    const { readConfig } = await import('../src/profiles.js');
    const config = readConfig();
    expect(config).toEqual({});
  });

  it('should write and read config', async () => {
    const { writeConfig, readConfig } = await import('../src/profiles.js');
    writeConfig({
      active_profile: 'test',
      profiles: {
        test: {
          type: 'user',
          token: 'secret',
          user: 'Test User',
          email: 'test@test.com',
          scopes: ['messages:read'],
        },
      },
    });

    const config = readConfig();
    expect(config.active_profile).toBe('test');
    expect(config.profiles?.test?.token).toBe('secret');
  });

  it('should set and get profile', async () => {
    const { setProfile, getProfile } = await import('../src/profiles.js');
    setProfile('personal', {
      type: 'user',
      token: 'token123',
      user: 'John',
      email: 'john@example.com',
      scopes: ['messages:read', 'users:read'],
    });

    const profile = getProfile('personal');
    expect(profile).toBeDefined();
    expect(profile!.user).toBe('John');
    expect(profile!.scopes).toHaveLength(2);
  });

  it('should delete profile', async () => {
    const { setProfile, deleteProfile, getProfile, setActiveProfile, getActiveProfile } = await import('../src/profiles.js');
    setProfile('p1', { type: 'user', token: 't1', user: 'U1', scopes: [] });
    setProfile('p2', { type: 'bot', token: 't2', user: 'U2', scopes: [] });
    setActiveProfile('p1');

    deleteProfile('p1');
    expect(getProfile('p1')).toBeUndefined();
    // Active should switch to remaining
    expect(getActiveProfile()).toBe('p2');
  });

  it('should clear active profile when last profile deleted', async () => {
    const { setProfile, deleteProfile, getActiveProfile, setActiveProfile } = await import('../src/profiles.js');
    setProfile('only', { type: 'user', token: 't1', user: 'U1', scopes: [] });
    setActiveProfile('only');

    deleteProfile('only');
    expect(getActiveProfile()).toBeUndefined();
  });

  it('should list profiles', async () => {
    const { setProfile, listProfiles } = await import('../src/profiles.js');
    setProfile('a', { type: 'user', token: 'ta', user: 'A', scopes: [] });
    setProfile('b', { type: 'bot', token: 'tb', user: 'B', scopes: [] });

    const profiles = listProfiles();
    expect(Object.keys(profiles)).toEqual(['a', 'b']);
  });

  it('should handle config values', async () => {
    const { setConfigValue, getConfigValue } = await import('../src/profiles.js');
    setConfigValue('defaults.output', 'json');
    setConfigValue('defaults.timeout', '60');

    expect(getConfigValue('defaults.output')).toBe('json');
    expect(getConfigValue('defaults.timeout')).toBe(60);
  });

  it('should return undefined for nonexistent config value', async () => {
    const { getConfigValue } = await import('../src/profiles.js');
    expect(getConfigValue('defaults.nonexistent')).toBeUndefined();
    expect(getConfigValue('totally.missing.path')).toBeUndefined();
  });

  it('should resolve token from active profile', async () => {
    const { setProfile, setActiveProfile, resolveToken } = await import('../src/profiles.js');
    setProfile('default', { type: 'user', token: 'from-profile', user: 'U', scopes: [] });
    setActiveProfile('default');

    const result = resolveToken({});
    expect(result.token).toBe('from-profile');
    expect(result.profileName).toBe('default');
  });

  it('should prioritize --token flag over everything', async () => {
    const { setProfile, setActiveProfile, resolveToken } = await import('../src/profiles.js');
    process.env.PACHCA_TOKEN = 'from-env';
    setProfile('default', { type: 'user', token: 'from-profile', user: 'U', scopes: [] });
    setActiveProfile('default');

    const result = resolveToken({ token: 'from-flag' });
    expect(result.token).toBe('from-flag');
    expect(result.profileName).toBeUndefined();
  });

  it('should prioritize PACHCA_TOKEN env over profile', async () => {
    const { setProfile, setActiveProfile, resolveToken } = await import('../src/profiles.js');
    process.env.PACHCA_TOKEN = 'from-env';
    setProfile('default', { type: 'user', token: 'from-profile', user: 'U', scopes: [] });
    setActiveProfile('default');

    const result = resolveToken({});
    expect(result.token).toBe('from-env');
    expect(result.profileName).toBeUndefined();
  });

  it('should use PACHCA_PROFILE env to select profile', async () => {
    const { setProfile, setActiveProfile, resolveToken } = await import('../src/profiles.js');
    setProfile('personal', { type: 'user', token: 'personal-token', user: 'Personal', scopes: [] });
    setProfile('bot', { type: 'bot', token: 'bot-token', user: 'Bot', scopes: [] });
    setActiveProfile('personal');
    process.env.PACHCA_PROFILE = 'bot';

    const result = resolveToken({});
    expect(result.token).toBe('bot-token');
    expect(result.profileName).toBe('bot');
  });

  it('should prioritize --profile flag over PACHCA_PROFILE env', async () => {
    const { setProfile, setActiveProfile, resolveToken } = await import('../src/profiles.js');
    setProfile('personal', { type: 'user', token: 'personal-token', user: 'Personal', scopes: [] });
    setProfile('bot', { type: 'bot', token: 'bot-token', user: 'Bot', scopes: [] });
    setActiveProfile('personal');
    process.env.PACHCA_PROFILE = 'personal';

    const result = resolveToken({ profile: 'bot' });
    expect(result.token).toBe('bot-token');
    expect(result.profileName).toBe('bot');
  });

  it('should throw TokenNotFoundError when no token available', async () => {
    const { resolveToken, TokenNotFoundError } = await import('../src/profiles.js');
    expect(() => resolveToken({})).toThrow(TokenNotFoundError);
  });

  it('should throw ProfileNotFoundError for nonexistent profile', async () => {
    const { resolveToken, setActiveProfile, ProfileNotFoundError } = await import('../src/profiles.js');
    // Set active profile name but don't create it
    const { writeConfig } = await import('../src/profiles.js');
    writeConfig({ active_profile: 'ghost' });

    expect(() => resolveToken({})).toThrow(ProfileNotFoundError);
  });

  it('should return profile data in resolveToken', async () => {
    const { setProfile, setActiveProfile, resolveToken } = await import('../src/profiles.js');
    setProfile('test', {
      type: 'bot',
      token: 'bot-token',
      user: 'Bot',
      scopes: ['messages:write'],
      scopes_refreshed_at: '2026-03-01T00:00:00Z',
    });
    setActiveProfile('test');

    const result = resolveToken({});
    expect(result.profile).toBeDefined();
    expect(result.profile!.type).toBe('bot');
    expect(result.profile!.scopes).toEqual(['messages:write']);
    expect(result.profile!.scopes_refreshed_at).toBe('2026-03-01T00:00:00Z');
  });

  it('should invalidate scopes for a profile', async () => {
    const { setProfile, getProfile, invalidateScopes } = await import('../src/profiles.js');
    setProfile('bot1', {
      type: 'bot',
      token: 'bot-token',
      user: 'Bot',
      scopes: ['messages:write', 'chats:read'],
      scopes_refreshed_at: '2026-03-01T00:00:00Z',
    });

    invalidateScopes('bot1');

    const profile = getProfile('bot1');
    expect(profile).toBeDefined();
    expect(profile!.scopes).toEqual([]);
    expect(profile!.scopes_refreshed_at).toBeUndefined();
    // Token should still be preserved
    expect(profile!.token).toBe('bot-token');
  });

  it('should not throw when invalidating scopes for nonexistent profile', async () => {
    const { invalidateScopes } = await import('../src/profiles.js');
    expect(() => invalidateScopes('nonexistent')).not.toThrow();
  });

  it('should store bot profile with scopes_refreshed_at', async () => {
    const { setProfile, getProfile } = await import('../src/profiles.js');
    const now = new Date().toISOString();
    setProfile('bot', {
      type: 'bot',
      token: 'bot-token',
      user: 'Support Bot',
      scopes: ['messages:write'],
      scopes_refreshed_at: now,
    });

    const profile = getProfile('bot');
    expect(profile!.type).toBe('bot');
    expect(profile!.scopes_refreshed_at).toBe(now);
  });

  it('should create config with 600 permissions on unix', async () => {
    if (process.platform === 'win32') return;

    const { writeConfig, getConfigFilePermissions } = await import('../src/profiles.js');
    writeConfig({ active_profile: 'test' });

    const permissions = getConfigFilePermissions();
    expect(permissions).toBe('600');
  });

  it('should perform atomic write (temp file + rename)', async () => {
    const { writeConfig, getConfigFilePath } = await import('../src/profiles.js');
    writeConfig({ active_profile: 'first' });
    const configPath = getConfigFilePath();

    // Write again — no leftover .tmp files should exist
    writeConfig({ active_profile: 'second' });

    const dir = path.dirname(configPath);
    const files = fs.readdirSync(dir);
    const tmpFiles = files.filter((f) => f.includes('.tmp.'));
    expect(tmpFiles).toHaveLength(0);

    // Verify content was updated
    const content = fs.readFileSync(configPath, 'utf-8');
    expect(content).toContain('second');
  });

  it('should get defaults', async () => {
    const { setConfigValue, getDefaults } = await import('../src/profiles.js');
    setConfigValue('defaults.output', 'yaml');
    setConfigValue('defaults.timeout', '45');

    const defaults = getDefaults();
    expect(defaults.output).toBe('yaml');
    expect(defaults.timeout).toBe(45);
  });

  it('should return empty defaults when none set', async () => {
    const { getDefaults } = await import('../src/profiles.js');
    const defaults = getDefaults();
    expect(defaults).toEqual({});
  });
});
