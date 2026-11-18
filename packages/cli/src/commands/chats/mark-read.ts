// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class ChatsMarkRead extends BaseCommand {
  static override summary = "Отметка чата прочитанным";
  static override description = "Отмечает чат прочитанным для владельца токена до последнего сообщения на момент запроса, как если дочитать его до конца в интерфейсе. Прочитанными станут и сообщения, пришедшие уже после того, как вы получили историю.\n\nПолное описание: pachca api PUT /chats/{id}/read --docs";
  static scope = "chats:mark_read";
  static apiMethod = "PUT";
  static apiPath = "/chats/{id}/read";
  static defaultColumns = ["last_read_message_id"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор чата (беседы, канала, личного чата или чата треда) (pachca chats list)",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ChatsMarkRead);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'PUT',
      path: `/chats/${args.id}/read`,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
