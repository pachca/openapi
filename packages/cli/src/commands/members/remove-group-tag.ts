// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class MembersRemoveGroupTag extends BaseCommand {
  static override description = "Исключение тега";

  static scope = "chat_members:write";
  static apiMethod = "DELETE";
  static apiPath = "/chats/{id}/group_tags/{tag_id}";

  static override args = {
    id: Args.integer({
      description: "Идентификатор чата",
      required: true,
    }),
    tag_id: Args.integer({
      description: "Идентификатор тега",
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
    const { args, flags } = await this.parse(MembersRemoveGroupTag);
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

    this.checkScope("chat_members:write");

    const { data } = await this.apiRequest({
      method: 'DELETE',
      path: `/chats/${args.id}/group_tags/${args.tag_id}`,
    });

    this.success('Удалено');
  }
}
