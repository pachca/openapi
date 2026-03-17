import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import semver from 'semver';
import { BaseCommand } from '../base-command.js';

interface PackageManager {
  name: string;
  cmd: string;
  args: string[];
}

/**
 * Detect how CLI was installed by examining the executable path.
 */
function detectPackageManager(binPath: string): PackageManager {
  const resolved = fs.realpathSync(binPath);

  // Homebrew: /opt/homebrew/... or /usr/local/Cellar/...
  if (resolved.includes('/homebrew/') || resolved.includes('/Cellar/')) {
    return { name: 'homebrew', cmd: 'brew', args: ['upgrade', '@pachca/cli'] };
  }

  // Bun global: ~/.bun/install/global/ or contains /bun/
  if (resolved.includes('/bun/') || resolved.includes('.bun/')) {
    return { name: 'bun', cmd: 'bun', args: ['install', '-g', '@pachca/cli@latest'] };
  }

  // pnpm global: contains /pnpm/
  if (resolved.includes('/pnpm/')) {
    return { name: 'pnpm', cmd: 'pnpm', args: ['install', '-g', '@pachca/cli@latest'] };
  }

  // yarn global: contains /yarn/
  if (resolved.includes('/yarn/')) {
    return { name: 'yarn', cmd: 'yarn', args: ['global', 'add', '@pachca/cli@latest'] };
  }

  // Default: npm
  return { name: 'npm', cmd: 'npm', args: ['install', '-g', '@pachca/cli@latest'] };
}

export default class Upgrade extends BaseCommand {
  static override description = 'Обновить CLI до последней версии';

  static override examples = [
    '<%= config.bin %> upgrade',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Upgrade);
    this.parsedFlags = flags;

    const currentVersion = this.config.version;
    const format = this.getOutputFormat();

    // Fetch latest version from npm registry
    let latest: string | undefined;
    try {
      const response = await fetch('https://registry.npmjs.org/@pachca/cli');
      if (response.ok) {
        const data = (await response.json()) as { 'dist-tags'?: { latest?: string } };
        latest = data['dist-tags']?.latest;
      }
    } catch {
      // Fallback: try cached version
    }

    if (!latest) {
      try {
        const versionFile = path.join(this.config.cacheDir, 'version');
        if (fs.existsSync(versionFile)) {
          const cached = JSON.parse(fs.readFileSync(versionFile, 'utf-8'));
          latest = cached.latest;
        }
      } catch {
        // ignore
      }
    }

    if (!latest) {
      if (format === 'json') {
        this.output({ upgraded: false, current: currentVersion, error: 'Cannot determine latest version' });
      } else {
        process.stderr.write('✗ Не удалось определить последнюю версию\n');
      }
      this.exit(1);
    }

    if (semver.valid(currentVersion) && semver.valid(latest) && !semver.gt(latest, currentVersion)) {
      if (format === 'json') {
        this.output({ upgraded: false, current: currentVersion, latest });
      } else {
        process.stderr.write(`✔ CLI уже обновлён (${currentVersion})\n`);
      }
      return;
    }

    const pm = detectPackageManager(process.argv[1] || this.config.binPath || '');

    if (format !== 'json' && process.stderr.isTTY) {
      process.stderr.write(`Обновление ${currentVersion} → ${latest} (${pm.name})...\n`);
    }

    try {
      execFileSync(pm.cmd, pm.args, {
        stdio: format === 'json' ? 'ignore' : 'inherit',
      });

      if (format === 'json') {
        this.output({ upgraded: true, from: currentVersion, to: latest, package_manager: pm.name });
      } else {
        process.stderr.write(`\n✔ Обновлено до ${latest}\n`);
      }
    } catch {
      if (format === 'json') {
        this.output({ upgraded: false, current: currentVersion, latest, package_manager: pm.name, error: `${pm.cmd} failed` });
      } else {
        process.stderr.write(`\n✗ Не удалось обновить через ${pm.name}. Попробуйте вручную:\n`);
        process.stderr.write(`  ${pm.cmd} ${pm.args.join(' ')}\n`);
      }
      this.exit(1);
    }
  }
}
