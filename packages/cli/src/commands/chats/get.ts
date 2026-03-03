// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class ChatsGet extends BaseCommand {
  static override description = "Информация о чате";

  static override examples = [
      "Переименовать или обновить чат:\n  $ pachca chats update"
  ];

  static scope = "chats:read";
  static apiMethod = "GET";
  static apiPath = "/chats/{id}";
  static defaultColumns = ["id","name","created_at","owner_id","channel"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор чата",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ChatsGet);
    this.parsedFlags = flags;

    this.checkScope("chats:read");

    const { data } = await this.apiRequest({
      method: 'GET',
      path: `/chats/${args.id}`,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
