// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class TasksGet extends BaseCommand {
  static override description = "Информация о напоминании";

  static override examples = [
      "Получить задачу по ID:\n  $ pachca tasks get",
      "Отметить задачу выполненной:\n  $ pachca tasks update",
      "Обновить задачу (перенести срок, сменить ответственных):\n  $ pachca tasks update"
  ];

  static scope = "tasks:read";
  static apiMethod = "GET";
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

  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(TasksGet);
    this.parsedFlags = flags;

    this.checkScope("tasks:read");

    const { data } = await this.apiRequest({
      method: 'GET',
      path: `/tasks/${args.id}`,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
