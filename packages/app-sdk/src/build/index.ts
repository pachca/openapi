// Сборка приложения: типы `_generated`, проверка (`tsc`, скоупы, хосты, импорты для workerd) и артефакт в `dist`,
// который загружается на платформу. Этим пользуется `pachca-app` и тесты платформы.
//
//   import { build, check } from '@pachca/app-sdk/build';
import { build as esbuild, type BuildOptions as EsbuildOptions } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { browserHostProblems } from '../hosts.js';
import { PROTOCOL } from '../protocol.js';
import { scopeProblems } from '../scopes.js';
import { objectSchema, type FieldsDef, type JsonSchema } from '../server.js';
import { workerdImports } from './workerd.js';

export { scaffold } from './template.js';

const require = createRequire(import.meta.url);

/** Версия SDK, которой собрано приложение (`manifest.sdk`): по ней платформа решает, можно ли загрузить сборку. */
export const SDK_VERSION: string = (require('../../package.json') as { version: string }).version;

const KINDS = ['query', 'mutation', 'action', 'internalQuery', 'internalMutation', 'internalAction', 'webhook', 'pachcaEvent', 'job'] as const;
const EXPORT_RE = new RegExp(`^export const (\\w+)\\s*=\\s*(${KINDS.join('|')})\\(`, 'gm');

/** Ошибка сборки с текстом для человека. */
export class BuildError extends Error {
  override name = 'BuildError';
}

export interface Found {
  module: string;
  name: string;
  kind: string;
}

/** Функции приложения: именованные экспорты `export const имя = query(…)` в `server/<модуль>.ts`. */
function scan(dir: string): Found[] {
  const serverDir = join(dir, 'server');
  if (!existsSync(serverDir)) return [];
  const found: Found[] = [];
  for (const file of readdirSync(serverDir).sort()) {
    if (!file.endsWith('.ts') || file.startsWith('_') || file.endsWith('.test.ts')) continue;
    const module = basename(file, '.ts');
    for (const m of readFileSync(join(serverDir, file), 'utf8').matchAll(EXPORT_RE)) found.push({ module, name: m[1]!, kind: m[2]! });
  }
  return found;
}

const HEADER = '// Сгенерировано @pachca/app-sdk. Не править.\n';

/** Пишет `_generated/{server,api,entry}.ts` по функциям из `server/`. check и build делают это сами. */
export function generate(dir: string): Found[] {
  const found = scan(dir);
  const out = join(dir, '_generated');
  mkdirSync(out, { recursive: true });
  const modules = [...new Set(found.map((f) => f.module))];
  const typeOf = `{ ${modules.map((m) => `${m}: typeof ${m}`).join('; ')} }`;
  writeFileSync(
    join(out, 'server.ts'),
    `${HEADER}import schema from "../schema";
import type manifest from "../manifest";
import type { PachcaApi } from "@pachca/app-sdk/pachca";
import { createFunctions, type PachcaSides } from "@pachca/app-sdk/server";

/** Строители функций с типами из схемы приложения; ctx.pachca с методами по скоупам манифеста. */
export const { query, mutation, action, internalQuery, internalMutation, internalAction, webhook, pachcaEvent, job } =
  createFunctions<typeof schema, PachcaSides<PachcaApi, typeof manifest>>();
`
  );
  writeFileSync(
    join(out, 'api.ts'),
    `${HEADER}${modules.map((m) => `import type * as ${m} from "../server/${m}";\n`).join('')}import { anyApi, type ApiFromModules, type InternalFromModules, type JobsApi } from "@pachca/app-sdk/api";
import type {} from "@pachca/app-sdk"; // типы window.pachca: сам SDK подставляет платформа

/** Типизированные ссылки на функции: api.<модуль>.<функция>; api._jobs.get и api._jobs.cancel для статуса заданий. */
export const api = anyApi as unknown as ApiFromModules<${typeOf}> & { _jobs: JobsApi };

/** Ссылки на внутренние функции (internalQuery, internalMutation, internalAction): internal.<модуль>.<функция>. */
export const internal = anyApi as unknown as InternalFromModules<${typeOf}>;
`
  );
  writeFileSync(
    join(out, 'entry.ts'),
    `${HEADER}${modules.map((m) => `import * as ${m} from "../server/${m}";\n`).join('')}
export const functions = {
${found.map((f) => `  "${f.module}.${f.name}": ${f.module}.${f.name},\n`).join('')}} as const;
`
  );
  return found;
}

