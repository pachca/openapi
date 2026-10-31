> Расположение: Методы API → Поиск
> Краткое содержание: Метод ищет по названиям, а не по содержанию
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Поиск чатов

**Метод**: `GET`

**Путь**: `/search/chats`

> **Скоуп:** `search:chats`

Ищет беседы и каналы по названию, прощая опечатки. Находит и открытые чаты пространства, куда вызывающий не вступал, а закрытые — только те, где он состоит.

Личные переписки по умолчанию не ищутся. Передайте `personal=true`, и поиск пойдёт по имени собеседника, а не по названию чата.

Метод ищет по названиям, а не по содержанию. Если нужно найти, где что-то обсуждали или о чём договорились, это [Поиск сообщений](/api/search/list-messages).

Слишком тяжёлый запрос может не уложиться по времени: тогда метод отвечает `504` с кодом `timeout`, и запрос стоит сузить.

## Параметры

### Query параметры

- `query: string` — Текст поискового запроса. Запрос длиннее 500 знаков обрезается.
- `limit: integer, int32` (default: 100) — Количество возвращаемых результатов за один запрос. Целое число вне допустимых значений заменяется ближайшей границей.
- `cursor: string` — Курсор для пагинации (из `meta.paginate.next_page`)
- `order: string` — Направление сортировки
  Значения: `asc`, `desc`
- `created_from: date-time` — Фильтр по дате создания (от)
- `created_to: date-time` — Фильтр по дате создания (до)
- `active: boolean` — Фильтр по активности чата
- `chat_subtype: string` — Фильтр по типу чата
  Значения: `discussion`, `thread`
- `personal: boolean` — Фильтр по личным чатам


## Пример запроса

```bash
# Для получения следующей страницы используйте cursor из meta.paginate.next_page
curl "https://api.pachca.com/api/shared/v1/search/chats?query=Разработка&limit=10&order=desc&created_from=2025-01-01T00:00:00.000Z&created_to=2025-02-01T00:00:00.000Z&active=true&chat_subtype=discussion&personal=false" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: array of object` (required)
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
- `meta: object` (required) — Мета-информация для пагинации поисковых результатов
  - `total: integer, int32` (required) — Общее количество найденных результатов. Пример: `42`
  - `paginate: object` (required) — Вспомогательная информация
    - `next_page: string` (required) — Курсор пагинации следующей страницы. Пример: `"eyJxZCO2MiwiZGlyIjomSNYjIn3"`
    - `has_next: boolean` (required) — Есть ли ещё данные на следующей странице. На последней странице — `false`. Пример: `true`

**Пример ответа:**

```json
{
  "data": [
    {
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
    }
  ],
  "meta": {
    "total": 42,
    "paginate": {
      "next_page": "eyJxZCO2MiwiZGlyIjomSNYjIn3",
      "has_next": true
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

### 504: Server error

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

