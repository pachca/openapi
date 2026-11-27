// Заготовка приложения из `template/` пакета. Её копирует `npm create @pachca/app`, в пакете она же проверяется сборкой.
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Папка шаблона в установленном пакете. */
export const TEMPLATE_DIR = fileURLToPath(new URL('../../template', import.meta.url));

// npm не публикует файл `.gitignore` из пакета, поэтому в шаблоне он без точки
const RENAME: Record<string, string> = { gitignore: '.gitignore' };

/** Копирует шаблон в `dir` (новую или пустую папку), подставляя название приложения вместо `__NAME__`. */
export function scaffold(dir: string, options: { name: string }): void {
  if (existsSync(dir) && readdirSync(dir).length) throw new Error(`папка ${dir} не пустая`);
  const copy = (src: string, dst: string) => {
    mkdirSync(dst, { recursive: true });
    for (const f of readdirSync(src)) {
      if (statSync(join(src, f)).isDirectory()) copy(join(src, f), join(dst, f));
      else writeFileSync(join(dst, RENAME[f] ?? f), readFileSync(join(src, f), 'utf8').replaceAll('__NAME__', options.name));
    }
  };
  copy(TEMPLATE_DIR, dir);
}
