// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class TasksDelete extends BaseCommand {
  static override description = "Удаление напоминания";

  static override examples = [
      "Получить задачу по ID:\n  $ pachca tasks get",
      "Отметить задачу выполненной:\n  $ pachca tasks update",
      "Обновить задачу (перенести срок, сменить ответственных):\n  $ pachca tasks update"
  ];

  static scope = "tasks:delete";
  static apiMethod = "DELETE";
  static apiPath = "/tasks/{id}";

  static override args = {
    id: Args.integer({
      description: "Идентификатор напоминания (pachca tasks list)",
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
    const { args, flags } = await this.parse(TasksDelete);
    this.parsedFlags = flags;

    if (!flags.force) {
      if (!this.isInteractive()) {
        this.validationError(
          [{ message: 'Деструктивная операция требует флага --force', flag: 'force' }],
          { type: 'PACHCA_DESTRUCTIVE_OP_ERROR', hint: "pachca tasks delete <id> --force" },
        );
      }
      const confirm = await clack.confirm({ message: 'Вы уверены?' });
      if (clack.isCancel(confirm) || !confirm) {
        process.stderr.write('Отменено.\n');
        this.exit(0);
      }
    }

    this.checkScope("tasks:delete");

    const { data } = await this.apiRequest({
      method: 'DELETE',
      path: `/tasks/${args.id}`,
    });

    this.success('Удалено');
  }
}
