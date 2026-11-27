// Импорты, которых нет в рантайме приложений. Код функций выполняет workerd без модулей Node (`node:*`, `fs`, `path`…):
// такая сборка упала бы только на платформе, поэтому check и build отказывают сразу и говорят, какой файл виноват.
import { builtinModules } from 'node:module';
import { relative } from 'node:path';
import type { Plugin } from 'esbuild';

const NODE = new Set(builtinModules);
const SKIP = Symbol('workerd-imports');

/** Плагин esbuild: собирает недоступные импорты в `problems` и помечает их внешними, чтобы сборка дошла до конца. */
export function workerdImports(dir: string, problems: string[]): Plugin {
  return {
    name: 'workerd-imports',
    setup(b) {
      b.onResolve({ filter: /^(node:|cloudflare:)|^[a-z_]+(\/[a-z_]+)?$/ }, async (args) => {
        if ((args.pluginData as { skip?: symbol } | undefined)?.skip === SKIP) return undefined;
        const from = args.importer ? relative(dir, args.importer) : '?';
        if (args.path.startsWith('node:') || args.path.startsWith('cloudflare:')) {
          problems.push(importProblem(from, args.path));
          return { path: args.path, external: true };
        }
        if (!NODE.has(args.path)) return undefined;
        // одноимённый пакет из npm (`events`, `buffer`) годится: он попадёт в сборку
        const r = await b.resolve(args.path, { resolveDir: args.resolveDir, kind: args.kind, importer: args.importer, pluginData: { skip: SKIP } });
        if (r.errors.length === 0) return r;
        problems.push(importProblem(from, args.path));
        return { path: args.path, external: true };
      });
    },
  };
}

const importProblem = (from: string, path: string) =>
  `${from}: импорт ${path} недоступен на платформе: функции выполняет workerd без модулей Node. ` +
  `Сеть это ctx.fetch, файлы ctx.files, время и случайные числа есть глобально`;
