import { Args } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { getConfigValue } from '../../profiles.js';

export default class ConfigGet extends BaseCommand {
  static override description = 'Получение значения конфигурации';

  static override examples = [
    '<%= config.bin %> config get defaults.output',
  ];

  static override args = {
    key: Args.string({ description: 'Configuration key', required: true }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ConfigGet);
    this.parsedFlags = flags;

    const value = getConfigValue(args.key);
    const format = this.getOutputFormat();

    if (format === 'json') {
      this.output({ key: args.key, value: value ?? null });
    } else {
      process.stdout.write(`${value ?? ''}\n`);
    }
  }
}
