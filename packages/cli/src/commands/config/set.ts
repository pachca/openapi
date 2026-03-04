import { Args } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { setConfigValue } from '../../profiles.js';

export default class ConfigSet extends BaseCommand {
  static override description = 'Установка значения конфигурации';

  static override examples = [
    '<%= config.bin %> config set defaults.output json',
    '<%= config.bin %> config set defaults.timeout 60',
  ];

  static override args = {
    key: Args.string({ description: 'Configuration key', required: true }),
    value: Args.string({ description: 'Configuration value', required: true }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ConfigSet);
    this.parsedFlags = flags;

    setConfigValue(args.key, args.value);

    const format = this.getOutputFormat();
    if (format === 'json') {
      this.output({ key: args.key, value: args.value });
    } else {
      this.success(`Сохранено: ${args.key} = "${args.value}"`);
    }
  }
}
