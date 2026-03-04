/**
 * Post-build patches:
 * 1. Translate plugin command descriptions to Russian
 * 2. Generate CHANGELOG.md from changelog.json
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

// 1. Patch plugin manifests
const PATCHES = {
  'node_modules/@oclif/plugin-autocomplete/oclif.manifest.json': {
    autocomplete: { description: 'Настройка автодополнения команд' },
  },
};

for (const [file, commands] of Object.entries(PATCHES)) {
  if (!existsSync(file)) continue;
  const manifest = JSON.parse(readFileSync(file, 'utf8'));
  for (const [cmd, patch] of Object.entries(commands)) {
    if (manifest.commands?.[cmd]) {
      Object.assign(manifest.commands[cmd], patch);
    }
  }
  writeFileSync(file, JSON.stringify(manifest));
}

// 2. Generate CHANGELOG.md from changelog.json
const changelogPath = 'src/data/changelog.json';
if (existsSync(changelogPath)) {
  const changelog = JSON.parse(readFileSync(changelogPath, 'utf8'));
  const lines = ['# Changelog', ''];
  for (const e of changelog) {
    lines.push(`## ${e.version}  (${e.date})`, '');
    for (const c of e.changes) {
      lines.push(`  ${c.type} ${c.command.padEnd(35)} — ${c.description}`);
    }
    lines.push('');
  }
  writeFileSync('CHANGELOG.md', lines.join('\n'));
}
