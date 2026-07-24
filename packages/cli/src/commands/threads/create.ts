// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class ThreadsCreate extends BaseCommand {
  static override description = "Новый самостоятельный тред";

  static scope = "threads:create";
  static apiMethod = "POST";
  static apiPath = "/threads";
  static defaultColumns = ["id","chat_id","message_id","message_chat_id","updated_at"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ThreadsCreate);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'POST',
      path: '/threads',
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
