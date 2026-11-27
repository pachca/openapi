// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class AppsListLogs extends BaseCommand {
  static override summary = "Журнал приложения";
  static override description = "Что делало приложение на платформе: ошибки функций, запросы в сеть и к API Пачки, вызовы вебхуков, нарушения ограничений фронта. Видно, что платформа разрешила и что заблокировала. Новые записи первыми.\n\nПолное описание: pachca api GET /apps/{id}/logs --docs";
  static scope = "apps:read";
  static apiMethod = "GET";
  static apiPath = "/apps/{id}/logs";
  static defaultColumns = ["time","kind","text","allowed","reason"];

  static override args = {
    id: Args.string({
      description: "Идентификатор приложения",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'n': Flags.integer({
      description: "Сколько записей вернуть. Целое число вне допустимых значений заменяется ближайшей границей.",
      default: 50,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AppsListLogs);
    this.parsedFlags = flags;

    const { data } = await this.apiRequest({
      method: 'GET',
      path: `/apps/${args.id}/logs`,
      query: {
      n: flags['n'],
      },
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
