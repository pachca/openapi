import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { artifact, build, check, sources } from '../build/index.js';
import { ApiError, call, DEFAULT_API, type Api, type App, type Item, type LogEntry, type Released, type Source } from './api.js';
import { CliError, colors, confirm, step, type Io } from './io.js';
import { appOf, forget, saveState, target } from './state.js';

export interface Target {
  mode: string;
  app?: string;
}

export async function runCheck(io: Io, mode: string): Promise<boolean> {
  const c = colors(io);
  const r = await check(io.cwd, { mode });
  if (r.ok) {
    io.err(`  ${c.green('✔')} Проверка прошла\n`);
    return true;
  }
  io.err(`  ${c.red('✖')} Проверка не прошла:\n\n${r.problems.join('\n')}\n`);
  return false;
}

export async function runBuild(io: Io, mode: string): Promise<void> {
  const r = await build(io.cwd, { mode, log: (m) => io.err(`${m}\n`) });
  io.err(`  ${colors(io).green('✔')} Сборка ${relative(io.cwd, r.dist) || r.dist}: ${r.functions} функций, ${r.tables} таблиц, режим ${r.mode}\n`);
}

function appName(dir: string, flag?: string): string {
  if (flag) return flag;
  try {
    const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as { pachca?: { name?: string } };
    if (pkg.pachca?.name) return pkg.pachca.name;
  } catch {
  }
  return basename(dir);
}

export interface ShipOptions extends Target {
  name?: string;
  approve: boolean;
  force: boolean;
}

export async function ship(io: Io, a: Api, opts: ShipOptions): Promise<string | undefined> {
  const c = colors(io);
  const dir = io.cwd;
  const base = appName(dir, opts.name);
  const name = opts.mode === 'production' ? base : `${base} (${opts.mode})`;
  io.err(`\n  ${c.cyan('◆')} ${c.bold('pachca-app')} ${c.dim('·')} ${name}\n\n`);
  await step(io, 'Проверка', async (log) => {
    const r = await check(dir, { mode: opts.mode });
    if (!r.ok) {
      for (const p of r.problems) log(p);
      throw new CliError('Проверка не прошла: исправьте ошибки выше и повторите');
    }
  });
  await step(io, 'Сборка', (log) => build(dir, { mode: opts.mode, skipCheck: true, log }), (r) => c.dim(r.mode));
  let app = target(dir, a.url, opts).id;
  const fresh = !app;
  if (!app) {
    app = await step(
      io,
      'Приложение',
      async () => {
        const id = (await call<App>(io, a, 'POST', '/apps', { name })).id;
        saveState(dir, a.url, opts.mode, id, 0);
        return id;
      },
      (id) => `${id} ${c.dim('(новое)')}`,
    );
  } else io.err(`  ${c.green('✔')} ${'Приложение'.padEnd(14)}${app}\n`);
  const released = await upload(io, a, app, opts);
  if (!released) return undefined;
  const web = a.url === DEFAULT_API ? `https://app.pachca.com/app/${encodeURIComponent(app)}` : undefined;
  io.err(`\n  ${c.green('Готово')}${fresh ? ' · приложение создано' : ''} · версия ${released.version}\n  ${c.dim('id')}  ${app}${web ? `\n  ${c.dim('web')} ${web}` : ''}\n\n`);
  io.out(`${app}\n`);
  return app;
}

const itemLine = (io: Io, i: Item) => {
  const c = colors(io);
  return `${i.removed ? c.dim('убрано ') : i.new ? c.cyan('НОВОЕ ') : ''}${i.text}${i.scope && i.kind !== 'net' ? c.dim(` (${i.scope})`) : ''}`;
};

const conflictText = (app: string, base: number, current?: number) =>
  `Приложение ${app} обновили${current ? ` до версии ${current}` : ''}, а эта папка сделана от ${base ? `версии ${base}` : 'пустого приложения'}. ` +
  `Скачайте текущую версию в новую папку (npx pachca-app pull ../<папка> --app ${app}), перенесите туда свои изменения и загрузите оттуда. ` +
  'Загрузить поверх (--force) можно только по решению человека: чужие изменения пропадут';

const sdkText = (message: string, command?: string) =>
  command ? `${message}\n\n  ${command}\n  npx pachca-app ship` : message;

