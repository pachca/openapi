import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..', '..', '..');

/**
 * The Kotlin SDK is served by JitPack as `com.github.pachca:openapi:<version>`,
 * and the install snippets name the version explicitly: JitPack lists both
 * `v1.7.0` and `1.7.0`, and Gradle orders `1.7.0` above `v1.8.0`, so
 * `latest.release` stays on an old build. An explicit version goes stale with
 * every SDK release, so this check fails until every snippet names the latest
 * `sdk` release from releases.json. It also refuses the coordinates
 * `com.pachca:pachca-sdk`, under which nothing was ever published.
 */

const FILES = [
  'apps/docs/content/guides/sdk/kotlin.mdx',
  'apps/docs/lib/api-clients.ts',
  'apps/docs/scripts/generate-llms.ts',
  'sdk/kotlin/README.md',
];
const SEARCHED = [
  ...FILES,
  'README.md',
  'README.en.md',
  'apps/docs/content/guides/sdk/overview.mdx',
];

const releases = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'apps/docs/data/releases.json'), 'utf-8')
);
const latest = releases.find((r) => r.product === 'sdk')?.version;
if (!latest) {
  console.error('check-sdk-install: no sdk release in apps/docs/data/releases.json');
  process.exit(1);
}

const errors = [];
for (const file of SEARCHED) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf-8');
  if (text.includes('com.pachca:pachca-sdk')) {
    errors.push(
      `${file}: names com.pachca:pachca-sdk, which JitPack does not serve; use com.github.pachca:openapi`
    );
  }
}
for (const file of FILES) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf-8');
  const versions = [...text.matchAll(/com\.github\.pachca:openapi:([^"`\s)]+)/g)].map((m) => m[1]);
  if (versions.length === 0)
    errors.push(`${file}: no com.github.pachca:openapi:<version> install snippet`);
  for (const v of versions) {
    if (v !== latest)
      errors.push(`${file}: com.github.pachca:openapi:${v}, the latest SDK release is ${latest}`);
  }
}

if (errors.length > 0) {
  console.error(
    'Kotlin SDK install snippets are out of date:\n' + errors.map((e) => `  - ${e}`).join('\n')
  );
  process.exit(1);
}
console.log(`✓ Kotlin SDK install snippets name com.github.pachca:openapi:${latest}`);
