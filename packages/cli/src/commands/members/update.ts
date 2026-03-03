// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class MembersUpdate extends BaseCommand {
  static override description = "Редактирование роли";

  static override examples = [
      "Архивация и управление чатом:\n  $ pachca members update",
      "Архивация и управление чатом:\n  $ pachca members remove"
  ];

  static scope = "chat_members:write";
  static apiMethod = "PUT";
  static apiPath = "/chats/{id}/members/{user_id}";

  static override args = {
    id: Args.integer({
      description: "Идентификатор чата",
      required: true,
    }),
    user_id: Args.integer({
      description: "Идентификатор пользователя",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MembersUpdate);
    this.parsedFlags = flags;

    this.checkScope("chat_members:write");

    const { data } = await this.apiRequest({
      method: 'PUT',
      path: `/chats/${args.id}/members/${args.user_id}`,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
