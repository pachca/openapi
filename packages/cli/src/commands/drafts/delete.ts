// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class DraftsDelete extends BaseCommand {
  static override description = "Удаление черновика";

  static override examples = [
      "Отправить сообщение позже или по расписанию — Чтобы отменить отправку — удали отложенное сообщение:\n  $ pachca drafts delete"
  ];

  static scope = "drafts:write";
  static apiMethod = "DELETE";
  static apiPath = "/drafts/{id}";

  static override args = {
    id: Args.integer({
      description: "Идентификатор черновика",
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
    const { args, flags } = await this.parse(DraftsDelete);
    this.parsedFlags = flags;

    if (!flags.force) {
      if (!this.isInteractive()) {
        this.validationError(
          [{ message: 'Деструктивная операция требует флага --force', flag: 'force' }],
          { type: 'PACHCA_DESTRUCTIVE_OP_ERROR', hint: "pachca drafts delete <id> --force" },
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
      path: `/drafts/${args.id}`,
    });

    this.success('Удалено');
  }
}
