import { Args } from '@oclif/core';
import * as clack from '@clack/prompts';
import { BaseCommand } from '../../base-command.js';
import { listProfiles, deleteProfile } from '../../profiles.js';
import { outputError } from '../../output.js';

export default class AuthLogout extends BaseCommand {
  static override description = 'Remove a saved profile';

  static override examples = [
    '<%= config.bin %> auth logout bot-notify',
    '<%= config.bin %> auth logout',
  ];

  static override args = {
    profile: Args.string({
      description: 'Profile name to remove',
      required: false,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AuthLogout);
    this.parsedFlags = flags;

    const profiles = listProfiles();
    const profileNames = Object.keys(profiles);
    const format = this.getOutputFormat();

    if (profileNames.length === 0) {
      outputError(
        { error: 'No profiles found', type: 'PACHCA_USAGE_ERROR', code: null },
        format,
      );
      this.exit(2);
    }

    let profileName = args.profile;

    if (!profileName) {
      if (this.isInteractive()) {
        // Interactive selection
        const selected = await clack.select({
          message: 'Выберите профиль для удаления:',
          options: profileNames.map((name) => ({
            value: name,
            label: name,
          })),
        });
        if (clack.isCancel(selected)) {
          process.stderr.write('Отменено.\n');
          this.exit(0);
        }
        profileName = selected as string;
      } else {
        // Non-interactive: one profile → delete it; multiple → error
        if (profileNames.length === 1) {
          profileName = profileNames[0];
        } else {
          if (format === 'json') {
            this.output({
              error: 'Multiple profiles found, specify which to remove',
              type: 'PACHCA_USAGE_ERROR',
              profiles: profileNames,
            });
          } else {
            outputError(
              { error: 'Multiple profiles found, specify which to remove', type: 'PACHCA_USAGE_ERROR', code: null, profiles: profileNames },
              format,
            );
          }
          this.exit(2);
        }
      }
    }

    if (!profiles[profileName!]) {
      outputError(
        { error: `Profile "${profileName}" not found`, type: 'PACHCA_USAGE_ERROR', code: null },
        format,
      );
      this.exit(2);
    }

    deleteProfile(profileName!);

    if (format === 'json') {
      this.output({ deleted_profile: profileName });
    } else {
      this.success(`Профиль ${profileName} удалён`);
    }
  }
}
