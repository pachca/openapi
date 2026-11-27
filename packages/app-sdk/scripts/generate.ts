// src/generated из packages/spec/openapi.yaml: типы ctx.pachca (pachca.ts), таблица методов платформы (ops.json) и скоупы
// с ролями для проверки манифеста (scopes.json). Платформа берёт ops.json из установленного пакета.
import { readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'yaml';
import { generatePachca, scopes, type Spec } from './openapi.ts';

const spec = parse(readFileSync(new URL('../../spec/openapi.yaml', import.meta.url), 'utf8')) as Spec;
const { source, ops } = generatePachca(spec);
const out = (name: string) => new URL(`../src/generated/${name}`, import.meta.url);
writeFileSync(out('pachca.ts'), source);
writeFileSync(out('ops.json'), JSON.stringify(ops, null, 1) + '\n');
writeFileSync(out('scopes.json'), JSON.stringify(scopes(spec), null, 1) + '\n');
console.log(`src/generated: ${Object.keys(ops).length} методов`);
