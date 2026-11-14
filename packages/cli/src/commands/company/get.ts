// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class CompanyGet extends BaseCommand {
  static override summary = "Информация о пространстве";
  static override description = "Название пространства, его владелец, тариф и основные настройки: показ личных данных, сквозные треды, кто может создавать персональные токены и интеграции. Метод работает, даже когда пространство заблокировано и другие методы отвечают `402`.\n\nПолное описание: pachca api GET /company --docs";
  static scope = "company:read";
  static apiMethod = "GET";
  static apiPath = "/company";
  static defaultColumns = ["id","name","owner_id","show_personal_data","use_global_threads"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CompanyGet);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: '/company',
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
