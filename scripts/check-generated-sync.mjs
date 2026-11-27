#!/usr/bin/env node

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
  'packages/spec/openapi.en.yaml',
  'packages/spec/mcp-manifest.json',
  // MCP manifest package — the copies that ship to npm
  'packages/mcp-manifest/mcp-manifest.json',
  'packages/mcp-manifest/mcp-manifest.schema.json',
  // CLI
  'packages/cli/CHANGELOG.md',
  'packages/cli/oclif.manifest.json',
  'packages/app-sdk/src/generated/**',
  // Docs — root + agent indices
  'AGENTS.md',
  'plugins/pachca/evals/mocks/pachca/_tools.json',
  // The version field of the plugin manifests (the rest of each file is hand-written)
  // and the record of the plugin content it was given for
  'plugins/pachca/plugin.json',
  'plugins/pachca/.claude-plugin/plugin.json',
  'plugins/pachca/.codex-plugin/plugin.json',
  'plugins/pachca/.cursor-plugin/plugin.json',
  'apps/docs/scripts/skills/plugin-version.json',
  'apps/docs/public/index.md',
  'apps/docs/public/llms.txt',
  'apps/docs/public/llms-full.txt',
  'apps/docs/public/llms-en.txt',
  'apps/docs/public/skill.md',
  'apps/docs/public/updates.md',
  'apps/docs/public/pachca.postman_collection.json',
  // Docs — per-page MD twins
  'apps/docs/public/api/**',
  'apps/docs/public/guides/**',
  'apps/docs/public/updates/**',
  'apps/docs/public/.well-known/skills/**',
  'apps/docs/public/.well-known/agent-skills/**',
  'apps/docs/public/skills/**',
];

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

// Only the packages that *produce* tracked generated files. Building SDK
// targets (C#, Go, Kotlin, Python, n8n) doesn't affect any path in
// GENERATED_PATHS, and tying our sync check to those toolchains makes the
// gate flaky for reasons unrelated to "is the generator output in sync".
const BUILD_FILTERS = ['@pachca/spec', '@pachca/mcp-manifest', '@pachca/cli', '@pachca/docs', '@pachca/app-sdk'];

console.error('[check-generated-sync] regenerating artefacts via `bun turbo build`…');
try {
  // --force: several outputs (root AGENTS.md,
  // packages/cli/CHANGELOG.md) live outside any task's declared `outputs`, so a
  // warm turbo cache would skip regenerating them and this gate would compare a
  // file nothing had rebuilt. This is the one caller that needs a guaranteed
  // fresh build, so pay for it here rather than restructuring the task graph.
  execSync(`bun turbo build --force ${BUILD_FILTERS.map((f) => `--filter=${f}`).join(' ')}`, {
    stdio: ['ignore', 'inherit', 'inherit'],
  });
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
    '  - added a content/updates/<date>.md entry without rebuilding (public/updates/*.md stays stale)',
    '  - edited typespec.tsp without re-running `--filter=@pachca/spec --force`',
  ].join('\n'),
);
process.exit(1);
