> Расположение: Методы API → Напоминания
> Краткое содержание: Напоминание вместе с его автором, ответственными и чатом, к которому оно привязано.
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Информация о напоминании

**Метод**: `GET`

**Путь**: `/tasks/{id}`

> **Скоуп:** `tasks:read`

Напоминание вместе с его автором, ответственными и чатом, к которому оно привязано.

Напоминание видят его автор, ответственные и все, кому доступен его чат. Правило то же, что у фильтра `chat_ids` в методе [Список напоминаний](/api/tasks/list): участники чата, а в открытых беседах и каналах — любой сотрудник пространства. Доступа к чату хватает, чтобы прочитать, но не чтобы изменить: править и удалять напоминание могут только автор и ответственные.

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор напоминания: в ссылке веб-приложения это число из пути `/tasks/{id}` или из параметра `task_id`


## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/tasks/22283" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: object` (required) — Напоминание
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
  - `all_day: boolean` (required) — Напоминание на весь день: `true`, если при создании передан `all_day: true` или срок стоит ровно на 23:59:59. Веб-версия Пачки показывает напоминание без времени только по такому сроку, а при другом времени срока показывает это время. Пример: `false`
  - `custom_properties: array of object` (required) — Дополнительные поля напоминания
    - `id: integer, int32` (required) — Идентификатор поля. Пример: `1678`
    - `name: string` (required, max length: 32) — Название поля. Пример: `"Город"`
    - `data_type: string` (required) — Тип поля
      Значения: `string` — Строковое значение, `number` — Числовое значение, `date` — Дата, `link` — Ссылка
    - `value: string` (required, nullable, max length: 768) — Значение. Возвращается `null`, если поле не заполнено. Число передаётся строкой, дата — в формате ISO 8601. Пример: `"Санкт-Петербург"`

**Пример ответа:**

```json
{
  "data": {
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

