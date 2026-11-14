// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class ChatsUnarchive extends BaseCommand {
  static override summary = "Разархивация чата";
  static override description = "Возвращает беседу или канал из архива: чат снова появляется в списках, и в него снова можно писать.\n\nПолное описание: pachca api PUT /chats/{id}/unarchive --docs";
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

    const { data } = await this.apiRequest({
      method: 'PUT',
      path: `/chats/${args.id}/unarchive`,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
