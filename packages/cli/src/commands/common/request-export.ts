// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class CommonRequestExport extends BaseCommand {
  static override description = "Экспорт сообщений";

  static override examples = [
      "Экспорт истории чата:\n  $ pachca common request-export"
  ];

  static scope = "chat_exports:write";
  static plan = "corporation";
  static apiMethod = "POST";
  static apiPath = "/chats/exports";

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'start-at': Flags.string({
      description: "Дата начала для экспорта (ISO-8601, UTC+0) в формате YYYY-MM-DD",
    }),
    'end-at': Flags.string({
      description: "Дата окончания для экспорта (ISO-8601, UTC+0) в формате YYYY-MM-DD",
    }),
    'webhook-url': Flags.string({
      description: "Адрес, на который будет отправлен вебхук по завершению экспорта",
    }),
    'chat-ids': Flags.string({
      description: "Массив идентификаторов чатов. Указывается, если нужно получить сообщения только некоторых чатов.",
    }),
    'skip-chats-file': Flags.boolean({
      description: "Пропуск формирования файла со списком чатов (chats.json)",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(CommonRequestExport);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'start-at', label: "Дата начала для экспорта (ISO-8601, UTC+0) в формате YYYY-MM-DD", type: 'string' },
      { flag: 'end-at', label: "Дата окончания для экспорта (ISO-8601, UTC+0) в формате YYYY-MM-DD", type: 'string' },
      { flag: 'webhook-url', label: "Адрес, на который будет отправлен вебхук по завершению экспорта", type: 'string' },
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

    this.checkScope("chat_exports:write");

    const body: Record<string, unknown> = {
      start_at: flags['start-at'],
      end_at: flags['end-at'],
      webhook_url: flags['webhook-url'],
      chat_ids: flags['chat-ids'] ? this.parseJSON(flags['chat-ids'], 'chat-ids') : undefined,
      skip_chats_file: flags['skip-chats-file'],
    };
    // Clean undefined fields
    for (const [k, v] of Object.entries(body)) { if (v === undefined) delete body[k]; }

    const { data } = await this.apiRequest({
      method: 'POST',
      path: '/chats/exports',
      body,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
