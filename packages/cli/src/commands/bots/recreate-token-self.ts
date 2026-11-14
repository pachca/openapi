// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class BotsRecreateTokenSelf extends BaseCommand {
  static override summary = "Ротация собственного токена бота";
  static override description = "Метод позволяет боту сгенерировать себе новый `access_token` своим же токеном — без участия администратора и без знания собственного `id`.\n\nПолное описание: pachca api POST /bot/recreate_token --docs";
  static scope = "bot_self:write";
  static apiMethod = "POST";
  static apiPath = "/bot/recreate_token";
  static defaultColumns = ["id","webhook","access_token"];

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
