// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class CompanyReissueInviteLink extends BaseCommand {
  static override description = "Перевыпуск ссылки-приглашения";
  static scope = "invite_links:write";
  static apiMethod = "POST";
  static apiPath = "/company/invite_link";
  static defaultColumns = ["url","expires_at"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CompanyReissueInviteLink);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'POST',
      path: '/company/invite_link',
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
