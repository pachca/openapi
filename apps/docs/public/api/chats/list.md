> Расположение: Методы API → Чаты
> Краткое содержание: По умолчанию — беседы, каналы и личные переписки, где состоит владелец токена
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Список чатов

**Метод**: `GET`

**Путь**: `/chats`

> **Скоуп:** `chats:read`

По умолчанию — беседы, каналы и личные переписки, где состоит владелец токена. С `availability=public` метод отдаёт вместо этого все открытые чаты пространства, включая те, куда вызывающий не вступал. Мульти-гостю — только открытые чаты, где он участник.

Закрытые чаты метод отдаёт только их участникам, при любых `availability` и `archived`. Перечень всех чатов пространства, включая закрытые, доступен владельцу пространства на тарифе «Корпорация» — [Список чатов пространства](/api/chats/list-company).

Треды в списке не приходят никогда, для них есть [Список тредов](/api/threads/list).

`archived=true` не переключает выдачу на архив, а добавляет архивные чаты к активным.

## Параметры

### Query параметры

- `sort: string` (default: id) — Поле сортировки
- `order: string` (default: desc) — Направление сортировки
- `availability: string` (default: is_member) — Параметр, который отвечает за доступность и выборку чатов для пользователя
- `archived: boolean` (default: false) — Добавляет к выдаче архивные чаты. По умолчанию возвращаются только активные. Работает при любом значении `availability`.
- `last_message_at_after: date-time` — Фильтрация по времени создания последнего сообщения: вернутся чаты, где оно позже указанного. Значение в ISO-8601, смещение вида `+03:00` учитывается, время без смещения считается UTC.
- `last_message_at_before: date-time` — Фильтрация по времени создания последнего сообщения: вернутся чаты, где оно раньше указанного. Значение в ISO-8601, смещение вида `+03:00` учитывается, время без смещения считается UTC.
- `personal: boolean` — Фильтрация по личным и групповым чатам. Если параметр не указан, возвращаются любые чаты.
- `limit: integer, int32` (default: 50) — Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей.
- `cursor: string` — Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`)


## Пример запроса

```bash
# Для получения следующей страницы используйте cursor из meta.paginate.next_page
curl "https://api.pachca.com/api/shared/v1/chats?sort=id&order=desc&availability=is_member&archived=true&last_message_at_after=2025-01-01T00:00:00.000Z&last_message_at_before=2025-02-01T00:00:00.000Z&personal=false&limit=1" \
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

