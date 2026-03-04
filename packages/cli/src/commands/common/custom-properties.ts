// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class CommonCustomProperties extends BaseCommand {
  static override description = "Список дополнительных полей";

  static override examples = [
      "Получить кастомные поля профиля:\n  $ pachca common custom-properties"
  ];

  static scope = "custom_properties:read";
  static apiMethod = "GET";
  static apiPath = "/custom_properties";
  static defaultColumns = ["id","name","data_type"];
  static requiredFlags = ["entity-type"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'entity-type': Flags.string({
      description: "Тип сущности",
      options: ["User","Task"],
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CommonCustomProperties);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'entity-type', label: "Тип сущности", type: 'string' },
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
          { hint: "Обязательные: --entity-type <string>. pachca introspect common custom-properties" },
        );
      }
    }

    this.checkScope("custom_properties:read");

    const { data } = await this.apiRequest({
      method: 'GET',
      path: '/custom_properties',
      query: {
      'entity_type': flags['entity-type'],
      },
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
