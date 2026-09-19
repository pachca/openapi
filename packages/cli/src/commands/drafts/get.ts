// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class DraftsGet extends BaseCommand {
  static override description = "Информация о черновике";

  static scope = "drafts:read";
  static apiMethod = "GET";
  static apiPath = "/drafts/{id}";
  static defaultColumns = ["id","content","created_at","entity_type","entity_id"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор черновика",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(DraftsGet);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: `/drafts/${args.id}`,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
