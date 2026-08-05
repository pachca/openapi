// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class BotsRecreateTokenSelf extends BaseCommand {
  static override description = "Ротация собственного токена бота";

  static override examples = [
      "Ротация токена бота — Или: бот перевыпускает собственный токен своим же токеном (скоуп `bot_self:write`). Токен, которым выполнен запрос, инвалидируется сразу — обязательно сохрани новый `access_token` из ответа, иначе бот потеряет доступ к API:\n  $ pachca bots recreate-token-self"
  ];

  static scope = "bot_self:write";
  static apiMethod = "POST";
  static apiPath = "/bot/recreate_token";
  static defaultColumns = ["id","webhook","access_token","client_secret"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(BotsRecreateTokenSelf);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'POST',
      path: '/bot/recreate_token',
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
