import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

import {
  CLI_CLIENT_ID,
  OAuthError,
  pollForToken,
  refreshAccessToken,
  requestDeviceCode,
  revokeToken,
} from '../src/oauth.js';

const originalFetch = globalThis.fetch;

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('oauth device flow', () => {
  it('requests a device code with the CLI client id', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        device_code: 'dev-code',
        user_code: 'BCDF-GHJK',
        verification_uri: 'https://app.pachca.com/apps/authorize',
        expires_in: 600,
        interval: 5,
      }),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const grant = await requestDeviceCode();

    expect(grant.user_code).toBe('BCDF-GHJK');
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/oauth/device_authorization');
    expect(init.body).toBe(`client_id=${CLI_CLIENT_ID}`);
  });

  it('raises the floor on a too-small interval from the server', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse(200, {
        device_code: 'dev-code',
        user_code: 'BCDF-GHJK',
        verification_uri: 'https://app.pachca.com/apps/authorize',
        interval: 1,
      }),
    ) as unknown as typeof fetch;

    const grant = await requestDeviceCode();
    expect(grant.interval).toBe(5);
  });

  it('reports an OAuth error body as OAuthError', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(400, { error: 'invalid_scope', error_description: 'Bad scope' }),
      ) as unknown as typeof fetch;

    await expect(requestDeviceCode()).rejects.toMatchObject({
      name: 'OAuthError',
      code: 'invalid_scope',
      description: 'Bad scope',
      status: 400,
    });
  });

  it('keeps polling while the user has not confirmed yet', async () => {
    vi.useFakeTimers();
    try {
      const responses = [
        jsonResponse(400, { error: 'authorization_pending' }),
        jsonResponse(400, { error: 'authorization_pending' }),
        jsonResponse(200, { access_token: 'tok', refresh_token: 'ref', expires_in: 3600 }),
      ];
      globalThis.fetch = vi
        .fn()
        .mockImplementation(() => Promise.resolve(responses.shift())) as unknown as typeof fetch;

      const pending = pollForToken({
        device_code: 'dev-code',
        user_code: 'BCDF-GHJK',
        verification_uri: 'https://app.pachca.com/apps/authorize',
        expires_in: 600,
        interval: 5,
      });

      await vi.advanceTimersByTimeAsync(20_000);
      await expect(pending).resolves.toMatchObject({ access_token: 'tok', refresh_token: 'ref' });
    } finally {
      vi.useRealTimers();
    }
  });

  it('backs off on slow_down and on a throttled 429', async () => {
    vi.useFakeTimers();
    try {
      const responses = [
        jsonResponse(400, { error: 'slow_down' }),
        jsonResponse(429, {}),
        jsonResponse(200, { access_token: 'tok' }),
      ];
      const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(responses.shift()));
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      const pending = pollForToken({
        device_code: 'dev-code',
        user_code: 'BCDF-GHJK',
        verification_uri: 'https://app.pachca.com/apps/authorize',
        expires_in: 600,
        interval: 5,
      });

      // 5s → first poll, +10s → second, +15s → third
      await vi.advanceTimersByTimeAsync(30_000);
      await expect(pending).resolves.toMatchObject({ access_token: 'tok' });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });

  it('survives a dropped connection on one poll and keeps waiting', async () => {
    vi.useFakeTimers();
    try {
      // A body that fails mid-read: outside the error guard this arrived as a raw
      // TypeError and ended a login that only needed another poll.
      const brokenBody = {
        ok: false,
        status: 400,
        text: () => Promise.reject(new TypeError('terminated')),
      } as unknown as Response;

      const responses = [brokenBody, jsonResponse(200, { access_token: 'tok' })];
      const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(responses.shift()));
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      const pending = pollForToken({
        device_code: 'dev-code',
        user_code: 'BCDF-GHJK',
        verification_uri: 'https://app.pachca.com/apps/authorize',
        expires_in: 600,
        interval: 5,
      });

      await vi.advanceTimersByTimeAsync(20_000);
      await expect(pending).resolves.toMatchObject({ access_token: 'tok' });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops when the user denies the request', async () => {
    vi.useFakeTimers();
    try {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(jsonResponse(400, { error: 'access_denied' })) as unknown as typeof fetch;

      const pending = pollForToken({
        device_code: 'dev-code',
        user_code: 'BCDF-GHJK',
        verification_uri: 'https://app.pachca.com/apps/authorize',
        expires_in: 600,
        interval: 5,
      });
      const assertion = expect(pending).rejects.toMatchObject({ code: 'access_denied' });

      await vi.advanceTimersByTimeAsync(10_000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it('gives up once the device code has expired', async () => {
    vi.useFakeTimers();
    try {
      globalThis.fetch = vi
        .fn()
        .mockResolvedValue(
          jsonResponse(400, { error: 'authorization_pending' }),
        ) as unknown as typeof fetch;

      const pending = pollForToken({
        device_code: 'dev-code',
        user_code: 'BCDF-GHJK',
        verification_uri: 'https://app.pachca.com/apps/authorize',
        expires_in: 10,
        interval: 5,
      });
      const assertion = expect(pending).rejects.toMatchObject({ code: 'expired_token' });

      await vi.advanceTimersByTimeAsync(30_000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it('exchanges a refresh token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { access_token: 'new', expires_in: 3600 }));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const grant = await refreshAccessToken('old-refresh');

    expect(grant.access_token).toBe('new');
    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toContain('grant_type=refresh_token');
    expect(init.body).toContain('refresh_token=old-refresh');
  });

  it('turns a transport failure into an OAuthError', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED')) as unknown as typeof fetch;

    await expect(refreshAccessToken('old')).rejects.toBeInstanceOf(OAuthError);
  });
});

describe('revokeToken', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends the token both as the bearer and in the body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, {}));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(revokeToken('tok-123')).resolves.toBe(true);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('/oauth/revoke');
    // Self-revocation is the only form the endpoint accepts: same token in both places.
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok-123');
    expect(init.body).toBe('token=tok-123');
  });

  it('reports a refusal instead of pretending the token is gone', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(jsonResponse(403, {})) as unknown as typeof fetch;

    await expect(revokeToken('tok-123')).resolves.toBe(false);
  });

  it('survives being offline — logging out without a network is normal', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('fetch failed')) as unknown as typeof fetch;

    await expect(revokeToken('tok-123')).resolves.toBe(false);
  });
});

