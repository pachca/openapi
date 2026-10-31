> Расположение: Методы API → Участники чатов
> Краткое содержание: Убирает сотрудника или бота из беседы, канала или треда
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Исключение участника

**Метод**: `DELETE`

**Путь**: `/chats/{id}/members/{user_id}`

> **Скоуп:** `chat_members:write`

Убирает сотрудника или бота из беседы, канала или треда. Из треда исключают по его `chat_id`: это может Создатель или Админ чата, где находится родительское сообщение, а в самостоятельном треде — его создатель и владелец и администраторы пространства, которых добавили в тред окном «Добавить участников» в интерфейсе Пачки, а не упоминанием. В закрытой беседе исключённый теряет доступ к чату, но остаётся в тредах, где состоял.

Сотрудника, которого держит в чате привязанный тег, этим методом убрать нельзя: ответ придёт успешный, а сотрудник останется в чате. Снимите с него тег методом [Редактирование сотрудника](/api/users/update) или отцепите тег от чата методом [Исключение тега из чата](/api/members/remove-group-tag).

Владельца чата исключить нельзя: метод ответит `400` с кодом `cannot_kick_owner`. Из беседы или канала владелец может выйти только сам, методом [Выход из чата](/api/members/leave), а создатель самостоятельного треда остаётся в нём.

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор чата
- `user_id: integer, int32` (required) — Идентификатор пользователя


## Пример запроса

```bash
curl -X DELETE "https://api.pachca.com/api/shared/v1/chats/334/members/186" \
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

