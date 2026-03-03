import { Args } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { getActiveProfile, getProfile, setProfile } from '../../profiles.js';
import { request } from '../../client.js';
import { outputError } from '../../output.js';

export default class AuthRefresh extends BaseCommand {
  static override description = 'Refresh cached scopes for a profile';

  static override examples = [
    '<%= config.bin %> auth refresh bot-support',
    '<%= config.bin %> auth refresh',
  ];

  static override args = {
    profile: Args.string({
      description: 'Profile name to refresh',
      required: false,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AuthRefresh);
    this.parsedFlags = flags;

    const profileName = args.profile || flags.profile || process.env.PACHCA_PROFILE || getActiveProfile();
    const format = this.getOutputFormat();

    if (!profileName) {
      outputError(
        { error: 'No profile specified. Run: pachca auth refresh <profile>', type: 'PACHCA_USAGE_ERROR', code: null },
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

    // Fetch fresh scopes
    const response = await request(
      { method: 'GET', path: '/oauth/token/info', token: profile!.token },
      { quiet: flags.quiet },
    );
    const tokenInfo = response.data as { scopes: string[] };
    const newScopes = tokenInfo.scopes || [];
    const oldScopes = profile!.scopes || [];

    // Update profile
    profile!.scopes = newScopes;
    profile!.scopes_refreshed_at = new Date().toISOString();
    setProfile(profileName!, profile!);

    // Calculate diff
    const added = newScopes.filter((s) => !oldScopes.includes(s));
    const removed = oldScopes.filter((s) => !newScopes.includes(s));

    if (format === 'json') {
      this.output({
        profile: profileName,
        scopes_before: oldScopes,
        scopes_after: newScopes,
        added,
        removed,
      });
    } else if (!flags.quiet) {
      this.success(`Скоупы обновлены  [${profileName}]`);
      if (added.length || removed.length) {
        process.stderr.write(`  Было: ${oldScopes.join(', ')}\n`);
        process.stderr.write(`  Стало: ${newScopes.join(', ')}`);
        if (added.length) process.stderr.write(`  (+${added.length} новых)`);
        process.stderr.write('\n');
      }
    }
  }
}
