> Расположение: Методы API → Боты и Webhook
> Краткое содержание: Метод доступен владельцу пространства
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Список ботов пространства

**Метод**: `GET`

**Путь**: `/company/bots`

> **Скоуп:** `company_bots:read`

> **Внимание:** Доступно только на тарифе **Корпорация**

Все боты пространства, включая тех, кто недоступен вам для редактирования. У таких ботов приходят только имя и ник, остальные настройки — `null`. Только тех ботов, которых вы можете настраивать, возвращает метод [Список ботов](/api/bots/list).

Метод доступен владельцу пространства. Каждый запрос записывается в [журнал аудита событий](/guides/audit-events) с типом `company_bots_accessed`.

## Параметры

### Query параметры

- `query: string` — Поисковая фраза для фильтрации ботов по имени
- `limit: integer, int32` (default: 50) — Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей.
- `cursor: string` — Курсор для пагинации (из `meta.paginate.next_page`)


## Пример запроса

```bash
# Для получения следующей страницы используйте cursor из meta.paginate.next_page
curl "https://api.pachca.com/api/shared/v1/company/bots?query=задач&limit=1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: array of object` (required)
  - `id: integer, int32` (required) — Идентификатор бота (совпадает с `user_id` бота). Пример: `1738816`
  - `oauth_client: object` (required) — Параметры авторизации от имени сотрудника. `null` у бота, недоступного вам для редактирования. Может прийти и у бота с выключенной авторизацией, а у бота без токенов может прийти `null`.
    - `client_id: string` (required) — Идентификатор клиента для ссылки авторизации. Пример: `"aB3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1xY"`
    - `client_secret_preview: string` (required) — Секрет клиента в маскированном виде. Полное значение приходит в `client_secret` один раз: при включении серверного клиента и при ротации секрета. Пример: `"cH5kR9mN...x7Qp"`
    - `confidential: boolean` (required) — Где хранится секрет: `true` — серверное приложение, `false` — приложение без секрета, обмен кода по PKCE. Пример: `true`
    - `redirect_uris: array of string` (required) — Адреса возврата после согласия. Пример: `["https://example.com/oauth/callback"]`
    - `scopes: array of string` (required) — Права, которые бот запрашивает у сотрудника на экране согласия. Пример: `["messages:read","messages:create"]`
  - `webhook: object` (required) — Объект параметров вебхука
    - `name: string` (required, max length: 255) — Имя бота. Пример: `"Бот задач"`
    - `nickname: string` (required, max length: 255) — Никнейм бота. Пример: `"tasks_bot"`
    - `outgoing_url: string` (required, nullable) — URL исходящего вебхука. `null`, если исходящий вебхук у бота не настроен. Пример: `"https://example.com/tasks/new"`
    - `events: array of string` (required, nullable) — События, на которые подписан бот. Пример: `["message_new"]`
    - `trigger_on: string` (required) — Условие срабатывания исходящего вебхука
      Значения: `commands` — Только на команды (триггер-слова) из commands, `all_messages` — На все сообщения в чатах, где есть бот, `unfurl` — На развёртывание ссылок (link previews)
    - `commands: array of string` (required, nullable) — Команды бота (триггер-слова). Пример: `["/task"]`
    - `scopes: array of string` (required, nullable) — Скоупы (права доступа) токена бота. Пример: `["messages:create"]`
    - `template: string` (required, nullable) — Шаблон форматирования входящего вебхука. `null`, если не задан. Пример: `"Заказ от {{ client }} на сумму {{ amount }} ₽"`
    - `template_engine: string` (required) — Шаблонизатор для обработки шаблона входящего вебхука
      Значения: `liquid` — Liquid — условия, циклы и фильтры, `mustache` — Mustache — простая подстановка без логики
    - `challenge_key: string` (required, nullable) — Название поля проверки для верификации входящего вебхука. `null`, если не задано. Пример: `"challenge"`
    - `link_preview_enabled: boolean` (required, nullable) — Показывать превью ссылок в сообщениях входящего вебхука. Пример: `true`
    - `ignore_self_messages: boolean` (required, nullable) — Не присылать боту события о его собственных сообщениях и реакциях. Пример: `false`
    - `events_history_enabled: boolean` (required, nullable) — Сохранять историю событий бота для последующего получения через метод истории событий. Пример: `false`
    - `single_chat: boolean` (required, nullable) — Ограничивает бота одной беседой или каналом: `true` — бота можно добавить только в один такой чат, `false` — в несколько. Личные чаты и треды в ограничение не входят. Пример: `false`
    - `can_edit: array of string` (required, nullable) — Роли, которым, помимо создателя, разрешено редактировать настройки бота. Создатель может редактировать всегда. Пустой массив — редактировать может только создатель. Пример: `["admin"]`
    - `who_can_add: string` (required) — Кто может добавлять бота в чаты
      Значения: `creator` — Только создатель бота, `creator_admin` — Создатель и администраторы компании, `creator_admin_user` — Создатель, администраторы и участники компании, `anyone` — Публичный бот: добавить его может любой сотрудник, кроме гостей и мульти-гостей
