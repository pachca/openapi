import { Args } from '@oclif/core';
import * as clack from '@clack/prompts';
import { BaseCommand } from '../../base-command.js';
import { listProfiles, deleteProfile, getAuthMethod, getSecretStorage, getProfile } from '../../profiles.js';
import { revokeToken } from '../../oauth.js';
import { outputError } from '../../output.js';

export default class AuthLogout extends BaseCommand {
  static override description = 'Удаление сохранённого профиля';

  static override examples = [
    '<%= config.bin %> auth logout bot-notify',
    '<%= config.bin %> auth logout',
  ];

  static override args = {
    profile: Args.string({
      description: 'Имя профиля для удаления',
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

    const authMethod = getAuthMethod(profiles[profileName!]);
    const storage = getSecretStorage(profiles[profileName!]);

    // Put the token out server-side before dropping the profile — afterwards the
    // secret is gone and there is nothing left to revoke with. Only tokens this
    // CLI issued can revoke themselves; a pasted one is not ours to cancel.
    let revoked = false;
    if (authMethod === 'oauth') {
      const secret = getProfile(profileName!)?.token;
      if (secret) revoked = await revokeToken(secret);
    }

    deleteProfile(profileName!);

    if (format === 'json') {
      this.output({
        deleted_profile: profileName,
        auth: authMethod,
        storage,
        token_revoked: revoked,
      });
      return;
    }

    this.success(`Профиль ${profileName} удалён`);

    // Never claim access is closed when it is not: believing a logout revoked a
    // token when it did not is worse than an extra line here.
    if (!flags.quiet) {
      if (authMethod === 'oauth') {
        process.stderr.write(
          revoked
            ? `  Токен отозван на сервере и удалён с этой машины.\n`
            : `  Токен удалён с этой машины. Отозвать его не удалось — перестанет действовать по истечении срока.\n`,
        );
      } else {
        process.stderr.write(`  Токен удалён с этой машины, но продолжает действовать.\n`);
        process.stderr.write(`  Отзовите его в настройках Пачки, если он больше не нужен.\n`);
      }

      // Storage is a property of the profile, not of how it was created: a pasted
      // token lives in the store just the same, and its entry goes away too.
      if (storage === 'keyring') {
        process.stderr.write(`  Запись в хранилище ключей ОС удалена.\n`);
      }
    }
  }
}
