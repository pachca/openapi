#!/usr/bin/env node

/**
 * Regenerate all test snapshots by running the generator against each
 * fixture and writing directly into the snapshots/ directory.
 *
 * Usage: tsx bin/regen-snapshots.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { generate, SUPPORTED_LANGS } from '../src/index.js';

const TESTS_DIR = path.resolve(import.meta.dirname, '..', 'tests');
const suites = fs
  .readdirSync(TESTS_DIR)
  .filter((d) => {
    const full = path.join(TESTS_DIR, d);
    return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, 'fixture.yaml'));
  })
  .sort();

for (const suite of suites) {
  const specPath = path.join(TESTS_DIR, suite, 'fixture.yaml');
  const snapshotsDir = path.join(TESTS_DIR, suite, 'snapshots');
  generate(specPath, snapshotsDir, SUPPORTED_LANGS, { examples: true });
  console.log(`  ✓ ${suite}`);
}

console.log(`\nRegenerated ${suites.length} suites.`);
