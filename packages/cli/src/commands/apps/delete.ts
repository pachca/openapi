// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class AppsDelete extends BaseCommand {
  static override summary = "Удаление приложения";
  static override description = "Удаляет приложение целиком и необратимо: версии, базу, файлы, секреты и бота приложения. Если платформа приложений не ответила, метод отвечает `502`, ничего не удалено, запрос можно повторить.\n\nПолное описание: pachca api DELETE /apps/{id} --docs";
  static scope = "apps:write";
  static apiMethod = "DELETE";
  static apiPath = "/apps/{id}";

  static override args = {
    id: Args.string({
      description: "Идентификатор приложения",
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
    const { args, flags } = await this.parse(AppsDelete);
    this.parsedFlags = flags;

    if (!flags.force) {
      if (!this.isInteractive()) {
        this.validationError(
          [{ message: 'Деструктивная операция требует флага --force', flag: 'force' }],
          { type: 'PACHCA_DESTRUCTIVE_OP_ERROR', hint: "pachca apps delete <id> --force" },
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
      path: `/apps/${args.id}`,
    });

    this.success('Удалено');
  }
}
