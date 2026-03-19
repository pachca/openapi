// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class ProfileGetStatus extends BaseCommand {
  static override description = "Текущий статус";

  static override examples = [
      "Установить статус:\n  $ pachca profile update-status",
      "Сбросить статус:\n  $ pachca profile delete-status"
  ];

  static scope = "profile_status:read";
  static apiMethod = "GET";
  static apiPath = "/profile/status";
  static defaultColumns = ["title","emoji","expires_at","is_away"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ProfileGetStatus);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: '/profile/status',
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
