import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as TOML from 'smol-toml';

import { deleteSecret, readSecret, writeSecret } from './secret-store.js';

/**
 * How the profile got its token. Absent means the token was pasted in — profiles
 * written before OAuth login existed have no marker and must keep working.
 */
export type AuthMethod = 'token' | 'oauth';

/**
 * Where the secret part of the profile lives. Absent = 'file', which is what
 * every profile written before the OS store existed uses.
 */
export type SecretStorage = 'file' | 'keyring';

export interface Profile {
  type: 'user' | 'bot';
  /** Empty when storage is 'keyring' and the store could not be read. */
  token: string;
  user: string;
  email?: string | null;
  /** Absent = 'token' (pasted). Pasted tokens never expire and cannot be refreshed. */
  auth?: AuthMethod;
  refresh_token?: string;
  /** ISO-8601. Only set for OAuth logins — those tokens live an hour. */
  expires_at?: string;
  scopes?: string[];
  /** Absent = 'file'. When 'keyring', `token`/`refresh_token` are not in the config file. */
  storage?: SecretStorage;
}

export function getSecretStorage(profile: Profile): SecretStorage {
  return profile.storage === 'keyring' ? 'keyring' : 'file';
}

export function getAuthMethod(profile: Profile): AuthMethod {
  return profile.auth === 'oauth' ? 'oauth' : 'token';
}

/** True when the profile holds a refreshable OAuth session. */
export function isRefreshable(profile: Profile): boolean {
  return getAuthMethod(profile) === 'oauth' && !!profile.refresh_token;
}

/**
 * True when the access token is gone or about to be. The skew keeps a command
 * from starting with a token that expires while the request is in flight.
 */
export function isExpiring(profile: Profile, skewSeconds = 120): boolean {
  if (!profile.expires_at) return false;
  const expiresAt = Date.parse(profile.expires_at);
  if (Number.isNaN(expiresAt)) return false;
  return expiresAt - skewSeconds * 1000 <= Date.now();
}

export function expiresAtFromNow(expiresInSeconds: number): string {
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString();
}

export interface ConfigDefaults {
  output?: string;
  timeout?: number;
}

export interface ConfigData {
  active_profile?: string;
  defaults?: ConfigDefaults;
  profiles?: Record<string, Profile>;
}

const CONFIG_FILENAME = 'config.toml';

function getConfigDir(): string {
  // C8 — explicit override (highest priority). Guarded: when PACHCA_HOME is
  // unset the path is byte-identical to before, so existing behavior is
  // preserved. Useful for isolating config in CI/tests/agents.
  if (process.env.PACHCA_HOME) {
    return path.join(process.env.PACHCA_HOME, 'pachca');
  }
  // XDG_CONFIG_HOME on Unix, LOCALAPPDATA on Windows
  if (process.env.XDG_CONFIG_HOME) {
    return path.join(process.env.XDG_CONFIG_HOME, 'pachca');
  }
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    return path.join(process.env.LOCALAPPDATA, 'pachca');
  }
  return path.join(os.homedir(), '.config', 'pachca');
}

function getConfigPath(): string {
  return path.join(getConfigDir(), CONFIG_FILENAME);
}

export function readConfig(): ConfigData {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    return {};
  }
  const raw = fs.readFileSync(configPath, 'utf-8');
  return TOML.parse(raw) as unknown as ConfigData;
}

export function writeConfig(config: ConfigData): void {
  const dir = getConfigDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const configPath = getConfigPath();
  const tomlStr = TOML.stringify(config as unknown as Record<string, unknown>);

  // Atomic write: write to temp file then rename
  const tmpPath = configPath + '.tmp.' + process.pid;
  fs.writeFileSync(tmpPath, tomlStr, { mode: 0o600 });
  fs.renameSync(tmpPath, configPath);

  // Ensure permissions on Unix
  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(configPath, 0o600);
    } catch {
      // Ignore chmod errors
    }
  }
}

export function getActiveProfile(): string | undefined {
  const config = readConfig();
  return config.active_profile;
}

export function setActiveProfile(name: string): void {
  const config = readConfig();
  config.active_profile = name;
  writeConfig(config);
}

