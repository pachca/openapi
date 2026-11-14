// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class MessagesPin extends BaseCommand {
  static override summary = "Закрепление сообщения";
  static override description = "Закрепляет сообщение в шапке беседы, канала или личной переписки, где его видят все участники. Ограничения на число закреплённых сообщений нет.\n\nПолное описание: pachca api POST /messages/{id}/pin --docs";
  static scope = "pins:write";
  static apiMethod = "POST";
  static apiPath = "/messages/{id}/pin";

  static override args = {
    id: Args.integer({
      description: "Идентификатор сообщения (pachca messages list)",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(MessagesPin);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'POST',
      path: `/messages/${args.id}/pin`,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
