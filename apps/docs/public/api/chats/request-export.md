> Расположение: Методы API → Чаты
> Краткое содержание: Заказ выгрузки сообщений пространства за период
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Экспорт сообщений

**Метод**: `POST`

**Путь**: `/chats/exports`

> **Скоуп:** `chat_exports:write`

> **Внимание:** Доступно только на тарифе **Корпорация**

Заказ выгрузки сообщений пространства за период. Архив готовится в фоне.

Период выгрузки — не больше 45 дней, с `chat_ids` — до 366 дней, а `end_at` не может быть раньше `start_at`. Другой период отвечает `422` с кодом `invalid_date_range`.

С заголовком `Prefer: return=representation` ответ приходит со статусом `202` и идентификатором экспорта в `data.id`. Без заголовка ответ пустой, со статусом `204`. По идентификатору архив отдаёт метод [Скачать архив экспорта](/api/chats/download-export), когда сборка закончится.

Когда архив готов, на адрес из `webhook_url` приходит вебхук с идентификатором в поле `export_id`. Заказавший получает письмо и уведомление в Пачке со ссылкой вида `/full_exports/{id}` — число в ней и есть идентификатор.

Следующую выгрузку пространство может заказать через 90 секунд после предыдущей, даже если та ещё собирается. Более ранний запрос отвечает `422` с кодом `rate_limit`.

## Параметры

### Header параметры

- `Prefer: string` — Просьба вернуть идентификатор экспорта в ответе. Без заголовка ответ приходит пустым, со статусом `204`.
  Значения: `return=representation`


## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `start_at: date` (required) — Дата начала для экспорта в формате YYYY-MM-DD. Если прислать дату со временем, время молча отбрасывается — экспорт всегда идёт по календарным дням. Пример: `"2025-03-20"`
- `end_at: date` (required) — Дата окончания для экспорта в формате YYYY-MM-DD, включительно. Если прислать дату со временем, время молча отбрасывается. Пример: `"2025-03-20"`
- `webhook_url: string` — Адрес, на который придёт вебхук с номером готовой выгрузки, когда архив будет собран. Номер приходит в поле `export_id`, а всё тело вебхука описано в разделе [Экспорт](/guides/export). Пример: `"https://example.com/webhooks/export"`
- `chat_ids: array of integer` (max items: 50) — Массив идентификаторов чатов. Указывается, если нужно получить сообщения только некоторых чатов. Пример: `[1381521]`
- `skip_chats_file: boolean` (default: false) — Пропуск формирования файла со списком чатов (chats.json). Пример: `false`

### Пример

```json
{
  "start_at": "2025-03-01",
  "end_at": "2025-03-20",
  "chat_ids": [
    1381521
  ]
}
```

## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/chats/exports" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H 'Prefer: return=representation' \
  -H "Content-Type: application/json" \
  -d '{
  "start_at": "2025-03-01",
  "end_at": "2025-03-20",
  "chat_ids": [
    1381521
  ]
}'
```

## Ответы

### 202: The request has been accepted for processing, but processing has not yet completed.

**Схема ответа:**

- `data: object` (required) — Заказанный экспорт сообщений
  - `id: integer, int32` (required) — Идентификатор экспорта. Пример: `22322`

**Пример ответа:**

```json
{
  "data": {
    "id": 22322
  }
}
```

### 204: There is no content to send for this request, but the headers may be useful. 

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

