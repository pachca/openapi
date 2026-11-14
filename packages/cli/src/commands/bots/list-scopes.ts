// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class BotsListScopes extends BaseCommand {
  static override summary = "Каталог прав бота";
  static override description = "Права, которые можно выдать этому боту: его токенам и авторизации от имени сотрудника. У каждого права есть описание, категория и готовые наборы, в которые оно входит, как при выборе прав в интерфейсе.\n\nПолное описание: pachca api GET /bots/{id}/scopes --docs";
  static scope = "bots:read";
  static apiMethod = "GET";
  static apiPath = "/bots/{id}/scopes";

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
    const { args, flags } = await this.parse(BotsListScopes);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: `/bots/${args.id}/scopes`,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
