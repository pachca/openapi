// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class AppsSetSecret extends BaseCommand {
  static override summary = "Задание секрета приложения";
  static override description = "Создаёт или заменяет секрет. Секрет объявляет манифест приложения: ключ внешнего сервиса платформа сама добавляет в запросы функций к его хосту, а секретом подписи проверяет вызовы вебхука. Код приложения значения не видит.\n\nПолное описание: pachca api PUT /apps/{id}/secrets/{name} --docs";
  static scope = "apps:write";
  static apiMethod = "PUT";
  static apiPath = "/apps/{id}/secrets/{name}";
  static requiredFlags = ["value"];

  static override args = {
    id: Args.string({
      description: "Идентификатор приложения",
      required: true,
    }),
    name: Args.string({
      description: "Имя секрета",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'value': Flags.string({
      description: "Значение секрета, до 4 КБ",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AppsSetSecret);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'value', label: "Значение секрета, до 4 КБ", type: 'string' },
    ].filter((f) => (flags as Record<string, unknown>)[f.flag] === undefined || (flags as Record<string, unknown>)[f.flag] === null);

    if (missingRequired.length > 0) {
      if (this.isInteractive()) {
        for (const field of missingRequired) {
          const value = await clack.text({ message: field.label, validate: (v) => v.length === 0 ? 'Обязательное поле' : undefined });
          if (clack.isCancel(value)) { process.stderr.write('Отменено.\n'); this.exit(0); }
          if (field.type === 'integer') { (flags as Record<string, unknown>)[field.flag] = Number.parseInt(value, 10); }
          else if (field.type === 'boolean') { (flags as Record<string, unknown>)[field.flag] = value === 'true'; }
          else { (flags as Record<string, unknown>)[field.flag] = value; }
        }
      } else {
        this.validationError(
          missingRequired.map((f) => ({ message: `Обязательный флаг --${f.flag} не передан`, flag: f.flag })),
          { hint: "Обязательные: --value <string>. pachca introspect apps set-secret" },
        );
      }
    }

    const body: Record<string, unknown> = {
      value: flags['value'],
    };
    // Clean undefined fields
    for (const [k, v] of Object.entries(body)) { if (v === undefined) delete body[k]; }

    if (Object.keys(body).length === 0) {
      this.validationError(
        [{ message: 'Не указаны поля для обновления' }],
        { type: 'PACHCA_USAGE_ERROR' },
      );
    }

    const { data } = await this.apiRequest({
      method: 'PUT',
      path: `/apps/${args.id}/secrets/${args.name}`,
      body,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
