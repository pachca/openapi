// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class CompanyGetInviteLink extends BaseCommand {
  static override description = "Ссылка-приглашение";
  static scope = "invite_links:write";
  static apiMethod = "GET";
  static apiPath = "/company/invite_link";
  static defaultColumns = ["url","expires_at"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CompanyGetInviteLink);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: '/company/invite_link',
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
