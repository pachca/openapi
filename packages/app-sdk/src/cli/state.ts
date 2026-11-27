import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_API } from './api.js';
import { CliError } from './io.js';

export type AppState = Record<string, { id: string; version: number }>;

export const stateFile = (dir: string, apiUrl: string) =>
  join(dir, apiUrl === DEFAULT_API ? '.pachca-app.json' : `.pachca-app.${new URL(apiUrl).host.replace(/[^a-z0-9]+/gi, '-')}.json`);

export function readState(dir: string, apiUrl: string): AppState {
  const f = stateFile(dir, apiUrl);
  return existsSync(f) ? (JSON.parse(readFileSync(f, 'utf8')) as AppState) : {};
}

export function saveState(dir: string, apiUrl: string, mode: string, id: string, version: number): void {
  const state = readState(dir, apiUrl);
  for (const [m, v] of Object.entries(state)) if (m !== mode && v.id === id) delete state[m];
  state[mode] = { id, version };
  writeFileSync(stateFile(dir, apiUrl), `${JSON.stringify(state, null, 2)}\n`);
}

export function forget(dir: string, apiUrl: string, id: string): void {
  const state = readState(dir, apiUrl);
  const left = Object.fromEntries(Object.entries(state).filter(([, v]) => v.id !== id));
  if (Object.keys(left).length !== Object.keys(state).length) writeFileSync(stateFile(dir, apiUrl), `${JSON.stringify(left, null, 2)}\n`);
}

export function target(dir: string, apiUrl: string, opts: { app?: string; mode: string }): { id?: string; version: number } {
  const state = readState(dir, apiUrl);
  if (opts.app) return { id: opts.app, version: Object.values(state).find((s) => s.id === opts.app)?.version ?? 0 };
  return state[opts.mode] ?? { version: 0 };
}

export function appOf(dir: string, apiUrl: string, opts: { app?: string; mode: string }): string {
  const id = target(dir, apiUrl, opts).id;
  if (!id) {
    const mode = opts.mode === 'production' ? '' : ` --mode ${opts.mode}`;
    throw new CliError(`Эта папка ещё не загружалась${mode ? ` в режиме ${opts.mode}` : ''}: сначала npx pachca-app ship${mode}, или укажите --app <id>`);
  }
  return id;
}
