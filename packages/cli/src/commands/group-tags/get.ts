// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class GroupTagsGet extends BaseCommand {
  static override description = "Информация о теге";

  static scope = "group_tags:read";
  static apiMethod = "GET";
  static apiPath = "/group_tags/{id}";
  static defaultColumns = ["id","name","users_count"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор тега",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(GroupTagsGet);
    this.parsedFlags = flags;

    this.checkScope("group_tags:read");

    const { data } = await this.apiRequest({
      method: 'GET',
      path: `/group_tags/${args.id}`,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
