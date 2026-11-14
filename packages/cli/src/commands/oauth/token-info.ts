// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class OauthTokenInfo extends BaseCommand {
  static override summary = "Информация о токене";
  static override description = "Сведения о токене, которым сделан сам запрос: его скоупы, владелец, даты создания и последнего использования. Сам токен приходит замаскированным — видны только первые 8 и последние 4 символа.\n\nПолное описание: pachca api GET /oauth/token/info --docs";
  static override hiddenAliases = ["profile:get-info"];
  static apiMethod = "GET";
  static apiPath = "/oauth/token/info";
  static defaultColumns = ["id","name","created_at","token","user_id"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(OauthTokenInfo);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: '/oauth/token/info',
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