async function upload(io: Io, a: Api, app: string, opts: ShipOptions): Promise<Released | undefined> {
  const c = colors(io);
  const dir = io.cwd;
  const { version: base } = target(dir, a.url, { app, mode: opts.mode });
  const body = { ...artifact(dir), source: sources(dir), base_version: base, force: opts.force };
  const send = (approve: boolean) => call<Released>(io, a, 'POST', `/apps/${encodeURIComponent(app)}/versions`, { ...body, approve });
  let released: Released;
  try {
    released = await step(io, 'Загрузка', () => send(opts.approve), (r) => `версия ${r.version}`);
  } catch (e) {
    if (!(e instanceof ApiError)) throw e;
    if (e.code === 'version_conflict') throw new CliError(conflictText(app, base, (e.payload as { version?: number } | undefined)?.version));
    if (e.code === 'sdk_outdated') throw new CliError(sdkText(e.message, (e.payload as { command?: string } | undefined)?.command));
    if (e.code !== 'consent_required') throw e;
    io.err(`  ${c.cyan('!')} ${'Права'.padEnd(14)}изменились, приложение сможет:\n`);
    for (const i of (e.payload as { items?: Item[] } | undefined)?.items ?? []) io.err(`    ${c.dim('·')} ${itemLine(io, i)}\n`);
    if (!(await confirm(io, `\n  Подтвердить эти права и загрузить? [y/N] `))) {
      io.err(`\n  ${c.cyan('!')} Ничего не загружено. Покажите изменения человеку и после его согласия добавьте ${c.bold('--approve-consent-screen')}\n`);
      return undefined;
    }
    released = await step(io, 'Загрузка', () => send(true), (r) => `версия ${r.version}`);
  }
  saveState(dir, a.url, opts.mode, app, released.version);
  for (const w of released.warnings ?? []) io.err(`    ${c.cyan('!')} ${w}\n`);
  const changed = (released.items ?? []).filter((i) => i.new || i.removed);
  if (changed.length) {
    io.err(`  ${c.green('✔')} ${'Права'.padEnd(14)}${c.dim('подтверждены')}\n`);
    for (const i of changed) io.err(`    ${c.dim('·')} ${itemLine(io, i)}\n`);
  }
  io.err(`  ${c.green('✔')} ${'База'.padEnd(14)}${released.migrations?.length ? '' : c.dim('без изменений')}\n`);
  for (const m of released.migrations ?? []) io.err(`    ${c.dim('·')} ${m}\n`);
  return released;
}

export async function pull(io: Io, a: Api, into: string, app: string, mode: string): Promise<void> {
  const dir = resolve(io.cwd, into);
  if (existsSync(dir) && readdirSync(dir).length) throw new CliError(`Папка ${into} не пустая, скачайте в новую`);
  const src = await call<Source>(io, a, 'GET', `/apps/${encodeURIComponent(app)}/source`);
  const names = Object.keys(src.files);
  if (!names.length) throw new CliError(`У версии ${src.version} приложения ${app} нет исходников`);
  for (const [rel, b64] of Object.entries(src.files)) {
    const p = resolve(dir, rel);
    if (!p.startsWith(dir + sep)) throw new CliError(`Недопустимый путь в исходниках: ${rel}`);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, Buffer.from(b64, 'base64'));
  }
  saveState(dir, a.url, mode, app, src.version);
  io.err(`  Версия ${src.version}, ${names.length} файлов в ${relative(io.cwd, dir) || '.'}. Дальше: cd ${into} && npm install\n`);
}

const KIND_LABEL: Record<string, string> = { function: 'функция', fetch: 'сеть', pachca: 'Пачка', webhook: 'вебхук', csp: 'фронт', platform: 'платформа' };

