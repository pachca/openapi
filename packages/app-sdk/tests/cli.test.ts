// pachca-app без процесса: вход в терминале и без него, проверка свежести SDK. Терминал, сеть и запуск программ подменены.
import { mkdirSync, mkdtempSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { resolveApi } from '../src/cli/auth.ts';
import { DEFAULT_API } from '../src/cli/api.ts';
import { remove } from '../src/cli/commands.ts';
import { CliError, type Io, type RunResult } from '../src/cli/io.ts';
import { compareVersions, ensureLatest, installCommand } from '../src/cli/update.ts';

type Call = { command: string; args: string[]; env?: Record<string, string> };

function fakeIo(opts: { tty?: boolean; answers?: string[]; run?: (c: Call) => Partial<RunResult>; fetch?: (url: string) => Response; env?: Record<string, string> } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'pachca-app-'));
  const calls: Call[] = [];
  const asked: { prompt: string; hidden?: boolean }[] = [];
  const answers = [...(opts.answers ?? [])];
  let err = '';
  const io: Io = {
    cwd: dir,
    env: { HOME: dir, XDG_CONFIG_HOME: dir, ...opts.env },
    tty: opts.tty ?? false,
    err: (t) => void (err += t),
    out: () => {},
    ask: async (prompt, o) => {
      asked.push({ prompt, hidden: o?.hidden });
      return answers.shift() ?? '';
    },
    run: (command, args, o) => {
      const c = { command, args, env: o?.env };
      calls.push(c);
      return { status: 0, stdout: '', missing: false, ...opts.run?.(c) };
    },
    fetch: async (url) => (opts.fetch ?? (() => new Response('{"data":[]}')))(String(url)),
    sleep: async () => {},
  };
  return { io, dir, calls, asked, err: () => err };
}

const pachcaMissing = (c: Call) => (c.command === 'pachca' ? { missing: true, status: null } : {});

describe('вход', () => {
  test('порядок: --token, PACHCA_TOKEN, сохранённый, pachca auth token', async () => {
    const withEnv = fakeIo({ env: { PACHCA_TOKEN: 'env' } });
    expect(await resolveApi(withEnv.io, { token: 'flag' })).toMatchObject({ token: 'flag', source: 'flag' });
    expect(await resolveApi(withEnv.io, {})).toMatchObject({ token: 'env', source: 'env' });

    const pachca = fakeIo({ run: (c) => (c.command === 'pachca' ? { stdout: 'from-cli\n' } : {}) });
    expect(await resolveApi(pachca.io, { profile: 'work' })).toMatchObject({ token: 'from-cli', source: 'pachca' });
    expect(pachca.calls[0]).toMatchObject({ command: 'pachca', args: ['auth', 'token', '--profile', 'work'] });

  });

  test('сохранённый токен важнее входа pachca', async () => {
    const { io, dir, calls } = fakeIo({ run: () => ({ stdout: 'from-cli' }) });
    mkdirSync(join(dir, 'pachca-app'));
    writeFileSync(join(dir, 'pachca-app', 'credentials.json'), JSON.stringify({ token: 'saved' }));
    expect(await resolveApi(io, {})).toMatchObject({ token: 'saved', source: 'saved' });
    expect(calls).toHaveLength(0);
  });

  test('pachca есть, но вход не выполнен: в терминале предлагает pachca auth login и берёт токен после него', async () => {
    let loggedIn = false;
    const { io, calls } = fakeIo({
      tty: true,
      answers: [''],
      run: (c) => {
        if (c.args[1] === 'login') loggedIn = true;
        return c.args[1] === 'token' ? (loggedIn ? { stdout: 'fresh' } : { status: 3 }) : {};
      },
    });
    expect(await resolveApi(io, {})).toMatchObject({ token: 'fresh', source: 'pachca' });
    expect(calls.map((c) => c.args.join(' '))).toEqual(['auth token', 'auth login', 'auth token']);
  });

  test('pachca нет: выбор «вставить токен» проверяет его, сохраняет с правами 0600 и не показывает', async () => {
    const urls: string[] = [];
    const { io, dir, asked } = fakeIo({ tty: true, answers: ['2', 'pasted'], run: pachcaMissing, fetch: (u) => (urls.push(u), new Response('{"data":[]}')) });
    expect(await resolveApi(io, {})).toMatchObject({ token: 'pasted', source: 'saved' });
    expect(asked.at(-1)!.hidden).toBe(true);
    expect(urls).toEqual(['https://api.pachca.com/api/shared/v1/apps']);
    const file = join(dir, 'pachca-app', 'credentials.json');
    expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({ token: 'pasted' });
    expect(statSync(file).mode & 0o777).toBe(0o600);
  });

  test('pachca нет: выбор «установить» ставит @pachca/cli и входит через него', async () => {
    let installed = false;
    const { io, calls } = fakeIo({
      tty: true,
      answers: ['1'],
      run: (c) => {
        if (c.command === 'npm') installed = true;
        if (c.command !== 'pachca') return {};
        if (!installed) return { missing: true, status: null };
        return c.args[1] === 'token' ? { stdout: 'after-install' } : {};
      },
    });
    expect(await resolveApi(io, {})).toMatchObject({ token: 'after-install' });
    expect(calls.map((c) => `${c.command} ${c.args.join(' ')}`)).toEqual(['pachca auth token', 'npm install -g @pachca/cli', 'pachca auth login', 'pachca auth token']);
  });

  test('без терминала ничего не спрашивает', async () => {
    const { io, asked } = fakeIo({ run: pachcaMissing });
    await expect(resolveApi(io, {})).rejects.toThrow(/npm i -g @pachca\/cli/);
    expect(asked).toHaveLength(0);
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
    const deleted: string[] = [];
    const f = fakeIo({ tty: true, answers, fetch: (u) => (deleted.push(u), new Response(null, { status: 204 })) });
    writeFileSync(join(f.dir, '.pachca-app.json'), JSON.stringify({ production: { id: app, version: 3 } }));
    return { ...f, deleted, a: { url: DEFAULT_API, token: 't', source: 'saved' as const } };
  };

  test('человек вводит id приложения: удалено, папка его забыла', async () => {
    const { io, dir, deleted, a } = setup([app]);
    await remove(io, a, { mode: 'production' });
    expect(deleted).toEqual([`${DEFAULT_API}/apps/${app}`]);
    expect(JSON.parse(readFileSync(join(dir, '.pachca-app.json'), 'utf8'))).toEqual({});
  });

  test('другой ответ отменяет удаление', async () => {
    const { io, deleted, a } = setup(['y']);
    await expect(remove(io, a, { mode: 'production' })).rejects.toThrow('отменено');
    expect(deleted).toEqual([]);
  });
});
