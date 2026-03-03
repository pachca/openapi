// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';
import { Readable } from 'node:stream';

export default class TasksCreate extends BaseCommand {
  static override description = "Новое напоминание";

  static override examples = [
      "Создать напоминание:\n  $ pachca tasks create",
      "Получить список предстоящих задач:\n  $ pachca tasks list",
      "Создать серию напоминаний:\n  $ pachca tasks create"
  ];

  static scope = "tasks:create";
  static apiMethod = "POST";
  static apiPath = "/tasks";
  static defaultColumns = ["id","content","created_at","kind","due_at"];

  static override args = {

  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'kind': Flags.string({
      description: "Тип",
    }),
    'content': Flags.string({
      description: "Описание (по умолчанию — название типа)",
    }),
    'due-at': Flags.string({
      description: "Срок выполнения напоминания (ISO-8601) в формате YYYY-MM-DDThh:mm:ss.sssTZD. Если указано время 23:59:59.000, то напоминание будет создано на весь день (без указания времени).",
    }),
    'priority': Flags.integer({
      description: "Приоритет: 1, 2 (важно) или 3 (очень важно).",
    }),
    'performer-ids': Flags.string({
      description: "Массив идентификаторов пользователей, привязываемых к напоминанию как «ответственные» (по умолчанию ответственным назначается вы)",
    }),
    'chat-id': Flags.integer({
      description: "Идентификатор чата, к которому привязывается напоминание",
    }),
    'all-day': Flags.boolean({
      description: "Напоминание на весь день (без указания времени)",
    }),
    'custom-properties': Flags.string({
      description: "Задаваемые дополнительные поля",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(TasksCreate);
    this.parsedFlags = flags;

    // Read from stdin if --content not provided and stdin is not TTY
    if (!flags['content'] && !process.stdin.isTTY) {
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk as Buffer);
      }
      flags['content'] = Buffer.concat(chunks).toString('utf-8').trimEnd();
    }

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'kind', label: "Тип", type: 'string' },
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

    this.checkScope("tasks:create");

    const body: Record<string, unknown> = { task: {
      kind: flags['kind'],
      content: flags['content'],
      due_at: flags['due-at'],
      priority: flags['priority'],
      performer_ids: flags['performer-ids'] ? JSON.parse(flags['performer-ids']) : undefined,
      chat_id: flags['chat-id'],
      all_day: flags['all-day'],
      custom_properties: flags['custom-properties'] ? JSON.parse(flags['custom-properties']) : undefined,
    } };
    // Clean undefined fields
    const inner = body['task'] as Record<string, unknown>;
    for (const [k, v] of Object.entries(inner)) { if (v === undefined) delete inner[k]; }

    const { data } = await this.apiRequest({
      method: 'POST',
      path: '/tasks',
      body,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
