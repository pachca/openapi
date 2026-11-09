import { ApiError, request, type ClientFlags } from './client.js';

/** What `GET /oauth/token/info` says about a token. The method needs no scope. */
export interface TokenInfo {
  user_id: number;
  scopes?: string[];
  created_at?: string;
  expires_in?: number | null;
}

/**
 * Whom a token belongs to: name, email and whether it is a bot.
 *
 * Reading the profile needs `profile:read`. Without it the user id from the
 * token info is all there is: enough to name the account, not to tell a bot
 * from an employee, so `isBot` is then null. A bot token starts with no scopes,
 * so this is the usual case for a notification bot.
 */
export async function fetchIdentity(
  token: string,
  userId: number,
  clientFlags: ClientFlags = { quiet: true },
): Promise<{ name: string; email: string | null; isBot: boolean | null; noScope?: boolean }> {
  try {
    const response = await request({ method: 'GET', path: '/profile', token }, clientFlags);
    const data = (response.data as { data: Record<string, unknown> }).data;
    const name = `${data.first_name || ''} ${data.last_name || ''}`.trim();
    return {
      name: name || `User #${userId}`,
      email: (data.email as string) || null,
      isBot: (data.bot as boolean) || false,
    };
  } catch (error) {
    const noScope = error instanceof ApiError && error.details.type === 'PACHCA_SCOPE_ERROR';
    return { name: `User #${userId}`, email: null, isBot: null, noScope };
  }
}
