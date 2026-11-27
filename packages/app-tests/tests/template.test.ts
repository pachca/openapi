// Шаблон из @pachca/app-sdk проходит check и собирается: так начинается каждое новое приложение.
import { build, check, scaffold } from '@pachca/app-sdk/build';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, expect, test } from 'vitest';
import { json, tmp } from './apps.js';

const dir = tmp('template');

beforeAll(() => {
  rmSync(dir, { recursive: true, force: true });
  scaffold(dir, { name: 'Заметки' });
});

test('название подставлено, .gitignore на месте', () => {
  expect(readFileSync(join(dir, 'index.html'), 'utf8')).toContain('<title>Заметки</title>');
  expect(readFileSync(join(dir, '.gitignore'), 'utf8')).toContain('_generated/');
  expect(existsSync(join(dir, 'gitignore'))).toBe(false);
  expect(existsSync(join(dir, 'AGENTS.md'))).toBe(true);
});

test('файлы шаблона не перезаписывает', () => {
  expect(() => scaffold(dir, { name: 'x' })).toThrow('уже есть');
});

test('check проходит', async () => {
  expect(await check(dir)).toEqual({ ok: true, problems: [] });
});

test('собирается: заметки, задание, вебхук и событие Пачки', async () => {
  await build(dir, { skipCheck: true, log: () => {} });
  const fns = json(dir, 'functions.json');
  expect(fns['notes.send'].kind).toBe('job');
  expect(fns['hooks.incoming']).toMatchObject({ kind: 'webhook', body: { required: ['owner', 'text'] } });
  expect(fns['bot.onMessage']).toEqual({ kind: 'pachcaEvent', event: 'message.new' });
  expect(json(dir, 'manifest.json')).toMatchObject({ description: 'Заметки', pachca: { events: ['message.new'] }, webhooks: { incoming: {} } });
});
