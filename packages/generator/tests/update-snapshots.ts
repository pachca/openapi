import * as fs from 'node:fs';
import * as path from 'node:path';
import { generate, SUPPORTED_LANGS } from '../src/index.js';

const testsDir = path.resolve(import.meta.dirname);
const suites = fs.readdirSync(testsDir).filter((d) => {
  const full = path.join(testsDir, d);
  return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, 'fixture.yaml'));
});

for (const suite of suites) {
  const snapshotsDir = path.join(testsDir, suite, 'snapshots');
  fs.rmSync(snapshotsDir, { recursive: true, force: true });
  generate(path.join(testsDir, suite, 'fixture.yaml'), snapshotsDir, SUPPORTED_LANGS, { examples: true });
  console.log(`Updated: ${suite}`);
}
