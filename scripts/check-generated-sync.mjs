#!/usr/bin/env node
//
// Build gate: every file produced by a generator must be in sync with the
// source it was generated from. Run in CI (see `.github/workflows/check.yml`)
// and locally via `bun run check:generated`.
//
// Why this exists: the repo has several generator → output relationships
//   - packages/spec/typespec.tsp           → packages/spec/openapi.yaml
//   - packages/cli/src/data/changelog.json → packages/cli/CHANGELOG.md
//   - apps/docs/content/**.mdx + apps/docs/data/releases.json
//                                          → apps/docs/public/**, llms*.txt
//   - apps/docs/scripts/skills/generate.ts → AGENTS.md (template-driven)
//
// The deployment Docker image always regenerates these on build, so prod
// stays correct even when committed copies are stale. But other developers
// (and other PRs) inherit the drift: a `turbo build` on someone else's
// branch suddenly produces unrelated diffs they then have to deal with.
//
// This gate runs `bun turbo build` and fails if any generator output ends
// up different from what is checked in (modified OR untracked). The error
// message lists the out-of-sync files and tells the author how to fix it.
//
// SKIP: when neither `CI` nor `--force` is set, the script no-ops with a
// note (a full rebuild is too slow for a default local `bun check`).

import { execSync } from 'node:child_process';

const FORCE = process.argv.includes('--force');
const IS_CI = !!process.env.CI;

if (!IS_CI && !FORCE) {
  console.error(
    '[check-generated-sync] skipped (set CI=1 or pass --force to run locally — it does a full `turbo build`)',
  );
  process.exit(0);
}

// Generated-file path specs. Anything matching these MUST equal what its
// generator would produce from the current sources. Add new entries here
// when introducing a new generator output.
const GENERATED_PATHS = [
  // Spec
  'packages/spec/openapi.yaml',
  // CLI
  'packages/cli/CHANGELOG.md',
  'packages/cli/oclif.manifest.json',
  // Docs — root + agent indices
  'AGENTS.md',
  'apps/docs/public/index.md',
  'apps/docs/public/llms.txt',
  'apps/docs/public/llms-full.txt',
  'apps/docs/public/llms-en.txt',
  'apps/docs/public/skill.md',
  'apps/docs/public/updates.md',
  'apps/docs/public/pachca.postman_collection.json',
  'apps/docs/public/workflows.arazzo.yaml',
  // Docs — per-page MD twins
  'apps/docs/public/api/**',
  'apps/docs/public/guides/**',
  'apps/docs/public/updates/**',
  'apps/docs/public/.well-known/skills/**',
  'apps/docs/public/.well-known/agent-skills/**',
];

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

console.error('[check-generated-sync] regenerating artefacts via `bun turbo build`…');
try {
  execSync('bun turbo build', { stdio: ['ignore', 'inherit', 'inherit'] });
} catch {
  console.error('[check-generated-sync] turbo build failed — cannot verify sync');
  process.exit(1);
}

const pathSpec = GENERATED_PATHS.map((p) => `'${p}'`).join(' ');

// Files known to git but different from HEAD after the rebuild.
const modified = sh(`git diff HEAD --name-only -- ${pathSpec}`).split('\n').filter(Boolean);
// Files the rebuild produced that aren't tracked yet (new MD twins, etc).
const untracked = sh(`git ls-files --others --exclude-standard -- ${pathSpec}`)
  .split('\n')
  .filter(Boolean);

const drift = [...new Set([...modified, ...untracked])].sort();

if (drift.length === 0) {
  console.error('[check-generated-sync] ✓ all generated files match their sources');
  process.exit(0);
}

console.error('');
console.error(`[check-generated-sync] ✗ ${drift.length} generated file(s) out of sync:`);
console.error('');
for (const f of drift) console.error(`    ${f}`);
console.error('');
console.error(
  [
    'To fix this locally:',
    '',
    '  bun turbo build         # regenerate everything from sources',
    '  git add -A              # stage the regenerated files',
    '  git commit              # append/amend a commit',
    '',
    'Each generator output must always match the source it was produced from.',
    'Common culprits:',
    '  - bumped changelog.json without committing the regenerated CHANGELOG.md',
    '  - added an updates.mdx entry without committing the regenerated /updates/*.md',
    '  - edited typespec.tsp without re-running `--filter=@pachca/spec --force`',
  ].join('\n'),
);
process.exit(1);
