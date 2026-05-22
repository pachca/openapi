#!/usr/bin/env node
/**
 * Build gate: every published package must change its code and its changelog
 * together. Run in `turbo check` / CI.
 *
 * For each package, compared against the merge-base with origin/main:
 *   - code changed  = any file under the package dir changed, EXCEPT its own
 *     changelog files (so updating the changelog isn't counted as "code").
 *   - changelog written = the package's entry in apps/docs/data/releases.json
 *     changed, OR (for packages that keep one) its own changelog changed.
 *
 * Fails if code changed without a changelog entry, OR a changelog entry was
 * added without code changes. This forbids silent, unannounced releases:
 * anything that lands in main and would trigger a publish must carry a
 * changelog the users will see.
 *
 * Override the baseline with CHANGELOG_SYNC_BASE (default: origin/main).
 * Skips silently when the baseline ref is unavailable (e.g. shallow clone
 * with no origin/main) — CI must fetch origin/main for the check to run.
 */

import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const RELEASES = 'apps/docs/data/releases.json';
const BASE_REF = process.env.CHANGELOG_SYNC_BASE || 'origin/main';

const PACKAGES = [
  {
    product: 'cli',
    label: 'CLI',
    dirs: ['packages/cli'],
    ownChangelogs: ['packages/cli/CHANGELOG.md', 'packages/cli/src/data/changelog.json'],
    // Source of the package's own declared version, to cross-check releases.json.
    versionSource: { file: 'packages/cli/src/data/changelog.json', type: 'json' },
  },
  {
    product: 'n8n',
    label: 'n8n',
    dirs: ['integrations/n8n'],
    ownChangelogs: ['integrations/n8n/CHANGELOG.md'],
    versionSource: { file: 'integrations/n8n/CHANGELOG.md', type: 'md' },
  },
  {
    product: 'generator',
    label: 'generator',
    dirs: ['packages/generator', 'packages/openapi-parser'],
    ownChangelogs: [],
  },
  {
    product: 'sdk',
    label: 'SDK',
    dirs: ['sdk'],
    ownChangelogs: [],
  },
];

/** Latest version declared in releases.json for a product. */
function releasesVersion(product) {
  try {
    const r = JSON.parse(readFileSync(RELEASES, 'utf-8')).find((x) => x.product === product);
    return r ? r.version : null;
  } catch {
    return null;
  }
}

/** Latest version declared in the package's own changelog. */
function ownChangelogVersion(versionSource) {
  try {
    const content = readFileSync(versionSource.file, 'utf-8');
    if (versionSource.type === 'json') {
      return JSON.parse(content)[0]?.version ?? null;
    }
    const m = content.match(/^##\s+(\d+\.\d+\.\d+|\d{4}\.\d{1,2}\.\d+)\b/m);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

function resolveBase() {
  try {
    return sh(`git merge-base ${BASE_REF} HEAD`);
  } catch {
    try {
      // base ref exists but no common ancestor found — compare directly
      sh(`git rev-parse ${BASE_REF}`);
      return BASE_REF;
    } catch {
      return null;
    }
  }
}

function changedFiles(base, paths) {
  const out = sh(`git diff --name-only ${base} HEAD -- ${paths.join(' ')}`);
  return out ? out.split('\n').filter(Boolean) : [];
}

function releasesForProduct(ref, product) {
  try {
    const content = sh(`git show ${ref}:${RELEASES}`);
    return JSON.parse(content).filter((r) => r.product === product);
  } catch {
    return [];
  }
}

const base = resolveBase();
if (!base) {
  console.error(
    `[changelog-sync] baseline ${BASE_REF} unavailable — skipping (fetch origin/main in CI to enable)`
  );
  process.exit(0);
}

const errors = [];

for (const pkg of PACKAGES) {
  const all = changedFiles(base, pkg.dirs);
  const code = all.filter((f) => !pkg.ownChangelogs.includes(f));
  const codeChanged = code.length > 0;

  const ownChanged =
    pkg.ownChangelogs.length > 0 && changedFiles(base, pkg.ownChangelogs).length > 0;
  const releasesChanged =
    JSON.stringify(releasesForProduct(base, pkg.product)) !==
    JSON.stringify(releasesForProduct('HEAD', pkg.product));
  const changelogWritten = ownChanged || releasesChanged;

  const changelogTargets = [`${RELEASES} (product "${pkg.product}")`, ...pkg.ownChangelogs].join(
    ' and/or '
  );

  if (codeChanged && !changelogWritten) {
    errors.push(
      `${pkg.label}: code changed (${code.length} file(s), e.g. ${code[0]}) but no changelog entry.\n` +
        `      Add a release entry in ${changelogTargets}, or revert the package change.`
    );
  }
  if (changelogWritten && !codeChanged) {
    errors.push(
      `${pkg.label}: changelog updated but no code change in ${pkg.dirs.join(', ')}.\n` +
        `      Remove the changelog entry, or make the corresponding code change.`
    );
  }

  // Version consistency: releases.json must agree with the package's own
  // changelog (so the published version is unambiguous, not "any number").
  if (pkg.versionSource) {
    const relV = releasesVersion(pkg.product);
    const ownV = ownChangelogVersion(pkg.versionSource);
    if (relV && ownV && relV !== ownV) {
      errors.push(
        `${pkg.label}: version mismatch — releases.json says "${relV}" but ` +
          `${pkg.versionSource.file} says "${ownV}". Make them agree.`
      );
    }
  }
}

if (errors.length > 0) {
  console.error('\n✗ changelog sync check failed:\n');
  for (const e of errors) console.error(`  • ${e}\n`);
  console.error(
    'Every change to a published package must ship with a changelog entry the\n' +
      'users will see (and vice versa). This blocks silent, unannounced releases.\n'
  );
  process.exit(1);
}

console.log(`✓ changelog sync OK (baseline ${BASE_REF})`);
