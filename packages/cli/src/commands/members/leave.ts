// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class MembersLeave extends BaseCommand {
  static override summary = "Выход из чата";
  static override description = "Владелец токена выходит из беседы или канала сам. В закрытой беседе остальные видят системное сообщение о выходе, в открытом чате и канале — нет.\n\nПолное описание: pachca api DELETE /chats/{id}/leave --docs";
  static scope = "chats:leave";
  static apiMethod = "DELETE";
  static apiPath = "/chats/{id}/leave";

  static override args = {
    id: Args.integer({
      description: "Идентификатор чата",
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
    const { args, flags } = await this.parse(MembersLeave);
    this.parsedFlags = flags;

    if (!flags.force) {
      if (!this.isInteractive()) {
        this.validationError(
          [{ message: 'Деструктивная операция требует флага --force', flag: 'force' }],
          { type: 'PACHCA_DESTRUCTIVE_OP_ERROR', hint: "pachca members leave <id> --force" },
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
      path: `/chats/${args.id}/leave`,
    });

    this.success('Удалено');
  }
}
