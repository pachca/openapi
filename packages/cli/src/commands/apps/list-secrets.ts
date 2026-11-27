// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class AppsListSecrets extends BaseCommand {
  static override summary = "Список секретов приложения";
  static override description = "Имена заданных секретов приложения: ключей внешних сервисов и секретов подписи вебхуков. Значения не возвращаются.\n\nПолное описание: pachca api GET /apps/{id}/secrets --docs";
  static scope = "apps:read";
  static apiMethod = "GET";
  static apiPath = "/apps/{id}/secrets";

  static override args = {
    id: Args.string({
      description: "Идентификатор приложения",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AppsListSecrets);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: `/apps/${args.id}/secrets`,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
