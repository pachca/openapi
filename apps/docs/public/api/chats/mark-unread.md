> Расположение: Методы API → Чаты
> Краткое содержание: Помечает чат непрочитанным для владельца токена, как «Отметить непрочитанным» в интерфейсе
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Отметка чата непрочитанным

**Метод**: `PUT`

**Путь**: `/chats/{id}/unread`

> **Скоуп:** `chats:mark_unread`

Помечает чат непрочитанным для владельца токена, как «Отметить непрочитанным» в интерфейсе. Меняется только его собственный счётчик, остальные участники ничего не замечают.

Без `message_id` непрочитанным становится последнее сообщение чата, с `message_id` — это сообщение и все после него. Повторный запрос с тем же сообщением ничего не меняет, а в чате без сообщений метод отвечает успехом и ничего не делает.

Работает в беседах, каналах, личных чатах и тредах, где владелец токена состоит: тред передают его `chat_id`. Скрытый личный чат снова появляется в списке. Открытый чат, где владелец токена не состоит, и сообщение из другого чата отвечают `404`. Закрытый чат, недоступный тред и чат другого пространства отвечают `403`.

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор чата (беседы, канала, личного чата или чата треда)


## Тело запроса

**Опционально**

Формат: `application/json`

### Схема

- `message_id: integer, int32` (min: 1) — Идентификатор сообщения, с которого чат становится непрочитанным: оно и все сообщения после него. Если не передать, непрочитанным становится последнее сообщение. Пример: `1194275`

### Пример

```json
{
  "message_id": 1194275
}
```

## Пример запроса

```bash
curl -X PUT "https://api.pachca.com/api/shared/v1/chats/334/unread" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "message_id": 1194275
}'
```

## Ответы

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

