> Расположение: Методы API → Боты и Webhook
> Краткое содержание: Метод отдаёт только тех ботов, которых вызывающий вправе настраивать: своих, а также чужих, если настройки бота открывают доступ администраторам пространства или руководителям чатов, где бот состоит
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Информация о боте

**Метод**: `GET`

**Путь**: `/bots/{id}`

> **Скоуп:** `bots:read`

Настройки бота. Токен в ответе не приходит — его показывают один раз при создании бота и при вызове метода [Ротация токена бота](/api/bots/recreate-token). Токены бота отдаёт [Список токенов бота](/api/bots/list-tokens).

Метод отдаёт только тех ботов, которых вызывающий вправе настраивать: своих, а также чужих, если настройки бота открывают доступ администраторам пространства или руководителям чатов, где бот состоит. На остальных метод ответит `403`.

Токену со скоупом `bots:write` метод отвечает и без `bots:read`. Если при этом вы можете управлять токенами бота (`permissions.recreate_token`), в `webhook` приходят адрес входящего вебхука `url`, секрет подписи `secret_token` и тело последнего запроса на входящий вебхук `last_request_body`.

Перечень всех ботов пространства, включая чужих, доступен владельцу пространства на тарифе «Корпорация» — [Список ботов пространства](/api/bots/list-company).

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор бота


## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/bots/1738816" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: object` (required) — Параметры бота
  - `id: integer, int32` (required) — Идентификатор бота (совпадает с `user_id` бота). Пример: `1738816`
  - `name: string` (required) — Имя бота. Пример: `"Бот задач"`
  - `nickname: string` (required) — Никнейм бота. Пример: `"tasks_bot"`
  - `avatar_url: string` (required, nullable) — Ссылка на аватар бота. `null`, если аватар не задан. Пример: `"https://files.example.com/uploads/0001/0001/image.jpg"`
  - `creator_id: integer, int32` (required, nullable) — Идентификатор сотрудника, создавшего бота. `null`, если создатель не записан. Пример: `12`
  - `created_at: date-time` (required) — Дата и время создания бота (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-05-15T14:30:00.000Z"`
  - `authorized_users_count: integer, int32` (required) — Сколько сотрудников авторизовали бота. Пример: `3`
  - `last_used_at: date-time` (required, nullable) — Дата и время, когда бот последний раз работал (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ: запрос на входящий вебхук или вызов API любым токеном бота, включая токены сотрудников. `null`, если такого не было. Использование токена учитывается не чаще раза в минуту. Пример: `"2025-05-15T14:30:00.000Z"`
  - `webhook: object` (required) — Объект параметров вебхука
    - `name: string` (required, max length: 255) — Имя бота. Пример: `"Бот задач"`
    - `nickname: string` (required, max length: 255) — Никнейм бота. Пример: `"tasks_bot"`
    - `outgoing_url: string` (required, nullable) — URL исходящего вебхука. `null`, если исходящий вебхук у бота не настроен. Пример: `"https://example.com/tasks/new"`
    - `events: array of string` (required) — События, на которые подписан бот. Пример: `["message_new"]`
    - `trigger_on: string` (required) — Условие срабатывания исходящего вебхука
      Значения: `commands` — Только на команды (триггер-слова) из commands, `all_messages` — На все сообщения в чатах, где есть бот, `unfurl` — На развёртывание ссылок (link previews)
    - `commands: array of string` (required) — Команды бота (триггер-слова). Пример: `["/task"]`
    - `scopes: array of string` (required) — Скоупы (права доступа) токена бота. Набор по умолчанию шире того, что можно назначить явно, поэтому здесь могут встречаться значения, недоступные для явной установки. Пример: `["messages:create"]`
    - `template: string` (required, nullable) — Шаблон форматирования входящего вебхука. `null`, если не задан. Пример: `"Заказ от {{ client }} на сумму {{ amount }} ₽"`
    - `template_engine: string` (required) — Шаблонизатор для обработки шаблона входящего вебхука
      Значения: `liquid` — Liquid — условия, циклы и фильтры, `mustache` — Mustache — простая подстановка без логики
    - `challenge_key: string` (required, nullable) — Название поля проверки для верификации входящего вебхука. `null`, если не задано. Пример: `"challenge"`
    - `link_preview_enabled: boolean` (required) — Показывать превью ссылок в сообщениях входящего вебхука. Пример: `true`
    - `ignore_self_messages: boolean` (required) — Не присылать боту события о его собственных сообщениях и реакциях. Пример: `false`
    - `events_history_enabled: boolean` (required) — Сохранять историю событий бота для последующего получения через метод истории событий. Пример: `false`
    - `single_chat: boolean` (required) — Ограничивает бота одной беседой или каналом: `true` — бота можно добавить только в один такой чат, `false` — в несколько. Личные чаты и треды в ограничение не входят. Пример: `false`
    - `can_edit: array of string` (required) — Роли, которым, помимо создателя, разрешено редактировать настройки бота. Создатель может редактировать всегда. Пустой массив — редактировать может только создатель. Пример: `["admin"]`
    - `who_can_add: string` (required) — Кто может добавлять бота в чаты
      Значения: `creator` — Только создатель бота, `creator_admin` — Создатель и администраторы компании, `creator_admin_user` — Создатель, администраторы и участники компании, `anyone` — Публичный бот: добавить его может любой сотрудник, кроме гостей и мульти-гостей
    - `kind: string` (required) — Источник входящего вебхука. `null`, если входящий вебхук у бота выключен.
      Значения: `simple` — Свой формат: сообщение собирается из тела запроса по шаблону бота, `gitlab` — GitLab: Пачка сама разбирает запрос и собирает сообщение, `grafana` — Grafana: Пачка сама разбирает запрос и собирает сообщение
    - `unfurl_domains: array of string` (required) — Домены, ссылки на которые бот разворачивает. Пример: `["example.com"]`
    - `last_request_at: date-time` (required, nullable) — Дата и время последнего запроса на входящий вебхук бота (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null`, если запросов не было. Пример: `"2025-05-15T14:30:00.000Z"`
    - `url: string` (nullable) — Адрес входящего вебхука. `null`, если входящий вебхук у бота выключен. Приходит только в методе [Информация о боте](/api/bots/get). Пример: `"https://api.pachca.com/webhooks/01JAXK7R3B5Y8Q2W4E6T9V1N3M"`
    - `secret_token: string` — Секрет подписи исходящего вебхука: им подписан заголовок `Pachca-Signature`. Приходит только в методе [Информация о боте](/api/bots/get). Пример: `"pachca_wh_3pX9vQ2mL7rT5yW8kN4bH6jF1dS0aZcVxE2uI9oP7qR3tY5wK8nM4gB6hJ1lD0fA"`
    - `last_request_body: string` (nullable) — Тело последнего запроса на входящий вебхук бота. Длиннее 128 КБ обрезается и заканчивается на `...[truncated]`. `null`, если запросов не было. Приходит только в методе [Информация о боте](/api/bots/get). Пример: `"{\"client\": \"ООО Ромашка\", \"amount\": 15000}"`
  - `oauth_client_enabled: boolean` (required) — Включена ли у бота авторизация от имени сотрудника. Пример: `true`
  - `oauth_client: object` (required) — Параметры авторизации от имени сотрудника. Может прийти и у бота с выключенной авторизацией, поэтому включена ли она, смотрите в `oauth_client_enabled`. У бота без токенов может прийти `null`.
    - `client_id: string` (required) — Идентификатор клиента для ссылки авторизации. Пример: `"aB3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1xY"`
    - `client_secret_preview: string` (required) — Секрет клиента в маскированном виде. Полное значение приходит в `client_secret` один раз: при включении серверного клиента и при ротации секрета. Пример: `"cH5kR9mN...x7Qp"`
    - `confidential: boolean` (required) — Где хранится секрет: `true` — серверное приложение, `false` — приложение без секрета, обмен кода по PKCE. Пример: `true`
    - `redirect_uris: array of string` (required) — Адреса возврата после согласия. Пример: `["https://example.com/oauth/callback"]`
    - `scopes: array of string` (required) — Права, которые бот запрашивает у сотрудника на экране согласия. Пример: `["messages:read","messages:create"]`
  - `promo: object` (required) — Страница бота в витрине. `null`, если авторизация у бота выключена.
    - `description: string` (required, nullable) — Описание бота. `null`, если не задано. Пример: `"Собирает сводку по задачам Jira и присылает её в чат"`
    - `published: boolean` (required) — Опубликован ли бот в витрине. Пример: `true`
    - `promo_images: array of object` (required) — Скриншоты страницы бота
      - `key: string` (required) — Ключ изображения. Пример: `"attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/screenshot.png"`
      - `url: string` (required) — Ссылка на изображение. Пример: `"https://files.example.com/attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/screenshot.png"`
  - `permissions: object` (required) — Что вы можете делать с этим ботом
    - `update_oauth_client: boolean` (required) — Менять авторизацию от имени сотрудника, страницу в витрине и имя бота. Пример: `true`
    - `recreate_token: boolean` (required) — Выпускать, менять и удалять токены бота и обновлять секрет клиента. Пример: `true`
    - `destroy: boolean` (required) — Удалить бота. Пример: `true`
  - `client_secret: string` — Секрет клиента. Приходит один раз: при включении серверного клиента, при переходе на него и при ротации секрета. Пример: `"dGhpc19pc19ub3RfYV9yZWFsX3NlY3JldA"`

**Пример ответа:**

```json
{
  "data": {
    "id": 1738816,
    "name": "Бот задач",
    "nickname": "tasks_bot",
    "avatar_url": null,
    "creator_id": 12,
    "created_at": "2025-05-15T14:30:00.000Z",
    "authorized_users_count": 3,
    "last_used_at": "2025-05-20T09:15:00.000Z",
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
      "who_can_add": "creator",
      "kind": "simple",
      "unfurl_domains": [],
      "last_request_at": "2025-05-20T09:15:00.000Z",
      "url": "https://api.pachca.com/webhooks/01JAXK7R3B5Y8Q2W4E6T9V1N3M",
      "secret_token": "pachca_wh_3pX9vQ2mL7rT5yW8kN4bH6jF1dS0aZcVxE2uI9oP7qR3tY5wK8nM4gB6hJ1lD0fA",
      "last_request_body": "{\"client\": \"ООО Ромашка\", \"amount\": 15000}"
    },
    "oauth_client_enabled": true,
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
    "promo": {
      "description": "Собирает сводку по задачам и присылает её в чат",
      "published": true,
      "promo_images": []
    },
    "permissions": {
      "update_oauth_client": true,
      "recreate_token": true,
      "destroy": true
    }
  }
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

### 404: The server cannot find the requested resource.

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

