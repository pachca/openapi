#!/usr/bin/env node
/**
 * Creates a new package on npm, so that trusted publishing can be set up for it.
 *
 * npm configures a trusted publisher (OIDC from GitHub Actions) only for a
 * package that already exists on the registry, so CI cannot make the first
 * publish of a new package. This script makes the package exist: it publishes
 * a placeholder 0.0.0 under the package's name from a temporary directory,
 * with the user's own npm login (npm asks for the second factor). Nothing in
 * the repository is touched. The first real version is then published by the
 * package's workflow, like every later one.
 *
 * Usage:
 *   node scripts/npm-bootstrap.mjs <package-dir> [--workflow <file.yml>] [--dry-run]
 *
 *   <package-dir>  the directory with the new package's package.json
 *   --workflow     the workflow file that publishes the package, when it
 *                  cannot be told by the package name in .github/workflows
 *   --dry-run      everything except the upload: runs `npm publish --dry-run`
 *
 * Refuses when the package already exists on npm, or when npm does not answer.
 * The whole procedure: docs/releases.md, «Новый пакет в npm».
 */

import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const WORKFLOWS = path.join(ROOT, '.github', 'workflows');
const PLACEHOLDER = '0.0.0';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const workflowIndex = args.indexOf('--workflow');
const workflowArg = workflowIndex >= 0 ? args[workflowIndex + 1] : undefined;
const positional = args.filter(
  (a, i) => !a.startsWith('--') && !(workflowIndex >= 0 && i === workflowIndex + 1)
);

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

if (positional.length !== 1) {
  fail('usage: node scripts/npm-bootstrap.mjs <package-dir> [--workflow <file.yml>] [--dry-run]');
}

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

/** Runs npm and returns stdout, or throws with npm's stderr attached. */
// Always the public registry: a mirror in the user's npm config must not get the
// placeholder or answer whether the name is taken.
const REGISTRY = 'https://registry.npmjs.org/';

function npm(npmArgs) {
  return execFileSync(npmCmd, [...npmArgs, '--registry', REGISTRY], { stdio: ['ignore', 'pipe', 'pipe'] })
    .toString()
    .trim();
}

// 1. The package to create.
const pkgDir = path.resolve(positional[0]);
const pkgFile = path.join(pkgDir, 'package.json');
if (!fs.existsSync(pkgFile)) fail(`${pkgFile} not found`);
const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
const name = pkg.name;
if (!name) fail(`${pkgFile} has no "name"`);
if (pkg.private) fail(`${name} is "private": true, it is not published to npm`);
const firstReal = pkg.version && pkg.version !== PLACEHOLDER ? pkg.version : null;

// 2. It must not exist yet. Only a real E404 counts as "not on npm".
try {
  npm(['view', name, 'name']);
  fail(
    `${name} is already on npm. Bootstrap is only for a package that does not exist yet:\n` +
      `  add the trusted publisher in its settings on npmjs.com instead (docs/releases.md).`
  );
} catch (error) {
  const stderr = String(error?.stderr ?? error?.message ?? error);
  if (!/E404|404 Not Found/.test(stderr)) {
    fail(`npm did not answer for ${name}:\n${stderr.slice(0, 500)}`);
  }
}

