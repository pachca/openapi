// Раздел «Кастомные приложения» API Пачки (`/apps`) через CLI Пачки: `pachca api <МЕТОД> <путь>`. Вход, профили, токен
// из PACHCA_TOKEN и его обновление остаются у CLI, pachca-app токенов не видит и не хранит.
import { compareVersions } from './update.js';
import { CliError, type Io } from './io.js';

export const DEFAULT_API = 'https://api.pachca.com/api/shared/v1';

/** Первая версия CLI, которая отдаёт `payload` ошибки: без него не разобрать version_conflict и consent_required. */
export const MIN_CLI = '2026.11.8';

const INSTALL = 'npm install -g @pachca/cli';
const LOGIN = 'pachca auth login';

/** Как ходить в API: адрес Пачки (по нему же выбирается файл состояния папки) и профиль CLI. */
export interface Api {
  url: string;
  profile?: string;
}

export type App = { id: string; name: string; icon: string | null; visibility: string; version: number };
export type Item = { kind: string; text: string; scope?: string; new?: boolean; removed?: boolean };
export type Released = { version: number; hash: string; items: Item[]; migrations: string[]; warnings: string[] };
export type LogEntry = { time: string; kind: string; text: string; allowed: boolean; reason?: string };
export type Source = { version: number; files: Record<string, string> };

/** Отказ API: `code` и `payload` из тела ошибки (`version_conflict`, `consent_required`). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly payload?: unknown,
  ) {
    super(message);
  }
}

/** Как поставить CLI Пачки и войти: печатается везде, где без него не обойтись. */
export const SETUP = [
  'Команды pachca-app работают через CLI Пачки и его вход:',
  `  ${INSTALL}`,
  `  ${LOGIN}           владелец или администратор пространства`,
  'Без браузера (агент, CI) CLI берёт токен из PACHCA_TOKEN: токен со скоупами apps:read и apps:write.',
].join('\n');

/** Проверяет, что CLI Пачки установлен и не старее MIN_CLI. Адрес Пачки как у CLI: PACHCA_API_URL. */
export async function resolveApi(io: Io, flags: { profile?: string }): Promise<Api> {
  const r = await io.exec('pachca', ['--version']);
  if (r.missing) throw new CliError(`CLI Пачки не установлен.\n${SETUP}`);
  const version = r.stdout.match(/(\d{4}\.\d{1,2}\.\d+(?:-[\w.]+)?|\d+\.\d+\.\d+)/)?.[1];
  // 0.0.0 это CLI из репозитория, без номера релиза
  if (version && version !== '0.0.0' && compareVersions(version, MIN_CLI) < 0) {
    throw new CliError(`CLI Пачки ${version} устарел, нужен ${MIN_CLI} или новее: pachca upgrade (или ${INSTALL})`);
  }
  return { url: (io.env.PACHCA_API_URL || DEFAULT_API).replace(/\/+$/, ''), profile: flags.profile };
}

type CliErrorBody = { error?: string; code?: number | null; type?: string; message?: string; validation_code?: string; payload?: unknown; hint?: string };

/** Запрос к API Пачки через `pachca api`; ответ `{ data }` приходит как `data`, пустой как `undefined`. */
export async function call<T>(io: Io, a: Api, method: string, path: string, body?: unknown): Promise<T> {
  const [route, search = ''] = path.split('?', 2);
  const query = [...new URLSearchParams(search)].flatMap(([k, v]) => ['--query', `${k}=${v}`]);
  const args = ['api', method, route!, '-o', 'json', '--no-input', ...query, ...(body === undefined ? [] : ['--input', '-']), ...(a.profile ? ['--profile', a.profile] : [])];
  const r = await io.exec('pachca', args, {
    input: body === undefined ? undefined : JSON.stringify(body),
    env: a.url === DEFAULT_API ? undefined : { PACHCA_API_URL: a.url },
  });
  if (r.missing) throw new CliError(`CLI Пачки не установлен.\n${SETUP}`);
  if (r.status !== 0) throw toError(method, route!, r.stderr);
  const out = r.stdout.trim();
  if (!out || out === 'null') return undefined as T;
  const parsed = JSON.parse(out) as { data?: T } | null;
  return (parsed && typeof parsed === 'object' && 'data' in parsed ? parsed.data : parsed) as T;
}

/** Ошибка CLI (последняя строка JSON в stderr) с подсказкой, если дело во входе или правах. */
function toError(method: string, path: string, stderr: string): Error {
  const line = stderr.trim().split('\n').reverse().find((l) => l.startsWith('{'));
  let e: CliErrorBody = {};
  try {
    e = line ? (JSON.parse(line) as CliErrorBody) : {};
  } catch {
    // не JSON: показываем как есть
  }
  const text = e.error ?? (stderr.trim().slice(0, 300) || 'CLI Пачки завершился с ошибкой');
  const status = typeof e.code === 'number' ? e.code : 0;
  const auth = e.type === 'PACHCA_AUTH_ERROR' || e.type === 'PACHCA_SCOPE_ERROR' || status === 401 || status === 403;
  if (auth && !e.validation_code) {
    const fix = e.type === 'PACHCA_SCOPE_ERROR' || status === 403
      ? `у входа CLI Пачки нет прав apps:read и apps:write. Войдите владельцем или администратором: ${LOGIN}`
      : `нет входа в CLI Пачки или он истёк: ${LOGIN}`;
    return new CliError(`${method} ${path}: ${text}. ${fix[0]!.toUpperCase()}${fix.slice(1)}\n${SETUP}`);
  }
  if (status === 403) return new ApiError(`${method} ${path}: ${text}. Кастомными приложениями управляют владелец и администраторы пространства`, status, e.validation_code, e.payload);
  return new ApiError(`${method} ${path}: ${status ? `${status} ` : ''}${text}`, status, e.validation_code, e.payload);
}
