> Расположение: Методы API → Напоминания
> Краткое содержание: Напоминания, доступные владельцу токена.
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Список напоминаний

**Метод**: `GET`

**Путь**: `/tasks`

> **Скоуп:** `tasks:read`

Напоминания, доступные владельцу токена.

Без параметра `chat_ids` возвращаются только ваши напоминания: из бесед и каналов, где вы состоите участником, а также созданные вами или назначенные вам напоминания без привязки к чату. Параметр `chat_ids` меняет выборку — возвращаются все напоминания указанных чатов, включая чужие.

## Параметры

### Query параметры

- `status: string` — Фильтр по состоянию. Если параметр не указан, возвращаются напоминания в любом состоянии.
  Значения: `done`, `undone`
- `chat_ids: array` — Фильтр по чатам, к которым привязаны напоминания. Доступными считаются чаты, где вы состоите участником, открытые беседы и каналы пространства, а также треды, доступные вам по родительскому чату. Мульти-гостю открытые беседы и каналы доступны, только если он в них участник. Остальные переданные идентификаторы игнорируются без ошибки. Не более 100 идентификаторов.
- `performer_ids: array` — Фильтр по ответственным за напоминание. Не более 100 идентификаторов.
- `author_id: integer, int32` — Фильтр по автору напоминания
- `limit: integer, int32` (default: 50) — Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей.
- `cursor: string` — Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`)


## Пример запроса

```bash
# Для получения следующей страницы используйте cursor из meta.paginate.next_page
curl "https://api.pachca.com/api/shared/v1/tasks?status=undone&chat_ids[]=198&chat_ids[]=334&performer_ids[]=12&performer_ids[]=185&author_id=12&limit=1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: array of object` (required)
  - `id: integer, int32` (required) — Идентификатор напоминания. Пример: `22283`
  - `kind: string` (required) — Тип
    Значения: `call` — Позвонить контакту, `meeting` — Встреча, `reminder` — Простое напоминание, `event` — Событие, `email` — Написать письмо
  - `content: string` (required) — Описание. Пример: `"Забрать со склада 21 заказ"`
  - `due_at: date-time` (required, nullable) — Срок выполнения напоминания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null`, если срок не задан. Пример: `"2020-06-05T09:00:00.000Z"`
  - `priority: integer, int32` (required) — Приоритет. Пример: `2`
  - `user_id: integer, int32` (required) — Идентификатор пользователя-создателя напоминания. Пример: `12`
  - `chat_id: integer, int32` (required, nullable) — Идентификатор чата, к которому привязано напоминание. `null`, если напоминание не привязано к чату. Пример: `334`
  - `status: string` (required) — Статус напоминания
    Значения: `done` — Выполнено, `undone` — Активно
  - `created_at: date-time` (required) — Дата и время создания напоминания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2020-06-04T10:37:57.000Z"`
  - `performer_ids: array of integer` (required) — Массив идентификаторов пользователей, привязанных к напоминанию как «ответственные». Пример: `[12]`
  - `all_day: boolean` (required) — Напоминание на весь день (без указания времени). Пример: `false`
  - `custom_properties: array of object` (required) — Дополнительные поля напоминания
    - `id: integer, int32` (required) — Идентификатор поля. Пример: `1678`
    - `name: string` (required, max length: 32) — Название поля. Пример: `"Город"`
    - `data_type: string` (required) — Тип поля
      Значения: `string` — Строковое значение, `number` — Числовое значение, `date` — Дата, `link` — Ссылка
    - `value: string` (required, nullable, max length: 768) — Значение. Возвращается `null`, если поле не заполнено. Число передаётся строкой, дата — в формате ISO 8601. Пример: `"Санкт-Петербург"`
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
      "id": 22283,
      "kind": "reminder",
      "content": "Забрать со склада 21 заказ",
      "due_at": "2020-06-05T09:00:00.000Z",
      "priority": 2,
      "user_id": 12,
      "chat_id": 334,
      "status": "undone",
      "created_at": "2020-06-04T10:37:57.000Z",
      "performer_ids": [
        12
      ],
      "all_day": false,
      "custom_properties": [
        {
          "id": 1678,
          "name": "Город",
          "data_type": "string",
          "value": "Санкт-Петербург"
        }
      ]
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

