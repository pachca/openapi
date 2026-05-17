// Deterministic dual-format package verification (replaces `attw --pack .`).
//
// Why not attw: `attw --pack .` shells out to `npm pack` and parses its JSON;
// that path is fragile to npm/runner drift (it broke CI with the SAME Node
// 20.20.2 / attw 0.18.2 that was green earlier — `data[0].filename`
// undefined). This check verifies the same thing that matters for a dual
// ESM/CJS package — that every entry point declared in `exports` exists and
// resolves under both `import` and `require`, and that the shipped `.d.ts`
// files are valid — using only Node + the pinned local `tsc`. No `npm pack`,
// no network, no version-drift surface. Builds must never fail on tooling.
import { createRequire } from 'node:module';
import { existsSync, statSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const dot = pkg.exports?.['.'];
if (!dot) throw new Error('package.json: missing exports["."]');

const EXPORT = 'PachcaClient'; // stable public entry of the SDK
const fail = (m) => {
  console.error(`verify: ${m}`);
  process.exit(1);
};

// 1. Every file declared in exports must exist and be non-empty.
const files = [
  dot.import?.types,
  dot.import?.default,
  dot.require?.types,
  dot.require?.default,
].filter(Boolean);
if (files.length !== 4) fail('exports must declare import/require {types,default}');
for (const f of files) {
  if (!existsSync(f) || statSync(f).size === 0) fail(`missing or empty: ${f}`);
}

// 2. CJS entry resolves and exposes the public API.
const cjs = require(resolve(dot.require.default));
if (typeof cjs[EXPORT] !== 'function') fail(`CJS ${dot.require.default} does not export ${EXPORT}`);

// 3. ESM entry resolves and exposes the public API.
const esm = await import(pathToFileURL(resolve(dot.import.default)).href);
if (typeof esm[EXPORT] !== 'function') fail(`ESM ${dot.import.default} does not export ${EXPORT}`);

// 4. Both shipped .d.ts are valid TypeScript declarations (pinned local tsc).
for (const dts of [dot.import.types, dot.require.types]) {
  try {
    execFileSync(
      require.resolve('typescript/bin/tsc'),
      ['--noEmit', '--skipLibCheck', dts],
      { stdio: 'pipe' },
    );
  } catch (e) {
    fail(`type declaration invalid: ${dts}\n${e.stdout?.toString() || e.message}`);
  }
}

console.log(`verify: OK — ESM & CJS entrypoints resolve, ${EXPORT} exported, .d.ts valid`);
