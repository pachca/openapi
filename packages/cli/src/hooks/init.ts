import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { Hook } from '@oclif/core';
import semver from 'semver';
import ansis from 'ansis';
import {
  getActiveProfile,
  getProfile,
  setProfile,
  getDefaults,
  resolveToken,
  TokenNotFoundError,
  ProfileNotFoundError,
} from '../profiles.js';
import { request } from '../client.js';
import { outputError } from '../output.js';
import { defaultOutputFormat, isInteractive } from '../utils.js';

/**
 * Resolve output format from argv before flags are parsed by oclif.
 */
function resolveOutputFromArgv(): string {
  if (process.argv.includes('--json')) return 'json';
  const outputIdx = Math.max(process.argv.indexOf('-o'), process.argv.indexOf('--output'));
  if (outputIdx !== -1) {
    const val = process.argv[outputIdx + 1];
    if (val && ['json', 'yaml', 'csv', 'table'].includes(val)) return val;
  }
  const defaults = getDefaults();
  if (defaults.output) return defaults.output;
  return defaultOutputFormat();
}

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
  'upgrade',
  'help',
]);

const hook: Hook<'init'> = async function (opts) {
  const commandId = opts.id;
  if (!commandId) return;

  // Register update banner on process exit (fires even when command fails)
  if (isInteractive() && !process.env.PACHCA_SKIP_NEW_VERSION_CHECK) {
    const cacheDir = opts.config.cacheDir;
    const versionFile = path.join(cacheDir, 'version');
    const currentVersion = opts.config.version;

    process.on('exit', () => {
      try {
        if (fs.existsSync(versionFile)) {
          const cached = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
          const latest = cached.latest;
          if (latest && semver.valid(latest) && semver.valid(currentVersion) && semver.gt(latest, currentVersion)) {
            const box = [
              '',
              ansis.yellow(`╭${'─'.repeat(37)}╮`),
              ansis.yellow(`│  Доступна новая версия: ${latest.padEnd(12)}│`),
              ansis.yellow(`│  pachca upgrade${' '.repeat(21)}│`),
              ansis.yellow(`╰${'─'.repeat(37)}╯`),
              '',
            ].join('\n');
            process.stderr.write(box);
          }
        }
      } catch {
        // ignore
      }
    });

    // Background refresh if cache is stale (>1h)
    try {
      let shouldRefresh = true;
      if (fs.existsSync(versionFile)) {
        const stat = fs.statSync(versionFile);
        shouldRefresh = Date.now() - stat.mtimeMs > 60 * 60 * 1000;
      }
      if (shouldRefresh) {
        if (!fs.existsSync(cacheDir)) {
          fs.mkdirSync(cacheDir, { recursive: true });
        }
        const scriptPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'get-version.js');
        if (fs.existsSync(scriptPath)) {
          const child = spawn(process.execPath, [scriptPath, versionFile], { detached: true, stdio: 'ignore' });
          child.unref();
        }
      }
    } catch {
      // ignore
    }
  }

  // Skip auth for exempt commands
  if (SKIP_AUTH.has(commandId)) return;

  // Skip auth when --help, --version, or --dry-run flag is passed
  if (process.argv.includes('--help') || process.argv.includes('-h')) return;
  if (process.argv.includes('--version')) return;
  if (process.argv.includes('--dry-run')) return;

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

  // Parse --token and --profile from argv for early auth check
  const tokenIdx = process.argv.indexOf('--token');
  const argvToken = tokenIdx !== -1 ? process.argv[tokenIdx + 1] : undefined;
  const profileIdx = process.argv.indexOf('--profile');
  const argvProfile = profileIdx !== -1 ? process.argv[profileIdx + 1] : undefined;

  // Verify auth exists
  try {
    const { profileName, profile } = resolveToken({ token: argvToken, profile: argvProfile });

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
          const wrapper = response.data as { data: { scopes: string[] } };
          profile.scopes = wrapper.data.scopes || [];
          profile.scopes_refreshed_at = new Date().toISOString();
          setProfile(profileName, profile);
        } catch {
          // Silently ignore refresh errors — use cached scopes
        }
      }
    }
  } catch (error) {
    if (error instanceof TokenNotFoundError) {
      const format = resolveOutputFromArgv();
      if (format === 'json' || !process.stderr.isTTY) {
        outputError(
          { error: 'Token not found', type: 'PACHCA_AUTH_ERROR', code: null, hint: 'pachca auth login --token <your-token>' },
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
      const format = resolveOutputFromArgv();
      outputError(
        { error: `Profile "${error.profileName}" not found`, type: 'PACHCA_USAGE_ERROR', code: null, hint: 'pachca auth list' },
        format as 'json',
      );
      process.exit(2);
    }
  }
};

export default hook;
