> Расположение: Методы API → Теги
> Краткое содержание: Переименовывает тег
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Редактирование тега

**Метод**: `PUT`

**Путь**: `/group_tags/{id}`

> **Скоуп:** `group_tags:write`

Переименовывает тег. Состав сотрудников и привязки к чатам при этом не меняются: у всех, кто был в теге, он остаётся, только под новым названием.

Название уникально в пространстве без учёта регистра и не может содержать `@`. Занятое название отвечает `400` с кодом `taken`, а `409` приходит, только если такое же название задали одновременно с запросом. Переименовывать теги могут владелец пространства и администратор, боту метод недоступен.

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор тега


## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `group_tag: object` (required)
  - `name: string` (required, max length: 255) — Название тега. Пример: `"Новое название тега"`

### Пример

```json
{
  "group_tag": {
    "name": "Новое название тега"
  }
}
```

## Пример запроса

```bash
curl -X PUT "https://api.pachca.com/api/shared/v1/group_tags/9111" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "group_tag": {
    "name": "Новое название тега"
  }
}'
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

### 409: The request conflicts with the current state of the server.

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

