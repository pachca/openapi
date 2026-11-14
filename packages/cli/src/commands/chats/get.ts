// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class ChatsGet extends BaseCommand {
  static override summary = "Информация о чате";
  static override description = "Карточка чата вместе с составом участников и привязанными тегами. Что в чате написано, возвращает Список сообщений чата.\n\nПолное описание: pachca api GET /chats/{id} --docs";
  static scope = "chats:read";
  static apiMethod = "GET";
  static apiPath = "/chats/{id}";
  static defaultColumns = ["id","name","created_at","owner_id","channel"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор чата: в ссылке веб-приложения это число из пути `/chats/{id}` (pachca chats list)",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ChatsGet);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: `/chats/${args.id}`,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
