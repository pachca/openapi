> Расположение: Методы API → Реакции на сообщения
> Краткое содержание: Ставит эмодзи-реакцию на сообщение от имени владельца токена.
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Добавление реакции

**Метод**: `POST`

**Путь**: `/messages/{id}/reactions`

> **Скоуп:** `reactions:write`

Ставит эмодзи-реакцию на сообщение от имени владельца токена.

В поле `code` передаётся сам символ эмодзи: текстовые записи вроде `+1` или `:+1:` метод не принимает. Если пользователь уже ставил реакцию, повторно она установлена не будет. Для удаления реакции надо воспользоваться методом [Удаление реакции](/api/reactions/remove).

Если под сообщением есть тред, реагирующий заодно подписывается на него и начинает получать новые сообщения треда.

Сообщение, которое токену не видно, отвечает `404` с кодом `not_found`, как несуществующее.

**Лимиты реакций:**

- Каждый пользователь может установить на сообщение не более **20 уникальных** реакций
- Сообщение может иметь не более **30 уникальных** реакций
- Общее количество реакций на сообщение не может превышать **1000**

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор сообщения


## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `code: string` (required) — Emoji символ реакции. Именно символ: текстовые записи вроде `+1` или `:+1:` отклоняются как неизвестный эмодзи. Пример: `"👍"`
- `name: string` — Текстовое имя эмодзи (используется для кастомных эмодзи). Пример: `":+1:"`

### Пример

```json
{
  "code": "👍",
  "name": ":+1:"
}
```

## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/messages/7231942/reactions" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "code": "👍",
  "name": ":+1:"
}'
```

## Ответы

### 201: The request has succeeded and a new resource has been created as a result.

**Схема ответа:**

- `user_id: integer, int32` (required) — Идентификатор пользователя, который добавил реакцию. Пример: `12`
- `created_at: date-time` (required) — Дата и время добавления реакции (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2024-01-20T10:30:00.000Z"`
- `code: string` (required) — Emoji символ реакции. Пример: `"👍"`
- `name: string` (required) — Название emoji реакции. Пример: `":+1::skin-tone-1:"`

**Пример ответа:**

```json
{
  "user_id": 12,
  "created_at": "2024-01-20T10:30:00.000Z",
  "code": "👍",
  "name": ":+1::skin-tone-1:"
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

