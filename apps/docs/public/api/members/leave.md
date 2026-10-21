> Расположение: Методы API → Участники чатов
> Краткое содержание: Владелец токена выходит из беседы или канала сам
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Выход из чата

**Метод**: `DELETE`

**Путь**: `/chats/{id}/leave`

> **Скоуп:** `chats:leave`

Владелец токена выходит из беседы или канала сам. В закрытой беседе остальные видят системное сообщение о выходе, в открытом чате и канале — нет.

Выйти нельзя, если сотрудника держит в чате привязанный тег: метод ответит `403`, пока тег не снимут с сотрудника или с чата. Гостю и мульти-гостю метод тоже отвечает `403`, какая бы роль в чате у них ни была. Из треда и из личной переписки выйти нельзя: на тред метод отвечает `403`, на личную переписку — `400` с кодом `personal_chat`. А вот из архивного чата выйти можно.

Вернуться в открытый чат можно самому, в закрытый — только если кто-то из участников добавит обратно. Другого сотрудника выводит [Исключение участника](/api/members/remove).

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор чата


## Пример запроса

```bash
curl -X DELETE "https://api.pachca.com/api/shared/v1/chats/334/leave" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
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

