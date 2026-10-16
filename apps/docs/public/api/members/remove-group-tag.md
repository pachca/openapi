> Расположение: Методы API → Участники чатов
> Краткое содержание: Отцепляет тег от беседы или канала и выводит оттуда сотрудников, которых держал только он.
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Исключение тега из чата

**Метод**: `DELETE`

**Путь**: `/chats/{id}/group_tags/{tag_id}`

> **Скоуп:** `chat_members:write`

Отцепляет тег от беседы или канала и выводит оттуда сотрудников, которых держал только он.

Выход происходит фоном, уже после ответа: метод отвечает `204` сразу, а состав чата меняется через несколько мгновений. Останутся владелец чата, те, кого приводит другой тег этого же чата, и те, кого добавляли в чат вручную.

Снять тег с чата может владелец или администратор чата. Привязать его обратно можно методом [Добавление тегов](/api/members/add-group-tags).

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор чата
- `tag_id: integer, int32` (required) — Идентификатор тега


## Пример запроса

```bash
curl -X DELETE "https://api.pachca.com/api/shared/v1/chats/334/group_tags/86" \
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