export async function logs(io: Io, a: Api, t: Target, opts: { n: number; follow: boolean }): Promise<void> {
  const c = colors(io);
  const app = appOf(io.cwd, a.url, t);
  const seen = new Set<string>();
  const key = (e: LogEntry) => `${e.time}|${e.kind}|${e.text}`;
  const show = async (n: number) => {
    const rows = await call<LogEntry[]>(io, a, 'GET', `/apps/${encodeURIComponent(app)}/logs?n=${n}`);
    for (const e of rows.reverse()) {
      if (seen.has(key(e))) continue;
      seen.add(key(e));
      const time = new Date(e.time).toLocaleTimeString('ru-RU', { hour12: false });
      const mark = e.kind === 'platform' ? c.cyan('!') : e.allowed ? c.green('✔') : c.red('✖');
      const reason = e.reason ? c.dim(`  ${e.reason.replace(/\s+/g, ' ')}`) : '';
      io.err(`  ${c.dim(time)} ${mark} ${c.cyan((KIND_LABEL[e.kind] ?? e.kind).padEnd(9))}${e.text}${reason}\n`);
    }
    return rows.length;
  };
  io.err(`\n  ${c.cyan('◆')} ${c.bold('pachca-app logs')} ${c.dim('·')} ${app}\n\n`);
  if ((await show(opts.n)) === 0) io.err(`  ${c.dim('Записей нет: журнал хранится в памяти платформы, после её перезапуска он пуст')}\n`);
  while (opts.follow) {
    await io.sleep(2000);
    await show(200);
  }
}

const SECRET_NAME = /^[A-Z][A-Z0-9_]{0,63}$/;

export async function secret(io: Io, a: Api, t: Target, sub: string | undefined, name: string | undefined): Promise<void> {
  const app = appOf(io.cwd, a.url, t);
  const base = `/apps/${encodeURIComponent(app)}/secrets`;
  if (sub === 'list') {
    const names = await call<string[]>(io, a, 'GET', base);
    if (names.length) io.out(`${names.join('\n')}\n`);
    else io.err('  Секретов нет\n');
    return;
  }
  if (sub !== 'set' && sub !== 'rm') throw new CliError('secret: set NAME, list или rm NAME', 2);
  if (!name || !SECRET_NAME.test(name)) throw new CliError('Имя секрета: заглавные латинские буквы, цифры и _, например CRM_KEY', 2);
  if (sub === 'rm') {
    await call(io, a, 'DELETE', `${base}/${name}`);
    io.err(`  Секрет ${name} удалён\n`);
    return;
  }
  const value = await io.ask(`  Значение ${name}: `, { hidden: true });
  if (!value) throw new CliError('Значение пустое');
  await call(io, a, 'PUT', `${base}/${name}`, { value });
  io.err(`  Секрет ${name} сохранён. Ключ подключения платформа сама добавит в запросы к его хосту, в коде его не пишите\n`);
}

const VISIBILITIES = ['private', 'link', 'public'];

export async function edit(io: Io, a: Api, t: Target, patch: { name?: string; icon?: string; visibility?: string }): Promise<void> {
  if (patch.name === undefined && patch.icon === undefined && patch.visibility === undefined) {
    throw new CliError('edit: укажите --name, --icon или --visibility', 2);
  }
  if (patch.visibility !== undefined && !VISIBILITIES.includes(patch.visibility)) {
    throw new CliError(`edit: --visibility это ${VISIBILITIES.join(', ')}`, 2);
  }
  const app = appOf(io.cwd, a.url, t);
  const r = await call<App>(io, a, 'PUT', `/apps/${encodeURIComponent(app)}`, patch);
  io.err(`  ${[r.icon, r.name].filter(Boolean).join(' ')}, доступ ${r.visibility}\n`);
}

export async function remove(io: Io, a: Api, t: Target): Promise<void> {
  const app = appOf(io.cwd, a.url, t);
  const mode = t.mode === 'production' ? '' : ` --mode ${t.mode}`;
  if (!io.tty) {
    throw new CliError(
      `Удаление приложения ${app} необратимо, его подтверждает человек в своём терминале: npx pachca-app delete${mode}. ` +
        'Агент эту команду не выполняет, а только предлагает',
    );
  }
  const c = colors(io);
  io.err(`\n  ${c.red('!')} Удалить приложение ${c.bold(app)} целиком: версии, базу, файлы, секреты и бота. Вернуть нельзя.\n`);
  const typed = (await io.ask(`  Чтобы удалить, введите id приложения: `)).trim();
  if (typed !== app) throw new CliError('Удаление отменено: id не совпал');
  await call(io, a, 'DELETE', `/apps/${encodeURIComponent(app)}`);
  forget(io.cwd, a.url, app);
  io.err(`  Приложение ${app} удалено\n`);
}
