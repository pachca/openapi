// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class CompanyUpdate extends BaseCommand {
  static override description = "Редактирование пространства";
  static scope = "company:write";
  static apiMethod = "PUT";
  static apiPath = "/company";
  static defaultColumns = ["id","name","owner_id","show_personal_data","use_global_threads"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'name': Flags.string({
      description: "Новое название пространства (макс. 255 символов)",
    }),
    'show-personal-data': Flags.boolean({
      description: "Видят ли сотрудники и боты `email` и `phone_number` коллег",
      allowNo: true,
    }),
    'use-global-threads': Flags.boolean({
      description: "Включена ли настройка «Использовать сквозные треды»",
      allowNo: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CompanyUpdate);
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
      show_personal_data: flags['show-personal-data'],
      use_global_threads: flags['use-global-threads'],
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
      path: '/company',
      body,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
