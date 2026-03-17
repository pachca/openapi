import * as fs from 'node:fs';
import * as process from 'node:process';
import semver from 'semver';
import { BaseCommand } from '../base-command.js';
import {
  getActiveProfile,
  getProfile,
  getConfigFilePath,
  getConfigFilePermissions,
} from '../profiles.js';

interface Check {
  name: string;
  status: 'ok' | 'warning' | 'error' | 'skipped';
  [key: string]: unknown;
}

export default class Doctor extends BaseCommand {
  static override description = 'Диагностика окружения: Node.js, сеть, токен, конфигурация';

  static override examples = [
    '<%= config.bin %> doctor',
    '<%= config.bin %> doctor -o json',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Doctor);
    this.parsedFlags = flags;

    const format = this.getOutputFormat();
    const checks: Check[] = [];
    let networkOk = false;
    let profileOk = false;

    // 1. Node.js version
    const nodeVersion = process.version.replace('v', '');
    const nodeMajor = Number.parseInt(nodeVersion.split('.')[0], 10);
    if (nodeMajor >= 20) {
      checks.push({ name: 'node', status: 'ok', version: nodeVersion, required: '>=20' });
      this.printCheck('ok', `Node.js        v${nodeVersion} (требуется >=20)`, format);
    } else {
      checks.push({ name: 'node', status: 'error', version: nodeVersion, required: '>=20' });
      this.printCheck('error', `Node.js        v${nodeVersion} — требуется >=20`, format);
    }

    // 2. Network
    try {
      const start = Date.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      await fetch('https://api.pachca.com/api/shared/v1/profile', {
        method: 'HEAD',
        signal: controller.signal,
      });
      clearTimeout(timer);
      const latency = Date.now() - start;
      checks.push({ name: 'network', status: 'ok', host: 'api.pachca.com', latency_ms: latency });
      this.printCheck('ok', `Сеть           api.pachca.com доступен (${latency}ms)`, format);
      networkOk = true;
    } catch {
      checks.push({ name: 'network', status: 'error', host: 'api.pachca.com' });
      this.printCheck('error', `Сеть           api.pachca.com недоступен (таймаут 5s)`, format);
    }

    // 3. Config file
    const configPath = getConfigFilePath();
    if (fs.existsSync(configPath)) {
      const permissions = getConfigFilePermissions();
      if (permissions && Number.parseInt(permissions, 8) > 0o600) {
        checks.push({ name: 'config', status: 'warning', path: configPath, permissions, expected: '600' });
        this.printCheck('warning', `Конфиг         ${configPath} (права: ${permissions} — рекомендуется chmod 600)`, format);
      } else {
        checks.push({ name: 'config', status: 'ok', path: configPath, permissions: permissions || '600' });
        this.printCheck('ok', `Конфиг         ${configPath} (права: ${permissions || '600'})`, format);
      }
    } else {
      checks.push({ name: 'config', status: 'error', path: configPath });
      this.printCheck('error', `Конфиг         файл не найден (запустите pachca auth login)`, format);
    }

    // 4. Profile
    const profileName = getActiveProfile();
    if (profileName) {
      const profile = getProfile(profileName);
      if (profile) {
        checks.push({ name: 'profile', status: 'ok', profile: profileName, type: profile.type, user: profile.user });
        this.printCheck('ok', `Профиль        ${profileName} (${profile.type}: ${profile.user})`, format);
        profileOk = true;
      } else {
        checks.push({ name: 'profile', status: 'error', profile: profileName });
        this.printCheck('error', `Профиль        ${profileName} — профиль не найден в конфиге`, format);
      }
    } else {
      checks.push({ name: 'profile', status: 'error' });
      this.printCheck('error', `Профиль        не настроен (запустите pachca auth login)`, format);
    }

    // 5. Token (skip if no network or no profile)
    if (!networkOk || !profileOk) {
      const reason = !networkOk ? 'нет сети' : 'нет профиля';
      checks.push({ name: 'token', status: 'skipped', reason });
      this.printCheck('skipped', `Токен          пропущено (${reason})`, format);
    } else {
      const profile = getProfile(profileName!)!;
      try {
        const response = await fetch('https://api.pachca.com/api/shared/v1/oauth/token/info', {
          headers: { Authorization: `Bearer ${profile.token}` },
        });
        if (response.ok) {
          const body = (await response.json()) as { data: { scopes?: string[] } };
          const scopeCount = body.data?.scopes?.length ?? 0;
          checks.push({ name: 'token', status: 'ok', scopes_count: scopeCount });
          this.printCheck('ok', `Токен          действителен (${scopeCount} скоупов)`, format);
        } else {
          checks.push({ name: 'token', status: 'error', http_status: response.status });
          this.printCheck('error', `Токен          недействителен (${response.status}) — обновите: pachca auth login`, format);
        }
      } catch {
        checks.push({ name: 'token', status: 'error' });
        this.printCheck('error', `Токен          ошибка проверки`, format);
      }
    }

    // 6. CLI version (skip if no network)
    if (!networkOk) {
      checks.push({ name: 'cli_version', status: 'skipped', reason: 'нет сети' });
      this.printCheck('skipped', `CLI            пропущено (нет сети)`, format);
    } else {
      const currentVersion = this.config.version;
      try {
        const response = await fetch('https://registry.npmjs.org/@pachca/cli');
        if (response.ok) {
          const data = (await response.json()) as { 'dist-tags'?: { latest?: string } };
          const latest = data['dist-tags']?.latest;
          if (latest && semver.valid(latest) && semver.valid(currentVersion)) {
            if (semver.gt(latest, currentVersion)) {
              checks.push({ name: 'cli_version', status: 'warning', current: currentVersion, latest });
              this.printCheck('warning', `CLI            v${currentVersion} → доступна v${latest} (pachca upgrade)`, format);
            } else {
              checks.push({ name: 'cli_version', status: 'ok', current: currentVersion, latest });
              this.printCheck('ok', `CLI            v${currentVersion} (актуальная версия)`, format);
            }
          } else {
            checks.push({ name: 'cli_version', status: 'ok', current: currentVersion });
            this.printCheck('ok', `CLI            v${currentVersion}`, format);
          }
        }
      } catch {
        checks.push({ name: 'cli_version', status: 'ok', current: currentVersion });
        this.printCheck('ok', `CLI            v${currentVersion}`, format);
      }
    }

    // Output JSON if requested
    if (format === 'json') {
      this.output({ checks });
      return;
    }

    // Summary
    const hasErrors = checks.some((c) => c.status === 'error');
    if (!hasErrors) {
      process.stderr.write('\nВсё в порядке.\n');
    }

    // Exit with error if any check failed
    if (hasErrors) {
      this.exit(1);
    }
  }

  private printCheck(status: 'ok' | 'warning' | 'error' | 'skipped', message: string, format: string): void {
    if (format === 'json') return;
    const icons: Record<string, string> = {
      ok: '✔',
      warning: '⚠',
      error: '✗',
      skipped: '⊘',
    };
    process.stderr.write(`${icons[status]} ${message}\n`);
  }
}
