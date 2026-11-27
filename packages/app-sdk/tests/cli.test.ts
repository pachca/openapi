// pachca-app без процесса: запросы через CLI Пачки, проверка свежести SDK, удаление. Терминал, сеть и программы подменены.
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { ApiError, call, DEFAULT_API, resolveApi } from '../src/cli/api.ts';
import { remove } from '../src/cli/commands.ts';
import { CliError, type ExecResult, type Io, type RunResult } from '../src/cli/io.ts';
import { compareVersions, ensureLatest, installCommand } from '../src/cli/update.ts';

type Call = { command: string; args: string[]; env?: Record<string, string>; input?: string };

function fakeIo(
  opts: {
    tty?: boolean;
    answers?: string[];
    run?: (c: Call) => Partial<RunResult>;
    exec?: (c: Call) => Partial<ExecResult>;
    fetch?: (url: string) => Response;
    env?: Record<string, string>;
  } = {},
) {
  const dir = mkdtempSync(join(tmpdir(), 'pachca-app-'));
  const calls: Call[] = [];
  const execs: Call[] = [];
  const answers = [...(opts.answers ?? [])];
  let err = '';
  const io: Io = {
    cwd: dir,
    env: { HOME: dir, ...opts.env },
    tty: opts.tty ?? false,
    err: (t) => void (err += t),
    out: () => {},
    ask: async () => answers.shift() ?? '',
    run: (command, args, o) => {
      const c = { command, args, env: o?.env };
      calls.push(c);
      return { status: 0, stdout: '', missing: false, ...opts.run?.(c) };
    },
    exec: async (command, args, o) => {
      const c = { command, args, env: o?.env, input: o?.input };
      execs.push(c);
      return { status: 0, stdout: '', stderr: '', missing: false, ...opts.exec?.(c) };
    },
    fetch: async (url) => (opts.fetch ?? (() => new Response('{}')))(String(url)),
    sleep: async () => {},
  };
  return { io, dir, calls, execs, err: () => err };
}

const api = { url: DEFAULT_API };
const cliError = (body: object) => ({ status: 1, stderr: `${JSON.stringify(body)}\n` });

describe('CLI Пачки', () => {
  test('не установлен: как поставить и войти', async () => {
    const { io } = fakeIo({ exec: () => ({ missing: true, status: null }) });
    const e = await resolveApi(io, {}).catch((x: unknown) => x);
    expect(e).toBeInstanceOf(CliError);
    expect((e as Error).message).toContain('npm install -g @pachca/cli');
    expect((e as Error).message).toContain('pachca auth login');
  });

  test('старый CLI: обновить; CLI из репозитория (0.0.0) подходит', async () => {
    const old = fakeIo({ exec: () => ({ stdout: '@pachca/cli/2026.11.7 darwin-arm64 node-v22.14.0\n' }) });
    await expect(resolveApi(old.io, {})).rejects.toThrow('pachca upgrade');
    const dev = fakeIo({ exec: () => ({ stdout: '@pachca/cli/0.0.0 darwin-arm64 node-v22.14.0\n' }), env: { PACHCA_API_URL: 'http://127.0.0.1:9/api/' } });
    expect(await resolveApi(dev.io, { profile: 'work' })).toEqual({ url: 'http://127.0.0.1:9/api', profile: 'work' });
  });

  test('запрос: метод, путь, параметры, тело в stdin, профиль; ответ без обёртки data', async () => {
    const { io, execs } = fakeIo({ exec: () => ({ stdout: '{"data":{"version":3}}\n' }) });
    expect(await call(io, { url: 'http://local/api', profile: 'work' }, 'POST', '/apps/x/versions', { code: 'c' })).toEqual({ version: 3 });
    expect(execs[0]).toEqual({
      command: 'pachca',
      args: ['api', 'POST', '/apps/x/versions', '-o', 'json', '--no-input', '--input', '-', '--profile', 'work'],
      env: { PACHCA_API_URL: 'http://local/api' },
      input: '{"code":"c"}',
    });
    await call(io, api, 'GET', '/apps/x/logs?n=10');
    expect(execs[1]!.args).toEqual(['api', 'GET', '/apps/x/logs', '-o', 'json', '--no-input', '--query', 'n=10']);
    expect(execs[1]!.env).toBeUndefined();
  });

  test('пустой ответ (204) это undefined', async () => {
    const { io } = fakeIo({ exec: () => ({ stdout: 'null\n' }) });
    expect(await call(io, api, 'DELETE', '/apps/x')).toBeUndefined();
  });

  test('отказ API: код и payload для version_conflict и consent_required', async () => {
    const { io } = fakeIo({ exec: () => cliError({ error: 'system: Версия не та', code: 409, type: 'PACHCA_API_ERROR', validation_code: 'version_conflict', payload: { version: 5 } }) });
    const e = (await call(io, api, 'POST', '/apps/x/versions', {}).catch((x: unknown) => x)) as ApiError;
    expect(e).toBeInstanceOf(ApiError);
    expect(e).toMatchObject({ status: 409, code: 'version_conflict', payload: { version: 5 } });
  });

  test('нет входа или прав: как войти', async () => {
    const none = fakeIo({ exec: () => cliError({ error: 'Token not found', type: 'PACHCA_AUTH_ERROR', code: null, hint: 'pachca auth login' }) });
    await expect(call(none.io, api, 'GET', '/apps')).rejects.toThrow('Нет входа в CLI Пачки');
    const scope = fakeIo({ exec: () => cliError({ error: 'insufficient_scope', type: 'PACHCA_SCOPE_ERROR', code: 403, scope: 'apps:read' }) });
    await expect(call(scope.io, api, 'GET', '/apps')).rejects.toThrow('нет прав apps:read и apps:write');
  });
});

