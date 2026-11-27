// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class AppsUpdate extends BaseCommand {
  static override summary = "Редактирование приложения";
  static override description = "Меняет название, иконку и доступ без новой версии. Название меняется и у бота приложения. Пустое название отвечает `422` с кодом `blank`, иконка длиннее 16 символов или с пробелами отвечает `422` с кодом `invalid`.\n\nПолное описание: pachca api PUT /apps/{id} --docs";
  static scope = "apps:write";
  static apiMethod = "PUT";
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
    'name': Flags.string({
      description: "Название приложения. Меняется и у бота приложения. (макс. 255 символов)",
    }),
    'icon': Flags.string({
      description: "Иконка: один эмодзи, до 16 символов без пробелов. Пустая строка снимает иконку.",
    }),
    'visibility': Flags.string({
      description: "Кто может открыть приложение",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AppsUpdate);
    this.parsedFlags = flags;

    const validationErrors: { message: string; flag: string }[] = [];
    if (flags['name'] && String(flags['name']).length > 255) {
      validationErrors.push({ message: `--name: максимум 255 символов (передано: ${String(flags['name']).length})`, flag: 'name' });
    }
    if (validationErrors.length > 0) {
      this.validationError(validationErrors);
    }

    const body: Record<string, unknown> = {
      name: flags['name'],
      icon: flags['icon'],
      visibility: flags['visibility'],
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
      path: `/apps/${args.id}`,
      body,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
