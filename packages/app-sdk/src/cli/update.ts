// Перед check, build и ship бинарь сверяет свою версию с npm: платформа принимает сборки только актуального SDK,
// поэтому старый SDK лучше обновить до сборки, а не узнать об этом отказом загрузки.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CliError, colors, confirm, type Io } from './io.js';

const REGISTRY = 'https://registry.npmjs.org/-/package/@pachca/app-sdk/dist-tags';

/** CalVer `YYYY.M.N` с необязательным предрелизом `-beta.K`: <0, 0, >0 как у сортировки. */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => {
    const [core = '', pre] = v.split('-', 2);
    return { core: core.split('.').map(Number), pre: pre?.split('.') };
  };
  const x = parse(a);
  const y = parse(b);
  for (let i = 0; i < Math.max(x.core.length, y.core.length); i++) {
    const d = (x.core[i] ?? 0) - (y.core[i] ?? 0);
    if (d) return d;
  }
  if (!x.pre || !y.pre) return (x.pre ? -1 : 0) - (y.pre ? -1 : 0);
  for (let i = 0; i < Math.max(x.pre.length, y.pre.length); i++) {
    const p = x.pre[i];
    const q = y.pre[i];
    if (p === undefined || q === undefined) return p === undefined ? -1 : 1;
    const d = /^\d+$/.test(p) && /^\d+$/.test(q) ? Number(p) - Number(q) : p.localeCompare(q);
    if (d) return d;
  }
  return 0;
}

/** Версия, до которой стоит обновиться, или `undefined`. Предрелиз сравнивается и с `next`, релиз только с `latest`. */
export async function newerVersion(io: Io, current: string): Promise<string | undefined> {
  let tags: Record<string, string>;
  try {
    const r = await io.fetch(REGISTRY, { signal: AbortSignal.timeout(5000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    tags = (await r.json()) as Record<string, string>;
  } catch (e) {
    io.err(colors(io).dim(`  Не удалось узнать последнюю версию @pachca/app-sdk (${(e as Error).message}), проверка пропущена\n`));
    return undefined;
  }
  const candidates = [tags.latest, current.includes('-') ? tags.next : undefined].filter((v): v is string => Boolean(v));
  const best = candidates.sort(compareVersions).at(-1);
  return best && compareVersions(best, current) > 0 ? best : undefined;
}

/** Пакеты SDK, которые стоят в папке: app-react обновляется вместе с app-sdk одним номером. */
function packagesOf(dir: string, version: string): string[] {
  const pkg = (() => {
    try {
      return JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as Record<string, Record<string, string> | undefined>;
    } catch {
      return {};
    }
  })();
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  return ['@pachca/app-sdk', ...('@pachca/app-react' in deps ? ['@pachca/app-react'] : [])].map((p) => `${p}@${version}`);
}

/** Менеджер пакетов папки по lock-файлу. */
export function installCommand(dir: string, packages: string[]): [string, string[]] {
  if (existsSync(join(dir, 'bun.lock')) || existsSync(join(dir, 'bun.lockb'))) return ['bun', ['add', ...packages]];
  if (existsSync(join(dir, 'pnpm-lock.yaml'))) return ['pnpm', ['add', ...packages]];
  if (existsSync(join(dir, 'yarn.lock'))) return ['yarn', ['add', ...packages]];
  return ['npm', ['install', ...packages]];
}

/**
 * Свежий SDK или решение, что делать: `undefined` значит продолжать. Человеку предлагает обновить и сам обновляет,
 * после чего команда запускается заново уже новой версией (её код возвращается); программе печатает команду и останавливает.
 */
export async function ensureLatest(io: Io, current: string, argv: string[]): Promise<number | undefined> {
  if (current === '0.0.0' || io.env.PACHCA_APP_UPDATED) return undefined;
  const latest = await newerVersion(io, current);
  if (!latest) return undefined;
  const [cmd, args] = installCommand(io.cwd, packagesOf(io.cwd, latest));
  const line = `${cmd} ${args.join(' ')}`;
  const c = colors(io);
  io.err(`\n  ${c.cyan('!')} Вышел @pachca/app-sdk ${latest}, в папке ${current}. Пачка принимает сборки только актуального SDK.\n`);
  if (!io.tty) throw new CliError(`Обновите SDK и повторите команду: ${line}`);
  if (!(await confirm(io, `  Обновить (${line})? [Y/n] `, true))) throw new CliError(`Обновите SDK и повторите команду: ${line}`);
  if (io.run(cmd, args, { cwd: io.cwd }).status !== 0) throw new CliError(`Не удалось обновить: ${line}`);
  const bin = join(io.cwd, 'node_modules', '@pachca', 'app-sdk', 'dist', 'cli', 'bin.js');
  return io.run(process.execPath, [bin, ...argv], { cwd: io.cwd, env: { PACHCA_APP_UPDATED: '1' } }).status ?? 1;
}
