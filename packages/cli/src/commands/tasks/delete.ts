// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class TasksDelete extends BaseCommand {
  static override summary = "Удаление напоминания";
  static override description = "Убирает напоминание насовсем: восстановить его нельзя, и у ответственных оно тоже пропадает. Если напоминание уехало в подключённый календарь, событие удаляется и там, когда напоминание удаляет его автор. Если удаляет ответственный, событие может остаться в календаре автора.\n\nПолное описание: pachca api DELETE /tasks/{id} --docs";
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

    const { data } = await this.apiRequest({
      method: 'DELETE',
      path: `/tasks/${args.id}`,
    });

    this.success('Удалено');
  }
}
