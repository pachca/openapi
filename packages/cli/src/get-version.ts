/**
 * Background script spawned by postrun hook.
 * Fetches latest version from npm registry and writes to cache file.
 * Usage: node get-version.js <versionFilePath>
 */

import * as fs from 'node:fs';

const versionFile = process.argv[2];
if (!versionFile) process.exit(1);

try {
  const response = await fetch('https://registry.npmjs.org/@pachca/cli');
  if (!response.ok) process.exit(1);
  const data = (await response.json()) as { 'dist-tags'?: { latest?: string } };
  const latest = data['dist-tags']?.latest;
  if (latest) {
    fs.writeFileSync(versionFile, JSON.stringify({ latest, checked_at: new Date().toISOString() }));
  }
} catch {
  // Silently fail
}
