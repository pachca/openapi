// check ловит ошибки до загрузки: типы, скоупы, хосты, импорты, которых нет в workerd. Каждый случай на испорченной копии.
import { build, check } from '@pachca/app-sdk/build';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { app, copy, patch } from './apps.js';

const TASKS = 'server/tasks.ts';
const SCREEN = 'src/screens/Tasks.tsx';
const JOBS = 'src/screens/Jobs.tsx';

// [что ломаем, файл, было, стало, часть сообщения (необязательно)]
const cases: [string, string, string, string, string?][] = [
  ['неверный тип аргумента', SCREEN, 'await add({ text, image });', 'await add({ text: 42, image });'],
  ['лишнее поле документа', TASKS, 'owner: ctx.actor.id, note: args.note', 'owner: ctx.actor.id, nope: 1'],
  ['запись в query', TASKS, 'const tasks = await ctx.db.query("tasks")', 'await ctx.db.insert("tasks", { text: "x", done: false, owner: "a" }); const tasks = await ctx.db.query("tasks")'],
  ['несуществующая функция', SCREEN, 'api.tasks.toggle', 'api.tasks.missing'],
  ['несуществующий индекс', TASKS, '"by_owner", (q)', '"by_nothing", (q)'],
  ['eq по полю вне индекса', TASKS, '(q) => q.eq("owner", ctx.actor?.id ?? "")).collect()', '(q) => q.eq("text", "a")).collect()'],
  ['action пишет в базу', TASKS, 'handler: (ctx) => ({ id: ctx.actor?.id ?? null, app: ctx.app })', 'handler: (ctx) => ctx.db.insert("tasks", { text: "x", done: false, owner: "a" })'],
  ['useJob принимает только задание', JOBS, 'useJob(api.tasks.sendJob)', 'useJob(api.tasks.add)'],
  ['аргументы задания типизированы', JOBS, 'send.start({ text, mode, ms: 1500 })', 'send.start({ text, mode, ms: "долго" })'],
  ['результат не по returns', TASKS, 'return !task.done;', 'return "yes";'],
  ['число вместо id таблицы', TASKS, 'await ctx.db.get("tasks", args.id)', 'await ctx.db.get("tasks", 5)'],
  ['v.file() принимает только uuid файла', SCREEN, 'await add({ text, image });', 'await add({ text, image: "x" });'],
  ['generateUploadUrl нет у запроса', TASKS, 'return Promise.all(tasks.map(', 'await ctx.files.generateUploadUrl({ filename: "a", size: 1, contentType: "a/b" }); return Promise.all(tasks.map('],
  ['неизвестный скоуп', 'manifest.ts', 'pachca: { events:', 'pachca: { bot: ["messages:nope"], events:', 'скоупа messages:nope нет в API Пачки'],
  ['голая * в browser', 'manifest.ts', 'pachca: { events:', 'browser: ["*"], pachca: { events:', 'голая * открыла бы любой хост'],
  ['модуль Node в функции', TASKS, 'import { AppError', 'import { readFileSync } from "node:fs";\nexport const leak = () => readFileSync;\nimport { AppError', 'server/tasks.ts: импорт node:fs недоступен на платформе'],
  ['встроенный модуль Node без node:', TASKS, 'import { AppError', 'import { join } from "path";\nexport const leak = () => join;\nimport { AppError', 'server/tasks.ts: импорт path недоступен на платформе'],
];

describe('check', () => {
  test('чистое приложение проходит', async () => {
    expect(await check(app('tasks'))).toEqual({ ok: true, problems: [] });
  });

  test.concurrent.each(cases)('%s', async (name, file, from, to, message) => {
    const dir = copy('tasks', `check-${cases.findIndex((c) => c[0] === name)}`);
    patch(dir, file, from, to);
    const r = await check(dir);
    expect(r.ok).toBe(false);
    if (message) expect(r.problems.join('\n')).toContain(message);
  });
});

describe('build отказывает', () => {
  test('без index.html', async () => {
    const dir = copy('tasks', 'no-index');
    rmSync(join(dir, 'index.html'));
    await expect(build(dir, { skipCheck: true, log: () => {} })).rejects.toThrow('нужен index.html');
  });

  test('inline-скрипт в index.html', async () => {
    const dir = copy('tasks', 'inline-script');
    patch(dir, 'index.html', '<div id="root"></div>', '<div id="root"></div><script>alert(1)</script>');
    await expect(build(dir, { skipCheck: true, log: () => {} })).rejects.toThrow('inline-скрипт заблокирует CSP');
  });

  test('модуль Node даже без check', async () => {
    const dir = copy('tasks', 'build-node');
    patch(dir, TASKS, 'import { AppError', 'import { readFileSync } from "node:fs";\nexport const leak = () => readFileSync;\nimport { AppError');
    await expect(build(dir, { skipCheck: true, log: () => {} })).rejects.toThrow('импорт node:fs недоступен');
  });
});
