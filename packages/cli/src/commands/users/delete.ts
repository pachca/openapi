// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class UsersDelete extends BaseCommand {
  static override description = "Удаление сотрудника";

  static override examples = [
      "Получить сотрудника по ID:\n  $ pachca users get",
      "Массовое создание сотрудников с тегами:\n  $ pachca users update",
      "Offboarding сотрудника:\n  $ pachca users update"
  ];

  static scope = "users:delete";
  static apiMethod = "DELETE";
  static apiPath = "/users/{id}";

  static override args = {
    id: Args.integer({
      description: "Идентификатор пользователя",
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
    const { args, flags } = await this.parse(UsersDelete);
    this.parsedFlags = flags;

    if (!flags.force) {
      if (!this.isInteractive()) {
        process.stderr.write('✗ Деструктивная операция требует флага --force в неинтерактивном режиме\n');
        this.exit(2);
      }
      const confirm = await clack.confirm({ message: 'Вы уверены?' });
      if (clack.isCancel(confirm) || !confirm) {
        process.stderr.write('Отменено.\n');
        this.exit(0);
      }
    }

    this.checkScope("users:delete");

    const { data } = await this.apiRequest({
      method: 'DELETE',
      path: `/users/${args.id}`,
    });

    this.success('Удалено');
  }
}