- `meta: object` (required) — Метаданные пагинации
  - `paginate: object` (required) — Вспомогательная информация
    - `next_page: string` (required) — Курсор пагинации следующей страницы. Пример: `"eyJxZCO2MiwiZGlyIjomSNYjIn3"`
    - `prev_page: string` — Курсор пагинации предыдущей страницы. Используется для polling новых записей «сверху» списка. Пример: `"eyJxZCO2MiwiZGlyIjoiYXNjIn0"`
    - `has_next: boolean` — Есть ли ещё данные на следующей странице. На последней странице — `false`. Пример: `true`
    - `has_prev: boolean` — Есть ли ещё данные на предыдущей странице. На первом запросе без курсора — `false`. Пример: `false`

**Пример ответа:**

```json
{
  "data": [
    {
      "id": 1738816,
      "oauth_client": {
        "client_id": "aB3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1xY",
        "client_secret_preview": "dGhpc19p...ZWNy",
        "confidential": true,
        "redirect_uris": [
          "https://example.com/oauth/callback"
        ],
        "scopes": [
          "messages:read",
          "messages:create"
        ]
      },
      "webhook": {
        "name": "Бот задач",
        "nickname": "tasks_bot",
        "outgoing_url": "https://example.com/tasks/new",
        "events": [
          "message_new"
        ],
        "trigger_on": "commands",
        "commands": [
          "/task"
        ],
        "scopes": [
          "messages:create"
        ],
        "template": "Заказ от {{ client }} на сумму {{ amount }} ₽",
        "template_engine": "liquid",
        "challenge_key": "challenge",
        "link_preview_enabled": true,
        "ignore_self_messages": false,
        "events_history_enabled": false,
        "single_chat": false,
        "can_edit": [
          "admin"
        ],
        "who_can_add": "creator"
      }
    },
    {
      "id": 1738817,
      "oauth_client": null,
      "webhook": {
        "name": "Бот релизов",
        "nickname": "release_bot",
        "outgoing_url": null,
        "events": null,
        "trigger_on": null,
        "commands": null,
        "scopes": null,
        "template": null,
        "template_engine": null,
        "challenge_key": null,
        "link_preview_enabled": null,
        "ignore_self_messages": null,
        "events_history_enabled": null,
        "single_chat": null,
        "can_edit": null,
        "who_can_add": null
      }
    }
  ],
  "meta": {
    "paginate": {
      "next_page": "eyJpZCI6MTczODgxN30"
    }
  }
}
```

### 400: The server could not understand the request due to invalid syntax.

**Схема ответа при ошибке:** `ApiError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

**Пример ответа:**

```json
{
  "errors": [
    {
      "key": "field.name",
      "value": "invalid_value",
      "message": "Поле не может быть пустым",
      "code": "blank",
      "payload": null
    }
  ]
}
```

### 401: Access is unauthorized.

**Схема ответа при ошибке:** `OAuthError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

**Пример ответа:**

```json
{
  "error": "invalid_token",
  "error_description": "Access token is missing"
}
```

### 402: Client error

**Схема ответа при ошибке:** `ApiError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

**Пример ответа:**

```json
{
  "errors": [
    {
      "key": "field.name",
      "value": "invalid_value",
      "message": "Поле не может быть пустым",
      "code": "blank",
      "payload": null
    }
  ]
}
```

### 403: Access is forbidden.

**Схема ответа при ошибке:** `ApiError` или `OAuthError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

**Пример ответа:**

```json
{
  "errors": [
    {
      "key": "field.name",
      "value": "invalid_value",
      "message": "Поле не может быть пустым",
      "code": "blank",
      "payload": null
    }
  ]
}
```

