> Расположение: Методы API → Боты и Webhook
> Краткое содержание: Создаёт бота в пространстве
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Новый бот

**Метод**: `POST`

**Путь**: `/bots`

> **Скоуп:** `bots:write`

Создаёт бота в пространстве. По умолчанию бот получает входящий вебхук в своём формате и сразу отдаёт свой `access_token`. Сохраните токен при создании: тот же самый повторно не показывают, останется перевыпустить его методом [Ротация токена бота](/api/bots/recreate-token).

С `empty: true` создаётся пустой бот, как в интерфейсе: только имя и ник, без токена и без входящего вебхука. Токены ему выпускают методом [Новый токен бота](/api/bots/create-token), а входящий вебхук включают полем `kind` в объекте `webhook`.

Созданный бот ещё никуда не пишет. В беседу и канал он пишет только как участник, а добавляют его как сотрудника — методом [Добавление участников](/api/members/add), передав `id` бота. В канале бот получает роль редактора. Личные сообщения и треды в открытых чатах членства не требуют.

Входящий вебхук бота отправляет сообщение сразу во все беседы и каналы, где бот состоит, поэтому набор его чатов и решает, куда оно попадёт. Токен для этого не нужен, достаточно адреса вебхука. Чтобы написать в один конкретный чат, берите метод [Новое сообщение](/api/messages/create) — вот там токен уже нужен.

Авторизацию от имени сотрудника можно включить сразу, передав `oauth_client`, а страницу в витрине заполнить в `promo`. У серверного клиента секрет приходит в `client_secret` один раз. Подробнее — в разделе [Настройка авторизации](/guides/oauth/setup). Ссылку авторизации для кнопки собирает и код на токен обменивает сервер бота — по шагам в разделе [Получение токена](/guides/oauth/flow).

Ник обязан заканчиваться на `_bot` и быть свободным в пространстве.

Аватар боту ставят после создания методом [Загрузка аватара бота](/api/bots/update-avatar).

## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `empty: boolean` (default: false) — Создать пустого бота: без токена и без входящего вебхука. Без этого поля бот создаётся с входящим вебхуком в своём формате, а его токен приходит в `access_token`. Пример: `false`
- `webhook: object` (required) — Объект параметров вебхука создаваемого бота
  - `name: string` (required, max length: 255) — Имя бота. Пример: `"Бот задач"`
  - `nickname: string` (max length: 255) — Никнейм бота. Должен заканчиваться на `_bot`. Пример: `"tasks_bot"`
  - `outgoing_url: string` — URL исходящего вебхука. Пример: `"https://example.com/tasks/new"`
  - `events: array of string` — События, на которые подписан бот. Пример: `["message_new"]`
  - `trigger_on: string` — Условие срабатывания исходящего вебхука
    Значения: `commands` — Только на команды (триггер-слова) из commands, `all_messages` — На все сообщения в чатах, где есть бот, `unfurl` — На развёртывание ссылок (link previews)
  - `commands: array of string` — Команды бота (триггер-слова), на которые он реагирует при trigger_on = commands. Суммарная длина команд, объединённых через запятую, не должна превышать 255 символов. Пример: `["/task","/help"]`
  - `scopes: array of string` — Скоупы (права доступа) токена бота. Если не указано, бот получает набор по умолчанию. Боту доступны не все скоупы: часть из них разрешена только пользовательским ролям, и попытка назначить такой скоуп возвращает `400`. Служебные значения `bot` и `all` назначать нельзя. Пример: `["messages:create"]`
  - `template: string` — Шаблон форматирования входящего вебхука. Пример: `"Заказ от {{ client }} на сумму {{ amount }} ₽"`
  - `template_engine: string` — Шаблонизатор для обработки шаблона входящего вебхука. Без этого поля бот получает `liquid`, а пустой бот (`empty: true`) — `mustache`.
    Значения: `liquid` — Liquid — условия, циклы и фильтры, `mustache` — Mustache — простая подстановка без логики
  - `challenge_key: string` — Название поля проверки для верификации входящего вебхука. Пример: `"challenge"`
  - `link_preview_enabled: boolean` (default: true) — Показывать превью ссылок в сообщениях входящего вебхука. Пример: `true`
  - `ignore_self_messages: boolean` (default: false) — Не присылать боту события о его собственных сообщениях и реакциях. Пример: `false`
  - `events_history_enabled: boolean` (default: false) — Сохранять историю событий бота для последующего получения через метод истории событий. Пример: `false`
  - `who_can_add: string` — Кто может добавлять бота в чаты
    Значения: `creator` — Только создатель бота, `creator_admin` — Создатель и администраторы компании, `creator_admin_user` — Создатель, администраторы и участники компании, `anyone` — Публичный бот: добавить его может любой сотрудник, кроме гостей и мульти-гостей
  - `can_edit: array of string` — Роли, которым, помимо создателя, разрешено редактировать настройки бота. Создатель может редактировать всегда. Пустой массив — редактировать может только создатель. Пример: `["admin"]`
  - `single_chat: boolean` (default: false) — Ограничивает бота одной беседой или каналом: `true` — бота можно добавить только в один такой чат, `false` — в несколько. Личные чаты и треды в ограничение не входят. Пример: `false`
  - `kind: string` — Источник входящего вебхука. Без `empty` по умолчанию `simple`, а у пустого бота входящий вебхук включается только этим полем.
    Значения: `simple` — Свой формат: сообщение собирается из тела запроса по шаблону бота, `gitlab` — GitLab: Пачка сама разбирает запрос и собирает сообщение, `grafana` — Grafana: Пачка сама разбирает запрос и собирает сообщение
  - `unfurl_domains: array of string` (max items: 5) — Домены, ссылки на которые бот разворачивает, не больше 5. Работают вместе с событием `message_link_shared`. Пример: `["example.com"]`
