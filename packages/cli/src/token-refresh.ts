import * as fs from 'node:fs';
import * as path from 'node:path';

import {
  getConfigDirPath,
  getProfile,
  isExpiring,
  isRefreshable,
  updateProfileTokens,
  expiresAtFromNow,
  type Profile,
} from './profiles.js';
import { OAuthError, refreshAccessToken, revokeToken } from './oauth.js';

const LOCK_FILENAME = 'refresh.lock';

/** A lock older than this belonged to a process that died mid-refresh. */
const LOCK_STALE_MS = 30_000;

/** How long a waiting process gives the lock holder before refreshing itself. */
const LOCK_WAIT_MS = 20_000;

const LOCK_POLL_MS = 150;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function lockPath(): string {
  return path.join(getConfigDirPath(), LOCK_FILENAME);
}

function acquireLock(): number | null {
  const file = lockPath();
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    return fs.openSync(file, 'wx');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;

    // Someone holds it — unless they died and left the file behind.
    try {
      const age = Date.now() - fs.statSync(file).mtimeMs;
      if (age > LOCK_STALE_MS) {
        fs.unlinkSync(file);
        return fs.openSync(file, 'wx');
      }
    } catch {
      // lost the race to another process; fall through to waiting
    }
    return null;
  }
}

function releaseLock(fd: number): void {
  try {
    fs.closeSync(fd);
  } catch {
    // already closed
  }
  try {
    fs.unlinkSync(lockPath());
  } catch {
    // already removed
  }
}

/**
 * Refresh the profile's access token when it is about to expire.
 *
 * OAuth tokens live an hour, so a long agent session would otherwise lose access
 * mid-run. Agents also run several CLI processes at once: without the lock they
 * would all refresh with the same refresh token and invalidate each other, and
 * the user would be logged out. One process refreshes, the rest wait and pick up
 * the result from the config file.
 *
 * Returns the profile to use. Throws `OAuthError` only when the session is truly
 * dead and the user has to log in again.
 */
export async function ensureFreshToken(
  profileName: string,
  profile: Profile,
  needsRefresh: (profile: Profile) => boolean = isExpiring,
): Promise<Profile> {
  if (!isRefreshable(profile) || !needsRefresh(profile)) return profile;

  const fd = acquireLock();

  if (fd === null) {
    const waited = await waitForOtherProcess(profileName, needsRefresh);
    if (waited) return waited;
    // The holder gave up or is stuck — refresh ourselves rather than fail.
    return refreshAndStore(profileName, profile, needsRefresh);
  }

  try {
    // Re-read: the previous holder may have refreshed while we queued for the lock.
    const current = getProfile(profileName) ?? profile;
    if (!needsRefresh(current)) return current;
    return await refreshAndStore(profileName, current, needsRefresh);
  } finally {
    releaseLock(fd);
  }
}

async function waitForOtherProcess(
  profileName: string,
  needsRefresh: (profile: Profile) => boolean,
): Promise<Profile | undefined> {
  const deadline = Date.now() + LOCK_WAIT_MS;

  while (Date.now() < deadline) {
    await sleep(LOCK_POLL_MS);

    const current = getProfile(profileName);
    if (current && !needsRefresh(current)) return current;

    if (!fs.existsSync(lockPath())) {
      // The holder finished between our read of the profile and this check. Look
      // once more before refreshing ourselves: their new token is already on disk,
      // and ours has just been spent.
      const after = getProfile(profileName);
      return after && !needsRefresh(after) ? after : undefined;
    }
  }
  return undefined;
}

async function refreshAndStore(
  profileName: string,
  profile: Profile,
  needsRefresh: (profile: Profile) => boolean,
): Promise<Profile> {
  let grant;
  try {
    grant = await refreshAccessToken(profile.refresh_token!);
  } catch (error) {
    // A refresh token is single-use — the server revokes it the moment someone
    // redeems it. So `invalid_grant` usually means a parallel process got there
    // first, not that the session died: the config already holds a working token.
    // Without this check a lost race logs the user out for no reason.
    if (error instanceof OAuthError && error.code === 'invalid_grant') {
      const current = getProfile(profileName);
      if (current?.token && !needsRefresh(current)) return current;
    }
    throw error;
  }

  const tokens = {
    token: grant.access_token,
    refresh_token: grant.refresh_token,
    expires_at: grant.expires_in ? expiresAtFromNow(grant.expires_in) : undefined,
    scopes: grant.scope ? grant.scope.split(' ').filter(Boolean) : undefined,
  };
  const updated = updateProfileTokens(profileName, tokens);

  // The profile can vanish from the config mid-refresh. The new token is still
  // the one in force: hand it back with its expiry so a caller can revoke it.
  return (
    updated ?? {
      ...profile,
      token: tokens.token,
      refresh_token: tokens.refresh_token ?? profile.refresh_token,
      expires_at: tokens.expires_at ?? profile.expires_at,
    }
  );
}

/** True when the failure means the session is gone for good, not a hiccup. */
export function isSessionExpired(error: unknown): boolean {
  return (
    error instanceof OAuthError &&
    ['invalid_grant', 'invalid_request', 'invalid_client', 'unauthorized_client'].includes(
      error.code,
    )
  );
}

/**
 * What `auth logout` left behind on the server.
 *
 * - `revoked` — the server took the revoke of a token that is live by its expiry.
 *   The refresh token lives in the same record, so the whole login is closed.
 *   The server answers the same to a record revoked before, so this says the
 *   login is closed now, not that this call was the one to close it.
 * - `closed` — the server no longer takes the refresh token: the login had been
 *   closed before (in the «Токены CLI» list, by an admin, by another logout).
 * - `open` — nothing confirms the login is closed: offline, refused, or there
 *   was no token to revoke with. It stays in the «Токены CLI» list.
 */
export type SessionRevocation = 'revoked' | 'closed' | 'open';

/**
 * True only when the access token will outlive the request about to use it.
 * Unknown expiry counts as not live: revoking is only proof when the token is.
 */
function hasLiveToken(profile: Profile): boolean {
  if (!profile.token || !profile.expires_at) return false;
  if (Number.isNaN(Date.parse(profile.expires_at))) return false;
  return !isExpiring(profile);
}

/**
 * Close the profile's OAuth login on the server.
 *
 * The revoke endpoint answers `200` even when it skipped the token: an expired
 * access token is not revocable, so the record stays as it was, refresh token
 * included, and that refresh token can still mint new access tokens. Revoking
 * by the refresh token itself is not open to the CLI: self-revocation takes only
 * the access token that also came as the bearer. So the token sent is always a
 * live one — refreshed first when the saved one has run out. The refresh retires
 * the old record on the server, and the revoke then closes the new one.
 */
export async function revokeSession(profileName: string, profile: Profile): Promise<SessionRevocation> {
  let current: Profile;
  try {
    current = await ensureFreshToken(profileName, profile, (p) => !hasLiveToken(p));
  } catch (error) {
    // `invalid_grant` on refresh: the token is revoked or gone on the server.
    if (error instanceof OAuthError && error.code === 'invalid_grant') return 'closed';
    return 'open';
  }

  // No refresh token and the access token has run out, or it never came back
  // from the OS store: there is nothing to revoke with that would prove anything.
  if (!hasLiveToken(current)) return 'open';

  return (await revokeToken(current.token)) ? 'revoked' : 'open';
}
