#!/usr/bin/env node
/**
 * Unified release gate for all published packages (CLI, n8n, SDK, generator).
 *
 * A package is published for version V only when ALL hold:
 *   1. V is declared in the portal changelog apps/docs/data/releases.json
 *      (the latest entry for this product) — this is the single source of
 *      the version number.
 *   2. V is NOT yet on npm (no duplicate re-publish).
 *   3. The package code actually changed in this push (HEAD~1..HEAD), so a
 *      portal edit alone doesn't trigger a release.
 *   4. If the package keeps its own changelog (CLI: changelog.json,
 *      n8n: CHANGELOG.md), V must also appear there. SDK/generator have no
 *      own changelog — the portal entry is enough.
 *
 * Usage:
 *   node scripts/check-release.mjs --product cli --npm @pachca/cli \
 *     --dir packages/cli --changelog packages/cli/src/data/changelog.json --changelog-type json
 *
 * Prints to stdout (GITHUB_OUTPUT format):
 *   version=<V>
 *   should_publish=<true|false>
 * Diagnostics go to stderr.
 */

import fs from 'node:fs';
import { execSync } from 'node:child_process';

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const product = arg('product');
const npmPkg = arg('npm');
const dir = arg('dir');
const changelog = arg('changelog');
const changelogType = arg('changelog-type') || 'json';
// Version format rule per library: 'calver' (CLI: YYYY.M.patch) or 'semver'.
const versionRule = arg('version-rule') || 'semver';

/** Validate version string against the library's format rule. */
function validFormat(v) {
  if (versionRule === 'calver') return /^\d{4}\.\d{1,2}\.\d+$/.test(v);
  return /^\d+\.\d+\.\d+$/.test(v);
}

/** Numeric component compare; works for both semver and CalVer (YYYY.M.patch). */
function cmpVersion(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

/**
 * Allowed next versions after `max`, by rule — for diagnostics. Null when
 * `max` is null (first release: any well-formed version allowed).
 */
function allowedNext(max) {
  if (!max) return null;
  if (versionRule === 'calver') {
    const [my, mm, mp] = max.split('.').map(Number);
    return { 'patch (this month)': `${my}.${mm}.${mp + 1}`, 'new month': `${my}.${mm + 1}.0` };
  }
  const [M, m, p] = max.split('.').map(Number);
  return { patch: `${M}.${m}.${p + 1}`, minor: `${M}.${m + 1}.0`, major: `${M + 1}.0.0` };
}

/** Is `version` exactly a valid next step after `max` per the library rule? */
function validIncrement(version, max) {
  if (!max) return true;
  if (versionRule === 'calver') {
    const [vy, vm, vp] = version.split('.').map(Number);
    const [my, mm, mp] = max.split('.').map(Number);
    if (vy === my && vm === mm) return vp === mp + 1; // same month → next patch
    return (vy > my || (vy === my && vm > mm)) && vp === 0; // later month → patch 0
  }
  return Object.values(allowedNext(max)).includes(version);
}

/** Highest version currently published on npm (numeric, ignores pre-release). */
function maxPublished() {
  try {
    const raw = execSync(`npm view ${npmPkg} versions --json`, {
      stdio: ['pipe', 'pipe', 'pipe'],
    }).toString();
    const parsed = JSON.parse(raw);
    const list = (Array.isArray(parsed) ? parsed : [parsed]).filter((v) =>
      v.split('.').every((p) => /^\d+$/.test(p))
    );
    if (list.length === 0) return null;
    return list.sort(cmpVersion).at(-1);
  } catch {
    return null;
  }
}

const releases = JSON.parse(fs.readFileSync('apps/docs/data/releases.json', 'utf-8'));
// releases.json is ordered newest-first; the first entry for a product is its
// current declared version.
const entry = releases.find((r) => r.product === product);

if (!entry) {
  console.error(`[check-release] ${product}: no portal entry in releases.json → skip`);
  console.log('version=');
  console.log('should_publish=false');
  process.exit(0);
}

const version = entry.version;

// Rule 1: version must match the library's format (CLI=CalVer, others=semver).
const formatOk = validFormat(version);

// Rule 2: version must be EXACTLY the valid next step after the latest
// published on npm (per library rule) — not just greater. Forbids skips
// (1.1.4 → 1.1.6), republishes and going backwards. Also yields onNpm.
const published = maxPublished();
const stepOk = validIncrement(version, published);
const onNpm = published !== null && cmpVersion(version, published) <= 0 && (() => {
  try {
    execSync(`npm view ${npmPkg}@${version} version`, { stdio: ['pipe', 'pipe', 'pipe'] });
    return true;
  } catch {
    return false;
  }
})();

// Rule 3: package code changed in this push (ignore script-only churn).
let codeChanged = false;
try {
  const dirs = dir.split(',').map((d) => d.trim());
  const diff = execSync(`git diff --name-only HEAD~1 HEAD -- ${dirs.join(' ')}`, {
    encoding: 'utf-8',
  })
    .split('\n')
    .filter((f) => f && !f.includes('/scripts/'));
  codeChanged = diff.length > 0;
} catch {
  codeChanged = false;
}

// Rule 4: version present in the package's own changelog, when it has one.
let inChangelog = true;
if (changelog) {
  const content = fs.readFileSync(changelog, 'utf-8');
  if (changelogType === 'json') {
    inChangelog = JSON.parse(content).some((e) => e.version === version);
  } else {
    const escaped = version.replace(/[.]/g, '\\.');
    inChangelog = new RegExp(`^##\\s+${escaped}\\b`, 'm').test(content);
  }
}

const shouldPublish = formatOk && stepOk && !onNpm && codeChanged && inChangelog;

console.error(
  `[check-release] ${product}: version=${version} (rule=${versionRule}) ` +
    `formatOk=${formatOk} stepOk=${stepOk} (npm-max=${published ?? 'none'}) ` +
    `onNpm=${onNpm} codeChanged=${codeChanged} inChangelog=${inChangelog} → publish=${shouldPublish}`
);
if (!formatOk) {
  console.error(
    `[check-release] ${product}: version "${version}" violates ${versionRule} format rule`
  );
}
if (!stepOk && !onNpm) {
  const next = allowedNext(published);
  const hint = next
    ? Object.entries(next)
        .map(([k, v]) => `${v} (${k})`)
        .join(', ')
    : '(any well-formed version)';
  console.error(
    `[check-release] ${product}: version "${version}" is not a valid next step after ` +
      `npm ${published}. Allowed: ${hint}`
  );
}
console.log(`version=${version}`);
console.log(`should_publish=${shouldPublish}`);
