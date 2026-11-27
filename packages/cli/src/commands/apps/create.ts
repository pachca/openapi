// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class AppsCreate extends BaseCommand {
  static override summary = "Новое приложение";
  static override description = "Создаёт приложение без версий и его бота без прав. Код загружают методом Загрузка версии, обычно командой `npx pachca-app ship` из папки приложения.\n\nПолное описание: pachca api POST /apps --docs";
  static scope = "apps:write";
  static apiMethod = "POST";
  static apiPath = "/apps";
  static defaultColumns = ["id","name","created_at","icon","bot_id"];
  static requiredFlags = ["name"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'name': Flags.string({
      description: "Название приложения (макс. 255 символов)",
    }),
    'id': Flags.string({
      description: "Свой идентификатор приложения: 12 символов `[0-9a-z]`. Без поля генерируется.",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AppsCreate);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'name', label: "Название приложения", type: 'string' },
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
          { hint: "Обязательные: --name <string>. pachca introspect apps create" },
        );
      }
    }

    const validationErrors: { message: string; flag: string }[] = [];
    if (flags['name'] && String(flags['name']).length > 255) {
      validationErrors.push({ message: `--name: максимум 255 символов (передано: ${String(flags['name']).length})`, flag: 'name' });
    }
    if (validationErrors.length > 0) {
      this.validationError(validationErrors);
    }

    const body: Record<string, unknown> = {
      name: flags['name'],
      id: flags['id'],
    };
    // Clean undefined fields
    for (const [k, v] of Object.entries(body)) { if (v === undefined) delete body[k]; }

    const { data } = await this.apiRequest({
      method: 'POST',
      path: '/apps',
      body,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
