// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class BotsRecreateToken extends BaseCommand {
  static override description = "Ротация токена бота";

  static override examples = [
      "Ротация токена бота:\n  $ pachca bots recreate-token"
  ];

  static scope = "bots:write";
  static apiMethod = "POST";
  static apiPath = "/bots/{id}/recreate_token";
  static defaultColumns = ["id","webhook","access_token"];

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
    const { args, flags } = await this.parse(BotsRecreateToken);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'POST',
      path: `/bots/${args.id}/recreate_token`,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
