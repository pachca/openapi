// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class MessagesGet extends BaseCommand {
  static override description = "Информация о сообщении";

  static override examples = [
      "Получить вложения из сообщения:\n  $ pachca messages get",
      "Отредактировать сообщение:\n  $ pachca messages update",
      "Изменить вложения сообщения:\n  $ pachca messages get"
  ];

  static scope = "messages:read";
  static apiMethod = "GET";
  static apiPath = "/messages/{id}";
  static defaultColumns = ["id","content","created_at","entity_type","entity_id"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор сообщения (pachca messages list)",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MessagesGet);
    this.parsedFlags = flags;

    this.checkScope("messages:read");

    const { data } = await this.apiRequest({
      method: 'GET',
      path: `/messages/${args.id}`,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
