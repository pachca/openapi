import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import * as TOML from 'smol-toml';

export interface Profile {
  type: 'user' | 'bot';
  token: string;
  user: string;
  email?: string | null;
  scopes: string[];
  scopes_refreshed_at?: string;
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

export function getProfile(name: string): Profile | undefined {
  const config = readConfig();
  return config.profiles?.[name];
}

export function setProfile(name: string, profile: Profile): void {
  const config = readConfig();
  if (!config.profiles) {
    config.profiles = {};
  }
  config.profiles[name] = profile;
  writeConfig(config);
}

export function deleteProfile(name: string): void {
  const config = readConfig();
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

export function setConfigValue(key: string, value: string): void {
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
 * --token > PACHCA_TOKEN env > --profile/PACHCA_PROFILE > active profile > error
 */
export function resolveToken(flags: {
  token?: string;
  profile?: string;
}): { token: string; profileName?: string; profile?: Profile } {
  // 1. --token flag (highest priority)
  if (flags.token) {
    return { token: flags.token };
  }

  // 2. PACHCA_TOKEN env
  if (process.env.PACHCA_TOKEN) {
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

  return { token: profile.token, profileName, profile };
}

export function getConfigFilePath(): string {
  return getConfigPath();
}

export function getConfigFilePermissions(): string | null {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) return null;
  if (process.platform === 'win32') return null;
  const stat = fs.statSync(configPath);
  return (stat.mode & 0o777).toString(8);
}

export function invalidateScopes(profileName: string): void {
  const config = readConfig();
  if (config.profiles?.[profileName]) {
    config.profiles[profileName].scopes = [];
    config.profiles[profileName].scopes_refreshed_at = undefined;
    writeConfig(config);
  }
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
