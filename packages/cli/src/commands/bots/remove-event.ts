// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class BotsRemoveEvent extends BaseCommand {
  static override description = "Удаление события";

  static override examples = [
      "Обработка событий через историю (polling):\n  $ pachca bots remove-event"
  ];

  static scope = "webhooks:events:delete";
  static apiMethod = "DELETE";
  static apiPath = "/webhooks/events/{id}";

  static override args = {
    id: Args.string({
      description: "Идентификатор события (pachca bots list)",
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
    const { args, flags } = await this.parse(BotsRemoveEvent);
    this.parsedFlags = flags;

    if (!flags.force) {
      if (!this.isInteractive()) {
        this.validationError(
          [{ message: 'Деструктивная операция требует флага --force', flag: 'force' }],
          { type: 'PACHCA_DESTRUCTIVE_OP_ERROR', hint: "pachca bots remove-event <id> --force" },
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
      path: `/webhooks/events/${args.id}`,
    });

    this.success('Удалено');
  }
}
