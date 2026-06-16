// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class BotsCreate extends BaseCommand {
  static override description = "Новый бот";

  static override examples = [
      "Создать бота через API и получить токен:\n  $ pachca bots create",
      "Настроить бота с исходящим вебхуком:\n  $ pachca bots create"
  ];

  static scope = "bots:write";
  static apiMethod = "POST";
  static apiPath = "/bots";
  static defaultColumns = ["id","webhook","access_token"];
  static requiredFlags = ["name"];

  static override args = {

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
    const { args, flags } = await this.parse(BotsCreate);
    this.parsedFlags = flags;

    const missingRequired: { flag: string; label: string; type: string }[] = [
      { flag: 'name', label: "Имя бота", type: 'string' },
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
          { hint: "Обязательные: --name <string>. pachca introspect bots create" },
        );
      }
    }

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

    const { data } = await this.apiRequest({
      method: 'POST',
      path: '/bots',
      body,
    });

    const responseBody = data as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
