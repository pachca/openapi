// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';

export default class BotsUpdate extends BaseCommand {
  static override description = "Редактирование бота";

  static override examples = [
      "Обновить Webhook URL бота — Пользовательским токеном (с правом редактировать бота) — обнови URL по `id` бота. Пустая строка отключает вебхук:\n  $ pachca bots update"
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
      description: "Имя бота (макс. 255 символов)",
    }),
    'nickname': Flags.string({
      description: "Никнейм бота. Должен заканчиваться на `_bot`. (макс. 255 символов)",
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
      description: "Команды бота (триггер-слова), на которые он реагирует при trigger_on = commands. Суммарная длина команд, объединённых через запятую, не должна превышать 255 символов.",
    }),
    'scopes': Flags.string({
      description: "Скоупы (права доступа) токена бота. Если не указано, бот получает набор по умолчанию. Боту доступны не все скоупы: часть из них разрешена только пользовательским ролям, и попытка назначить такой скоуп возвращает `400`. Служебные значения `bot` и `all` назначать нельзя.",
    }),
    'template': Flags.string({
      description: "Шаблон форматирования входящего вебхука",
    }),
    'template-engine': Flags.string({
      description: "Шаблонизатор для обработки шаблона входящего вебхука",
    }),
    'challenge-key': Flags.string({
      description: "Название поля проверки для верификации входящего вебхука",
    }),
    'link-preview-enabled': Flags.boolean({
      description: "Показывать превью ссылок в сообщениях входящего вебхука",
      allowNo: true,
    }),
    'ignore-self-messages': Flags.boolean({
      description: "Игнорировать входящие сообщения, отправленные самим ботом",
      allowNo: true,
    }),
    'events-history-enabled': Flags.boolean({
      description: "Сохранять историю событий бота для последующего получения через метод истории событий",
      allowNo: true,
    }),
    'who-can-add': Flags.string({
      description: "Кто может добавлять бота в чаты",
    }),
    'can-edit': Flags.string({
      description: "Роли, которым, помимо создателя, разрешено редактировать настройки бота. Создатель может редактировать всегда. Пустой массив — редактировать может только создатель.",
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(BotsUpdate);
    this.parsedFlags = flags;

    const validationErrors: { message: string; flag: string }[] = [];
    if (flags['name'] && String(flags['name']).length > 255) {
      validationErrors.push({ message: `--name: максимум 255 символов (передано: ${String(flags['name']).length})`, flag: 'name' });
    }
    if (flags['nickname'] && String(flags['nickname']).length > 255) {
      validationErrors.push({ message: `--nickname: максимум 255 символов (передано: ${String(flags['nickname']).length})`, flag: 'nickname' });
    }
    if (validationErrors.length > 0) {
      this.validationError(validationErrors);
    }

    const body: Record<string, unknown> = { webhook: {
      name: flags['name'],
      nickname: flags['nickname'],
      outgoing_url: flags['outgoing-url'],
      events: flags['events'] ? this.parseJSON(flags['events'], 'events') : undefined,
      trigger_on: flags['trigger-on'],
      commands: flags['commands'] ? this.parseJSON(flags['commands'], 'commands') : undefined,
      scopes: flags['scopes'] ? this.parseJSON(flags['scopes'], 'scopes') : undefined,
      template: flags['template'],
      template_engine: flags['template-engine'],
      challenge_key: flags['challenge-key'],
      link_preview_enabled: flags['link-preview-enabled'],
      ignore_self_messages: flags['ignore-self-messages'],
      events_history_enabled: flags['events-history-enabled'],
      who_can_add: flags['who-can-add'],
      can_edit: flags['can-edit'] ? this.parseJSON(flags['can-edit'], 'can-edit') : undefined,
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
