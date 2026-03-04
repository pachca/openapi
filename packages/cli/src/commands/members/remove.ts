// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class MembersRemove extends BaseCommand {
  static override description = "Исключение пользователя";

  static override examples = [
      "Архивация и управление чатом:\n  $ pachca members update",
      "Архивация и управление чатом:\n  $ pachca members remove"
  ];

  static scope = "chat_members:write";
  static apiMethod = "DELETE";
  static apiPath = "/chats/{id}/members/{user_id}";

  static override args = {
    id: Args.integer({
      description: "Идентификатор чата",
      required: true,
    }),
    user_id: Args.integer({
      description: "Идентификатор пользователя (pachca users list)",
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
    const { args, flags } = await this.parse(MembersRemove);
    this.parsedFlags = flags;

    if (!flags.force) {
      if (!this.isInteractive()) {
        this.validationError(
          [{ message: 'Деструктивная операция требует флага --force', flag: 'force' }],
          { type: 'PACHCA_DESTRUCTIVE_OP_ERROR', hint: "pachca members remove <id> <user_id> --force" },
        );
      }
      const confirm = await clack.confirm({ message: 'Вы уверены?' });
      if (clack.isCancel(confirm) || !confirm) {
        process.stderr.write('Отменено.\n');
        this.exit(0);
      }
    }

    this.checkScope("chat_members:write");

    const { data } = await this.apiRequest({
      method: 'DELETE',
      path: `/chats/${args.id}/members/${args.user_id}`,
    });

    this.success('Удалено');
  }
}
