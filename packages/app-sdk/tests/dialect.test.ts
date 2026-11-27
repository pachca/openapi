import { test } from 'vitest';
import ctxFixture from '../contract/ctx.json' with { type: 'json' };
import dialect from '../contract/dialect.json' with { type: 'json' };
import files from '../contract/files.json' with { type: 'json' };
import { v, type Validator } from '../src/server.ts';
import { ctx, upload } from './ctx.ts';
import { same } from './contract.ts';

const built: Record<string, Validator> = {
  'string()': v.string(),
  'number()': v.number(),
  'boolean()': v.boolean(),
  'file()': v.file(),
  'id("tasks")': v.id('tasks'),
  'ref("tasks")': v.ref('tasks'),
  'optional(string())': v.optional(v.string()),
  'array(id("tasks"))': v.array(v.id('tasks')),
  'object({ text: string(), note: optional(string()) })': v.object({ text: v.string(), note: v.optional(v.string()) }),
  'object({})': v.object({}),
};

test('v строит JSON Schema из dialect.json', () => {
  same('dialect.json', 'список значений', dialect.values.map((c) => c.v), Object.keys(built));
  for (const c of dialect.values) {
    same('dialect.json', `v.${c.v}`, { schema: built[c.v]!.schema, optional: built[c.v]!.optional }, { schema: c.schema, optional: c.optional });
  }
});

test('ключевые слова диалекта: ровно те, что встречаются в схемах', () => {
  const seen = new Set<string>();
  const walk = (s: unknown) => {
    if (!s || typeof s !== 'object') return;
    for (const [k, val] of Object.entries(s)) {
      seen.add(k);
      if (k === 'properties') for (const p of Object.values(val as object)) walk(p);
      if (k === 'items') walk(val);
    }
  };
  for (const c of Object.values(built)) walk(c.schema);
  same('dialect.json', 'ключевые слова', [...seen].sort(), dialect.keywords);
});

test('состав ctx по видам функций (ctx.json)', () => {
  same('ctx.json', 'ctx', ctx, ctxFixture);
});

test('сессия загрузки файла (files.json)', () => {
  same('files.json', 'способы загрузки', upload.strategies, [...files.strategies].sort());
  same('files.json', 'поля запроса generateUploadUrl', Object.keys(files.request).every((k) => upload.request.includes(k)), true);
  for (const [name, s] of Object.entries(files.sessions)) {
    same('files.json', `${name}: поля сессии`, Object.keys(s).every((k) => upload.session.includes(k)), true);
    same('files.json', `${name}: способы из списка`, s.strategy.every((x) => files.strategies.includes(x)), true);
    const p = (s as { presignedUpload?: object }).presignedUpload;
    if (p) same('files.json', `${name}: поля presignedUpload`, Object.keys(p).sort(), upload.presigned);
  }
});
