// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class ViewsSubmitResponse extends BaseCommand {
  static override description = "Ответ на отправку формы";

  static override examples = [
      "Обработать отправку формы (view_submission) — Если адрес исходящего вебхука не задан → ответь методом по `view_id` и `submit_id` из события: пустой `errors` закрывает форму, заполненный показывает ошибки полей:\n  $ pachca views submit-response"
  ];

  static scope = "views:write";
  static apiMethod = "POST";
  static apiPath = "/views/{view_id}/submit_response";
  static defaultColumns = ["success"];
  static requiredFlags = ["submit-id"];

  static override args = {
    view_id: Args.string({
      description: "Идентификатор представления",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'submit-id': Flags.string({
      description: "Идентификатор отправки формы из вебхука `view_submit`",
    }),
    'errors': Flags.string({
      description: "Ошибки заполнения полей. Ключ — `name` блока, значение — текст ошибки под полем. Без этого поля представление закрывается как успешно отправленное.",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(ViewsSubmitResponse);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'submit-id', label: "Идентификатор отправки формы из вебхука `view_submit`", type: 'string' },
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
          { hint: "Обязательные: --submit-id <string>. pachca introspect views submit-response" },
        );
      }
    }

    const body: Record<string, unknown> = {
      submit_id: flags['submit-id'],
      errors: flags['errors'] ? this.parseJSON(flags['errors'], 'errors') : undefined,
    };
    // Clean undefined fields
    for (const [k, v] of Object.entries(body)) { if (v === undefined) delete body[k]; }

    const { data } = await this.apiRequest({
      method: 'POST',
      path: `/views/${args.view_id}/submit_response`,
      body,
    });

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
