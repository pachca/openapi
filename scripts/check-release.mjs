#!/usr/bin/env node
/**
 * Unified release gate for all published packages (CLI, n8n, SDK, generator,
 * MCP manifest).
 *
 * A package is published for version V only when ALL hold:
 *   1. V is declared in the portal changelog apps/docs/data/releases.json
 *      (the latest entry for this product) — this is the single source of
 *      the version number. A package released outside the portal passes
 *      `--package-dir <dir>` instead: V is `version` in <dir>/package.json
 *      (MCP manifest).
 *   2. V is NOT yet on npm (no duplicate re-publish), and it is exactly the
 *      next step after the `latest` dist-tag.
 *   3. If the package keeps its own changelog (CLI: changelog.json,
 *      n8n: CHANGELOG.md, with `--package-dir`: <dir>/CHANGELOG.md), V must
 *      also appear there. SDK and generator have no own changelog — the
 *      portal entry is enough.
 *   4. The package already exists on npm. Trusted publishing cannot create a
 *      package, so a first publish from CI would fail with a 404: the gate
 *      skips it with `first_publish=true`, and the package is bootstrapped by
 *      hand with scripts/npm-bootstrap.mjs (see docs/releases.md).
 *
 * Whether the package code changed in this very push is deliberately NOT a
 * condition. It used to be, and it made a failed publish unrecoverable: the
 * version stayed declared in the changelog and missing from npm, while every
 * later push that did not touch the package skipped it, and the next one that
 * did would carry a higher version. Rules 1, 2 and 3 already keep a stray
 * publish from happening; dropping this one lets the next push to main finish
 * a release that broke halfway.
 *
 * Usage:
 *   node scripts/check-release.mjs --product cli --npm @pachca/cli \
 *     --dir packages/cli --changelog packages/cli/src/data/changelog.json --changelog-type json
 *   node scripts/check-release.mjs --product mcp-manifest --npm @pachca/mcp-manifest \
 *     --package-dir packages/mcp-manifest
 *
 * Prints to stdout (GITHUB_OUTPUT format):
 *   version=<V>
 *   should_publish=<true|false>
 *   first_publish=<true|false>
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
// A package released outside the portal: version from its package.json,
// changelog check against its CHANGELOG.md (unless --changelog says otherwise).
const packageDir = arg('package-dir');
const changelog = arg('changelog') ?? (packageDir ? `${packageDir}/CHANGELOG.md` : undefined);
const changelogType = arg('changelog-type') || (packageDir && !arg('changelog') ? 'md' : 'json');
// Version format rule per library: 'calver' (CLI: YYYY.M.patch) or 'semver'.
const versionRule = arg('version-rule') || 'semver';

/** Validate version string against the library's format rule. */
function validFormat(v) {
  // CalVer month must be a real month — `\d{1,2}` accepted 2026.13.0, which is
  // exactly what the (previously broken) new-month hint used to suggest.
  if (versionRule === 'calver') return /^\d{4}\.(1[0-2]|[1-9])\.\d+$/.test(v);
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
    // December rolls over to January of the next year, not to month 13.
    const [ny, nm] = mm >= 12 ? [my + 1, 1] : [my, mm + 1];
    return { 'patch (this month)': `${my}.${mm}.${mp + 1}`, 'new month': `${ny}.${nm}.0` };
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
/**
 * The current `latest` dist-tag — the base for the next-version step. NOT the
 * semver-max of all versions: a package may carry stray higher versions that
 * are not `latest` (e.g. @pachca/sdk has abandoned 2.0.0/3.0.0 while latest is
 * 1.0.19). Stepping from semver-max would force a jump onto the stray line.
 */
/**
 * "Package is genuinely unpublished" vs "npm did not answer".
 *
 * Both used to be swallowed into `null`, and `null` means "first release —
 * any version allowed". So during an npm outage a version that skips a step
 * sailed through the gate. Fail closed instead: only a real E404 counts as
 * unpublished.
 */
function npmUnreachable(error) {
  const stderr = String(error?.stderr ?? error?.message ?? error);
  if (/E404|code E404|404 Not Found/.test(stderr)) return false;
  console.error(`[check-release] npm unreachable for ${npmPkg}: ${stderr.slice(0, 300)}`);
  return true;
}

function latestPublished() {
  try {
    const v = execSync(`npm view ${npmPkg} version`, {
      stdio: ['pipe', 'pipe', 'pipe'],
    })
      .toString()
      .trim();
    return v || null;
  } catch (error) {
    if (npmUnreachable(error)) process.exit(1);
    return null;
  }
}

/** All published versions — used to reject re-publishing an already-taken number. */
function allPublishedVersions() {
  try {
    const raw = execSync(`npm view ${npmPkg} versions --json`, {
      stdio: ['pipe', 'pipe', 'pipe'],
    }).toString();
    const parsed = JSON.parse(raw);
    return (Array.isArray(parsed) ? parsed : [parsed]).map(String);
  } catch (error) {
    if (npmUnreachable(error)) process.exit(1);
    return [];
  }
}

/** The declared version: package.json with --package-dir, releases.json otherwise. */
function declaredVersion() {
  if (packageDir) {
    const pkg = JSON.parse(fs.readFileSync(`${packageDir}/package.json`, 'utf-8'));
    if (pkg.name !== npmPkg) {
      console.error(
        `[check-release] ${product}: ${packageDir}/package.json is "${pkg.name}", not ${npmPkg}`
      );
      process.exit(1);
    }
    return pkg.version || null;
  }
  const releases = JSON.parse(fs.readFileSync('apps/docs/data/releases.json', 'utf-8'));
  // releases.json is ordered newest-first; the first entry for a product is its
  // current declared version.
  return releases.find((r) => r.product === product)?.version ?? null;
}

const version = declaredVersion();

if (!version) {
  const source = packageDir ? `${packageDir}/package.json` : 'releases.json';
  console.error(`[check-release] ${product}: no version declared in ${source} → skip`);
  console.log('version=');
  console.log('should_publish=false');
  console.log('first_publish=false');
  process.exit(0);
}

// Rule 1: version must match the library's format (CLI=CalVer, others=semver).
const formatOk = validFormat(version);

// Rule 2: version must be EXACTLY the valid next step after the current
// `latest` dist-tag (per library rule) — not just greater. Forbids skips
// (1.1.4 → 1.1.6), republishes and going backwards.
const published = latestPublished();
const stepOk = validIncrement(version, published);
// onNpm: this exact version number is already taken (can't republish), even
// if it's a stray higher version not on `latest`.
const onNpm = allPublishedVersions().includes(version);

// Rule 3: version present in the package's own changelog, when it has one.
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

// Rule 4: the package exists on npm. Only a real E404 gets here as null.
const firstPublish = published === null;

const shouldPublish = formatOk && stepOk && !onNpm && inChangelog && !firstPublish;

console.error(
  `[check-release] ${product}: version=${version} (rule=${versionRule}) ` +
    `formatOk=${formatOk} stepOk=${stepOk} (npm-latest=${published ?? 'none'}) ` +
    `onNpm=${onNpm} inChangelog=${inChangelog} firstPublish=${firstPublish} → publish=${shouldPublish}`
);
if (firstPublish) {
  const bootstrapDir = packageDir ?? dir?.split(',')[0] ?? '<package-dir>';
  console.error(
    `[check-release] ${product}: ${npmPkg} is not on npm yet, and trusted publishing cannot ` +
      `create a package. First publish: run \`node scripts/npm-bootstrap.mjs ${bootstrapDir}\`, ` +
      `add the trusted publisher on npmjs.com, then run this workflow (docs/releases.md).`
  );
}
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
console.log(`first_publish=${firstPublish}`);
