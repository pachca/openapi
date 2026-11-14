// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class BotsGetStream extends BaseCommand {
  static override summary = "Поток событий";
  static override description = "Ссылка, по которой события бота приходят сразу, как они происходят, в формате Server-Sent Events. Это те же события, что ложатся в Историю событий. Поток подходит боту, который не принимает вебхуки на свой адрес, но должен отвечать быстро, например на нажатие кнопки или отправку формы.\n\nПолное описание: pachca api GET /webhooks/events/stream --docs";
  static scope = "webhooks:events:read";
  static apiMethod = "GET";
  static apiPath = "/webhooks/events/stream";
  static defaultColumns = ["url","expires_at"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(BotsGetStream);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: '/webhooks/events/stream',
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
