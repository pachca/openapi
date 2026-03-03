// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class ProfileGetInfo extends BaseCommand {
  static override description = "Информация о токене";

  static override examples = [
      "Проверить свой токен:\n  $ pachca profile get-info"
  ];

  static apiMethod = "GET";
  static apiPath = "/oauth/token/info";
  static defaultColumns = ["id","name","created_at","token","user_id"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProfileGetInfo);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: '/oauth/token/info',
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
