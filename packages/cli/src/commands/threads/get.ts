// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class ThreadsGet extends BaseCommand {
  static override summary = "Информация о треде";
  static override description = "Идентификаторы треда и сообщения, под которым он висит. По `id` в тред пишут методом Новое сообщение с `entity_type: \"thread\"`, а по `chat_id` читают его сообщения. У самостоятельного треда `message_id` и `message_chat_id` приходят как `null`.\n\nПолное описание: pachca api GET /threads/{id} --docs";
  static scope = "threads:read";
  static apiMethod = "GET";
  static apiPath = "/threads/{id}";
  static defaultColumns = ["id","chat_id","message_id","message_chat_id","updated_at"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор треда: в ссылке веб-приложения это число из параметра `thread_id`",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ThreadsGet);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: `/threads/${args.id}`,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
