// Бинарь pachca-app на копии apps/tasks против поддельного API Пачки: загрузка, подтверждение прав, конфликт версий,
// режимы, pull, журнал, секреты, правка, удаление и вход без токена. Запускается настоящий dist/cli/bin.js без терминала.
import { execFile } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { copy, tmp } from './apps.js';
import { fakeApi, TOKEN, type FakeApi } from './fakeapi.js';

const bin = join(dirname(createRequire(import.meta.url).resolve('@pachca/app-sdk/package.json')), 'dist', 'cli', 'bin.js');

let api: FakeApi;
let dir: string;
const home = tmp('cli-home');

type Run = { code: number; stdout: string; stderr: string };

function run(args: string[], opts: { cwd?: string; env?: Record<string, string | undefined>; input?: string } = {}): Promise<Run> {
  const env: Record<string, string | undefined> = {
    PATH: process.env.PATH,
    HOME: home,
    XDG_CONFIG_HOME: home,
    PACHCA_API: api.url,
    PACHCA_TOKEN: TOKEN,
    NO_COLOR: '1',
    ...opts.env,
  };
  return new Promise((done) => {
    const child = execFile(process.execPath, [bin, ...args], { cwd: opts.cwd ?? dir, env: env as NodeJS.ProcessEnv, maxBuffer: 1 << 24 }, (error, stdout, stderr) =>
      done({ code: error ? Number(error.code ?? 1) : 0, stdout, stderr }),
    );
    child.stdin!.end(opts.input ?? '');
  });
}

const stateOf = (d: string) => {
  const f = readdirSync(d).find((n) => /^\.pachca-app\..+\.json$/.test(n));
  return f ? (JSON.parse(readFileSync(join(d, f), 'utf8')) as Record<string, { id: string; version: number }>) : {};
};
const uploads = () => api.requests.filter((r) => r.method === 'POST' && r.path.endsWith('/versions'));

beforeAll(async () => {
  api = await fakeApi();
  dir = copy('tasks', 'cli-tasks');
  for (const d of ['cli-home', 'cli-pulled', 'cli-bin', 'cli-empty-path']) rmSync(tmp(d), { recursive: true, force: true });
  mkdirSync(home, { recursive: true });
  mkdirSync(tmp('cli-empty-path'));
});
afterAll(() => api.close());

