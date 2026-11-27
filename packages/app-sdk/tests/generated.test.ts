// src/generated совпадает со спецификацией: типы ctx.pachca, таблица методов платформы и скоупы из одного openapi.yaml.
import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { parse } from 'yaml';
import { generatePachca, scopes, type Spec } from '../scripts/openapi.ts';

const read = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8');
const spec = parse(read('../../spec/openapi.yaml')) as Spec;
const { source, ops } = generatePachca(spec);

test('src/generated собран из текущей packages/spec/openapi.yaml (иначе bun run generate)', () => {
  expect(read('../src/generated/pachca.ts')).toBe(source);
  expect(JSON.parse(read('../src/generated/ops.json'))).toStrictEqual(ops);
  expect(JSON.parse(read('../src/generated/scopes.json'))).toStrictEqual(scopes(spec));
});

test('строка таблицы: метод, путь, скоуп, распаковка ответа', () => {
  expect(ops['messages.createMessage']).toMatchObject({ method: 'POST', path: '/messages', scope: 'messages:create', unwrap: 'data' });
  expect(ops['chats.listChats']).toMatchObject({ method: 'GET', scope: 'chats:read', unwrap: 'full' });
  expect(ops['files.downloadFile']?.unwrap).toBe('binary');
});

test('без скоупа (OAuth, прямая загрузка в хранилище) и параметры загрузки в таблицу не попадают', () => {
  for (const row of Object.values(ops)) expect(row.scope).not.toBe('');
  expect(Object.keys(ops).filter((k) => k.startsWith('files.'))).toStrictEqual(['files.downloadFile']);
});

test('типы: метод с JSDoc, скоупом и аргументами в camelCase', () => {
  expect(source).toContain('createMessage: PachcaOp<"messages:create", false,');
  expect(source).toContain('export interface PachcaApi {');
  expect(source).toMatch(/entityId: number;/);
});

test('имя поля, которое не переводится в camelCase и обратно, роняет генерацию', () => {
  const bad: Spec = {
    paths: {
      '/x': {
        post: {
          operationId: 'X_create',
          'x-requirements': { scope: 'x:write' },
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { a_B: { type: 'string' } } } } } },
          responses: { '204': {} },
        },
      },
    },
    components: { schemas: {} },
  };
  expect(() => generatePachca(bad)).toThrow(/a_B/);
});
