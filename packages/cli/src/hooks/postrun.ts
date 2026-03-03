import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawn } from 'node:child_process';
import { Hook } from '@oclif/core';
import semver from 'semver';
import ansis from 'ansis';
import { isInteractive } from '../utils.js';

const hook: Hook<'postrun'> = async function (opts) {
  // Don't show update banner in non-interactive mode
  if (!isInteractive()) return;
  if (process.env.PACHCA_SKIP_NEW_VERSION_CHECK) return;

  const cacheDir = opts.config.cacheDir;
  const versionFile = path.join(cacheDir, 'version');

  // Check if version file exists and show banner
  try {
    if (fs.existsSync(versionFile)) {
      const cached = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
      const latest = cached.latest;
      const currentVersion = opts.config.version;

      if (latest && semver.valid(latest) && semver.valid(currentVersion)) {
        if (semver.gt(latest, currentVersion)) {
          const box = [
            '',
            ansis.yellow(`╭${'─'.repeat(37)}╮`),
            ansis.yellow(`│  Доступна новая версия: ${latest.padEnd(12)} │`),
            ansis.yellow(`│  npm install -g @pachca/cli${' '.repeat(9)}│`),
            ansis.yellow(`╰${'─'.repeat(37)}╯`),
            '',
          ].join('\n');
          process.stderr.write(box);
        }
      }
    }
  } catch {
    // Ignore cache read errors
  }

  // Check if we should refresh version cache (mtime > 24h)
  try {
    let shouldRefresh = true;
    if (fs.existsSync(versionFile)) {
      const stat = fs.statSync(versionFile);
      const ageMs = Date.now() - stat.mtimeMs;
      shouldRefresh = ageMs > 24 * 60 * 60 * 1000;
    }

    if (shouldRefresh) {
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      // Spawn detached background process to fetch latest version
      const scriptPath = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'get-version.js');
      if (fs.existsSync(scriptPath)) {
        const child = spawn(process.execPath, [scriptPath, versionFile], {
          detached: true,
          stdio: 'ignore',
        });
        child.unref();
      }
    }
  } catch {
    // Ignore errors in update check
  }
};

export default hook;
