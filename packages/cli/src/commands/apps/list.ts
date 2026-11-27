// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class AppsList extends BaseCommand {
  static override summary = "Список приложений";
  static override description = "Кастомные приложения пространства по порядку создания, одним списком без пагинации.\n\nПолное описание: pachca api GET /apps --docs";
  static scope = "apps:read";
  static apiMethod = "GET";
  static apiPath = "/apps";
  static defaultColumns = ["id","name","created_at","icon","bot_id"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AppsList);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: '/apps',
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
