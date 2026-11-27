#!/usr/bin/env node
// npm create @pachca/app@latest <папка> -- --name "Название"
import { spawnSync } from 'node:child_process';
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
${cliSetup()}
  cd ${cd}
  npx pachca-app check     проверка типов, прав и хостов
  npx pachca-app ship      сборка и загрузка в Пачку

Как устроено приложение и что можно в коде, написано в ${cd}/AGENTS.md.`);
} catch (e) {
  console.error(`\n${(e as Error).message}\n\n${USAGE}`);
  process.exit(1);
}

/** Загрузка идёт через вход CLI Пачки: если его нет, сначала показать, как поставить CLI и войти. */
function cliSetup(): string {
  const opts = { encoding: 'utf8' as const, stdio: ['ignore', 'pipe', 'pipe'] as ['ignore', 'pipe', 'pipe'], shell: process.platform === 'win32' };
  const installed = !spawnSync('pachca', ['--version'], opts).error;
  const login = '  pachca auth login        вход владельца или администратора пространства\n';
  if (!installed) return `\nЗагрузка идёт через CLI Пачки, поставьте его и войдите:\n\n  npm install -g @pachca/cli\n${login}`;
  if (spawnSync('pachca', ['auth', 'status', '-o', 'json'], opts).status !== 0) return `\nЗагрузка идёт через вход CLI Пачки, войдите:\n\n${login}`;
  return '';
}
