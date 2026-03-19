// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class ChatsArchive extends BaseCommand {
  static override description = "Архивация чата";

  static override examples = [
      "Архивация и управление чатом:\n  $ pachca chats archive",
      "Найти и заархивировать неактивные чаты:\n  $ pachca chats archive"
  ];

  static scope = "chats:archive";
  static apiMethod = "PUT";
  static apiPath = "/chats/{id}/archive";

  static override args = {
    id: Args.integer({
      description: "Идентификатор чата (pachca chats list)",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ChatsArchive);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'PUT',
      path: `/chats/${args.id}/archive`,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
