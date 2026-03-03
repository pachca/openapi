// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class MessagesDelete extends BaseCommand {
  static override description = "Удаление сообщения";

  static override examples = [
      "Получить вложения из сообщения:\n  $ pachca messages get",
      "Отредактировать сообщение:\n  $ pachca messages update",
      "Изменить вложения сообщения:\n  $ pachca messages get"
  ];

  static scope = "messages:delete";
  static apiMethod = "DELETE";
  static apiPath = "/messages/{id}";

  static override args = {
    id: Args.integer({
      description: "Идентификатор сообщения",
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
    const { args, flags } = await this.parse(MessagesDelete);
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

    this.checkScope("messages:delete");

    const { data } = await this.apiRequest({
      method: 'DELETE',
      path: `/messages/${args.id}`,
    });

    this.success('Удалено');
  }
}
