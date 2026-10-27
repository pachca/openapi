// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class ImportantMessagesDelete extends BaseCommand {
  static override description = "Удаление сообщения из важных";
  static scope = "important_messages:write";
  static apiMethod = "DELETE";
  static apiPath = "/important_messages/{id}";

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
    const { args, flags } = await this.parse(ImportantMessagesDelete);
    this.parsedFlags = flags;

    if (!flags.force) {
      if (!this.isInteractive()) {
        this.validationError(
          [{ message: 'Деструктивная операция требует флага --force', flag: 'force' }],
          { type: 'PACHCA_DESTRUCTIVE_OP_ERROR', hint: "pachca important-messages delete <id> --force" },
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
      path: `/important_messages/${args.id}`,
    });

    this.success('Удалено');
  }
}
