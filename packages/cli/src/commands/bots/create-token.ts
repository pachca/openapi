// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class BotsCreateToken extends BaseCommand {
  static override description = "Новый токен бота";

  static override examples = [
      "Выпустить боту отдельный токен — Выпусти токен с именем и правами из каталога. Без `--scopes` токен выпускается без прав, право не из каталога отклоняется с `400`:\n  $ pachca bots create-token"
  ];

  static scope = "bots:write";
  static apiMethod = "POST";
  static apiPath = "/bots/{id}/tokens";
  static defaultColumns = ["id","name","created_at","token","user_id"];
  static requiredFlags = ["name"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор бота (pachca bots list)",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'name': Flags.string({
      description: "Имя токена: по нему токены различают в списке (макс. 255 символов)",
    }),
    'scopes': Flags.string({
      description: "Права токена. Доступны только права, которые можно выдать боту. Если не передать, токен выпускается без прав.",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(BotsCreateToken);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'name', label: "Имя токена: по нему токены различают в списке", type: 'string' },
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
          { hint: "Обязательные: --name <string>. pachca introspect bots create-token" },
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
      scopes: flags['scopes'] ? this.parseJSON(flags['scopes'], 'scopes') : undefined,
    };
    // Clean undefined fields
    for (const [k, v] of Object.entries(body)) { if (v === undefined) delete body[k]; }

    const { data } = await this.apiRequest({
      method: 'POST',
      path: `/bots/${args.id}/tokens`,
      body,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
