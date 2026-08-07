#!/usr/bin/env node
/**
 * Build gate: every published package must change its code and its changelog
 * together. Run in `turbo check` / CI.
 *
 * For each package, compared against the merge-base with origin/main:
 *   - code changed  = any file under the package dir changed, EXCEPT its
 *     changelog files (so editing the changelog isn't counted as "code").
 *   - changelog written = the package's entry in apps/docs/data/releases.json
 *     changed, OR a SOURCE changelog of the package changed. Generated
 *     changelogs (e.g. CLI's `CHANGELOG.md`, which is produced from
 *     `changelog.json` by patch-manifest.js on every build) don't count —
 *     a change there alone is a sync-fix, not a new release declaration.
 *
 * Fails if code changed without a changelog entry, OR a changelog entry was
 * added without code changes. This forbids silent, unannounced releases:
 * anything that lands in main and would trigger a publish must carry a
 * changelog the users will see.
 *
 * Override the baseline with CHANGELOG_SYNC_BASE (default: origin/main).
 * Fails when the baseline ref is unavailable (e.g. shallow clone with no
 * origin/main) — CI must fetch origin/main for the check to run. Set
 * CHANGELOG_SYNC_SKIP=1 to bypass deliberately.
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
    // All changelog files — excluded from "code change" detection.
    ownChangelogs: ['packages/cli/CHANGELOG.md', 'packages/cli/src/data/changelog.json'],
    // SOURCE changelogs only — adding a version here declares a new release.
    // `CHANGELOG.md` is generated from `changelog.json` by patch-manifest.js
    // so a diff there alone is a sync-fix, not a new release declaration.
    sourceChangelogs: ['packages/cli/src/data/changelog.json'],
    versionSource: { file: 'packages/cli/src/data/changelog.json', type: 'json' },
  },
  {
    product: 'n8n',
    label: 'n8n',
    dirs: ['integrations/n8n'],
    ownChangelogs: ['integrations/n8n/CHANGELOG.md'],
    // n8n keeps its CHANGELOG.md by hand — no separate source.
    sourceChangelogs: ['integrations/n8n/CHANGELOG.md'],
    versionSource: { file: 'integrations/n8n/CHANGELOG.md', type: 'md' },
  },
  {
    product: 'generator',
    label: 'generator',
    dirs: ['packages/generator', 'packages/openapi-parser'],
    ownChangelogs: [],
    sourceChangelogs: [],
  },
  {
    product: 'sdk',
    label: 'SDK',
    dirs: ['sdk'],
    ownChangelogs: [],
    sourceChangelogs: [],
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

// Compare-relevant entries for a product. Entries marked `backfill: true`
// are excluded — they document versions that were already published before
// (e.g., a release that happened before the changelog-sync gate existed).
// Backfilled entries appear on the public timeline but don't represent a new
// release declaration, so they don't count toward "the changelog changed".
function releasesForProduct(ref, product) {
  try {
    const content = sh(`git show ${ref}:${RELEASES}`);
    return JSON.parse(content)
      .filter((r) => r.product === product)
      .filter((r) => !r.backfill);
  } catch {
    return [];
  }
}

/**
 * Whether the release entries declare a release, rather than just fixing the
 * metadata of one that already shipped.
 *
 * A release slipping past midnight is normal: the entry is written on one day
 * and merged on the next, and the date then has to be corrected. That correction
 * touches no code, so without this the gate would demand a code change for a
 * pure date fix — and the only way to satisfy it would be to invent one.
 *
 * A release is declared when a version appears, disappears, or its list of
 * changes is edited. A date moving on a version that was already there is not.
 */
function declaresRelease(before, after) {
  const byVersion = (list) => new Map(list.map((r) => [r.version, r]));
  const prev = byVersion(before);
  const next = byVersion(after);

  if (prev.size !== next.size) return true;

  for (const [version, entry] of next) {
    const old = prev.get(version);
    if (!old) return true;
    if (JSON.stringify(old.changes) !== JSON.stringify(entry.changes)) return true;
  }
  return false;
}

/**
 * Whether a package's own changelog changed in substance, or only in its dates.
 *
 * Same reason as `declaresRelease`: a release written on one day and merged on
 * the next needs its date corrected, and that correction is not a release.
 * Dates are blanked on both sides before comparing — in the CLI's JSON entries
 * and in the `## 2.0.18 (2026-08-07)` headings of the n8n changelog.
 */
function contentChangedBeyondDate(base, file) {
  const withoutDates = (text) =>
    text.replace(/"date":\s*"[^"]*"/g, '"date":""').replace(/^(##\s+\S+)\s+\([^)]*\)/gm, '$1');

  try {
    return (
      withoutDates(sh(`git show ${base}:${file}`)) !== withoutDates(sh(`git show HEAD:${file}`))
    );
  } catch {
    // A file that is new or gone on either side is a real change.
    return true;
  }
}

const base = resolveBase();
if (!base) {
  // Fail closed. Skipping here turned the whole gate into a no-op whenever the
  // baseline could not be resolved, which is precisely when it is unverifiable.
  if (process.env.CHANGELOG_SYNC_SKIP === '1') {
    console.error(`[changelog-sync] baseline ${BASE_REF} unavailable — skipped (opt-in)`);
    process.exit(0);
  }
  console.error(
    `[changelog-sync] baseline ${BASE_REF} unavailable — cannot verify.\n` +
      `      Run \`git fetch --no-tags origin main\`, point CHANGELOG_SYNC_BASE at a\n` +
      `      reachable ref, or set CHANGELOG_SYNC_SKIP=1 to bypass deliberately.`
  );
  process.exit(1);
}

const errors = [];

for (const pkg of PACKAGES) {
  const all = changedFiles(base, pkg.dirs);
  const code = all.filter((f) => !pkg.ownChangelogs.includes(f));
  const codeChanged = code.length > 0;

  // Use SOURCE changelogs (not all ownChangelogs) for the "written" signal.
  // Editing a generated changelog alone is sync-fixing, not declaring a
  // release — see the comment on `sourceChangelogs` in the PACKAGES table.
  const ownChanged =
    pkg.sourceChangelogs.length > 0 &&
    changedFiles(base, pkg.sourceChangelogs).some((file) => contentChangedBeyondDate(base, file));
  const releasesChanged = declaresRelease(
    releasesForProduct(base, pkg.product),
    releasesForProduct('HEAD', pkg.product)
  );
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
