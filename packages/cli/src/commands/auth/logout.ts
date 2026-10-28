import { Args } from '@oclif/core';
import * as clack from '@clack/prompts';
import { BaseCommand } from '../../base-command.js';
import { listProfiles, deleteProfile, getAuthMethod, getSecretStorage, getProfile } from '../../profiles.js';
import { revokeSession, type SessionRevocation } from '../../token-refresh.js';
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

    // Close the login server-side before dropping the profile — afterwards the
    // secrets are gone and there is nothing left to revoke with. Only logins this
    // CLI made can revoke themselves; a pasted token is not ours to cancel.
    let session: SessionRevocation = 'open';
    if (authMethod === 'oauth') {
      const profile = getProfile(profileName!);
      if (profile) session = await revokeSession(profileName!, profile);
    }

    deleteProfile(profileName!);

    if (format === 'json') {
      this.output({
        deleted_profile: profileName,
        auth: authMethod,
        storage,
        // True when the server confirms the login is closed. The revoke endpoint
        // answers 200 to a login closed earlier too, so the field reports the
        // state on the server, not which call closed it. False means nothing
        // confirms it: the login may still be alive in the «Токены CLI» list.
        token_revoked: session !== 'open',
      });
      return;
    }

    this.success(`Профиль ${profileName} удалён`);

    // Never claim access is closed when it is not: believing a logout revoked a
    // token when it did not is worse than an extra line here.
    if (!flags.quiet) {
      if (authMethod === 'oauth') {
        if (session === 'revoked') {
          process.stderr.write(`  Вход закрыт на сервере, токен удалён с этой машины.\n`);
        } else if (session === 'closed') {
          process.stderr.write(`  Токен удалён с этой машины. Вход на сервере уже был закрыт.\n`);
        } else {
          process.stderr.write(`  Токен удалён с этой машины, но закрыть вход на сервере не удалось.\n`);
          process.stderr.write(`  Отзовите его в Пачке: Интеграции > API, список «Токены CLI».\n`);
        }
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
