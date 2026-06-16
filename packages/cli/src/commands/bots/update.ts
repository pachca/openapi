// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class BotsUpdate extends BaseCommand {
  static override description = "Редактирование бота";

  static override examples = [
      "Обновить Webhook URL бота:\n  $ pachca bots update"
  ];

  static scope = "bots:write";
  static apiMethod = "PUT";
  static apiPath = "/bots/{id}";
  static defaultColumns = ["id","webhook"];

  static override args = {
    id: Args.integer({
      description: "Идентификатор бота (pachca bots list)",
      required: true,
    }),
  };

  static override flags = {
    ...BaseCommand.baseFlags,
    'name': Flags.string({
      description: "Имя бота",
    }),
    'nickname': Flags.string({
      description: "Никнейм бота. Должен заканчиваться на `_bot`.",
    }),
    'outgoing-url': Flags.string({
      description: "URL исходящего вебхука",
    }),
    'events': Flags.string({
      description: "События, на которые подписан бот",
    }),
    'trigger-on': Flags.string({
      description: "Условие срабатывания исходящего вебхука",
    }),
    'commands': Flags.string({
      description: "Команды бота (триггер-слова), на которые он реагирует при trigger_on = commands",
    }),
    'scopes': Flags.string({
      description: "Скоупы (права доступа) токена бота. Если не указано, бот получает набор по умолчанию.",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(BotsUpdate);
    this.parsedFlags = flags;

    const body: Record<string, unknown> = { webhook: {
      name: flags['name'],
      nickname: flags['nickname'],
      outgoing_url: flags['outgoing-url'],
      events: flags['events'] ? this.parseJSON(flags['events'], 'events') : undefined,
      trigger_on: flags['trigger-on'],
      commands: flags['commands'] ? this.parseJSON(flags['commands'], 'commands') : undefined,
      scopes: flags['scopes'] ? this.parseJSON(flags['scopes'], 'scopes') : undefined,
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
      path: `/bots/${args.id}`,
      body,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
