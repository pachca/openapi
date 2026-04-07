// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class UsersRemoveAvatar extends BaseCommand {
  static override description = "Удаление аватара сотрудника";

  static override examples = [
      "Загрузить аватар сотрудника:\n  $ pachca users update-avatar",
      "Удалить аватар сотрудника:\n  $ pachca users remove-avatar"
  ];

  static scope = "user_avatar:write";
  static apiMethod = "DELETE";
  static apiPath = "/users/{user_id}/avatar";

  static override args = {
    user_id: Args.integer({
      description: "Идентификатор пользователя (pachca users list)",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    force: Flags.boolean({
      description: 'Пропустить подтверждение',
      default: false,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UsersRemoveAvatar);
    this.parsedFlags = flags;

    if (!flags.force) {
      if (!this.isInteractive()) {
        this.validationError(
          [{ message: 'Деструктивная операция требует флага --force', flag: 'force' }],
          { type: 'PACHCA_DESTRUCTIVE_OP_ERROR', hint: "pachca users remove-avatar <user_id> --force" },
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
      path: `/users/${args.user_id}/avatar`,
    });

    this.success('Удалено');
  }
}
