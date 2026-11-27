// Вход pachca-app. Порядок, первый найденный побеждает:
// 1. --token или PACHCA_TOKEN;
// 2. токен, сохранённый `pachca-app login`;
// 3. вход основного CLI Пачки: `pachca auth token` печатает токен активного профиля (обновив его);
// 4. ничего нет: человеку предлагаем войти, программе (агент, CI) печатаем обе команды.
// Хранилище `pachca` (TOML, связка ключей) pachca-app не читает: это дело самого CLI.
import { chmodSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { call, DEFAULT_API, type Api } from './api.js';
import { CliError, colors, confirm, type Io } from './io.js';

export interface AuthFlags {
  token?: string;
  api?: string;
  /** Профиль основного CLI для `pachca auth token`. */
  profile?: string;
}

type Saved = { token?: string; api?: string };

export const credentialsFile = (io: Io) =>
  join(io.env.XDG_CONFIG_HOME || join(io.env.HOME || homedir(), '.config'), 'pachca-app', 'credentials.json');

function saved(io: Io): Saved {
  try {
    return JSON.parse(readFileSync(credentialsFile(io), 'utf8')) as Saved;
  } catch {
    return {};
  }
}

const apiUrl = (io: Io, flags: AuthFlags, s: Saved = {}) => (flags.api ?? io.env.PACHCA_API ?? s.api ?? DEFAULT_API).replace(/\/$/, '');

/** Токен из основного CLI; `installed: false`, если `pachca` не установлен. */
function fromPachca(io: Io, profile?: string): { token?: string; installed: boolean } {
  const r = io.run('pachca', ['auth', 'token', ...(profile ? ['--profile', profile] : [])], { capture: true });
  if (r.missing) return { installed: false };
  const token = r.status === 0 ? r.stdout.trim() : '';
  return { token: token || undefined, installed: true };
}

const MANUAL_TOKEN =
  'Токен владельца или администратора со скоупами apps:read и apps:write (как выпустить: https://dev.pachca.com/api/authorization)';

/** Токен для сетевых команд в порядке выше. */
export async function resolveApi(io: Io, flags: AuthFlags): Promise<Api> {
  const token = flags.token ?? io.env.PACHCA_TOKEN;
  if (token) return { url: apiUrl(io, flags), token, source: flags.token ? 'flag' : 'env' };

  const s = saved(io);
  if (s.token) return { url: apiUrl(io, flags, s), token: s.token, source: 'saved' };

  const first = fromPachca(io, flags.profile);
  if (first.token) return { url: apiUrl(io, flags), token: first.token, source: 'pachca' };

  if (!io.tty) {
    throw new CliError(
      [
        'Нет входа в Пачку. Войдите одним из способов и повторите команду:',
        `  pachca auth login              вход через браузер в CLI Пачки${first.installed ? '' : ' (npm i -g @pachca/cli)'}`,
        '  npx pachca-app login           сохранить готовый токен',
        '  PACHCA_TOKEN=<токен> npx pachca-app …',
        MANUAL_TOKEN,
      ].join('\n'),
    );
  }

  const c = colors(io);
  if (first.installed) {
    io.err(`\n  Нет входа в Пачку${flags.profile ? ` (профиль ${flags.profile})` : ''}.\n`);
    if (await confirm(io, `  Войти через браузер (pachca auth login)? [Y/n] `, true)) {
      io.run('pachca', ['auth', 'login', ...(flags.profile ? ['--profile', flags.profile] : [])]);
      const again = fromPachca(io, flags.profile);
      if (again.token) return { url: apiUrl(io, flags), token: again.token, source: 'pachca' };
    }
    throw new CliError('Нет входа в Пачку: pachca auth login или npx pachca-app login');
  }

  io.err(`\n  Нет входа в Пачку. CLI Пачки (pachca) не установлен.\n`);
  io.err(`    ${c.bold('1')}  установить его (npm i -g @pachca/cli) и войти через браузер\n`);
  io.err(`    ${c.bold('2')}  вставить готовый токен\n`);
  const choice = (await io.ask('  Выберите 1 или 2: ')).trim();
  if (choice === '1') {
    if (io.run('npm', ['install', '-g', '@pachca/cli']).status !== 0) throw new CliError('Не удалось установить @pachca/cli: npm i -g @pachca/cli');
    io.run('pachca', ['auth', 'login', ...(flags.profile ? ['--profile', flags.profile] : [])]);
    const again = fromPachca(io, flags.profile);
    if (again.token) return { url: apiUrl(io, flags), token: again.token, source: 'pachca' };
    throw new CliError('Вход не завершён: pachca auth login');
  }
  if (choice === '2') return login(io, flags);
  throw new CliError('Вход отменён');
}

/** Готовый токен: проверяет его списком приложений и сохраняет (права файла 0600). */
export async function login(io: Io, flags: AuthFlags): Promise<Api> {
  io.err(`  ${MANUAL_TOKEN}\n`);
  const token = flags.token ?? io.env.PACHCA_TOKEN ?? (await io.ask('  Токен: ', { hidden: true }));
  if (!token) throw new CliError('Пустой токен');
  const url = apiUrl(io, flags);
  const a: Api = { url, token, source: 'saved' };
  await call(io, a, 'GET', '/apps').catch((e: Error) => {
    throw new CliError(`Токен не подошёл: ${e.message}`);
  });
  const file = credentialsFile(io);
  mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
  writeFileSync(file, JSON.stringify({ token, ...(url !== DEFAULT_API ? { api: url } : {}) }), { mode: 0o600 });
  chmodSync(file, 0o600);
  io.err(`  Токен сохранён: ${file}\n`);
  return a;
}

export function logout(io: Io): void {
  rmSync(credentialsFile(io), { force: true });
  io.err('  Сохранённый токен удалён. Вход CLI Пачки (pachca) не тронут: pachca auth logout\n');
}