/**
 * Put the secret back on a profile read from the config file.
 *
 * A keyring-backed profile carries no token on disk, so every read has to go to
 * the OS store. When the store cannot be read — locked keyring, moved config,
 * removed entry — the token stays empty and `resolveToken` turns that into a
 * message the user can act on, rather than an opaque 401 later.
 */
function hydrate(name: string, profile: Profile): Profile {
  if (getSecretStorage(profile) !== 'keyring') return profile;

  const secret = readSecret(name);
  return {
    ...profile,
    token: secret?.token ?? '',
    ...(secret?.refresh_token ? { refresh_token: secret.refresh_token } : {}),
  };
}

export function getProfile(name: string): Profile | undefined {
  const stored = readConfig().profiles?.[name];
  return stored ? hydrate(name, stored) : undefined;
}

/**
 * Write a profile, keeping the secret out of the config file when the profile
 * asked for the OS store.
 *
 * A failed keyring write silently downgrades to the file: losing the session
 * because the store went away between login and now would be worse than storing
 * a token the way every previous version stored it.
 */
export function setProfile(name: string, profile: Profile): void {
  const config = readConfig();
  if (!config.profiles) {
    config.profiles = {};
  }

  if (getSecretStorage(profile) === 'keyring') {
    const stored = writeSecret(name, {
      token: profile.token,
      ...(profile.refresh_token ? { refresh_token: profile.refresh_token } : {}),
    });

    if (stored) {
      const { token: _token, refresh_token: _refresh, ...rest } = profile;
      config.profiles[name] = { ...rest, token: '', storage: 'keyring' };
      writeConfig(config);
      return;
    }

    config.profiles[name] = { ...profile, storage: 'file' };
    writeConfig(config);
    return;
  }

  // Moving the other way (keyring → file) must not leave the old secret behind.
  const previous = config.profiles[name];
  if (previous && getSecretStorage(previous) === 'keyring') {
    deleteSecret(name);
  }

  config.profiles[name] = profile;
  writeConfig(config);
}

/**
 * Overwrite just the token fields, re-reading the config first: a parallel CLI
 * process may have written a different profile in the meantime, and a blind
 * `setProfile` of a stale snapshot would drop its work.
 */
export function updateProfileTokens(
  name: string,
  tokens: { token: string; refresh_token?: string; expires_at?: string; scopes?: string[] },
): Profile | undefined {
  const config = readConfig();
  const profile = config.profiles?.[name];
  if (!profile) return undefined;

  profile.auth = 'oauth';
  profile.token = tokens.token;
  profile.refresh_token = tokens.refresh_token ?? profile.refresh_token;
  profile.expires_at = tokens.expires_at ?? profile.expires_at;
  if (tokens.scopes) profile.scopes = tokens.scopes;

  // The refreshed pair goes wherever the profile already keeps its secrets, so a
  // keyring-backed session does not quietly start writing tokens to disk an hour
  // after login.
  if (getSecretStorage(profile) === 'keyring') {
    const refreshed = { ...profile };
    const stored = writeSecret(name, {
      token: profile.token,
      ...(profile.refresh_token ? { refresh_token: profile.refresh_token } : {}),
    });

    if (stored) {
      profile.token = '';
      delete profile.refresh_token;
      writeConfig(config);
      return refreshed;
    }

    profile.storage = 'file';
  }

  writeConfig(config);
  return profile;
}

export function deleteProfile(name: string): void {
  const config = readConfig();
  const stored = config.profiles?.[name];
  if (stored && getSecretStorage(stored) === 'keyring') {
    deleteSecret(name);
  }
  if (config.profiles) {
    delete config.profiles[name];
  }
  if (config.active_profile === name) {
    // Switch to first remaining profile or clear
    const remaining = Object.keys(config.profiles || {});
    config.active_profile = remaining[0] || undefined;
  }
  writeConfig(config);
}

export function listProfiles(): Record<string, Profile> {
  const config = readConfig();
  return config.profiles || {};
}

export function getDefaults(): ConfigDefaults {
  const config = readConfig();
  return config.defaults || {};
}

export function setDefault(key: string, value: string | number): void {
  const config = readConfig();
  if (!config.defaults) {
    config.defaults = {};
  }
  (config.defaults as Record<string, unknown>)[key] = value;
  writeConfig(config);
}

