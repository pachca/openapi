import { createRequire } from 'node:module';

/**
 * Secrets in the OS credential store: Keychain on macOS, Secret Service on
 * Linux, Credential Manager on Windows.
 *
 * Why bother when the config file is already `chmod 600`: those permissions stop
 * *other users* of the machine, not code running as you — and code running as
 * you is the normal case now (postinstall scripts, editor extensions, agents).
 * The npm worm of 2025 swept developer machines with TruffleHog looking for
 * exactly this kind of file. The OS store is not a silver bullet either, but it
 * takes the secret out of a plain file that anything can read by walking $HOME.
 *
 * The native module is optional on purpose. Headless Linux, containers and
 * minimal images often have no Secret Service at all, and a CLI that refuses to
 * log in there would be worse than one that stores a file. Every entry point
 * below degrades to `null`/`false` instead of throwing, and the caller falls
 * back to the config file and says so.
 */

const SERVICE = 'pachca-cli';

/** What we keep out of the config file. The rest of the profile is not secret. */
export interface ProfileSecret {
  token: string;
  refresh_token?: string;
}

interface KeyringEntry {
  setPassword(password: string): void;
  getPassword(): string | null;
  deleteCredential(): boolean;
}

interface KeyringModule {
  Entry: new (service: string, username: string) => KeyringEntry;
}

// `undefined` = not attempted yet, `null` = attempted and unavailable.
let keyringModule: KeyringModule | null | undefined;

/**
 * Opt out of the OS store entirely. `--insecure-storage` covers the login, but
 * an environment variable is what agents, containers and CI can actually set —
 * and on a headless box every keyring call is a failed round trip.
 */
function disabledByEnv(): boolean {
  return process.env.PACHCA_SECRET_STORE === 'file';
}

function loadKeyring(): KeyringModule | null {
  if (disabledByEnv()) return null;
  if (keyringModule !== undefined) return keyringModule;

  // The package is CJS and optional; a static import would make the whole CLI
  // fail to load on a platform without a prebuilt binary.
  try {
    const require = createRequire(import.meta.url);
    keyringModule = require('@napi-rs/keyring') as KeyringModule;
  } catch {
    keyringModule = null;
  }
  return keyringModule;
}

/**
 * Install a stand-in for the native module.
 *
 * Tests need this: the module is pulled in with `createRequire`, which module
 * mocking cannot intercept, so without a seam a test run would read and write
 * the developer's real Keychain.
 */
export function setKeyringForTests(stub: KeyringModule | null): void {
  keyringModule = stub;
}

function entryFor(profileName: string): KeyringEntry | null {
  const keyring = loadKeyring();
  if (!keyring) return null;
  try {
    return new keyring.Entry(SERVICE, profileName);
  } catch {
    return null;
  }
}

/**
 * Whether secrets can actually be stored — checked by writing and removing a
 * probe entry, not by loading the module.
 *
 * Loading proves nothing: on Linux the binary loads fine and every call then
 * fails because no Secret Service is running. Finding that out at login time is
 * the point — a profile marked `keyring` that cannot be read back would lock the
 * user out of their own session.
 */
export function isSecretStoreAvailable(): boolean {
  const entry = entryFor('__pachca_probe__');
  if (!entry) return false;

  try {
    entry.setPassword('probe');
    const readBack = entry.getPassword();
    entry.deleteCredential();
    return readBack === 'probe';
  } catch {
    return false;
  }
}

export function readSecret(profileName: string): ProfileSecret | null {
  const entry = entryFor(profileName);
  if (!entry) return null;

  try {
    const raw = entry.getPassword();
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ProfileSecret;
    return typeof parsed?.token === 'string' ? parsed : null;
  } catch {
    // Missing entry, locked keyring, or something else wrote a value we cannot
    // parse. All three mean "no usable secret here".
    return null;
  }
}

export function writeSecret(profileName: string, secret: ProfileSecret): boolean {
  const entry = entryFor(profileName);
  if (!entry) return false;

  try {
    entry.setPassword(JSON.stringify(secret));
    return true;
  } catch {
    return false;
  }
}

export function deleteSecret(profileName: string): void {
  const entry = entryFor(profileName);
  if (!entry) return;

  try {
    entry.deleteCredential();
  } catch {
    // Nothing stored, or the store is gone. Either way there is nothing to undo.
  }
}

