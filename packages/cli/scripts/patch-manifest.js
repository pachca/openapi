/**
 * Post-build patches:
 * 1. Translate plugin command descriptions to Russian
 * 2. Generate CHANGELOG.md from changelog.json
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

// 1. Patch plugin manifests & source descriptions
const AUTOCOMPLETE_DIR = 'node_modules/@oclif/plugin-autocomplete';

const MANIFEST_PATCHES = {
  [`${AUTOCOMPLETE_DIR}/oclif.manifest.json`]: {
    autocomplete: { description: 'Настройка автодополнения команд' },
  },
};

for (const [file, commands] of Object.entries(MANIFEST_PATCHES)) {
  if (!existsSync(file)) continue;
  const manifest = JSON.parse(readFileSync(file, 'utf8'));
  for (const [cmd, patch] of Object.entries(commands)) {
    if (manifest.commands?.[cmd]) {
      Object.assign(manifest.commands[cmd], patch);
    }
  }
  writeFileSync(file, JSON.stringify(manifest));
}

// Patch static description in compiled JS (oclif reads it from class at runtime)
const SOURCE_PATCHES = [
  {
    file: `${AUTOCOMPLETE_DIR}/lib/commands/autocomplete/index.js`,
    from: "static description = 'Display autocomplete installation instructions.';",
    to: "static description = 'Настройка автодополнения команд';",
  },
];

for (const { file, from, to } of SOURCE_PATCHES) {
  if (!existsSync(file)) continue;
  const content = readFileSync(file, 'utf8');
  if (content.includes(from)) {
    writeFileSync(file, content.replace(from, to));
  }
}

// 2. Sort main manifest commands alphabetically for deterministic output
const mainManifestPath = 'oclif.manifest.json';
if (existsSync(mainManifestPath)) {
  const manifest = JSON.parse(readFileSync(mainManifestPath, 'utf8'));
  if (manifest.commands) {
    manifest.commands = Object.fromEntries(
      Object.entries(manifest.commands).sort(([a], [b]) => a.localeCompare(b)),
    );
  }
  writeFileSync(mainManifestPath, JSON.stringify(manifest));
}

// 3. Generate CHANGELOG.md from changelog.json
const changelogPath = 'src/data/changelog.json';
if (existsSync(changelogPath)) {
  const TYPE_LABELS = { '+': 'Добавлено', '~': 'Изменено', '-': 'Удалено' };
  const changelog = JSON.parse(readFileSync(changelogPath, 'utf8'));
  const entries = changelog.filter((e) => e.version !== '0.0.0');
  const lines = ['# Changelog', ''];
  for (const e of entries) {
    lines.push(`## ${e.version}  (${e.date})`, '');
    for (const c of e.changes) {
      const label = TYPE_LABELS[c.type] || c.type;
      lines.push(`- **${label}** (${c.command}): ${c.description}`);
    }
    lines.push('');
  }
  writeFileSync('CHANGELOG.md', lines.join('\n'));
}
