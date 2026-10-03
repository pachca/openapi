// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class BotsReissueToken extends BaseCommand {
  static override description = "Перевыпуск токена бота";

  static override examples = [
      "Ротация токена бота — Отдельный токен бота перевыпускай по его `id` из `pachca bots list-tokens`: значение меняется, имя и права остаются:\n  $ pachca bots reissue-token"
  ];

  static scope = "bots:write";
  static apiMethod = "POST";
  static apiPath = "/bots/{id}/tokens/{token_id}/reissue";
  static defaultColumns = ["id","name","created_at","token","user_id"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор бота (pachca bots list)",
      required: true,
    }),
    token_id: Args.integer({
      description: "Идентификатор токена",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(BotsReissueToken);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'POST',
      path: `/bots/${args.id}/tokens/${args.token_id}/reissue`,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
