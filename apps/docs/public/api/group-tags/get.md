> Расположение: Методы API → Теги
> Краткое содержание: Название тега и число сотрудников в нём.
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Информация о теге

**Метод**: `GET`

**Путь**: `/group_tags/{id}`

> **Скоуп:** `group_tags:read`

Название тега и число сотрудников в нём.

В `users_count` считаются только действующие сотрудники: приостановленные в счётчик не попадают, хотя в методе [Список сотрудников тега](/api/group-tags/list-users) остаются.

Мульти-гостю доступны только теги, которые приходят ему в [Список тегов](/api/group-tags/list), а на остальные метод отвечает `404`.

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор тега: в ссылке веб-приложения это число из параметра `tag_id`


## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/group_tags/9111" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: object` (required) — Тег
  - `id: integer, int32` (required) — Идентификатор тега. Пример: `9111`
  - `name: string` (required, max length: 255) — Название тега. Пример: `"Design"`
  - `users_count: integer, int32` (required) — Количество сотрудников, которые имеют этот тег. Пример: `6`

**Пример ответа:**

```json
{
  "data": {
    "id": 9111,
    "name": "Design",
    "users_count": 6
  }
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

