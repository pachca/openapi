// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class UsersGetStatus extends BaseCommand {
  static override description = "Статус сотрудника";

  static override examples = [
      "Управление статусом сотрудника:\n  $ pachca users get-status",
      "Управление статусом сотрудника:\n  $ pachca users update-status",
      "Управление статусом сотрудника:\n  $ pachca users remove-status"
  ];

  static scope = "user_status:read";
  static apiMethod = "GET";
  static apiPath = "/users/{user_id}/status";
  static defaultColumns = ["title","emoji","expires_at","is_away"];

  static override args = {
    user_id: Args.integer({
      description: "Идентификатор пользователя (pachca users list)",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(UsersGetStatus);
    this.parsedFlags = flags;

    this.checkScope("user_status:read");

    const { data } = await this.apiRequest({
      method: 'GET',
      path: `/users/${args.user_id}/status`,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
