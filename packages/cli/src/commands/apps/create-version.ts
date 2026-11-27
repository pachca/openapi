// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class AppsCreateVersion extends BaseCommand {
  static override summary = "Загрузка версии";
  static override description = "Загружает сборку приложения, и она сразу становится текущей версией. Сборку и запрос собирает команда `npx pachca-app ship` из папки приложения (пакет `@pachca/app-sdk`).\n\nПолное описание: pachca api POST /apps/{id}/versions --docs";
  static scope = "apps:write";
  static apiMethod = "POST";
  static apiPath = "/apps/{id}/versions";
  static defaultColumns = ["version","hash"];
  static requiredFlags = ["code","manifest","schema","functions","static","base-version"];

  static override args = {
    id: Args.string({
      description: "Идентификатор приложения",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'code': Flags.string({
      description: "Код функций приложения (`dist/app.js`)",
    }),
    'manifest': Flags.string({
      description: "Манифест сборки (`dist/manifest.json`): права, хосты, вебхуки, версии протокола и SDK",
    }),
    'schema': Flags.string({
      description: "Схема базы (`dist/schema.json`)",
    }),
    'functions': Flags.string({
      description: "Описания функций (`dist/functions.json`)",
    }),
    'static': Flags.string({
      description: "Статика фронта (`dist/static`): относительный путь и содержимое в base64",
    }),
    'source': Flags.string({
      description: "Исходники папки приложения: относительный путь и содержимое в base64, до 5 МБ. Платформа хранит их с версией и отдаёт методом [Исходники приложения](GET /apps/{id}/source).",
    }),
    'base-version': Flags.integer({
      description: "Номер версии, от которой сделана загрузка, `0` у первой",
    }),
    'approve': Flags.boolean({
      description: "Человек видел и подтвердил изменения прав, хостов и событий",
      allowNo: true,
    }),
    'force': Flags.boolean({
      description: "Загрузить, даже если текущая версия не `base_version`. Изменения из другой папки пропадут.",
      allowNo: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(AppsCreateVersion);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'code', label: "Код функций приложения (`dist/app.js`)", type: 'string' },
      { flag: 'manifest', label: "Манифест сборки (`dist/manifest.json`): права, хосты, вебхуки, версии протокола и SDK", type: 'string' },
      { flag: 'schema', label: "Схема базы (`dist/schema.json`)", type: 'string' },
      { flag: 'functions', label: "Описания функций (`dist/functions.json`)", type: 'string' },
      { flag: 'static', label: "Статика фронта (`dist/static`): относительный путь и содержимое в base64", type: 'string' },
      { flag: 'base-version', label: "Номер версии, от которой сделана загрузка, `0` у первой", type: 'integer' },
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
          { hint: "Обязательные: --code <string>, --manifest <string>, --schema <string>, --functions <string>, --static <string>, --base-version <integer>. pachca introspect apps create-version" },
        );
      }
    }

    const body: Record<string, unknown> = {
      code: flags['code'],
      manifest: flags['manifest'] ? this.parseJSON(flags['manifest'], 'manifest') : undefined,
      schema: flags['schema'] ? this.parseJSON(flags['schema'], 'schema') : undefined,
      functions: flags['functions'] ? this.parseJSON(flags['functions'], 'functions') : undefined,
      static: flags['static'] ? this.parseJSON(flags['static'], 'static') : undefined,
      source: flags['source'] ? this.parseJSON(flags['source'], 'source') : undefined,
      base_version: flags['base-version'],
      approve: flags['approve'],
      force: flags['force'],
    };
    // Clean undefined fields
    for (const [k, v] of Object.entries(body)) { if (v === undefined) delete body[k]; }

    const { data } = await this.apiRequest({
      method: 'POST',
      path: `/apps/${args.id}/versions`,
      body,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