// 3. Where the trusted publisher points: the repository and the workflow.
function githubRepo() {
  const fromPkg = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
  let url = fromPkg;
  if (!url) {
    try {
      url = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: ROOT }).toString();
    } catch {
      url = '';
    }
  }
  const m = String(url).match(/github\.com[/:]([^/]+)\/([^/#]+?)(?:\.git)?(?:[/#].*)?\s*$/);
  if (!m) fail(`cannot tell the GitHub repository of ${name}: set "repository" in ${pkgFile}`);
  return { owner: m[1], repo: m[2] };
}

function publishingWorkflow() {
  if (workflowArg) {
    const file = path.join(WORKFLOWS, path.basename(workflowArg));
    if (!fs.existsSync(file)) fail(`${file} not found`);
    return file;
  }
  const files = fs.existsSync(WORKFLOWS)
    ? fs
        .readdirSync(WORKFLOWS)
        .filter((f) => /\.ya?ml$/.test(f))
        .map((f) => path.join(WORKFLOWS, f))
    : [];
  const found = files.filter((file) => {
    const text = fs.readFileSync(file, 'utf8');
    return text.includes(name) && text.includes('npm publish');
  });
  if (found.length !== 1) {
    const list = found.map((f) => path.basename(f)).join(', ') || 'none';
    fail(
      `cannot tell which workflow publishes ${name} (matching: ${list}).\n` +
        `  Pass --workflow <file.yml>.`
    );
  }
  return found[0];
}

const { owner, repo } = githubRepo();
const workflowFile = publishingWorkflow();
const workflow = path.basename(workflowFile);
const workflowTitle =
  fs.readFileSync(workflowFile, 'utf8').match(/^name:\s*["']?(.+?)["']?\s*$/m)?.[1] ?? workflow;

// 4. The user's own npm login. A dry run needs none.
if (!dryRun) {
  try {
    console.log(`npm user: ${npm(['whoami'])}`);
  } catch {
    fail('not logged in to npm: run `npm login` first');
  }
}

// 5. The placeholder, built and published in a temporary directory.
const install = firstReal ? `${name}@^${firstReal.split('.')[0]}` : name;
const readme = `# ${name}

Version ${PLACEHOLDER} is a bootstrap placeholder with no content. It exists only
so that npm trusted publishing could be set up for this package: npm sets up a
trusted publisher only for a package that is already on the registry.

${
  firstReal
    ? `The first real version is ${firstReal}, published from CI. Install it with:`
    : 'Real versions are published from CI. Install the latest one with:'
}

\`\`\`sh
npm install ${install}
\`\`\`
${pkg.homepage ? `\nSource and documentation: ${pkg.homepage}\n` : ''}`;

const placeholder = {
  name,
  version: PLACEHOLDER,
  description: `Bootstrap placeholder of ${name} with no content: use ${
    firstReal ? `${firstReal} or later` : 'a later version'
  }`,
  ...(pkg.license ? { license: pkg.license } : {}),
  ...(pkg.homepage ? { homepage: pkg.homepage } : {}),
  ...(pkg.repository ? { repository: pkg.repository } : {}),
};

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'npm-bootstrap-'));
let status;
try {
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify(placeholder, null, 2) + '\n');
  fs.writeFileSync(path.join(tmp, 'README.md'), readme);
  const publishArgs = ['publish', '--access', 'public', '--tag', 'latest', '--ignore-scripts', '--registry', REGISTRY];
  if (dryRun) publishArgs.push('--dry-run');
  console.log(`\n$ npm ${publishArgs.join(' ')}   # ${name}@${PLACEHOLDER}, from ${tmp}\n`);
  status = spawnSync(npmCmd, publishArgs, { cwd: tmp, stdio: 'inherit' }).status;
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
if (status !== 0) fail(`npm publish exited with ${status}`);

// 6. What is left to do.
console.log(
  dryRun
    ? `\nDry run: nothing was published. Without --dry-run, ${name}@${PLACEHOLDER} goes to npm.`
    : `\n✓ ${name}@${PLACEHOLDER} is on npm as a bootstrap placeholder.`
);
console.log(`
Next steps:

  1. Add the trusted publisher: https://www.npmjs.com/package/${name}/access
     Trusted Publisher → GitHub Actions:
       Organization or user:  ${owner}
       Repository:            ${repo}
       Workflow filename:     ${workflow}
       Environment name:      (leave empty)

  2. Within 48 hours, run the workflow on main: a trusted publisher that has not
     published within 48 hours expires (then add it again and rerun).
       gh workflow run ${workflow} --ref main
     or Actions → ${workflowTitle} → Run workflow → main.
     It publishes ${firstReal ?? 'the version in package.json'}${
       firstReal ? ` (a major step after ${PLACEHOLDER})` : ''
     }, and every later release is automatic.
`);
