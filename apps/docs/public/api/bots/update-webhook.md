> Расположение: Методы API → Боты и Webhook
> Краткое содержание: Метод позволяет боту самостоятельно изменить URL своего исходящего вебхука своим же токеном — без участия администратора и без знания собственного id
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Саморегистрация вебхука бота

**Метод**: `PUT`

**Путь**: `/bot/webhook`

> **Скоуп:** `bot_self:webhook:write`

Метод позволяет боту самостоятельно изменить `URL` своего исходящего вебхука своим же токеном — без участия администратора и без знания собственного `id`. Меняется вебхук того бота, которому принадлежит токен. Чтобы отключить вебхук, передайте пустую строку в `outgoing_url`.

## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `webhook: object` (required) — Объект параметров вебхука
  - `outgoing_url: string` (required) — URL исходящего вебхука. Пустая строка отключает вебхук. Пример: `"https://example.com/tasks/new"`

### Пример

```json
{
  "webhook": {
    "outgoing_url": "https://example.com/tasks/new"
  }
}
```

## Пример запроса

```bash
curl -X PUT "https://api.pachca.com/api/shared/v1/bot/webhook" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "webhook": {
    "outgoing_url": "https://example.com/tasks/new"
  }
}'
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: object` (required) — Параметры бота в ответах методов самого бота
  - `id: integer, int32` (required) — Идентификатор бота (совпадает с `user_id` бота). Пример: `1738816`
  - `oauth_client: object` (required) — Параметры авторизации от имени сотрудника. Может прийти и у бота с выключенной авторизацией. У бота без токенов может прийти `null`.
    - `client_id: string` (required) — Идентификатор клиента для ссылки авторизации. Пример: `"aB3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1xY"`
    - `client_secret_preview: string` (required) — Секрет клиента в маскированном виде. Полное значение приходит в `client_secret` один раз: при включении серверного клиента и при ротации секрета. Пример: `"cH5kR9mN...x7Qp"`
    - `confidential: boolean` (required) — Где хранится секрет: `true` — серверное приложение, `false` — приложение без секрета, обмен кода по PKCE. Пример: `true`
    - `redirect_uris: array of string` (required) — Адреса возврата после согласия. Пример: `["https://example.com/oauth/callback"]`
    - `scopes: array of string` (required) — Права, которые бот запрашивает у сотрудника на экране согласия. Пример: `["messages:read","messages:create"]`
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

**Пример ответа:**

```json
{
  "data": {
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

### 422: Client error

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

