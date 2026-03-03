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
const SPEC_PATH = path.join(ROOT, 'packages', 'spec', 'openapi.yaml');
const DATA_DIR = path.join(ROOT, 'packages', 'cli', 'src', 'data');

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

  if (!previousTag) {
    console.log('No previous tag found. Generating initial changelog.');
    const currentSpec = fs.readFileSync(SPEC_PATH, 'utf-8');
    const current = extractEndpoints(currentSpec);

    const changes = [...current.values()].map((ep) => ({
      type: '+' as const,
      command: `${ep.method} ${ep.path}`,
      description: ep.summary || 'Новая команда',
    }));

    const version = process.env.npm_package_version || '0.0.0';
    const entry = {
      version,
      date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
      changes,
    };

    // Read existing changelog or create new
    let changelog: typeof entry[] = [];
    const changelogPath = path.join(DATA_DIR, 'changelog.json');
    if (fs.existsSync(changelogPath)) {
      try {
        changelog = JSON.parse(fs.readFileSync(changelogPath, 'utf-8'));
      } catch {
        changelog = [];
      }
    }

    if (changes.length > 0) {
      changelog.unshift(entry);
    }

    fs.writeFileSync(changelogPath, JSON.stringify(changelog, null, 2));
    console.log(`  Changelog: ${changes.length} new endpoints`);
    return;
  }

  // Get previous spec
  let previousSpec = '';
  try {
    previousSpec = execSync(`git show ${previousTag}:packages/spec/openapi.yaml 2>/dev/null`, { encoding: 'utf-8' });
  } catch {
    console.log('Could not read previous spec. Skipping changelog generation.');
    return;
  }

  const currentSpec = fs.readFileSync(SPEC_PATH, 'utf-8');
  const previous = extractEndpoints(previousSpec);
  const current = extractEndpoints(currentSpec);

  const changes: { type: '+' | '-' | '~'; command: string; description: string }[] = [];

  // New endpoints
  for (const [key, ep] of current) {
    if (!previous.has(key)) {
      changes.push({ type: '+', command: `${ep.method} ${ep.path}`, description: ep.summary || 'Новая команда' });
    }
  }

  // Removed endpoints
  for (const [key, ep] of previous) {
    if (!current.has(key)) {
      changes.push({ type: '-', command: `${ep.method} ${ep.path}`, description: ep.summary || 'Удалённая команда' });
    }
  }

  // Changed endpoints (summary changed)
  for (const [key, ep] of current) {
    const prev = previous.get(key);
    if (prev && prev.summary !== ep.summary) {
      changes.push({ type: '~', command: `${ep.method} ${ep.path}`, description: ep.summary || 'Обновлённая команда' });
    }
  }

  if (changes.length === 0) {
    console.log('  No endpoint changes detected.');
    return;
  }

  const version = process.env.npm_package_version || '0.0.0';
  const entry = {
    version,
    date: new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
    changes,
  };

  let changelog: typeof entry[] = [];
  const changelogPath = path.join(DATA_DIR, 'changelog.json');
  if (fs.existsSync(changelogPath)) {
    try {
      changelog = JSON.parse(fs.readFileSync(changelogPath, 'utf-8'));
    } catch {
      changelog = [];
    }
  }

  changelog.unshift(entry);
  fs.writeFileSync(changelogPath, JSON.stringify(changelog, null, 2));

  // Also generate CHANGELOG.md
  const mdLines: string[] = ['# Changelog', ''];
  for (const e of changelog) {
    mdLines.push(`## ${e.version}  (${e.date})`, '');
    for (const c of e.changes) {
      mdLines.push(`  ${c.type} ${c.command.padEnd(35)} — ${c.description}`);
    }
    mdLines.push('');
  }
  fs.writeFileSync(path.join(ROOT, 'packages', 'cli', 'CHANGELOG.md'), mdLines.join('\n'));

  console.log(`  Changelog: +${changes.filter((c) => c.type === '+').length} -${changes.filter((c) => c.type === '-').length} ~${changes.filter((c) => c.type === '~').length}`);
}

main();
