> Расположение: Методы API → Участники чатов
> Краткое содержание: Меняет роль участника беседы или канала
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Редактирование роли участника

**Метод**: `PUT`

**Путь**: `/chats/{id}/members/{user_id}`

> **Скоуп:** `chat_members:write`

Меняет роль участника беседы или канала. Роль в чате с ролью в пространстве не связана: рядовой сотрудник может быть администратором чата, а повышение в пространстве роли в чатах не меняет.

Роль `editor` существует только в каналах. Себе роль сменить нельзя, как и тому, кто в чате не состоит, и владельцу чата: он всегда имеет права администратора чата. Повторная установка той же роли считается ошибкой, а не повтором.

Отказ приходит со статусом `400`, а причину называет код: `not_applicable` — роль `editor` вне канала, `self_update` — своя роль, `owner_protected` — роль владельца чата, `already_assigned` — у участника уже эта роль, `forbidden` — эту роль вам менять нельзя. На сотрудника, который в чате не состоит, метод отвечает `404`.

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор чата
- `user_id: integer, int32` (required) — Идентификатор пользователя


## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `role: string` (required) — Роль
  Значения: `admin` — Админ, `editor` — Редактор (доступно только для каналов), `member` — Участник или подписчик

### Пример

```json
{
  "role": "admin"
}
```

## Пример запроса

```bash
curl -X PUT "https://api.pachca.com/api/shared/v1/chats/334/members/186" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "role": "admin"
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

