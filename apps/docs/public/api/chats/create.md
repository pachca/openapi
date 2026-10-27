> Расположение: Методы API → Чаты
> Краткое содержание: Создаёт беседу или канал
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Новый чат

**Метод**: `POST`

**Путь**: `/chats`

> **Скоуп:** `chats:create`

Создаёт беседу или канал. Владелец токена становится владельцем чата, и роль эта в дальнейшем не передаётся.

Мульти-гость, как и в интерфейсе, создавать чаты не может: метод отвечает ему `403`.

Для создания личной переписки 1 на 1 с пользователем пользуйтесь методом [Новое сообщение](/api/messages/create). Чтобы обсудить конкретное сообщение, чат заводить не нужно — под ним заводят тред методом [Новый тред](/api/threads/add). Разговору на одну тему постоянное место тоже не нужно: для него есть метод [Новый самостоятельный тред](/api/threads/create).

Участников можно передать сразу: `member_ids` добавляет поимённо, `group_tag_ids` приводит всех, кто состоит в теге, и дальше поддерживает состав сам. Идентификаторы, которых в пространстве нет, а также приостановленные и удалённые сотрудники запрос не останавливают: чат создаётся с остальными участниками, а такие идентификаторы приходят в `meta.not_found_member_ids`. То же с идентификаторами из `group_tag_ids`, которых нет среди тегов пространства: чат создаётся с остальными тегами, а такие идентификаторы приходят в `meta.not_found_group_tag_ids`. С ботами строже: если настройка бота «Кто может добавлять бота в чаты» не разрешает вам его добавить, чат не создаётся, а метод отвечает `403` с кодом `bot_add_denied` и идентификаторами таких ботов в `value`. Бот с настройкой «Ограничить одним чатом», который уже состоит в другой беседе или канале, тоже останавливает запрос, если он есть в `member_ids` или создаёт чат сам: чат не создаётся, а метод отвечает `409` с кодом `single_chat_bot_occupied` и идентификаторами таких ботов в `value`.

Аватар чату ставят после создания методом [Загрузка аватара чата](/api/chats/update-avatar).

## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `chat: object` (required) — Собранный объект параметров создаваемого чата
  - `name: string` (required, max length: 255) — Название беседы или канала. Пустое название или название из одних пробелов отвечает `422` с кодом `blank`. Пример: `"🤿 aqua"`
  - `member_ids: array of integer` — Массив идентификаторов пользователей, которые станут участниками. Пример: `[186,187]`
  - `group_tag_ids: array of integer` — Массив идентификаторов тегов, которые станут участниками. Пример: `[86,18]`
  - `channel: boolean` (default: false) — Является каналом. Пример: `true`
  - `public: boolean` (default: false) — Открытый доступ. Пример: `false`

### Пример

```json
{
  "chat": {
    "name": "🤿 aqua",
    "member_ids": [
      186,
      187
    ],
    "group_tag_ids": [
      86,
      18
    ],
    "channel": true
  }
}
```

## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/chats" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "chat": {
    "name": "🤿 aqua",
    "member_ids": [
      186,
      187
    ],
    "group_tag_ids": [
      86,
      18
    ],
    "channel": true
  }
}'
```

## Ответы

### 201: The request has succeeded and a new resource has been created as a result.

**Схема ответа:**

- `data: object` (required) — Чат
  - `id: integer, int32` (required) — Идентификатор созданного чата. Пример: `334`
  - `name: string` (required, max length: 255) — Название. Пример: `"🤿 aqua"`
  - `created_at: date-time` (required) — Дата и время создания чата (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2021-08-28T15:56:53.000Z"`
  - `owner_id: integer, int32` (required) — Идентификатор пользователя, создавшего чат. Пример: `185`
  - `member_ids: array of integer` (required) — Массив идентификаторов пользователей, участников. Пример: `[185,186,187]`
  - `group_tag_ids: array of integer` (required) — Массив идентификаторов тегов, участников. Пример: `[9111]`
  - `channel: boolean` (required) — Является каналом. Пример: `true`
  - `archived: boolean` (required) — Находится в архиве. Пример: `false`
  - `personal: boolean` (required) — Является личным чатом. Пример: `false`
  - `public: boolean` (required) — Открытый доступ. Пример: `false`
  - `last_message_at: date-time` (required) — Дата и время создания последнего сообщения в чате (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2021-08-28T15:56:53.000Z"`
  - `meet_room_url: string` (required) — Ссылка на Видеочат. Пример: `"https://meet.pachca.com/aqua-94bb21b5"`
  - `avatar_url: string` (required, nullable) — Ссылка на аватар чата. `null`, если аватар не задан. Пример: `"https://files.example.com/uploads/0001/0001/image.jpg"`
- `meta: object` (required) — Метаданные ответа
  - `not_found_member_ids: array of integer` (required) — Идентификаторы из `member_ids`, которые не удалось добавить: такого сотрудника нет в пространстве, он приостановлен или удалён. Пустой массив, если добавлены все. Пример: `[]`
  - `not_found_group_tag_ids: array of integer` (required) — Идентификаторы из `group_tag_ids`, которых нет среди тегов пространства. Пустой массив, если подключены все. Пример: `[]`

**Пример ответа:**

```json
{
  "data": {
    "id": 334,
    "name": "🤿 aqua",
    "created_at": "2021-08-28T15:56:53.000Z",
    "owner_id": 185,
    "member_ids": [
      185,
      186,
      187
    ],
    "group_tag_ids": [
      9111
    ],
    "channel": true,
    "archived": false,
    "personal": false,
    "public": false,
    "last_message_at": "2021-08-28T15:56:53.000Z",
    "meet_room_url": "https://meet.pachca.com/aqua-94bb21b5",
    "avatar_url": "https://files.example.com/uploads/0001/0001/image.jpg"
  },
  "meta": {
    "not_found_member_ids": [],
    "not_found_group_tag_ids": []
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

### 409: The request conflicts with the current state of the server.

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

