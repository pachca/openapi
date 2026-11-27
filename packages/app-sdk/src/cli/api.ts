// Раздел «Кастомные приложения» API Пачки (`/apps`): то, чем pachca-app создаёт, загружает и настраивает приложение.
import type { Io } from './io.js';

export const DEFAULT_API = 'https://api.pachca.com/api/shared/v1';

/** Куда и с каким токеном ходить; `source` говорит, откуда взят токен (для подсказки при отказе). */
export interface Api {
  url: string;
  token: string;
  source: TokenSource;
}

export type TokenSource = 'flag' | 'env' | 'saved' | 'pachca';

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

type ErrorBody = { errors?: { code?: string; message?: string; payload?: unknown }[]; error?: string; error_description?: string };

/** Запрос к API Пачки; ответ `{ data }` приходит как `data`, пустой как `undefined`. */
export async function call<T>(io: Io, a: Api, method: string, path: string, body?: unknown): Promise<T> {
  let r: Response;
  try {
    r = await io.fetch(`${a.url}${path}`, {
      method,
      headers: { Authorization: `Bearer ${a.token}`, 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    throw new ApiError(`${method} ${path}: Пачка недоступна (${(e as Error).message})`, 0);
  }
  const text = await r.text();
  if (!r.ok) {
    const j = (() => {
      try {
        return JSON.parse(text) as ErrorBody;
      } catch {
        return undefined;
      }
    })();
    const e = j?.errors?.[0];
    const message = e?.message ?? j?.error_description ?? j?.error ?? (text.slice(0, 200) || r.statusText);
    throw new ApiError(`${method} ${path}: ${r.status} ${message}${accessHint(r.status, j, a.source)}`, r.status, e?.code ?? j?.error, e?.payload);
  }
  return text ? (JSON.parse(text) as { data: T }).data : (undefined as T);
}

/** Что делать, если токен не подошёл: зависит от того, откуда он взят. */
function accessHint(status: number, body: ErrorBody | undefined, source: TokenSource): string {
  if (status !== 401 && status !== 403) return '';
  if (status === 403 && body?.errors?.length) return '. Кастомными приложениями управляют владелец и администраторы пространства';
  const where: Record<TokenSource, string> = {
    flag: 'токен из --token',
    env: 'токен из PACHCA_TOKEN',
    saved: 'токен, сохранённый npx pachca-app login',
    pachca: 'токен входа pachca (pachca auth token)',
  };
  const fix =
    source === 'pachca'
      ? 'войдите заново: pachca auth login (вход владельца или администратора получает apps:read и apps:write)'
      : 'нужен токен владельца или администратора со скоупами apps:read и apps:write';
  return status === 401 ? `. Не подошёл ${where[source]}: ${fix}` : `. ${where[source]} без нужного права: ${fix}`;
}
