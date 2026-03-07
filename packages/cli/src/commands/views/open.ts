// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class ViewsOpen extends BaseCommand {
  static override description = "Открытие представления";

  static override examples = [
      "Показать интерактивную форму пользователю:\n  $ pachca views open",
      "Опрос сотрудников через форму:\n  $ pachca views open",
      "Форма заявки/запроса:\n  $ pachca views open"
  ];

  static scope = "views:write";
  static apiMethod = "POST";
  static apiPath = "/views/open";
  static requiredFlags = ["title","blocks","type","trigger-id"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'title': Flags.string({
      description: "Заголовок представления (макс. 24 символов)",
    }),
    'close-text': Flags.string({
      description: "Текст кнопки закрытия представления (макс. 24 символов)",
    }),
    'submit-text': Flags.string({
      description: "Текст кнопки отправки формы (макс. 24 символов)",
    }),
    'blocks': Flags.string({
      description: "Массив блоков представления",
    }),
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
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ViewsOpen);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'title', label: "Заголовок представления", type: 'string' },
      { flag: 'blocks', label: "Массив блоков представления", type: 'string' },
      { flag: 'type', label: "Способ открытия представления", type: 'string' },
      { flag: 'trigger-id', label: "Уникальный идентификатор события (полученный, например, в исходящем вебхуке о нажатии кнопки)", type: 'string' },
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
          { hint: "Обязательные: --title <string>, --blocks <string>, --type <string>, --trigger-id <string>. pachca introspect views open" },
        );
      }
    }

    const validationErrors: { message: string; flag: string }[] = [];
    if (flags['title'] && String(flags['title']).length > 24) {
      validationErrors.push({ message: `--title: максимум 24 символов (передано: ${String(flags['title']).length})`, flag: 'title' });
    }
    if (flags['close-text'] && String(flags['close-text']).length > 24) {
      validationErrors.push({ message: `--close-text: максимум 24 символов (передано: ${String(flags['close-text']).length})`, flag: 'close-text' });
    }
    if (flags['submit-text'] && String(flags['submit-text']).length > 24) {
      validationErrors.push({ message: `--submit-text: максимум 24 символов (передано: ${String(flags['submit-text']).length})`, flag: 'submit-text' });
    }
    if (flags['type'] && !["modal"].includes(flags['type'])) {
      validationErrors.push({ message: `--type: допустимые значения — "modal"`, flag: 'type' });
    }
    if (flags['private-metadata'] && String(flags['private-metadata']).length > 3000) {
      validationErrors.push({ message: `--private-metadata: максимум 3000 символов (передано: ${String(flags['private-metadata']).length})`, flag: 'private-metadata' });
    }
    if (flags['callback-id'] && String(flags['callback-id']).length > 255) {
      validationErrors.push({ message: `--callback-id: максимум 255 символов (передано: ${String(flags['callback-id']).length})`, flag: 'callback-id' });
    }
    if (validationErrors.length > 0) {
      this.validationError(validationErrors);
    }

    this.checkScope("views:write");

    const body: Record<string, unknown> = {
      view: {
      title: flags['title'],
      close_text: flags['close-text'],
      submit_text: flags['submit-text'],
      blocks: flags['blocks'] ? this.parseJSON(flags['blocks'], 'blocks') : undefined,
      },
      type: flags['type'],
      trigger_id: flags['trigger-id'],
      private_metadata: flags['private-metadata'],
      callback_id: flags['callback-id'],
    };
    // Clean undefined fields
    const inner = body['view'] as Record<string, unknown>;
    for (const [k, v] of Object.entries(inner)) { if (v === undefined) delete inner[k]; }
    for (const [k, v] of Object.entries(body)) { if (k !== 'view' && v === undefined) delete body[k]; }

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
