> Расположение: Методы API → Важное
> Краткое содержание: Добавляет сообщение в раздел «Важное» владельца токена, как «Добавить в важное» в интерфейсе
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Добавление сообщения в важные

**Метод**: `POST`

**Путь**: `/important_messages`

> **Скоуп:** `important_messages:write`

Добавляет сообщение в раздел «Важное» владельца токена, как «Добавить в важное» в интерфейсе. Отметка личная и видна только самому сотруднику. Закрепление, которое видят все участники чата, ставит метод [Закрепление сообщения](/api/messages/pin).

Повторный вызов отвечает `204` и ничего не меняет. Сообщение, которое владелец токена не видит, отвечает `404`, как несуществующее, а удалённое — `404` с кодом `message_deleted`.

Ботам чата при добавлении приходит вебхук `update` об этом сообщении, хотя его текст и `changed_at` не меняются. У добавления в важные и удаления из важных свой [лимит](/api/limits) на частоту запросов.

Токенам ботов метод недоступен.

## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `message_id: integer, int32` (required) — Идентификатор сообщения. Пример: `194275`

### Пример

```json
{
  "message_id": 194275
}
```

## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/important_messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "message_id": 194275
}'
```

## Ответы

### 204: There is no content to send for this request, but the headers may be useful. 

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