export function getConfigValue(key: string): unknown {
  const config = readConfig();
  const parts = key.split('.');
  let current: unknown = config;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

const ALLOWED_CONFIG_KEYS = new Set(['defaults.output', 'defaults.timeout']);

export function setConfigValue(key: string, value: string): void {
  if (!ALLOWED_CONFIG_KEYS.has(key)) {
    throw new Error(`Unknown config key: ${key}. Allowed keys: ${[...ALLOWED_CONFIG_KEYS].join(', ')}`);
  }

  const config = readConfig();
  const parts = key.split('.');

  // Try to parse numbers
  let parsed: unknown = value;
  if (/^\d+$/.test(value)) {
    parsed = Number.parseInt(value, 10);
  } else if (/^\d+\.\d+$/.test(value)) {
    parsed = Number.parseFloat(value);
  }

  if (parts.length === 1) {
    (config as Record<string, unknown>)[parts[0]] = parsed;
  } else {
    let current: Record<string, unknown> = config as Record<string, unknown>;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
        current[parts[i]] = {};
      }
      current = current[parts[i]] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = parsed;
  }

  writeConfig(config);
}

/**
 * Resolve the token to use, respecting priority:
 * --token > --profile > PACHCA_TOKEN env > PACHCA_PROFILE env > active profile > error
 *
 * Explicit flags beat ambient environment. An exported PACHCA_TOKEN (common in
 * CI and agent shells) used to win over an explicit `--profile staging`, so the
 * command silently wrote to the wrong workspace with the wrong token.
 */
export function resolveToken(flags: {
  token?: string;
  profile?: string;
}): { token: string; profileName?: string; profile?: Profile } {
  // 1. --token flag (highest priority)
  if (flags.token) {
    return { token: flags.token };
  }

  // 2. PACHCA_TOKEN env — unless a profile was named explicitly
  if (!flags.profile && process.env.PACHCA_TOKEN) {
    return { token: process.env.PACHCA_TOKEN };
  }

  // 3. --profile flag or PACHCA_PROFILE env
  const profileName = flags.profile || process.env.PACHCA_PROFILE || getActiveProfile();
  if (!profileName) {
    throw new TokenNotFoundError();
  }

  const profile = getProfile(profileName);
  if (!profile) {
    throw new ProfileNotFoundError(profileName);
  }
  if (!profile.token) {
    throw new SecretStoreUnavailableError(profileName);
  }

  return { token: profile.token, profileName, profile };
}

/**
 * Refresh just the cached scope list from the server's answer.
 *
 * Deliberately does not touch the secret: the scopes live in the config file for
 * every profile, keyring-backed or not, so there is nothing to write to the store.
 */
export function updateProfileScopes(name: string, scopes: string[]): void {
  const config = readConfig();
  const profile = config.profiles?.[name];
  if (!profile) return;

  profile.scopes = scopes;
  writeConfig(config);
}

export function getConfigFilePath(): string {
  return getConfigPath();
}

export function getConfigDirPath(): string {
  return getConfigDir();
}

export function getConfigFilePermissions(): string | null {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return null;
  if (process.platform === 'win32') return null;
  const stat = fs.statSync(configPath);
  return (stat.mode & 0o777).toString(8);
}

export class TokenNotFoundError extends Error {
  constructor() {
    super('Token not found');
    this.name = 'TokenNotFoundError';
  }
}

export class ProfileNotFoundError extends Error {
  constructor(public profileName: string) {
    super(`Profile "${profileName}" not found`);
    this.name = 'ProfileNotFoundError';
  }
}

/**
 * The profile exists and points at the OS store, but the secret is not there.
 * Usually a locked keyring or a config copied to another machine — both fixed by
 * logging in again, which is what the message says.
 */
export class SecretStoreUnavailableError extends Error {
  constructor(public profileName: string) {
    super(
      `Token for profile "${profileName}" is stored in the OS credential store and cannot be read. ` +
        `Unlock the store, or run: pachca auth login --profile ${profileName}`,
    );
    this.name = 'SecretStoreUnavailableError';
  }
}
