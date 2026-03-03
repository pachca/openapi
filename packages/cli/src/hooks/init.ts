import { Hook } from '@oclif/core';
import {
  getActiveProfile,
  getProfile,
  setProfile,
  resolveToken,
  TokenNotFoundError,
  ProfileNotFoundError,
} from '../profiles.js';
import { request } from '../client.js';
import { outputError } from '../output.js';
import { defaultOutputFormat } from '../utils.js';

// Commands that don't require auth
const SKIP_AUTH = new Set([
  'auth:login',
  'auth:logout',
  'auth:list',
  'auth:switch',
  'auth:status',
  'auth:refresh',
  'config:set',
  'config:get',
  'config:list',
  'version',
  'doctor',
  'autocomplete',
  'commands',
  'guide',
  'introspect',
  'changelog',
  'help',
]);

const hook: Hook<'init'> = async function (opts) {
  const commandId = opts.id;
  if (!commandId) return;

  // Skip auth for exempt commands
  if (SKIP_AUTH.has(commandId)) return;

  // Skip auth when --help flag is passed (oclif may route help through init)
  if (process.argv.includes('--help') || process.argv.includes('-h')) return;

  // Check if the command itself says requiresAuth: false
  try {
    const cmd = opts.config.findCommand(commandId);
    if (cmd) {
      // Check custom metadata
      const pluginConfig = cmd as unknown as { requiresAuth?: boolean };
      if (pluginConfig.requiresAuth === false) return;
    }
  } catch {
    // Command not found — let oclif handle it
    return;
  }

  // Verify auth exists
  try {
    const { profileName, profile } = resolveToken({ token: undefined, profile: undefined });

    // Refresh bot scopes if stale (>24h)
    if (profileName && profile?.type === 'bot' && profile.scopes_refreshed_at) {
      const refreshedAt = new Date(profile.scopes_refreshed_at).getTime();
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (now - refreshedAt > twentyFourHours) {
        try {
          const response = await request(
            { method: 'GET', path: '/oauth/token/info', token: profile.token },
            { quiet: true },
          );
          const tokenInfo = response.data as { scopes: string[] };
          profile.scopes = tokenInfo.scopes || [];
          profile.scopes_refreshed_at = new Date().toISOString();
          setProfile(profileName, profile);
        } catch {
          // Silently ignore refresh errors — use cached scopes
        }
      }
    }
  } catch (error) {
    if (error instanceof TokenNotFoundError) {
      const format = defaultOutputFormat();
      if (format === 'json' || !process.stderr.isTTY) {
        outputError(
          { error: 'Token not found', type: 'PACHCA_AUTH_ERROR', code: null },
          format as 'json',
        );
      } else {
        process.stderr.write(`✗ Токен не найден. Войдите в аккаунт:\n\n`);
        process.stderr.write(`  Интерактивно (человек):\n`);
        process.stderr.write(`    pachca auth login\n\n`);
        process.stderr.write(`  Неинтерактивно (агент, CI):\n`);
        process.stderr.write(`    pachca auth login --token <ваш токен>\n\n`);
        process.stderr.write(`  Получить токен: https://dev.pachca.com/guides/authorization\n`);
      }
      process.exit(3);
    }
    if (error instanceof ProfileNotFoundError) {
      const format = defaultOutputFormat();
      outputError(
        { error: `Profile "${error.profileName}" not found`, type: 'PACHCA_USAGE_ERROR', code: null },
        format as 'json',
      );
      process.exit(2);
    }
  }
};

export default hook;
