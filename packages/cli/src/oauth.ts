import { spawn, spawnSync } from 'node:child_process';
import { getBaseUrl } from './client.js';

/** Uses the global timer on purpose: `node:timers/promises` is not fakeable in tests. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * OAuth device authorization grant (RFC 8628) against Pachca.
 *
 * The CLI is a public client: it ships no secret and identifies itself with a
 * fixed `client_id`. Protection comes from the code never leaving the user's
 * own screen — see `printDeviceInstructions` in `commands/auth/login.ts`.
 */
export const CLI_CLIENT_ID = 'pachca_cli';

const DEVICE_CODE_GRANT = 'urn:ietf:params:oauth:grant-type:device_code';

/** Backend enforces a floor of 5 seconds between polls. */
const MIN_POLL_INTERVAL_SECONDS = 5;

/** RFC 8628: on `slow_down` the client raises its interval by 5 seconds. */
const SLOW_DOWN_STEP_SECONDS = 5;

export interface DeviceCodeGrant {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface TokenGrant {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
}

export class OAuthError extends Error {
  constructor(
    public code: string,
    public description?: string,
    public status?: number,
  ) {
    super(description || code);
    this.name = 'OAuthError';
  }
}

function oauthUrl(endpoint: string): string {
  return `${getBaseUrl()}/oauth/${endpoint}`;
}

async function postForm(endpoint: string, params: Record<string, string>): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(oauthUrl(endpoint), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams(params).toString(),
    });
  } catch (error) {
    throw new OAuthError('network_error', (error as Error).message);
  }

  // Reading the body is a second trip over the network and fails on its own when
  // the connection drops mid-response. Outside this guard it surfaced as a raw
  // TypeError and killed a login that only needed another poll.
  let text: string;
  try {
    text = await response.text();
  } catch (error) {
    throw new OAuthError('network_error', (error as Error).message);
  }

  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const record = (body ?? {}) as Record<string, unknown>;
    const code = typeof record.error === 'string' ? record.error : `http_${response.status}`;
    const description =
      typeof record.error_description === 'string' ? record.error_description : undefined;
    throw new OAuthError(code, description, response.status);
  }

  return body;
}

/** Step 1 — ask the server for a device code and the code the user types in. */
export async function requestDeviceCode(): Promise<DeviceCodeGrant> {
  const body = (await postForm('device_authorization', { client_id: CLI_CLIENT_ID })) as
    | Partial<DeviceCodeGrant>
    | null;

  if (!body?.device_code || !body.user_code || !body.verification_uri) {
    throw new OAuthError('invalid_response', 'Сервер вернул неполный ответ на запрос кода');
  }

  return {
    device_code: body.device_code,
    user_code: body.user_code,
    verification_uri: body.verification_uri,
    expires_in: body.expires_in ?? 600,
    interval: Math.max(body.interval ?? MIN_POLL_INTERVAL_SECONDS, MIN_POLL_INTERVAL_SECONDS),
  };
}

async function exchangeDeviceCode(deviceCode: string): Promise<TokenGrant> {
  const body = (await postForm('token', {
    grant_type: DEVICE_CODE_GRANT,
    client_id: CLI_CLIENT_ID,
    device_code: deviceCode,
  })) as Partial<TokenGrant> | null;

  if (!body?.access_token) {
    throw new OAuthError('invalid_response', 'Сервер вернул ответ без токена');
  }
  return body as TokenGrant;
}

/**
 * Step 2 — poll until the user confirms in the browser.
 *
 * `slow_down` and a throttled `429` both mean the same thing to us: back off and
 * keep waiting. Everything else (`expired_token`, `access_denied`) ends the wait.
 */
export async function pollForToken(grant: DeviceCodeGrant): Promise<TokenGrant> {
  let interval = grant.interval;
  const deadline = Date.now() + grant.expires_in * 1000;

  while (Date.now() < deadline) {
    await delay(interval * 1000);

    try {
      return await exchangeDeviceCode(grant.device_code);
    } catch (error) {
      if (!(error instanceof OAuthError)) throw error;

      if (error.code === 'authorization_pending') continue;
      if (error.code === 'slow_down' || error.status === 429) {
        interval += SLOW_DOWN_STEP_SECONDS;
        continue;
      }
      // A blip on one poll is not a failed login: the person is still in the
      // browser and there are minutes of deadline left. Give up only when the
      // code actually expires.
      if (error.code === 'network_error') continue;
      throw error;
    }
  }

  throw new OAuthError('expired_token', 'Код подтверждения истёк');
}

/**
 * Put out an access token server-side (RFC 7009).
 *
 * The endpoint only accepts self-revocation: the same token must arrive both in
 * the body and as the bearer, and it must belong to the CLI's public client.
 * Returns false when the server declined, so the caller can say plainly that the
 * token is gone from this machine but still alive.
 */
export async function revokeToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(oauthUrl('revoke'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: new URLSearchParams({ token }).toString(),
    });
    return response.ok;
  } catch {
    // Offline logout is a normal thing to do. The profile still goes away.
    return false;
  }
}

/** Exchange a stored refresh token for a fresh access token. */
export async function refreshAccessToken(refreshToken: string): Promise<TokenGrant> {
  const body = (await postForm('token', {
    grant_type: 'refresh_token',
    client_id: CLI_CLIENT_ID,
    refresh_token: refreshToken,
  })) as Partial<TokenGrant> | null;

  if (!body?.access_token) {
    throw new OAuthError('invalid_response', 'Сервер вернул ответ без токена');
  }
  return body as TokenGrant;
}

/**
 * Copy the confirmation code to the clipboard. Best effort: no clipboard tool is
 * a normal state on a server, and the code is printed anyway.
 */
export function copyToClipboard(text: string): boolean {
  const candidates: [string, string[]][] =
    process.platform === 'darwin'
      ? [['pbcopy', []]]
      : process.platform === 'win32'
        ? [['clip', []]]
        : [
            ['wl-copy', []],
            ['xclip', ['-selection', 'clipboard']],
            ['xsel', ['--clipboard', '--input']],
          ];

  for (const [command, args] of candidates) {
    try {
      const result = spawnSync(command, args, { input: text, stdio: ['pipe', 'ignore', 'ignore'] });
      if (!result.error && result.status === 0) return true;
    } catch {
      // try the next tool
    }
  }
  return false;
}

/**
 * Open the confirmation page. Best effort — the URL is printed either way, and a
 * headless machine has nothing to open it with.
 */
export function openBrowser(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;

  const [command, args] =
    process.platform === 'darwin'
      ? ['open', [url]]
      : process.platform === 'win32'
        ? ['cmd', ['/c', 'start', '', url]]
        : ['xdg-open', [url]];

  try {
    const child = spawn(command, args as string[], { detached: true, stdio: 'ignore' });
    child.on('error', () => {
      // no browser on this machine — the printed URL is the fallback
    });
    child.unref();
    return true;
  } catch {
    return false;
  }
}
