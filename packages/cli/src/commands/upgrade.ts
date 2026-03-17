import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import semver from 'semver';
import { BaseCommand } from '../base-command.js';

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

    if (format !== 'json' && process.stderr.isTTY) {
      process.stderr.write(`Обновление ${currentVersion} → ${latest}...\n`);
    }

    try {
      execFileSync('npm', ['install', '-g', '@pachca/cli@latest'], {
        stdio: format === 'json' ? 'ignore' : 'inherit',
      });

      if (format === 'json') {
        this.output({ upgraded: true, from: currentVersion, to: latest });
      } else {
        process.stderr.write(`\n✔ Обновлено до ${latest}\n`);
      }
    } catch {
      if (format === 'json') {
        this.output({ upgraded: false, current: currentVersion, latest, error: 'npm install failed' });
      } else {
        process.stderr.write('\n✗ Не удалось обновить. Попробуйте вручную:\n');
        process.stderr.write('  npm install -g @pachca/cli\n');
      }
      this.exit(1);
    }
  }
}
