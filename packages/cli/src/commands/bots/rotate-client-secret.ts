// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class BotsRotateClientSecret extends BaseCommand {
  static override summary = "Ротация секрета клиента";
  static override description = "Выпускает новый `client_secret` для авторизации от имени сотрудника. Прежний секрет перестаёт работать сразу, поэтому сначала подготовьте бота к замене. Уже выданные авторизации и полученные токены продолжают работать.\n\nПолное описание: pachca api POST /bots/{id}/rotate_client_secret --docs";
  static scope = "bots:write";
  static apiMethod = "POST";
  static apiPath = "/bots/{id}/rotate_client_secret";
  static defaultColumns = ["id","name","created_at","nickname","avatar_url"];

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
    const { args, flags } = await this.parse(BotsRotateClientSecret);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'POST',
      path: `/bots/${args.id}/rotate_client_secret`,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
