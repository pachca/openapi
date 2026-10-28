// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class MessagesGet extends BaseCommand {
  static override description = "Информация о сообщении";
  static scope = "messages:read";
  static apiMethod = "GET";
  static apiPath = "/messages/{id}";
  static defaultColumns = ["id","content","created_at","entity_type","entity_id"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор сообщения. Ссылка веб-приложения указывает на сообщение параметром `sidebar_message`, а без него — параметром `message`. Число из `thread_message_id` — сообщение, под которым висит тред. (pachca messages list)",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MessagesGet);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: `/messages/${args.id}`,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
