import { Args } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { listProfiles, setActiveProfile, getProfile } from '../../profiles.js';
import { outputError } from '../../output.js';

export default class AuthSwitch extends BaseCommand {
  static override description = 'Переключение активного профиля';

  static override examples = [
    '<%= config.bin %> auth switch bot-support',
  ];

  static override args = {
    profile: Args.string({
      description: 'Имя профиля для переключения',
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

    // Say right here if the profile cannot work, rather than letting the next
    // unrelated command fail: switching is where the user can still act on it.
    const profile = getProfile(args.profile);
    const secretMissing = !profile?.token;
    const expired = !!profile?.expires_at && new Date(profile.expires_at) <= new Date();

    if (format === 'json') {
      this.output({
        active_profile: args.profile,
        secret_readable: !secretMissing,
        expired,
      });
      return;
    }

    this.success(`Активный профиль: ${args.profile}`);

    if (secretMissing) {
      process.stderr.write(`  Секрет профиля не читается — войдите заново: pachca auth login --profile ${args.profile}\n`);
    } else if (expired) {
      process.stderr.write(`  Срок действия токена истёк — он будет обновлён при следующей команде\n`);
    }
  }
}