- `oauth_client: object` — Включить авторизацию от имени сотрудника сразу при создании
  - `confidential: boolean` — Где хранится секрет: `true` — серверное приложение хранит `client_secret` и обменивает код у себя, `false` — приложение без секрета (браузер, мобильное, CLI) обменивает код по PKCE. Если не передать, значение не меняется, а у нового клиента — `true`. Пример: `true`
  - `redirect_uris: array of string` — Адреса возврата после согласия. HTTPS обязателен, кроме адресов на этом же компьютере (`localhost`, `127.0.0.1`, `[::1]`). Адрес в ссылке авторизации должен совпадать с одним из списка точно, у адресов на этом же компьютере порт не сравнивается. При включении передайте хотя бы один адрес. Список заменяется целиком. Пример: `["https://example.com/oauth/callback"]`
  - `scopes: array of string` — Права, которые бот запрашивает у сотрудника на экране согласия. Доступны только права, которые можно выдать самому боту. Если при включении поле не передать, запрашиваются все права бота. Список заменяется целиком. Пример: `["messages:read","messages:create"]`
- `promo: object` — Страница бота в витрине. Задаётся только вместе с `oauth_client`: без авторизации страницы у бота нет.
  - `description: string` — Описание: чем бот занимается и зачем его подключать. Без описания бота нельзя опубликовать. Пример: `"Собирает сводку по задачам Jira и присылает её в чат"`
  - `published: boolean` — Опубликовать бота в витрине: он появится карточкой на вкладке «Обзор». Публикация требует описания. Пример: `true`
  - `promo_images: array of string` (max items: 5) — Скриншоты страницы бота, не больше 5: ключи загруженных изображений (`key` из [Получение подписи, ключа и других параметров](/api/files/uploads)). Список заменяется целиком, порядок сохраняется. Пример: `["attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/screenshot.png"]`

### Пример

```json
{
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
    ]
  },
  "oauth_client": {
    "confidential": true,
    "redirect_uris": [
      "https://example.com/oauth/callback"
    ],
    "scopes": [
      "messages:read",
      "messages:create"
    ]
  }
}
```

## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/bots" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
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
    ]
  },
  "oauth_client": {
    "confidential": true,
    "redirect_uris": [
      "https://example.com/oauth/callback"
    ],
    "scopes": [
      "messages:read",
      "messages:create"
    ]
  }
}'
```

## Ответы

### 201: The request has succeeded and a new resource has been created as a result.

**Схема ответа:**

- `data: object` (required) — Параметры созданного бота
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
  - `access_token: string` — Токен доступа бота. Возвращается при создании бота и при ротации токена. Не приходит, если бот создан с `empty: true`. Пример: `"bm90X2FfcmVhbF90b2tlbg"`

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
    "authorized_users_count": 0,
    "last_used_at": null,
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
      "last_request_at": null
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
      "description": null,
      "published": false,
      "promo_images": []
    },
    "permissions": {
      "update_oauth_client": true,
      "recreate_token": true,
      "destroy": true
    },
    "client_secret": "dGhpc19pc19ub3RfYV9yZWFsX3NlY3JldA",
    "access_token": "bm90X2FfcmVhbF90b2tlbg"
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