export interface CheckOptions {
  /** Режим сборки: переменные из `.env.<mode>` (как у Vite). По умолчанию `production`. */
  mode?: string;
}

export interface CheckResult {
  ok: boolean;
  /** Что не так, по строке на проблему; вывод `tsc` одной строкой с переводами. */
  problems: string[];
}

/**
 * Типы (`tsc` по tsconfig приложения), скоупы манифеста по API Пачки, хосты `browser` и импорты, которых нет в workerd.
 * Ничего не печатает: что показать, решает вызывающий.
 */
export async function check(dir: string, options: CheckOptions = {}): Promise<CheckResult> {
  dir = resolve(dir);
  generate(dir);
  const define = await envDefine(dir, options.mode ?? 'production');
  const problems: string[] = [];
  const tmp = join(dir, '_generated', '.check');
  try {
    const mf = (await nodeBundle(dir, join(dir, 'manifest.ts'), join(tmp, 'manifest.mjs'), define)).default as ManifestShape;
    problems.push(...scopeProblems(mf.pachca), ...browserHostProblems(mf.browser));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  await esbuild({ ...serverBundle(dir, define, problems), write: false }).catch((e: unknown) => problems.push(bundleError(e)));
  const r = spawnSync(process.execPath, [tscBin(), '--noEmit', '-p', dir], { encoding: 'utf8' });
  if (r.status !== 0) problems.push(`${r.stdout ?? ''}${r.stderr ?? ''}`.trimEnd() || `tsc: код ${r.status}`);
  return { ok: problems.length === 0, problems };
}

export interface BuildOptions extends CheckOptions {
  /** Не запускать check (его уже прогнали). */
  skipCheck?: boolean;
  /** Предупреждения Vite и esbuild. По умолчанию stderr. */
  log?: (message: string) => void;
}

export interface BuildResult {
  functions: number;
  tables: number;
  mode: string;
  /** Папка сборки (`<dir>/dist`). */
  dist: string;
}

type Described = { schema: JsonSchema; optional: boolean };
type ManifestShape = { db?: boolean; pachca?: { bot?: string[]; user?: string[] }; browser?: string[] } & Record<string, unknown>;
type Def = { kind: string; args: FieldsDef; returns?: Described; body?: Described; verify?: unknown; event?: string };
type FunctionInfo = { kind: string; args?: JsonSchema; returns?: JsonSchema; body?: JsonSchema; verify?: true; event?: string };

/**
 * Собирает `dist`: `app.js` (функции одним модулем для workerd), `functions.json`, `schema.json`, `manifest.json` (с `protocol`
 * и `sdk`) и `static/` (фронт через Vite из `index.html` или `public/` как есть).
 */
export async function build(dir: string, options: BuildOptions = {}): Promise<BuildResult> {
  dir = resolve(dir);
  const mode = options.mode ?? 'production';
  const log = options.log ?? ((m: string) => console.error(m));
  if (!options.skipCheck) {
    const r = await check(dir, { mode });
    if (!r.ok) throw new BuildError(`check не прошёл:\n${r.problems.join('\n')}`);
  } else generate(dir);
  const dist = join(dir, 'dist');
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(join(dist, 'static'), { recursive: true });
  const tmp = join(dist, '.introspect');
  const define = await envDefine(dir, mode);

  const problems: string[] = [];
  await esbuild({ ...serverBundle(dir, define, problems), outfile: join(dist, 'app.js'), logLevel: 'silent' }).catch((e: unknown) => {
    throw new BuildError(bundleError(e));
  });
  if (problems.length) throw new BuildError(problems.join('\n'));

  try {
    // функции: имена, виды, описание аргументов и результата (проверяет платформа)
    const entry = await nodeBundle(dir, join(dir, '_generated/entry.ts'), join(tmp, 'entry.mjs'), define);
    const functions: Record<string, FunctionInfo> = {};
    for (const [name, def] of Object.entries(entry.functions as Record<string, Def>)) {
      if (!(KINDS as readonly string[]).includes(def.kind)) throw new BuildError(`${name}: неизвестный вид функции ${def.kind}`);
      // вебхук и событие Пачки получают запрос от платформы, а не от клиента: проверять аргументы нечего
      const fromPlatform = def.kind === 'webhook' || def.kind === 'pachcaEvent';
      functions[name] = {
        kind: def.kind,
        ...(fromPlatform ? {} : { args: objectSchema(def.args) }),
        ...(def.kind === 'webhook' && def.body ? { body: def.body.schema } : {}),
        ...(def.kind === 'webhook' && typeof def.verify === 'function' ? { verify: true as const } : {}),
        ...(def.kind === 'pachcaEvent' && def.event ? { event: def.event } : {}),
        ...(def.returns ? { returns: def.returns.schema } : {}),
      };
    }
    writeJson(join(dist, 'functions.json'), functions);

    const schemaMod = await nodeBundle(dir, join(dir, 'schema.ts'), join(tmp, 'schema.mjs'), define);
    type TableDef = { _fields: Record<string, Described>; _indexes: Record<string, string[]> };
    const tables: Record<string, unknown> = {};
    for (const [name, t] of Object.entries(schemaMod.default.tables as Record<string, TableDef>)) {
      for (const [idx, cols] of Object.entries(t._indexes)) {
        for (const c of cols) if (!(c in t._fields)) throw new BuildError(`${name}.${idx}: нет поля ${c}`);
      }
      for (const [f, d] of Object.entries(t._fields)) {
        if (d.schema.type === 'array' || d.schema.type === 'object')
          throw new BuildError(`${name}.${f}: объекты и массивы в таблицах не поддерживаются (только в аргументах и результатах функций)`);
      }
      tables[name] = { document: objectSchema(t._fields), indexes: t._indexes };
    }
    writeJson(join(dist, 'schema.json'), { tables });

    // protocol решает, работает ли сборка (окно перехода протокола), sdk решает, можно ли её загрузить сейчас
    const mf = (await nodeBundle(dir, join(dir, 'manifest.ts'), join(tmp, 'manifest.mjs'), define)).default as ManifestShape;
    const manifest: ManifestShape = { ...mf, protocol: PROTOCOL, sdk: SDK_VERSION };
    if (Object.keys(tables).length > 0) {
      if (manifest.db === false) throw new BuildError('манифест: db: false, но в schema.ts есть таблицы');
      manifest.db = true;
    }
    writeJson(join(dist, 'manifest.json'), manifest);

    if (existsSync(join(dir, 'index.html'))) await buildFront(dir, join(dist, 'static'), mode, log);
    else if (existsSync(join(dir, 'src')))
      throw new BuildError('фронт собирает Vite: нужен index.html в корне приложения со <script type="module" src="/src/main.tsx"></script>');
    else if (existsSync(join(dir, 'public'))) cpSync(join(dir, 'public'), join(dist, 'static'), { recursive: true });
    if (!existsSync(join(dist, 'static/index.html')))
      throw new BuildError(
        'нужен index.html: в Пачке приложение открывается только с него. Фронт это index.html в корне приложения (собирает Vite), ' +
          'а если интерфейс не нужен, положите в public/index.html страницу-заглушку с пояснением, что делает приложение'
      );
    return { functions: Object.keys(functions).length, tables: Object.keys(tables).length, mode, dist };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

/** Сервер одним ES-модулем для workerd. */
function serverBundle(dir: string, define: Record<string, string>, problems: string[]): EsbuildOptions {
  return {
    entryPoints: [join(dir, '_generated/entry.ts')], bundle: true, format: 'esm', platform: 'neutral', target: 'es2022',
    mainFields: ['module', 'main'], conditions: ['import'], logLevel: 'silent', absWorkingDir: dir, define,
    plugins: [workerdImports(dir, problems)],
  };
}

const bundleError = (e: unknown) =>
  ((e as { errors?: { text: string; location?: { file: string; line: number } | null }[] }).errors ?? [])
    .map((m) => (m.location ? `${m.location.file}:${m.location.line}: ${m.text}` : m.text))
    .join('\n') || String(e);

/** Модуль приложения (манифест, схема, функции) для чтения описаний в Node. */
async function nodeBundle(dir: string, entry: string, outfile: string, define: Record<string, string>) {
  await esbuild({
    entryPoints: [entry], outfile, bundle: true, format: 'esm', platform: 'node', target: 'es2022',
    conditions: ['import'], logLevel: 'silent', absWorkingDir: dir, define,
  }).catch((e: unknown) => {
    throw new BuildError(bundleError(e));
  });
  return import(`${pathToFileURL(outfile).href}?t=${Date.now()}`);
}

/**
 * Переменные режима как у Vite: `.env`, `.env.local`, `.env.[mode]`, `.env.[mode].local`, в код попадают только `VITE_*`.
 * Сервер получает тот же `import.meta.env`, что и фронт, значения вписываются в сборку.
 */
async function envDefine(dir: string, mode: string): Promise<Record<string, string>> {
  const { loadEnv } = await import('vite');
  const env = { ...loadEnv(mode, dir, 'VITE_'), MODE: mode, DEV: false, PROD: true, BASE_URL: '/', SSR: false };
  return { 'import.meta.env': JSON.stringify(env) };
}

/**
 * Фронт собирает Vite из `index.html` в корне приложения (с `vite.config.*` приложения, если он есть). Папку сборки и base
 * задаёт сборка: платформа отдаёт статику с корня хоста приложения.
 */
async function buildFront(dir: string, outDir: string, mode: string, log: (m: string) => void): Promise<void> {
  const { build: vite } = await import('vite');
  const configFile = ['vite.config.ts', 'vite.config.mts', 'vite.config.js', 'vite.config.mjs'].map((f) => join(dir, f)).find((f) => existsSync(f));
  const customLogger = {
    info: () => {}, warn: log, warnOnce: log, error: log, clearScreen: () => {},
    hasErrorLogged: () => false, hasWarned: false,
  };
  await vite({
    root: dir, mode, configFile: configFile ?? false, base: '/', logLevel: 'warn', customLogger, clearScreen: false,
    build: {
      outDir, emptyOutDir: true,
      // "use client" в библиотеках React для браузерной сборки ничего не значит, предупреждение только шумит
      rolldownOptions: { onwarn: (w, warn) => void (w.code !== 'MODULE_LEVEL_DIRECTIVE' && warn(w)) },
    },
  });
  // строгий CSP платформы (script-src 'self') не пустит inline-скрипт: лучше отказ сборки, чем белый экран в Пачке
  const html = readFileSync(join(outDir, 'index.html'), 'utf8');
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (!/\bsrc\s*=/.test(m[1]!) && m[2]!.trim()) throw new BuildError('index.html: inline-скрипт заблокирует CSP платформы, перенесите код в модуль (src/…)');
  }
}

function tscBin(): string {
  return join(dirname(require.resolve('typescript/package.json')), 'bin', 'tsc');
}

const writeJson = (file: string, value: unknown) => writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);

const walk = (base: string, dir = base): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(base, p) : [relative(base, p).split('\\').join('/')];
  });

