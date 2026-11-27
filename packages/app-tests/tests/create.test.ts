// npm create @pachca/app: папка с package.json на SDK своей версии, шаблон из установленного SDK, проверка проходит.
import { check } from '@pachca/app-sdk/build';
import { create, packageManager, VERSION } from '@pachca/create-app';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, expect, test } from 'vitest';
import { tmp } from './apps.js';

const dir = tmp('Created App');
const installed: string[] = [];

beforeAll(async () => {
  rmSync(dir, { recursive: true, force: true });
  // зависимости уже стоят в node_modules пакета тестов: установка только отмечается
  await create(dir, { name: 'Заметки команды', install: (d) => void installed.push(d), log: () => {} });
});

test('package.json: SDK и хуки ровно своей версии, название для первой загрузки', () => {
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  expect(pkg).toMatchObject({ name: 'created-app', private: true, type: 'module', pachca: { name: 'Заметки команды' } });
  expect(pkg.dependencies['@pachca/app-sdk']).toBe(VERSION);
  expect(pkg.dependencies['@pachca/app-react']).toBe(VERSION);
  expect(Object.keys(pkg.devDependencies)).toContain('vite');
  expect(installed).toEqual([dir]);
});

test('шаблон скопирован после установки, название подставлено', () => {
  expect(readFileSync(join(dir, 'index.html'), 'utf8')).toContain('<title>Заметки команды</title>');
  expect(existsSync(join(dir, '.gitignore'))).toBe(true);
  expect(existsSync(join(dir, 'AGENTS.md'))).toBe(true);
});

test('новое приложение проходит check', async () => {
  expect(await check(dir)).toEqual({ ok: true, problems: [] });
});

test('в непустую папку не создаёт', async () => {
  await expect(create(dir, { install: () => {} })).rejects.toThrow('не пустая');
});

test('менеджер пакетов того, кто запустил create', () => {
  expect(packageManager('pnpm/9.1.0 npm/? node/v22')).toBe('pnpm');
  expect(packageManager('bun/1.3.4 npm/? node/v24')).toBe('bun');
  expect(packageManager('npm/10.9.0 node/v22')).toBe('npm');
  expect(packageManager('')).toBe('npm');
});
