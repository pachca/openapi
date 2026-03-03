import { BaseCommand } from '../base-command.js';

export default class Version extends BaseCommand {
  static override description = 'Show CLI version';

  static override examples = [
    '<%= config.bin %> version',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(Version);
    this.parsedFlags = flags;

    const version = this.config.version;
    const format = this.getOutputFormat();

    if (format === 'json') {
      this.output({ version });
    } else {
      process.stdout.write(`@pachca/cli v${version}\n`);
    }
  }
}
