import { Args } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { listProfiles, setActiveProfile } from '../../profiles.js';
import { outputError } from '../../output.js';

export default class AuthSwitch extends BaseCommand {
  static override description = 'Переключение активного профиля';

  static override examples = [
    '<%= config.bin %> auth switch bot-support',
  ];

  static override args = {
    profile: Args.string({
      description: 'Profile name to switch to',
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AuthSwitch);
    this.parsedFlags = flags;

    const profiles = listProfiles();
    const format = this.getOutputFormat();

    if (!profiles[args.profile]) {
      outputError(
        { error: `Profile "${args.profile}" not found`, type: 'PACHCA_USAGE_ERROR', code: null },
        format,
      );
      this.exit(2);
    }

    setActiveProfile(args.profile);

    if (format === 'json') {
      this.output({ active_profile: args.profile });
    } else {
      this.success(`Активный профиль: ${args.profile}`);
    }
  }
}
