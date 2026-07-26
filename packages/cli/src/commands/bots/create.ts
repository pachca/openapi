// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import * as clack from '@clack/prompts';

export default class BotsCreate extends BaseCommand {
  static override description = "Новый бот";

  static override examples = [
      "Создать бота через API и получить токен — Создай бота. Только пользовательским токеном (не токеном бота); `nickname` обязан заканчиваться на `_bot`. Параметры вебхука (Webhook URL, события, команды) можно задать сразу или позже. Скоупы токена бота можно ограничить флагом `--scopes` (если не указать — бот получит набор по умолчанию):\n  $ pachca bots create",
      "Настроить бота с исходящим вебхуком — Создай бота, сразу указав Webhook URL и события в одном вызове (детали создания и работы с токеном — в сценарии «Создать бота через API и получить токен»):\n  $ pachca bots create"
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
    'single-chat': Flags.boolean({
      description: "Ограничивает бота одной беседой или каналом: `true` — бота можно добавить только в один такой чат, `false` — в несколько. Личные чаты и треды в ограничение не входят. Задаётся только при создании, при редактировании не меняется.",
      allowNo: true,
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
      single_chat: flags['single-chat'],
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
