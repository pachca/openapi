// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class UsersRemoveStatus extends BaseCommand {
  static override description = "Удаление статуса сотрудника";

  static override examples = [
      "Управление статусом сотрудника:\n  $ pachca users get-status",
      "Управление статусом сотрудника:\n  $ pachca users update-status",
      "Управление статусом сотрудника:\n  $ pachca users remove-status"
  ];

  static scope = "user_status:write";
  static apiMethod = "DELETE";
  static apiPath = "/users/{user_id}/status";

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
    const { args, flags } = await this.parse(UsersRemoveStatus);
    this.parsedFlags = flags;

    if (!flags.force) {
      if (!this.isInteractive()) {
        this.validationError(
          [{ message: 'Деструктивная операция требует флага --force', flag: 'force' }],
          { type: 'PACHCA_DESTRUCTIVE_OP_ERROR', hint: "pachca users remove-status <user_id> --force" },
        );
      }
      const confirm = await clack.confirm({ message: 'Вы уверены?' });
      if (clack.isCancel(confirm) || !confirm) {
        process.stderr.write('Отменено.\n');
        this.exit(0);
      }
    }

    this.checkScope("user_status:write");

    const { data } = await this.apiRequest({
      method: 'DELETE',
      path: `/users/${args.user_id}/status`,
    });

    this.success('Удалено');
  }
}
