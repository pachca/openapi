// Сборка приложения со всеми видами функций, фронтом и файлами: то, что получает платформа.
import { PROTOCOL } from '@pachca/app-sdk';
import { artifact, build, SDK_VERSION } from '@pachca/app-sdk/build';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, test } from 'vitest';
import { app, json } from './apps.js';

const dir = app('tasks');

describe('apps/tasks', () => {
  beforeAll(async () => {
    expect(await build(dir, { log: () => {} })).toMatchObject({ functions: 28, tables: 2, mode: 'production' });
  });

  test('functions.json: виды функций', () => {
    const fns = json(dir, 'functions.json');
    expect([...new Set(Object.values<{ kind: string }>(fns).map((f) => f.kind))].sort()).toEqual([
      'action', 'internalAction', 'internalMutation', 'job', 'mutation', 'pachcaEvent', 'query', 'webhook',
    ]);
  });

  test('functions.json: аргументы и результат как JSON Schema', () => {
    const fns = json(dir, 'functions.json');
    expect(fns['tasks.add'].args.required).toEqual(['text']);
    expect(fns['tasks.add'].args.additionalProperties).toBe(false);
    expect(fns['tasks.toggle'].args.properties.id['x-table']).toBe('tasks');
    expect(fns['tasks.toggle'].returns.type).toBe('boolean');
  });

  test('functions.json: вебхук без аргументов, с телом и проверкой адреса', () => {
    const fns = json(dir, 'functions.json');
    expect('args' in fns['tasks.orders']).toBe(false);
    expect(fns['tasks.crm'].body.required).toEqual(['order_id', 'status']);
    expect(fns['tasks.crm'].verify).toBe(true);
    expect('body' in fns['tasks.orders'] || 'verify' in fns['tasks.orders']).toBe(false);
  });

  test('functions.json: событие Пачки', () => {
    expect(json(dir, 'functions.json')['tasks.onMessage']).toEqual({ kind: 'pachcaEvent', event: 'message.new' });
  });

  test('schema.json: поля, обязательные поля и индекс', () => {
    const tasks = json(dir, 'schema.json').tables.tasks;
    expect(Object.keys(tasks.document.properties).sort()).toEqual(['done', 'image', 'note', 'owner', 'text']);
    expect(tasks.document.required).toEqual(['text', 'done', 'owner']);
    expect(Object.keys(tasks.indexes)).toEqual(['by_owner']);
  });

  test('manifest.json: протокол, версия SDK и база', () => {
    expect(json(dir, 'manifest.json')).toMatchObject({ protocol: PROTOCOL, sdk: SDK_VERSION, db: true });
  });

  test('app.js: один модуль без кода проверки', () => {
    const code = readFileSync(join(dir, 'dist/app.js'), 'utf8');
    expect(code).toMatch(/export\s*\{/);
    expect(code).not.toMatch(/arktype|jitless|node:/);
  });

  test('фронт собран Vite, скрипт с хэшем подключён в index.html', () => {
    expect(readdirSync(join(dir, 'dist/static')).sort()).toEqual(['assets', 'index.html']);
    const js = readdirSync(join(dir, 'dist/static/assets')).find((f) => f.endsWith('.js'));
    expect(readFileSync(join(dir, 'dist/static/index.html'), 'utf8')).toContain(`src="/assets/${js}"`);
  });

  test('артефакт: всё из dist, статика в base64', () => {
    const a = artifact(dir);
    expect(Object.keys(a).sort()).toEqual(['code', 'functions', 'manifest', 'schema', 'static']);
    expect(Buffer.from(a.static['index.html']!, 'base64').toString()).toContain('<div id="root">');
  });
});
