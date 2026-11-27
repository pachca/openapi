import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

export const TEMPLATE_DIR = fileURLToPath(new URL('../../template', import.meta.url));

// npm не публикует файл `.gitignore` из пакета, поэтому в шаблоне он без точки
const RENAME: Record<string, string> = { gitignore: '.gitignore' };

export function scaffold(dir: string, options: { name: string }): void {
  const files: [string, string][] = [];
  const walk = (src: string, dst: string) => {
    for (const f of readdirSync(src)) {
      if (statSync(join(src, f)).isDirectory()) walk(join(src, f), join(dst, f));
      else files.push([join(src, f), join(dst, RENAME[f] ?? f)]);
    }
  };
  walk(TEMPLATE_DIR, dir);
  const taken = files.filter(([, dst]) => existsSync(dst)).map(([, dst]) => relative(dir, dst));
  if (taken.length) throw new Error(`в папке ${dir} уже есть ${taken.join(', ')}`);
  for (const [src, dst] of files) {
    mkdirSync(dirname(dst), { recursive: true });
    writeFileSync(dst, readFileSync(src, 'utf8').replaceAll('__NAME__', options.name));
  }
}