describe('token refresh', () => {
  let tmpDir: string;
  const originalEnv = { ...process.env };

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pachca-refresh-test-'));
    process.env.XDG_CONFIG_HOME = tmpDir;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeProfile(overrides: Record<string, unknown> = {}) {
    const configDir = path.join(tmpDir, 'pachca');
    fs.mkdirSync(configDir, { recursive: true });
    const profile = {
      type: 'user',
      token: 'old-token',
      user: 'Test',
      auth: 'oauth',
      refresh_token: 'refresh-1',
      expires_at: new Date(Date.now() - 1000).toISOString(),
      ...overrides,
    };
    const lines = Object.entries(profile).map(([k, v]) => `${k} = ${JSON.stringify(v)}`);
    fs.writeFileSync(
      path.join(configDir, 'config.toml'),
      `active_profile = "default"\n\n[profiles.default]\n${lines.join('\n')}\n`,
    );
    return profile;
  }

  it('refreshes an expired token and stores the new one', async () => {
    const profile = writeProfile();
    globalThis.fetch = vi.fn().mockResolvedValue(
      jsonResponse(200, { access_token: 'fresh', refresh_token: 'refresh-2', expires_in: 3600 }),
    ) as unknown as typeof fetch;

    const { ensureFreshToken } = await import('../src/token-refresh.js');
    const { getProfile } = await import('../src/profiles.js');

    const updated = await ensureFreshToken('default', profile as never);

    expect(updated.token).toBe('fresh');
    expect(getProfile('default')?.refresh_token).toBe('refresh-2');
  });

  it('leaves a token alone while it is still valid', async () => {
    const profile = writeProfile({ expires_at: new Date(Date.now() + 3_600_000).toISOString() });
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { ensureFreshToken } = await import('../src/token-refresh.js');
    const updated = await ensureFreshToken('default', profile as never);

    expect(updated.token).toBe('old-token');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('leaves a pasted token alone — it has nothing to refresh with', async () => {
    const profile = writeProfile({ auth: 'token', refresh_token: undefined, expires_at: undefined });
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { ensureFreshToken } = await import('../src/token-refresh.js');
    await ensureFreshToken('default', profile as never);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('picks up the result of a parallel process instead of refreshing again', async () => {
    const profile = writeProfile();
    const lockFile = path.join(tmpDir, 'pachca', 'refresh.lock');
    fs.writeFileSync(lockFile, '');

    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const { ensureFreshToken } = await import('../src/token-refresh.js');
    const { updateProfileTokens } = await import('../src/profiles.js');

    const pending = ensureFreshToken('default', profile as never);

    // The other process finishes and drops the lock.
    setTimeout(() => {
      updateProfileTokens('default', {
        token: 'from-other-process',
        expires_at: new Date(Date.now() + 3_600_000).toISOString(),
      });
      fs.unlinkSync(lockFile);
    }, 300);

    const updated = await pending;

    expect(updated.token).toBe('from-other-process');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not log the user out when a parallel process spent the refresh token first', async () => {
    const profile = writeProfile();

    // We lose the race: our refresh token was already redeemed, so the server
    // rejects it — but the winner's token is on disk and perfectly good.
    globalThis.fetch = vi.fn().mockImplementation(async () => {
      const { updateProfileTokens } = await import('../src/profiles.js');
      updateProfileTokens('default', {
        token: 'from-winner',
        expires_at: new Date(Date.now() + 3_600_000).toISOString(),
      });
      return jsonResponse(400, { error: 'invalid_grant' });
    }) as unknown as typeof fetch;

    const { ensureFreshToken } = await import('../src/token-refresh.js');

    const updated = await ensureFreshToken('default', profile as never);

    expect(updated.token).toBe('from-winner');
  });

  it('still reports a dead session when no one else refreshed', async () => {
    const profile = writeProfile();
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse(400, { error: 'invalid_grant' })) as unknown as typeof fetch;

    const { ensureFreshToken, isSessionExpired } = await import('../src/token-refresh.js');

    await expect(ensureFreshToken('default', profile as never)).rejects.toSatisfy((error: unknown) =>
      isSessionExpired(error),
    );
  });

  it('takes over a lock left behind by a dead process', async () => {
    const profile = writeProfile();
    const lockFile = path.join(tmpDir, 'pachca', 'refresh.lock');
    fs.writeFileSync(lockFile, '');
    const stale = new Date(Date.now() - 60_000);
    fs.utimesSync(lockFile, stale, stale);

    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(
        jsonResponse(200, { access_token: 'fresh', expires_in: 3600 }),
      ) as unknown as typeof fetch;

    const { ensureFreshToken } = await import('../src/token-refresh.js');
    const updated = await ensureFreshToken('default', profile as never);

    expect(updated.token).toBe('fresh');
    expect(fs.existsSync(lockFile)).toBe(false);
  });

  it('flags a dead session so the caller can ask for a new login', async () => {
    const profile = writeProfile();
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(jsonResponse(400, { error: 'invalid_grant' })) as unknown as typeof fetch;

    const { ensureFreshToken, isSessionExpired } = await import('../src/token-refresh.js');

    await expect(ensureFreshToken('default', profile as never)).rejects.toSatisfy((error) =>
      isSessionExpired(error),
    );
  });
});
