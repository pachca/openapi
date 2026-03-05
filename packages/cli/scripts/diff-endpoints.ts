/**
 * Diff endpoints between current and previous OpenAPI spec.
 * Generates changelog.json and CHANGELOG.md.
 *
 * Usage: tsx scripts/diff-endpoints.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { execSync } from 'node:child_process';
import * as yaml from 'js-yaml';

const ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const CLI_DIR = path.join(ROOT, 'packages', 'cli');
const SPEC_PATH = path.join(ROOT, 'packages', 'spec', 'openapi.yaml');
const DATA_DIR = path.join(CLI_DIR, 'src', 'data');

interface ChangelogEntry {
  version: string;
  date: string;
  changes: { type: string; command: string; description: string }[];
}

function readVersion(): string {
  const pkg = JSON.parse(fs.readFileSync(path.join(CLI_DIR, 'package.json'), 'utf-8'));
  return pkg.version || '0.0.0';
}

function generateChangelogMd(changelog: ChangelogEntry[]): void {
  const lines: string[] = ['# Changelog', ''];
  for (const e of changelog) {
    lines.push(`## ${e.version}  (${e.date})`, '');
    for (const c of e.changes) {
      lines.push(`  ${c.type} ${c.command.padEnd(35)} — ${c.description}`);
    }
    lines.push('');
  }
  fs.writeFileSync(path.join(CLI_DIR, 'CHANGELOG.md'), lines.join('\n'));
}

function readChangelog(): ChangelogEntry[] {
  const changelogPath = path.join(DATA_DIR, 'changelog.json');
  if (fs.existsSync(changelogPath)) {
    try {
      return JSON.parse(fs.readFileSync(changelogPath, 'utf-8'));
    } catch { /* empty */ }
  }
  return [];
}

function writeChangelog(changelog: ChangelogEntry[]): void {
  fs.writeFileSync(path.join(DATA_DIR, 'changelog.json'), JSON.stringify(changelog, null, 2));
  generateChangelogMd(changelog);
}

/** Add changes to changelog. Skip if an entry for this version already exists (manual entries take priority). */
function addChanges(changelog: ChangelogEntry[], version: string, changes: ChangelogEntry['changes']): boolean {
  if (changelog.some((e) => e.version === version)) {
    return false;
  }
  changelog.unshift({
    version,
    date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
    changes,
  });
  return true;
}

interface EndpointKey {
  method: string;
  path: string;
  summary?: string;
}

function extractEndpoints(specContent: string): Map<string, EndpointKey> {
  const spec = yaml.load(specContent) as Record<string, unknown>;
  const paths = (spec.paths || {}) as Record<string, Record<string, unknown>>;
  const endpoints = new Map<string, EndpointKey>();

  for (const [pathStr, methods] of Object.entries(paths)) {
    if (!methods || typeof methods !== 'object') continue;
    for (const [method, op] of Object.entries(methods as Record<string, unknown>)) {
      if (!['get', 'post', 'put', 'delete', 'patch'].includes(method)) continue;
      const operation = op as Record<string, unknown>;
      const key = `${method.toUpperCase()} ${pathStr}`;
      endpoints.set(key, {
        method: method.toUpperCase(),
        path: pathStr,
        summary: operation.summary as string | undefined,
      });
    }
  }

  return endpoints;
}

function main(): void {
  // Get previous tag
  let previousTag = '';
  try {
    previousTag = execSync('git describe --tags --abbrev=0 HEAD~1 2>/dev/null || echo ""', { encoding: 'utf-8' }).trim();
  } catch {
    previousTag = '';
  }

  const changelog = readChangelog();
  const version = readVersion();

  // Determine changes from OpenAPI spec diff
  let changes: ChangelogEntry['changes'] = [];

  if (!previousTag) {
    console.log('No previous tag found. Using all current endpoints.');
    const currentSpec = fs.readFileSync(SPEC_PATH, 'utf-8');
    const current = extractEndpoints(currentSpec);
    changes = [...current.values()].map((ep) => ({
      type: '+',
      command: `${ep.method} ${ep.path}`,
      description: ep.summary || 'Новая команда',
    }));
  } else {
    let previousSpec = '';
    try {
      previousSpec = execSync(`git show ${previousTag}:packages/spec/openapi.yaml 2>/dev/null`, { encoding: 'utf-8' });
    } catch {
      console.log('Could not read previous spec. Skipping endpoint diff.');
    }

    if (previousSpec) {
      const currentSpec = fs.readFileSync(SPEC_PATH, 'utf-8');
      const previous = extractEndpoints(previousSpec);
      const current = extractEndpoints(currentSpec);

      for (const [key, ep] of current) {
        if (!previous.has(key)) {
          changes.push({ type: '+', command: `${ep.method} ${ep.path}`, description: ep.summary || 'Новая команда' });
        }
      }
      for (const [key, ep] of previous) {
        if (!current.has(key)) {
          changes.push({ type: '-', command: `${ep.method} ${ep.path}`, description: ep.summary || 'Удалённая команда' });
        }
      }
      for (const [key, ep] of current) {
        const prev = previous.get(key);
        if (prev && prev.summary !== ep.summary) {
          changes.push({ type: '~', command: `${ep.method} ${ep.path}`, description: ep.summary || 'Обновлённая команда' });
        }
      }
    }
  }

  if (changes.length > 0) {
    const added = addChanges(changelog, version, changes);
    if (added) {
      console.log(`  Changelog: +${changes.filter((c) => c.type === '+').length} -${changes.filter((c) => c.type === '-').length} ~${changes.filter((c) => c.type === '~').length}`);
    } else {
      console.log(`  Changelog: version ${version} already has manual entries, skipping auto-generation.`);
    }
  } else {
    console.log('  No endpoint changes detected.');
  }

  // Remove legacy 0.0.0 bootstrap entry if present
  const cleaned = changelog.filter((e) => e.version !== '0.0.0');
  writeChangelog(cleaned);
}

main();
