// Эталонная сборка: её артефакт лежит в @pachca/app-sdk/contract/build.json, и платформа проверяет, что принимает и выполняет
// его. Изменение артефакта значит, что собранные приложения получают другой формат.
import { artifact, build, SDK_VERSION } from '@pachca/app-sdk/build';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, test } from 'vitest';
import { app } from './apps.js';

const file = createRequire(import.meta.url).resolve('@pachca/app-sdk/contract/build.json');

// Пути модулей в комментариях esbuild зависят от раскладки node_modules, версия SDK от релиза: в эталон они не входят.
function normalized(dir: string) {
  const { static: files, code, manifest, ...rest } = artifact(dir);
  const { sdk, ...mf } = manifest;
  expect(sdk).toBe(SDK_VERSION);
  return { manifest: mf, ...rest, code: code.replace(/^\/\/ .*\n/gm, ''), static: files };
}

test('совпадает с contract/build.json', async () => {
  await build(app('reference'), { log: () => {} });
  const got = normalized(app('reference'));
  if (process.env.UPDATE_CONTRACT) writeFileSync(file, `${JSON.stringify(got, null, 2)}\n`);
  expect(
    got,
    'артефакт эталонной сборки изменился. Если платформа его не примет или выполнит иначе, это подъём версии протокола ' +
      '(PROTOCOL и AppProtocol платформы, см. contract/README.md). Намеренное изменение: UPDATE_CONTRACT=1 bun run test'
  ).toStrictEqual(JSON.parse(readFileSync(file, 'utf8')));
});