describe('свежесть SDK', () => {
  test('сравнение CalVer с предрелизом', () => {
    expect(compareVersions('2026.12.1', '2026.12.0')).toBeGreaterThan(0);
    expect(compareVersions('2026.12.0', '2026.9.5')).toBeGreaterThan(0);
    expect(compareVersions('2026.12.1-beta.1', '2026.12.1')).toBeLessThan(0);
    expect(compareVersions('2026.12.1-beta.10', '2026.12.1-beta.2')).toBeGreaterThan(0);
    expect(compareVersions('2026.12.1', '2026.12.1')).toBe(0);
  });

  const registry = (tags: Record<string, string>) => () => new Response(JSON.stringify(tags));

  test('без терминала: команда обновления и остановка', async () => {
    const { io, dir } = fakeIo({ fetch: registry({ latest: '2026.12.2' }) });
    writeFileSync(join(dir, 'package.json'), JSON.stringify({ dependencies: { '@pachca/app-sdk': '2026.12.1', '@pachca/app-react': '2026.12.1' } }));
    const e = await ensureLatest(io, '2026.12.1', ['ship']).catch((x: unknown) => x);
    expect(e).toBeInstanceOf(CliError);
    expect((e as Error).message).toContain('npm install @pachca/app-sdk@2026.12.2 @pachca/app-react@2026.12.2');
  });

  test('в терминале: обновляет менеджером папки и запускает команду заново новой версией', async () => {
    const { io, dir, calls } = fakeIo({ tty: true, answers: [''], fetch: registry({ latest: '2026.12.2' }), run: () => ({ status: 0 }) });
    writeFileSync(join(dir, 'bun.lock'), '');
    expect(await ensureLatest(io, '2026.12.1', ['ship', '--mode', 'staging'])).toBe(0);
    expect(calls[0]).toMatchObject({ command: 'bun', args: ['add', '@pachca/app-sdk@2026.12.2'] });
    expect(calls[1]!.args.slice(-3)).toEqual(['ship', '--mode', 'staging']);
    expect(calls[1]!.env).toEqual({ PACHCA_APP_UPDATED: '1' });
  });

  test('свежая версия, предрелиз, недоступный npm и сборка из репозитория', async () => {
    expect(await ensureLatest(fakeIo({ fetch: registry({ latest: '2026.12.1' }) }).io, '2026.12.1', [])).toBeUndefined();
    const beta = fakeIo({ fetch: registry({ latest: '2026.12.1', next: '2026.12.2-beta.3' }) });
    await expect(ensureLatest(beta.io, '2026.12.2-beta.1', [])).rejects.toThrow('@pachca/app-sdk@2026.12.2-beta.3');
    expect(await ensureLatest(fakeIo({ fetch: registry({ latest: '2026.12.1', next: '2026.12.2-beta.3' }) }).io, '2026.12.1', [])).toBeUndefined();
    const down = fakeIo({ fetch: () => new Response('', { status: 503 }) });
    expect(await ensureLatest(down.io, '2026.12.1', [])).toBeUndefined();
    expect(down.err()).toContain('проверка пропущена');
    expect(await ensureLatest(fakeIo({ fetch: () => { throw new Error('не должен спрашивать npm'); } }).io, '0.0.0', [])).toBeUndefined();
  });

  test('менеджер пакетов по lock-файлу', () => {
    const { dir } = fakeIo();
    expect(installCommand(dir, ['a@1'])).toEqual(['npm', ['install', 'a@1']]);
    writeFileSync(join(dir, 'pnpm-lock.yaml'), '');
    expect(installCommand(dir, ['a@1'])).toEqual(['pnpm', ['add', 'a@1']]);
  });
});

describe('удаление', () => {
  const app = 'k3x9q2m7a1bz';
  const setup = (answers: string[]) => {
    const f = fakeIo({ tty: true, answers, exec: () => ({ stdout: 'null\n' }) });
    writeFileSync(join(f.dir, '.pachca-app.json'), JSON.stringify({ production: { id: app, version: 3 } }));
    const deleted = () => f.execs.filter((c) => c.args[1] === 'DELETE').map((c) => c.args[2]);
    return { ...f, deleted, a: api };
  };

  test('человек вводит id приложения: удалено, папка его забыла', async () => {
    const { io, dir, deleted, a } = setup([app]);
    await remove(io, a, { mode: 'production' });
    expect(deleted()).toEqual([`/apps/${app}`]);
    expect(JSON.parse(readFileSync(join(dir, '.pachca-app.json'), 'utf8'))).toEqual({});
  });

  test('другой ответ отменяет удаление', async () => {
    const { io, deleted, a } = setup(['y']);
    await expect(remove(io, a, { mode: 'production' })).rejects.toThrow('отменено');
    expect(deleted()).toEqual([]);
  });
});
