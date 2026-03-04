import { BaseCommand } from '../../base-command.js';
import { readConfig } from '../../profiles.js';

export default class ConfigList extends BaseCommand {
  static override description = 'Список всех настроек';

  static override examples = [
    '<%= config.bin %> config list',
    '<%= config.bin %> config list -o json',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(ConfigList);
    this.parsedFlags = flags;

    const config = readConfig();
    const format = this.getOutputFormat();

    if (format === 'json') {
      const { profiles: _profiles, ...rest } = config;
      this.output(rest);
    } else {
      // Flatten config for display
      const entries = flattenConfig(config as unknown as Record<string, unknown>, ['profiles']);
      if (entries.length === 0) {
        process.stderr.write('Нет настроек.\n');
        return;
      }
      for (const [key, value] of entries) {
        process.stdout.write(`${key.padEnd(25)} = ${value}\n`);
      }
    }
  }
}

function flattenConfig(
  obj: Record<string, unknown>,
  exclude: string[] = [],
  prefix = '',
): [string, string][] {
  const entries: [string, string][] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (exclude.includes(key)) continue;
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      entries.push(...flattenConfig(value as Record<string, unknown>, [], fullKey));
    } else {
      entries.push([fullKey, String(value)]);
    }
  }
  return entries;
}
