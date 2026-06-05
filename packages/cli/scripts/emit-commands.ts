/**
 * D2 — emit src/data/commands.json for the docs Commands page.
 *
 * Runs AFTER `oclif manifest` (oclif.manifest.json must exist). Reuses the
 * SAME normalization as the `introspect` command (src/lib/manifest.ts):
 * one parsing logic, one data source (oclif.manifest.json). The docs read
 * the JSON via a cwd-relative path — no cross-package TS import.
 *
 * Usage: bun scripts/emit-commands.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { BaseCommand } from '../src/base-command.js';
import { groupCommandsBySection, type ManifestCommands } from '../src/lib/manifest.js';

const ROOT = path.resolve(import.meta.dirname, '..');
const manifestPath = path.join(ROOT, 'oclif.manifest.json');
const outPath = path.join(ROOT, 'src', 'data', 'commands.json');

if (!fs.existsSync(manifestPath)) {
  console.warn('  ⚠ Skipped commands.json: oclif.manifest.json not found');
  process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as {
  commands?: ManifestCommands;
};
const commands = manifest.commands ?? {};
const baseFlagNames = new Set(Object.keys(BaseCommand.baseFlags));
const sections = groupCommandsBySection(commands, baseFlagNames);

// Atomic write: docs build may read this file concurrently (turbo runs the
// docs build in parallel with no ordering dependency). tmp + rename so a
// concurrent reader sees either the old complete file or the new one,
// never a partially written one.
const tmpPath = `${outPath}.tmp`;
fs.writeFileSync(tmpPath, JSON.stringify(sections, null, 2));
fs.renameSync(tmpPath, outPath);
console.log(
  `  Generated commands.json (${sections.length} sections, ${Object.keys(commands).length} commands)`,
);
