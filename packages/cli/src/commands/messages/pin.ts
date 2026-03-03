// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class MessagesPin extends BaseCommand {
  static override description = "Закрепление сообщения";

  static override examples = [
      "Закрепить/открепить сообщение:\n  $ pachca messages pin",
      "Закрепить/открепить сообщение:\n  $ pachca messages unpin"
  ];

  static scope = "pins:write";
  static apiMethod = "POST";
  static apiPath = "/messages/{id}/pin";

  static override args = {
    id: Args.integer({
      description: "Идентификатор сообщения",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MessagesPin);
    this.parsedFlags = flags;

    this.checkScope("pins:write");

    const { data } = await this.apiRequest({
      method: 'POST',
      path: `/messages/${args.id}/pin`,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
