// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class TasksUpdate extends BaseCommand {
  static override description = "Редактирование напоминания";

  static override examples = [
      "Получить задачу по ID:\n  $ pachca tasks get",
      "Отметить задачу выполненной:\n  $ pachca tasks update",
      "Обновить задачу (перенести срок, сменить ответственных):\n  $ pachca tasks update"
  ];

  static scope = "tasks:update";
  static apiMethod = "PUT";
  static apiPath = "/tasks/{id}";
  static defaultColumns = ["id","content","created_at","kind","due_at"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор напоминания",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'kind': Flags.string({
      description: "Тип",
    }),
    'content': Flags.string({
      description: "Описание",
    }),
    'due-at': Flags.string({
      description: "Срок выполнения напоминания (ISO-8601) в формате YYYY-MM-DDThh:mm:ss.sssTZD. Если указано время 23:59:59.000, то напоминание будет создано на весь день (без указания времени).",
    }),
    'priority': Flags.integer({
      description: "Приоритет: 1, 2 (важно) или 3 (очень важно).",
    }),
    'performer-ids': Flags.string({
      description: "Массив идентификаторов пользователей, привязываемых к напоминанию как «ответственные»",
    }),
    'status': Flags.string({
      description: "Статус",
    }),
    'all-day': Flags.boolean({
      description: "Напоминание на весь день (без указания времени)",
      allowNo: true,
    }),
    'done-at': Flags.string({
      description: "Дата и время выполнения напоминания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ",
    }),
    'custom-properties': Flags.string({
      description: "Задаваемые дополнительные поля",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(TasksUpdate);
    this.parsedFlags = flags;

    // Read from stdin if --content not provided and stdin is not TTY
    if (!flags['content'] && !process.stdin.isTTY) {
      const chunks: Buffer[] = [];
      for await (const chunk of process.stdin) {
        chunks.push(chunk as Buffer);
      }
      flags['content'] = Buffer.concat(chunks).toString('utf-8').trimEnd();
    }

    this.checkScope("tasks:update");

    const body: Record<string, unknown> = { task: {
      kind: flags['kind'],
      content: flags['content'],
      due_at: flags['due-at'],
      priority: flags['priority'],
      performer_ids: flags['performer-ids'] ? this.parseJSON(flags['performer-ids'], 'performer-ids') : undefined,
      status: flags['status'],
      all_day: flags['all-day'],
      done_at: flags['done-at'],
      custom_properties: flags['custom-properties'] ? this.parseJSON(flags['custom-properties'], 'custom-properties') : undefined,
    } };
    // Clean undefined fields
    const inner = body['task'] as Record<string, unknown>;
    for (const [k, v] of Object.entries(inner)) { if (v === undefined) delete inner[k]; }

    if (Object.keys(inner).length === 0) {
      process.stderr.write('⚠ Не указаны поля для обновления. Используйте --help для списка флагов.\n');
      return;
    }

    const { data } = await this.apiRequest({
      method: 'PUT',
      path: `/tasks/${args.id}`,
      body,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
