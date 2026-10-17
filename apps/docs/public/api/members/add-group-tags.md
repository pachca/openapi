> Расположение: Методы API → Участники чатов
> Краткое содержание: Привязывает теги к беседе или каналу, чтобы состав чата поддерживался сам.
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Добавление тегов

**Метод**: `POST`

**Путь**: `/chats/{id}/group_tags`

> **Скоуп:** `chat_members:write`

Привязывает теги к беседе или каналу, чтобы состав чата поддерживался сам.

После добавления тега все его участники автоматически становятся участниками чата. Состав участников тега и чата синхронизируется автоматически: при добавлении нового участника в тег он сразу появляется в чате, при удалении из тега — удаляется из чата.

Если хотя бы один из переданных тегов не найден, метод отвечает `404` и не привязывает ни одного. Тег, который к чату уже привязан, повторно не привязывается, а его участники всё равно догружаются в чат. Бот, которому нельзя состоять в тегах, по тегу в чат не приходит.

Привязать тег может участник закрытой беседы и любой сотрудник пространства в открытом чате, а отцепить — только владелец или администратор чата методом [Исключение тега из чата](/api/members/remove-group-tag). Гостю и мульти-гостю метод отвечает `403`, какая бы роль в чате у них ни была.

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор чата


## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `group_tag_ids: array of integer` (required) — Массив идентификаторов тегов, которые станут участниками. Пример: `[86,18]`

### Пример

```json
{
  "group_tag_ids": [
    86,
    18
  ]
}
```

## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/chats/334/group_tags" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "group_tag_ids": [
    86,
    18
  ]
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

