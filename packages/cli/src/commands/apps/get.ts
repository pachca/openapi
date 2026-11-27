// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class AppsGet extends BaseCommand {
  static override summary = "Информация о приложении";
  static override description = "Приложение пространства по его идентификатору. Приложение другого пространства отвечает `404`.\n\nПолное описание: pachca api GET /apps/{id} --docs";
  static scope = "apps:read";
  static apiMethod = "GET";
  static apiPath = "/apps/{id}";
  static defaultColumns = ["id","name","created_at","icon","bot_id"];

  static override args = {
    id: Args.string({
      description: "Идентификатор приложения",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AppsGet);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: `/apps/${args.id}`,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
