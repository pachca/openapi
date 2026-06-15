// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class BotsGet extends BaseCommand {
  static override description = "Получение бота";

  static override examples = [
      "Обновить Webhook URL бота:\n  $ pachca bots update"
  ];

  static scope = "bots:read";
  static apiMethod = "GET";
  static apiPath = "/bots/{id}";
  static defaultColumns = ["id","webhook"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор бота (pachca bots list)",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(BotsGet);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: `/bots/${args.id}`,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
