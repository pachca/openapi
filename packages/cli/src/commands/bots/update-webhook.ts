// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class BotsUpdateWebhook extends BaseCommand {
  static override description = "Саморегистрация вебхука бота";

  static override examples = [
      "Обновить Webhook URL бота:\n  $ pachca bots update-webhook"
  ];

  static scope = "bot_self:webhook:write";
  static apiMethod = "PUT";
  static apiPath = "/bot/webhook";
  static defaultColumns = ["id","webhook"];
  static requiredFlags = ["outgoing-url"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'outgoing-url': Flags.string({
      description: "URL исходящего вебхука. Пустая строка отключает вебхук.",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(BotsUpdateWebhook);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'outgoing-url', label: "URL исходящего вебхука. Пустая строка отключает вебхук.", type: 'string' },
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
          { hint: "Обязательные: --outgoing-url <string>. pachca introspect bots update-webhook" },
        );
      }
    }

    const body: Record<string, unknown> = { webhook: {
      outgoing_url: flags['outgoing-url'],
    } };
    // Clean undefined fields
    const inner = body['webhook'] as Record<string, unknown>;
    for (const [k, v] of Object.entries(inner)) { if (v === undefined) delete inner[k]; }

    if (Object.keys(inner).length === 0) {
      this.validationError(
        [{ message: 'Не указаны поля для обновления' }],
        { type: 'PACHCA_USAGE_ERROR' },
      );
    }

    const { data } = await this.apiRequest({
      method: 'PUT',
      path: '/bot/webhook',
      body,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