describe('ship', () => {
  test('новые права без терминала и без --approve-consent-screen: ничего не загружено', async () => {
    const r = await run(['ship', '--name', 'Задачи']);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain('Права         изменились');
    expect(r.stderr).toContain('Отправка сообщений');
    expect(r.stderr).toContain('--approve-consent-screen');
    const [app] = [...api.apps.values()];
    expect(app).toMatchObject({ name: 'Задачи', version: 0 });
    expect(stateOf(dir)).toEqual({ production: { id: app!.id, version: 0 } });
  });

  test('с подтверждением: версия загружена, папка запомнила её номер', async () => {
    const r = await run(['ship', '--approve-consent-screen']);
    expect(r.stderr).toContain('версия 1');
    expect(r.code).toBe(0);
    const [app] = [...api.apps.values()];
    expect(r.stdout).toBe(`${app!.id}\n`);
    expect(r.stderr).toContain('Таблица tasks создана');
    expect(stateOf(dir).production).toEqual({ id: app!.id, version: 1 });
    const body = uploads().at(-1)!.body as { manifest: { sdk: string; protocol: number }; source: Record<string, string>; base_version: number; approve: boolean };
    expect(body).toMatchObject({ base_version: 0, approve: true });
    expect(body.manifest.sdk).toBe('0.0.0');
    expect(typeof body.manifest.protocol).toBe('number');
    expect(Object.keys(body.source)).toContain('schema.ts');
    expect(Object.keys(body.source).some((f) => /^(dist|_generated|node_modules)\//.test(f) || f.startsWith('.pachca-app'))).toBe(false);
  });

  test('без изменений прав следующая версия идёт от номера папки без вопросов', async () => {
    const r = await run(['ship']);
    expect(r.code).toBe(0);
    expect(uploads().at(-1)!.body).toMatchObject({ base_version: 1, approve: false });
    expect(Object.values(stateOf(dir))[0]!.version).toBe(2);
  });

  test('приложение загрузили из другой папки: version_conflict и путь через pull', async () => {
    const [app] = [...api.apps.values()];
    app!.version = 5;
    const r = await run(['ship']);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain(`обновили до версии 5, а эта папка сделана от версии 2`);
    expect(r.stderr).toContain(`npx pachca-app pull ../<папка> --app ${app!.id}`);
    expect(stateOf(dir).production!.version).toBe(2);
  });

  test('--force загружает поверх', async () => {
    const r = await run(['ship', '--force']);
    expect(r.code).toBe(0);
    expect(stateOf(dir).production!.version).toBe(6);
  });

  test('--mode staging: отдельное приложение режима', async () => {
    const r = await run(['ship', '--mode', 'staging', '--approve-consent-screen']);
    expect(r.code).toBe(0);
    const state = stateOf(dir);
    expect(Object.keys(state).sort()).toEqual(['production', 'staging']);
    expect(api.apps.get(state.staging!.id)!.name).toBe('cli-tasks (staging)');
  });

  test('проверка не прошла: приложение не создаётся, ошибка tsc видна', async () => {
    const broken = copy('tasks', 'cli-broken');
    writeFileSync(join(broken, 'server', 'oops.ts'), 'export const x: number = "строка";\n');
    const before = api.apps.size;
    const r = await run(['ship'], { cwd: broken });
    expect(r.code).toBe(1);
    expect(r.stderr).toContain('Проверка не прошла');
    expect(r.stderr).toContain('oops.ts');
    expect(api.apps.size).toBe(before);
  });
});

describe('команды приложения папки', () => {
  test('pull: исходники текущей версии в новую папку', async () => {
    const id = stateOf(dir).production!.id;
    const into = tmp('cli-pulled');
    const r = await run(['pull', into, '--app', id]);
    expect(r.code).toBe(0);
    expect(readFileSync(join(into, 'schema.ts'), 'utf8')).toBe(readFileSync(join(dir, 'schema.ts'), 'utf8'));
    expect(stateOf(into)).toEqual({ production: { id, version: 6 } });
    expect((await run(['pull', into, '--app', id])).stderr).toContain('не пустая');
  });

  test('logs: записи журнала от старых к новым', async () => {
    api.logs.push(
      { time: '2026-11-27T10:00:02Z', kind: 'fetch', text: 'GET https://api.example.com/b', allowed: false, reason: 'хоста нет в manifest.fetch' },
      { time: '2026-11-27T10:00:01Z', kind: 'function', text: 'tasks.add', allowed: false, reason: '500' },
    );
    const r = await run(['logs', '-n', '10']);
    expect(r.code).toBe(0);
    expect(r.stderr.indexOf('tasks.add')).toBeLessThan(r.stderr.indexOf('api.example.com/b'));
    expect(r.stderr).toContain('хоста нет в manifest.fetch');
    expect(api.requests.at(-1)!.path).toMatch(/\/logs\?n=10$/);
  });

  test('secret: значение из stdin, имена списком, удаление', async () => {
    expect((await run(['secret', 'set', 'CRM_KEY'], { input: 'sk_test\n' })).code).toBe(0);
    expect(api.requests.at(-1)).toMatchObject({ method: 'PUT', body: { value: 'sk_test' } });
    expect((await run(['secret', 'list'])).stdout).toBe('CRM_KEY\n');
    expect((await run(['secret', 'rm', 'CRM_KEY'])).code).toBe(0);
    expect((await run(['secret', 'set', 'crm'])).code).toBe(2);
  });

  test('edit: доступ без новой версии', async () => {
    const r = await run(['edit', '--visibility', 'link', '--icon', '✅']);
    expect(r.code).toBe(0);
    expect(r.stderr).toContain('доступ link');
    expect((await run(['edit', '--visibility', 'all'])).code).toBe(2);
  });

  test('delete без терминала ничего не удаляет и просит человека', async () => {
    const state = stateOf(dir);
    const r = await run(['delete', '--mode', 'staging']);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain('подтверждает человек в своём терминале: npx pachca-app delete --mode staging');
    expect(api.apps.has(state.staging!.id)).toBe(true);
    expect(api.requests.some((q) => q.method === 'DELETE' && !q.path.includes('/secrets/'))).toBe(false);
    expect((await run(['delete', '--confirm', state.production!.id])).code).toBe(2);
  });

  test('папка без загрузки: команда объясняет, что сначала ship', async () => {
    const r = await run(['logs'], { cwd: tmp('cli-home') });
    expect(r.code).toBe(1);
    expect(r.stderr).toContain('ещё не загружалась');
  });
});

describe('вход', () => {
  // без CLI Пачки в PATH: бинарь запускается по process.execPath, PATH ему не нужен
  const noPachca = { PACHCA_TOKEN: undefined, PATH: tmp('cli-empty-path') };

  test('нет токена и нет терминала: обе команды входа', async () => {
    const r = await run(['logs'], { env: noPachca });
    expect(r.code).toBe(1);
    expect(r.stderr).toContain('pachca auth login');
    expect(r.stderr).toContain('npm i -g @pachca/cli');
    expect(r.stderr).toContain('npx pachca-app login');
  });

  test('токен берётся у pachca auth token', async () => {
    const binDir = tmp('cli-bin');
    mkdirSync(binDir, { recursive: true });
    const fake = join(binDir, 'pachca');
    writeFileSync(fake, `#!/bin/sh\n[ "$1 $2" = "auth token" ] && echo ${TOKEN} && exit 0\nexit 3\n`);
    chmodSync(fake, 0o755);
    const r = await run(['secret', 'list'], { env: { PACHCA_TOKEN: undefined, PATH: `${binDir}:${dirname(process.execPath)}:/bin:/usr/bin` } });
    expect(r.code).toBe(0);
  });

  test('токен не подошёл: откуда он взят и что делать', async () => {
    const r = await run(['secret', 'list'], { env: { PACHCA_TOKEN: 'bad' } });
    expect(r.code).toBe(1);
    expect(r.stderr).toContain('Не подошёл токен из PACHCA_TOKEN');
    expect(r.stderr).toContain('apps:read и apps:write');
  });

  test('login сохраняет проверенный токен, logout удаляет', async () => {
    const file = join(home, 'pachca-app', 'credentials.json');
    expect((await run(['login'], { env: { PACHCA_TOKEN: undefined }, input: 'bad\n' })).code).toBe(1);
    expect(existsSync(file)).toBe(false);
    expect((await run(['login'], { env: { PACHCA_TOKEN: undefined }, input: `${TOKEN}\n` })).code).toBe(0);
    expect(JSON.parse(readFileSync(file, 'utf8')).token).toBe(TOKEN);
    expect((await run(['secret', 'list'], { env: noPachca })).code).toBe(0);
    expect((await run(['logout'])).code).toBe(0);
    expect(existsSync(file)).toBe(false);
  });
});

test('неизвестная команда и флаг: код 2 и справка', async () => {
  expect((await run(['deploy'])).code).toBe(2);
  const r = await run(['ship', '--approve']);
  expect(r.code).toBe(2);
  expect(r.stderr).toContain('--approve-consent-screen');
});
