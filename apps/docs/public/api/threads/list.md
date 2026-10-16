> Расположение: Методы API → Треды
> Краткое содержание: Треды, доступные владельцу токена.
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Список тредов

**Метод**: `GET`

**Путь**: `/threads`

> **Скоуп:** `threads:read`

Треды, доступные владельцу токена.

Возвращаются треды, где вы состоите в самом треде или в чате, в котором он заведён. Участия в треде достаточно: входить в чат с родительским сообщением не нужно, самостоятельные треды тоже приходят. А вот треды из открытых чатов пространства, где вы не состоите, в список не попадают, хотя сами чаты вам доступны.

Сортировка — по убыванию времени последнего сообщения в треде.

В элементе списка нет ни названия, ни текста: только идентификаторы треда, его чата и родительского сообщения. Чтобы понять, о чём тред, прочитайте его сообщения методом [Список сообщений чата](/api/messages/list) по `chat_id`, а нужный тред по содержанию ищут методом [Поиск сообщений](/api/search/list-messages).

## Параметры

### Query параметры

- `last_message_at_after: date-time` — Фильтрация по времени последнего сообщения в треде: вернутся треды, где оно позже указанного. Значение в ISO-8601, смещение вида `+03:00` учитывается, время без смещения считается UTC.
- `last_message_at_before: date-time` — Фильтрация по времени последнего сообщения в треде: вернутся треды, где оно раньше указанного. Значение в ISO-8601, смещение вида `+03:00` учитывается, время без смещения считается UTC.
- `limit: integer, int32` (default: 50) — Количество возвращаемых сущностей за один запрос
- `cursor: string` — Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`)


## Пример запроса

```bash
# Для получения следующей страницы используйте cursor из meta.paginate.next_page
curl "https://api.pachca.com/api/shared/v1/threads?last_message_at_after=2025-01-01T00:00:00.000Z&last_message_at_before=2025-02-01T00:00:00.000Z&limit=1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: array of object` (required)
  - `id: integer, int64` (required) — Идентификатор треда. Чтобы написать в тред, передайте его в `entity_id` метода [Новое сообщение](/api/messages/create) с `entity_type: "thread"`. Пример: `265142`
  - `chat_id: integer, int64` (required) — Идентификатор чата треда. По нему читают сообщения треда методом [Список сообщений чата](/api/messages/list) и работают с его участниками. Пример: `2637266155`
  - `message_id: integer, int64` (required, nullable) — Идентификатор сообщения, к которому был создан тред. `null` для самостоятельного треда, созданного без привязки к сообщению. Пример: `154332686`
  - `message_chat_id: integer, int64` (required, nullable) — Идентификатор чата сообщения. `null` для самостоятельного треда, созданного без привязки к сообщению. Пример: `2637266154`
  - `updated_at: date-time` (required) — Дата и время обновления треда (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2023-02-01T19:20:47.204Z"`
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
      "id": 265142,
      "chat_id": 2637266155,
      "message_id": 154332686,
      "message_chat_id": 2637266154,
      "updated_at": "2023-02-01T19:20:47.204Z"
    }
  ],
  "meta": {
    "paginate": {
      "next_page": "eyJxZCO2MiwiZGlyIjomSNYjIn3",
      "prev_page": "eyJxZCO2MiwiZGlyIjoiYXNjIn0",
      "has_next": true,
      "has_prev": false
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

