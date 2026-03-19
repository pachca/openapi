import { BaseCommand } from '../../base-command.js';
import { getActiveProfile, getProfile } from '../../profiles.js';
import { outputError } from '../../output.js';

export default class AuthStatus extends BaseCommand {
  static override description = 'Статус текущего профиля';

  static override examples = [
    '<%= config.bin %> auth status',
    '<%= config.bin %> auth status -o json',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthStatus);
    this.parsedFlags = flags;

    const profileName = flags.profile || process.env.PACHCA_PROFILE || getActiveProfile();
    const format = this.getOutputFormat();

    if (!profileName) {
      outputError(
        { error: 'No active profile. Run: pachca auth login', type: 'PACHCA_USAGE_ERROR', code: null },
        format,
      );
      this.exit(2);
    }

    const profile = getProfile(profileName!);
    if (!profile) {
      outputError(
        { error: `Profile "${profileName}" not found`, type: 'PACHCA_USAGE_ERROR', code: null },
        format,
      );
      this.exit(2);
    }

    if (format === 'json') {
      this.output({
        profile: profileName,
        type: profile!.type,
        user: profile!.user,
        email: profile!.email || null,
      });
    } else {
      const emailStr = profile!.email ? ` (${profile!.email})` : '';
      process.stderr.write(`  Подключён как: ${profile!.user}${emailStr}  [${profile!.type}, profile: ${profileName}]\n`);
    }
  }
}
