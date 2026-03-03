import { BaseCommand } from '../../base-command.js';
import { listProfiles, getActiveProfile } from '../../profiles.js';

export default class AuthList extends BaseCommand {
  static override description = 'List all saved profiles';

  static override examples = [
    '<%= config.bin %> auth list',
    '<%= config.bin %> auth list -o json',
  ];

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(AuthList);
    this.parsedFlags = flags;

    const profiles = listProfiles();
    const activeProfile = getActiveProfile();
    const format = this.getOutputFormat();

    const entries = Object.entries(profiles).map(([name, profile]) => ({
      name,
      type: profile.type,
      user: profile.user,
      email: profile.email || null,
      scopes_count: profile.scopes?.length ?? 0,
      active: name === activeProfile,
    }));

    if (entries.length === 0) {
      if (format === 'json') {
        this.output([]);
      } else {
        process.stderr.write('Нет сохранённых профилей. Создайте профиль:\n');
        process.stderr.write('  pachca auth login\n');
      }
      return;
    }

    this.output(entries);
  }
}
