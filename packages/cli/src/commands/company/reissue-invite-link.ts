// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class CompanyReissueInviteLink extends BaseCommand {
  static override summary = "Перевыпуск ссылки-приглашения";
  static override description = "Выпускает новую ссылку-приглашение владельца токена. Прежняя ссылка этого администратора сразу перестаёт работать, в том числе уже разосланная из интерфейса. Ссылки других администраторов остаются.\n\nПолное описание: pachca api POST /company/invite_link --docs";
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
