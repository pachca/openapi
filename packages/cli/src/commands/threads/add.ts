// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class ThreadsAdd extends BaseCommand {
  static override description = "Новый тред";

  static override examples = [
      "Ответить в тред (комментарий к сообщению):\n  $ pachca thread add",
      "Подписаться на тред сообщения:\n  $ pachca thread add"
  ];

  static scope = "threads:create";
  static apiMethod = "POST";
  static apiPath = "/messages/{id}/thread";
  static defaultColumns = ["id","chat_id","message_id","message_chat_id","updated_at"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор сообщения",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ThreadsAdd);
    this.parsedFlags = flags;

    this.checkScope("threads:create");

    const { data } = await this.apiRequest({
      method: 'POST',
      path: `/messages/${args.id}/thread`,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
