// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class ProfileGet extends BaseCommand {
  static override description = "Информация о профиле";

  static override examples = [
      "Получить свой профиль:\n  $ pachca profile get",
      "Получить кастомные поля профиля:\n  $ pachca profile get"
  ];

  static scope = "profile:read";
  static apiMethod = "GET";
  static apiPath = "/profile";
  static defaultColumns = ["id","title","first_name","last_name","email"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProfileGet);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: '/profile',
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
