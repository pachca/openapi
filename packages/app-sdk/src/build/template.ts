// Заготовка приложения из `template/` пакета. Её копирует `npm create @pachca/app`, в пакете она же проверяется сборкой.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Папка шаблона в установленном пакете. */
export const TEMPLATE_DIR = fileURLToPath(new URL('../../template', import.meta.url));

// npm не публикует файл `.gitignore` из пакета, поэтому в шаблоне он без точки
const RENAME: Record<string, string> = { gitignore: '.gitignore' };

/**
 * Копирует шаблон в `dir`, подставляя название приложения вместо `__NAME__`. Папка может быть новой или уже с
 * `package.json` и зависимостями (так её готовит `npm create @pachca/app`), но файлы шаблона в ней не перезаписываются.
 */
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
