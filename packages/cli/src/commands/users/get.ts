// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class UsersGet extends BaseCommand {
  static override description = "Информация о сотруднике";

  static override examples = [
      "Получить сотрудника по ID:\n  $ pachca users get",
      "Массовое создание сотрудников с тегами:\n  $ pachca users update",
      "Offboarding сотрудника:\n  $ pachca users update"
  ];

  static scope = "users:read";
  static apiMethod = "GET";
  static apiPath = "/users/{id}";
  static defaultColumns = ["id","title","first_name","last_name","email"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор пользователя (pachca users list)",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UsersGet);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: `/users/${args.id}`,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
