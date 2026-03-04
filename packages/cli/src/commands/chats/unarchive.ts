// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class ChatsUnarchive extends BaseCommand {
  static override description = "Разархивация чата";

  static override examples = [
      "Архивация и управление чатом:\n  $ pachca chats unarchive"
  ];

  static scope = "chats:archive";
  static apiMethod = "PUT";
  static apiPath = "/chats/{id}/unarchive";

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
    const { args, flags } = await this.parse(ChatsUnarchive);
    this.parsedFlags = flags;

    this.checkScope("chats:archive");

    const { data } = await this.apiRequest({
      method: 'PUT',
      path: `/chats/${args.id}/unarchive`,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
