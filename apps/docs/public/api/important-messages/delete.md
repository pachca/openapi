> Расположение: Методы API → Важное
> Краткое содержание: Убирает сообщение из раздела «Важное» владельца токена по идентификатору сообщения
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Удаление сообщения из важных

**Метод**: `DELETE`

**Путь**: `/important_messages/{id}`

> **Скоуп:** `important_messages:write`

Убирает сообщение из раздела «Важное» владельца токена по идентификатору сообщения. Если сообщения в важных не было, ответ всё равно `204`, поэтому повторный вызов безопасен. Убрать можно и сообщение из чата, где сотрудник больше не состоит.

Ботам чата при удалении приходит вебхук `update` об этом сообщении, хотя его текст и `changed_at` не меняются.

Токенам ботов метод недоступен.

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор сообщения


## Пример запроса

```bash
curl -X DELETE "https://api.pachca.com/api/shared/v1/important_messages/194275" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
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

