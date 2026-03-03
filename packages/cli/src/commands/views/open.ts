// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class ViewsOpen extends BaseCommand {
  static override description = "Открытие представления";

  static override examples = [
      "Показать интерактивную форму пользователю:\n  $ pachca views open",
      "Опрос сотрудников через форму:\n  $ pachca views open"
  ];

  static scope = "views:write";
  static apiMethod = "POST";
  static apiPath = "/views/open";

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'type': Flags.string({
      description: "Способ открытия представления",
      options: ["modal"],
    }),
    'trigger-id': Flags.string({
      description: "Уникальный идентификатор события (полученный, например, в исходящем вебхуке о нажатии кнопки)",
    }),
    'private-metadata': Flags.string({
      description: "Необязательная строка, которая будет отправлена в ваше приложение при отправке пользователем заполненной формы. Используйте это поле, например, для передачи в формате `JSON` какой то дополнительной информации вместе с заполненной пользователем формой. (макс. 3000 символов)",
    }),
    'callback-id': Flags.string({
      description: "Необязательный идентификатор для распознавания этого представления, который будет отправлен в ваше приложение при отправке пользователем заполненной формы. Используйте это поле, например, для понимания, какую форму должен был заполнить пользователь. (макс. 255 символов)",
    }),
    'view': Flags.string({
      description: "Собранный объект представления",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ViewsOpen);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'type', label: "Способ открытия представления", type: 'string' },
      { flag: 'trigger-id', label: "Уникальный идентификатор события (полученный, например, в исходящем вебхуке о нажатии кнопки)", type: 'string' },
      { flag: 'view', label: "Собранный объект представления", type: 'string' },
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
        for (const field of missingRequired) {
          process.stderr.write(`✗ Обязательный флаг --${field.flag} не передан\n`);
        }
        this.exit(2);
      }
    }

    if (flags['type'] && !["modal"].includes(flags['type'])) {
      process.stderr.write(`✗ --type: допустимые значения — "modal"\n`);
      this.exit(2);
    }
    if (flags['private-metadata'] && String(flags['private-metadata']).length > 3000) {
      process.stderr.write(`✗ --private-metadata: максимум 3000 символов (передано: ${String(flags['private-metadata']).length})\n`);
      this.exit(2);
    }
    if (flags['callback-id'] && String(flags['callback-id']).length > 255) {
      process.stderr.write(`✗ --callback-id: максимум 255 символов (передано: ${String(flags['callback-id']).length})\n`);
      this.exit(2);
    }

    this.checkScope("views:write");

    const body: Record<string, unknown> = {
      type: flags['type'],
      trigger_id: flags['trigger-id'],
      private_metadata: flags['private-metadata'],
      callback_id: flags['callback-id'],
      view: flags['view'] ? JSON.parse(flags['view']) : undefined,
    };
    // Clean undefined fields
    for (const [k, v] of Object.entries(body)) { if (v === undefined) delete body[k]; }

    const { data } = await this.apiRequest({
      method: 'POST',
      path: '/views/open',
      body,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
