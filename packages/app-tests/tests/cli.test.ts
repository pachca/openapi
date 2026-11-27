// Бинарь pachca-app на копии apps/tasks против поддельного API Пачки: загрузка, подтверждение прав, конфликт версий,
// режимы, pull, журнал, секреты, правка, удаление и вход. Запускается настоящий dist/cli/bin.js без терминала, а в API
// он ходит через настоящий CLI Пачки из репозитория (`pachca api`) с профилем во временной папке.
import { execFile } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { copy, tmp } from './apps.js';
import { fakeApi, TOKEN, type FakeApi } from './fakeapi.js';

const require = createRequire(import.meta.url);
const bin = join(dirname(require.resolve('@pachca/app-sdk/package.json')), 'dist', 'cli', 'bin.js');
const pachcaCli = join(dirname(require.resolve('@pachca/cli/package.json')), 'bin', 'run.js');
const binDir = tmp('cli-bin');

let api: FakeApi;
let dir: string;
const home = tmp('cli-home');

type Run = { code: number; stdout: string; stderr: string };

function run(args: string[], opts: { cwd?: string; env?: Record<string, string | undefined>; input?: string } = {}): Promise<Run> {
  const env: Record<string, string | undefined> = {
    PATH: `${binDir}:/usr/bin:/bin`,
    HOME: home,
    XDG_CONFIG_HOME: home,
    PACHCA_API_URL: api.url,
    PACHCA_SKIP_NEW_VERSION_CHECK: '1',
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
  for (const d of ['cli-home', 'cli-pulled', 'cli-bin', 'cli-empty-path', 'cli-nobody']) rmSync(tmp(d), { recursive: true, force: true });
  mkdirSync(join(home, 'pachca'), { recursive: true });
  mkdirSync(tmp('cli-empty-path'));
  // вход CLI Пачки: профиль с готовым токеном, как после `pachca auth login --token`
  writeFileSync(join(home, 'pachca', 'config.toml'), `active_profile = "admin"\n\n[profiles.admin]\ntype = "user"\ntoken = "${TOKEN}"\nuser = "Админ"\n`);
  mkdirSync(binDir);
  writeFileSync(join(binDir, 'pachca'), `#!/bin/sh\nexec "${process.execPath}" "${pachcaCli}" "$@"\n`);
  chmodSync(join(binDir, 'pachca'), 0o755);
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

  test('платформа не принимает версию SDK: sdk_outdated и команда обновления, ничего не загружено', async () => {
    api.sdk = '2099.1.0';
    try {
      const r = await run(['ship', '--force']);
      expect(r.code).toBe(1);
      expect(r.stderr).toContain('платформа принимает 2099.1.0');
      expect(r.stderr).toContain('npm i @pachca/app-sdk@2099.1.0 @pachca/app-react@2099.1.0');
      expect(r.stderr).toContain('npx pachca-app ship');
      expect(stateOf(dir).production!.version).toBe(2);
    } finally {
      api.sdk = undefined;
    }
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

describe('вход через CLI Пачки', () => {
  test('CLI не установлен: как поставить и войти', async () => {
    const r = await run(['logs'], { env: { PATH: tmp('cli-empty-path') } });
    expect(r.code).toBe(1);
    expect(r.stderr).toContain('npm install -g @pachca/cli');
    expect(r.stderr).toContain('pachca auth login');
  });

  test('в CLI нет входа: как войти, приложение не создаётся', async () => {
    const before = api.apps.size;
    const r = await run(['ship'], { env: { XDG_CONFIG_HOME: tmp('cli-nobody') } });
    expect(r.code).toBe(1);
    expect(r.stderr).toContain('Нет входа в CLI Пачки');
    expect(r.stderr).not.toContain('Проверка');
    expect(api.apps.size).toBe(before);
  });

  test('токен из PACHCA_TOKEN передаёт CLI сам; чужой токен не подходит', async () => {
    const r = await run(['secret', 'list'], { env: { PACHCA_TOKEN: 'bad' } });
    expect(r.code).toBe(1);
    expect(r.stderr).toContain('pachca auth login');
    expect((await run(['secret', 'list'], { env: { PACHCA_TOKEN: TOKEN, XDG_CONFIG_HOME: tmp('cli-nobody') } })).code).toBe(0);
  });

  test('login и --token больше нет', async () => {
    expect((await run(['login'])).code).toBe(2);
    expect((await run(['logs', '--token', TOKEN])).code).toBe(2);
  });
});

test('неизвестная команда и флаг: код 2 и справка', async () => {
  expect((await run(['deploy'])).code).toBe(2);
  const r = await run(['ship', '--approve']);
  expect(r.code).toBe(2);
  expect(r.stderr).toContain('--approve-consent-screen');
});