/** Артефакт сборки для загрузки: то, что лежит в `dist` после build. Статика в base64 по относительному пути. */
export interface Artifact {
  code: string;
  manifest: Record<string, unknown>;
  schema: { tables: Record<string, unknown> };
  functions: Record<string, FunctionInfo>;
  static: Record<string, string>;
}

export function artifact(dir: string): Artifact {
  const dist = join(resolve(dir), 'dist');
  const read = (f: string) => JSON.parse(readFileSync(join(dist, f), 'utf8'));
  const staticDir = join(dist, 'static');
  const files: Record<string, string> = {};
  if (existsSync(staticDir)) for (const f of walk(staticDir).sort()) files[f] = readFileSync(join(staticDir, f)).toString('base64');
  return {
    code: readFileSync(join(dist, 'app.js'), 'utf8'), manifest: read('manifest.json'),
    schema: read('schema.json'), functions: read('functions.json'), static: files,
  };
}

// Что не входит в исходники: зависимости и то, что собирается само, состояние папки и локальные файлы (*.local, как у Vite)
const SOURCE_SKIP_DIRS = new Set(['node_modules', 'dist', '_generated', '.git']);
const SOURCE_MAX_BYTES = 5 << 20;
const isAppState = (f: string) => /^\.pachca-app(\..+)?\.json$/.test(f);

/** Исходники папки приложения по относительному пути (base64): платформа хранит их с версией и отдаёт через pull. */
export function sources(dir: string): Record<string, string> {
  dir = resolve(dir);
  const out: Record<string, string> = {};
  let total = 0;
  const visit = (sub: string) => {
    for (const f of readdirSync(join(dir, sub)).sort()) {
      const rel = sub ? `${sub}/${f}` : f;
      const st = lstatSync(join(dir, rel));
      if (st.isSymbolicLink() || f === '.DS_Store' || f.endsWith('.local') || (!sub && isAppState(f))) continue;
      if (st.isDirectory()) {
        if (!SOURCE_SKIP_DIRS.has(f)) visit(rel);
        continue;
      }
      if ((total += st.size) > SOURCE_MAX_BYTES)
        throw new BuildError(`исходники больше ${SOURCE_MAX_BYTES >> 20} МБ: уберите из папки приложения крупные файлы (данные, архивы)`);
      out[rel] = readFileSync(join(dir, rel)).toString('base64');
    }
  };
  visit('');
  return out;
}
