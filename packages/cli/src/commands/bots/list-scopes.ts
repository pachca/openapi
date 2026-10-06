// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class BotsListScopes extends BaseCommand {
  static override description = "Каталог прав бота";

  static override examples = [
      "Выпустить боту отдельный токен — Пользовательским токеном (создатель бота или администратор, если бот открыт администраторам) получи каталог прав, которые можно выдать этому боту:\n  $ pachca bots list-scopes"
  ];

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
