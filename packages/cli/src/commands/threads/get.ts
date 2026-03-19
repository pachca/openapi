// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class ThreadsGet extends BaseCommand {
  static override description = "Информация о треде";

  static scope = "threads:read";
  static apiMethod = "GET";
  static apiPath = "/threads/{id}";
  static defaultColumns = ["id","chat_id","message_id","message_chat_id","updated_at"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор треда",
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

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
