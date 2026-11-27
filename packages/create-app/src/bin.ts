#!/usr/bin/env node
// npm create @pachca/app@latest <папка> -- --name "Название"
import { relative } from 'node:path';
import { parseArgs } from 'node:util';
import { create } from './create.js';

const USAGE = 'npm create @pachca/app@latest <папка> -- --name "Название"';

try {
  const { values, positionals } = parseArgs({ options: { name: { type: 'string' }, help: { type: 'boolean', short: 'h' } }, allowPositionals: true });
  if (values.help || positionals.length !== 1) {
    console.error(USAGE);
    process.exit(values.help ? 0 : 2);
  }
  const dir = await create(positionals[0]!, { name: values.name });
  const cd = relative(process.cwd(), dir) || '.';
  console.error(`
Приложение готово: ${cd}

  cd ${cd}
  npx pachca-app check     проверка типов, прав и хостов
  npx pachca-app ship      сборка и загрузка в Пачку (вход: pachca auth login)

Как устроено приложение и что можно в коде, написано в ${cd}/AGENTS.md.`);
} catch (e) {
  console.error(`\n${(e as Error).message}\n\n${USAGE}`);
  process.exit(1);
}
