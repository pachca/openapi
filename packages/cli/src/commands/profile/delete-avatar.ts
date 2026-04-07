// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class ProfileDeleteAvatar extends BaseCommand {
  static override description = "Удаление аватара";

  static override examples = [
      "Загрузить аватар профиля:\n  $ pachca profile update-avatar",
      "Удалить аватар профиля:\n  $ pachca profile delete-avatar"
  ];

  static scope = "profile_avatar:write";
  static apiMethod = "DELETE";
  static apiPath = "/profile/avatar";

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    force: Flags.boolean({
      description: 'Пропустить подтверждение',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProfileDeleteAvatar);
    this.parsedFlags = flags;

    if (!flags.force) {
      if (!this.isInteractive()) {
        this.validationError(
          [{ message: 'Деструктивная операция требует флага --force', flag: 'force' }],
          { type: 'PACHCA_DESTRUCTIVE_OP_ERROR', hint: "pachca profile delete-avatar  --force" },
        );
      }
      const confirm = await clack.confirm({ message: 'Вы уверены?' });
      if (clack.isCancel(confirm) || !confirm) {
        process.stderr.write('Отменено.\n');
        this.exit(0);
      }
    }

    const { data } = await this.apiRequest({
      method: 'DELETE',
      path: '/profile/avatar',
    });

    this.success('Удалено');
  }
}
