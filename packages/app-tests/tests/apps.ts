import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('..', import.meta.url));
export const app = (name: string) => join(root, 'apps', name);
export const tmp = (name: string) => join(root, '.tmp', name);

export function copy(from: string, name: string): string {
  const dir = tmp(name);
  rmSync(dir, { recursive: true, force: true });
  cpSync(app(from), dir, { recursive: true, filter: (src) => !/[/\\](_generated|dist)$/.test(src) });
  return dir;
}

export function patch(dir: string, file: string, from: string, to: string): void {
  const path = join(dir, file);
  const src = readFileSync(path, 'utf8');
  if (!src.includes(from)) throw new Error(`${file}: нет «${from}»`);
  writeFileSync(path, src.replace(from, to));
}

export const json = (dir: string, file: string) => JSON.parse(readFileSync(join(dir, 'dist', file), 'utf8'));
