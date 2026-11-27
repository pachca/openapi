// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class AppsDeleteSecret extends BaseCommand {
  static override summary = "Удаление секрета приложения";
  static override description = "Удаляет секрет. Удаление секрета, которого нет, не ошибка.\n\nПолное описание: pachca api DELETE /apps/{id}/secrets/{name} --docs";
  static scope = "apps:write";
  static apiMethod = "DELETE";
  static apiPath = "/apps/{id}/secrets/{name}";

  static override args = {
    id: Args.string({
      description: "Идентификатор приложения",
      required: true,
    }),
    name: Args.string({
      description: "Имя секрета",
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
    const { args, flags } = await this.parse(AppsDeleteSecret);
    this.parsedFlags = flags;

    if (!flags.force) {
      if (!this.isInteractive()) {
        this.validationError(
          [{ message: 'Деструктивная операция требует флага --force', flag: 'force' }],
          { type: 'PACHCA_DESTRUCTIVE_OP_ERROR', hint: "pachca apps delete-secret <id> <name> --force" },
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
      path: `/apps/${args.id}/secrets/${args.name}`,
    });

    this.success('Удалено');
  }
}
