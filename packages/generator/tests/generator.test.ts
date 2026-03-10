import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { generate, SUPPORTED_LANGS } from '../src/index.js';

const TESTS_DIR = path.resolve(__dirname, '.');
const SUITES = fs.readdirSync(TESTS_DIR).filter((d) => {
  const full = path.join(TESTS_DIR, d);
  return fs.statSync(full).isDirectory() && fs.existsSync(path.join(full, 'fixture.yaml'));
});

function readDirRecursive(dir: string): Map<string, string> {
  const result = new Map<string, string>();
  for (const entry of fs.readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (entry.isFile()) {
      const full = path.join(entry.parentPath, entry.name);
      const rel = path.relative(dir, full);
      result.set(rel, fs.readFileSync(full, 'utf-8'));
    }
  }
  return result;
}

describe('generator', () => {
  let tmpDir: string;

  afterEach(() => {
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  for (const suite of SUITES) {
    it(`generates correct output for ${suite}`, () => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `gen-test-${suite}-`));
      const fixtureDir = path.join(TESTS_DIR, suite);
      const specPath = path.join(fixtureDir, 'fixture.yaml');
      const snapshotsDir = path.join(fixtureDir, 'snapshots');

      generate(specPath, tmpDir, SUPPORTED_LANGS);

      const generated = readDirRecursive(tmpDir);
      const expected = readDirRecursive(snapshotsDir);

      // Same set of files
      expect([...generated.keys()].sort()).toEqual([...expected.keys()].sort());

      // Same content
      for (const [file, content] of expected) {
        expect(generated.get(file), `Mismatch in ${suite}/${file}`).toBe(content);
      }
    });
  }
});
