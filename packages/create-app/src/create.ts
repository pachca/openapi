import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);

export const VERSION: string = (require('../package.json') as { version: string }).version;

export interface CreateOptions {
  name?: string;
  install?: (dir: string) => void;
  log?: (line: string) => void;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[-._]+|-+$/g, '') || 'pachca-app';

/** `npm create`, `pnpm create`, `bun create` и `yarn create` называют себя в `npm_config_user_agent`. */
export function packageManager(userAgent = process.env.npm_config_user_agent ?? ''): string {
  const pm = userAgent.split('/')[0];
  return pm === 'pnpm' || pm === 'bun' || pm === 'yarn' ? pm : 'npm';
}

function defaultInstall(dir: string): void {
  const pm = packageManager();
  const r = spawnSync(pm, ['install'], { cwd: dir, stdio: 'inherit', shell: process.platform === 'win32' });
  if (r.status !== 0) throw new Error(`${pm} install не прошёл: повторите его в папке ${dir}`);
}

export async function create(target: string, options: CreateOptions = {}): Promise<string> {
  const dir = resolve(target);
  const log = options.log ?? ((l: string) => console.error(l));
  if (existsSync(dir) && readdirSync(dir).length) throw new Error(`Папка ${target} не пустая: выберите новую`);
  const name = options.name?.trim() || basename(dir);
  mkdirSync(dir, { recursive: true });
  const pkg = {
    name: slug(basename(dir)),
    private: true,
    type: 'module',
    pachca: { name },
    dependencies: {
      '@pachca/app-sdk': VERSION,
      '@pachca/app-react': VERSION,
      '@tanstack/react-router': '^1.170.46',
      react: '^19.3.1',
      'react-dom': '^19.3.1',
    },
    devDependencies: {
      '@types/react': '^19.3.0',
      '@types/react-dom': '^19.3.0',
      // типы `vite/client` в tsconfig шаблона: менеджеры без подъёма зависимостей (pnpm, bun) иначе их не найдут
      vite: '^8.3.8',
    },
  };
  writeFileSync(join(dir, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
  log(`Зависимости @pachca/app-sdk ${VERSION}…`);
  (options.install ?? defaultInstall)(dir);
  const build = createRequire(join(dir, 'package.json')).resolve('@pachca/app-sdk/build');
  const { scaffold } = (await import(pathToFileURL(build).href)) as { scaffold: (dir: string, o: { name: string }) => void };
  scaffold(dir, { name });
  return dir;
}
