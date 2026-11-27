// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class AppsGetSource extends BaseCommand {
  static override summary = "Исходники приложения";
  static override description = "Исходники текущей версии, загруженные вместе с ней. По ним команда `npx pachca-app pull` восстанавливает папку приложения. Приложение без версий отвечает `404`.\n\nПолное описание: pachca api GET /apps/{id}/source --docs";
  static scope = "apps:read";
  static apiMethod = "GET";
  static apiPath = "/apps/{id}/source";
  static defaultColumns = ["version"];

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
    const { args, flags } = await this.parse(AppsGetSource);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: `/apps/${args.id}/source`,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
