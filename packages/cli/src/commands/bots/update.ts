// Auto-generated from openapi.yaml — DO NOT EDIT
import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../../base-command.js';
import { nullableString } from '../../lib/flags.js';

export default class BotsUpdate extends BaseCommand {
  static override description = "Редактирование бота";
  static scope = "bots:write";
  static apiMethod = "PUT";
  static apiPath = "/bots/{id}";
  static defaultColumns = ["id","name","created_at","nickname","avatar_url"];

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
      description: "Никнейм бота: латинские буквы, цифры и `_`, в конце `_bot`, свободный в пространстве. Ник не по формату отвечает `400` на поле `bot.nickname` с кодом `invalid`, а занятый ник — с кодом `taken`. (макс. 255 символов)",
    }),
    'outgoing-url': Flags.string({
      description: "URL исходящего вебхука: публичный адрес с протоколом `http` или `https`. Иначе ответ `400` на поле `webhook.outgoing_url` с кодом `webhook_url_invalid`, `webhook_url_unresolved` или `webhook_url_forbidden`. (макс. 255 символов)",
    }),
    'events': Flags.string({
      description: "События, на которые подписан бот. Список заменяется целиком.",
    }),
    'trigger-on': Flags.string({
      description: "Условие срабатывания исходящего вебхука",
    }),
    'commands': Flags.string({
      description: "Команды бота (триггер-слова), на которые он реагирует при trigger_on = commands. Событие о сообщении приходит боту, когда первое слово текста совпадает с одной из команд целиком, с учётом регистра. Команду можно задать и без слэша в начале. Суммарная длина команд вместе с разделителями `, ` (запятая и пробел) не должна превышать 255 символов.",
    }),
    'scopes': Flags.string({
      description: "Скоупы (права доступа) токена бота. Если не указано, бот получает набор по умолчанию. Боту доступны не все скоупы: часть из них разрешена только пользовательским ролям, и попытка назначить такой скоуп возвращает `400`. Служебные значения `bot` и `all` назначать нельзя.",
    }),
    'template': Flags.string({
      description: "Шаблон форматирования входящего вебхука. Шаблон проверяется, когда в запросе меняются `template`, `template_engine` или `kind`, поэтому смена одного шаблонизатора или включение `kind: simple` проверяет и уже сохранённый шаблон. Шаблон с синтаксической ошибкой у источника `simple` даёт ответ `400` на этом поле с кодом `invalid`, и запрос не применяется. Причина приходит в `message`.",
    }),
    'template-engine': Flags.string({
      description: "Шаблонизатор для обработки шаблона входящего вебхука",
    }),
    'challenge-key': Flags.string({
      description: "Название поля проверки для верификации входящего вебхука (макс. 255 символов)",
    }),
    'link-preview-enabled': Flags.boolean({
      description: "Показывать превью ссылок в сообщениях входящего вебхука",
      allowNo: true,
    }),
    'ignore-self-messages': Flags.boolean({
      description: "Не присылать боту события о сообщениях, которые он отправил сам, и о реакциях на эти сообщения, кто бы их ни поставил или снял. Нажатия кнопок приходят всегда.",
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
      description: "Роли, которым, помимо создателя, разрешено редактировать настройки бота. Создатель может редактировать всегда. Пустой массив — редактировать может только создатель. Список заменяется целиком.",
    }),
    'single-chat': Flags.boolean({
      description: "Ограничивает бота одной беседой или каналом: `true` — бота можно добавить только в один такой чат, `false` — в несколько. Личные чаты и треды в ограничение не входят.",
      allowNo: true,
    }),
    'kind': nullableString({
      description: "Источник входящего вебхука. Если у бота входящего вебхука не было, он включается. `null` удаляет входящий вебхук: адрес перестаёт работать, шаблон и настройки входящего вебхука сбрасываются, а при следующем включении бот получает новый адрес. Чтобы передать null, укажите `--kind null`.",
    }),
    'unfurl-domains': Flags.string({
      description: "Домены, ссылки на которые бот разворачивает, не больше 5. Работают вместе с событием `message_link_shared`. Список заменяется целиком.",
    }),
    'oauth-client': Flags.string({
      description: "Настройки авторизации от имени сотрудника. Если авторизация выключена, объект её включает, а `null` выключает: выданные сотрудниками авторизации отзываются, страница в витрине удаляется, собственные токены бота продолжают работать.",
    }),
    'promo': Flags.string({
      description: "Страница бота в витрине. Доступна, только когда у бота включена авторизация.",
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
    if (flags['outgoing-url'] && String(flags['outgoing-url']).length > 255) {
      validationErrors.push({ message: `--outgoing-url: максимум 255 символов (передано: ${String(flags['outgoing-url']).length})`, flag: 'outgoing-url' });
    }
    if (flags['challenge-key'] && String(flags['challenge-key']).length > 255) {
      validationErrors.push({ message: `--challenge-key: максимум 255 символов (передано: ${String(flags['challenge-key']).length})`, flag: 'challenge-key' });
    }
    if (validationErrors.length > 0) {
      this.validationError(validationErrors);
    }

    const body: Record<string, unknown> = {
      webhook: {
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
      kind: flags['kind'],
      unfurl_domains: flags['unfurl-domains'] ? this.parseJSON(flags['unfurl-domains'], 'unfurl-domains') : undefined,
      },
      oauth_client: flags['oauth-client'] ? this.parseJSON(flags['oauth-client'], 'oauth-client') : undefined,
      promo: flags['promo'] ? this.parseJSON(flags['promo'], 'promo') : undefined,
    };
    // Clean undefined fields
    const inner = body['webhook'] as Record<string, unknown>;
    for (const [k, v] of Object.entries(inner)) { if (v === undefined) delete inner[k]; }
    for (const [k, v] of Object.entries(body)) { if (k !== 'webhook' && v === undefined) delete body[k]; }

    if (Object.keys(inner).length === 0 && Object.keys(body).length === 1) {
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

    const responseBody = (data ?? {}) as Record<string, unknown>;
    const result = responseBody.data ?? responseBody;
    this.output(result);
  }
}
