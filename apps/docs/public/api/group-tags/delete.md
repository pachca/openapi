> Расположение: Методы API → Теги
> Краткое содержание: Убирает тег из пространства: он снимается со всех сотрудников и отвязывается от всех чатов.
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Удаление тега

**Метод**: `DELETE`

**Путь**: `/group_tags/{id}`

> **Скоуп:** `group_tags:write`

Убирает тег из пространства: он снимается со всех сотрудников и отвязывается от всех чатов.

Из чатов при этом никто не выходит. Сотрудники, которых тег привёл в беседу или канал, остаются там обычными участниками, и дальше их состав тегом уже не поддерживается. Чтобы вывести их из конкретного чата, пользуйтесь методом [Исключение тега из чата](/api/members/remove-group-tag) до удаления самого тега.

Удалять теги могут владелец пространства и администратор, боту метод недоступен.

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор тега


## Пример запроса

```bash
curl -X DELETE "https://api.pachca.com/api/shared/v1/group_tags/9111" \
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

