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
import { OAuthError, refreshAccessToken } from './oauth.js';

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
export async function ensureFreshToken(profileName: string, profile: Profile): Promise<Profile> {
  if (!isRefreshable(profile) || !isExpiring(profile)) return profile;

  const fd = acquireLock();

  if (fd === null) {
    const waited = await waitForOtherProcess(profileName);
    if (waited) return waited;
    // The holder gave up or is stuck — refresh ourselves rather than fail.
    return refreshAndStore(profileName, profile);
  }

  try {
    // Re-read: the previous holder may have refreshed while we queued for the lock.
    const current = getProfile(profileName) ?? profile;
    if (!isExpiring(current)) return current;
    return await refreshAndStore(profileName, current);
  } finally {
    releaseLock(fd);
  }
}

async function waitForOtherProcess(profileName: string): Promise<Profile | undefined> {
  const deadline = Date.now() + LOCK_WAIT_MS;

  while (Date.now() < deadline) {
    await sleep(LOCK_POLL_MS);

    const current = getProfile(profileName);
    if (current && !isExpiring(current)) return current;

    if (!fs.existsSync(lockPath())) {
      // The holder finished between our read of the profile and this check. Look
      // once more before refreshing ourselves: their new token is already on disk,
      // and ours has just been spent.
      const after = getProfile(profileName);
      return after && !isExpiring(after) ? after : undefined;
    }
  }
  return undefined;
}

async function refreshAndStore(profileName: string, profile: Profile): Promise<Profile> {
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
      if (current?.token && !isExpiring(current)) return current;
    }
    throw error;
  }

  const updated = updateProfileTokens(profileName, {
    token: grant.access_token,
    refresh_token: grant.refresh_token,
    expires_at: grant.expires_in ? expiresAtFromNow(grant.expires_in) : undefined,
    scopes: grant.scope ? grant.scope.split(' ').filter(Boolean) : undefined,
  });

  return updated ?? { ...profile, token: grant.access_token };
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
