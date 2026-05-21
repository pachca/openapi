> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) **обязательно открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом** — это сэкономит токены и предотвратит неполный ответ.

# Информация о токене

**Метод**: `GET`

**Путь**: `/oauth/token/info`

Метод для получения информации о текущем OAuth токене, включая его скоупы, дату создания и последнего использования. Токен в ответе маскируется — видны только первые 8 и последние 4 символа.

## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/oauth/token/info" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: object` (required) — Токен доступа
  - `id: integer, int64` (required) — Идентификатор токена. Пример: `4827`
  - `token: string` (required) — Маскированный токен (видны первые 8 и последние 4 символа). Пример: `"cH5kR9mN...x7Qp"`
  - `name: string` (required) — Пользовательское имя токена. Пример: `"Мой API токен"`
  - `user_id: integer, int64` (required) — Идентификатор владельца токена. Пример: `12`
  - `scopes: array of string` (required) — Список скоупов токена. Пример: `["messages:read","chats:read"]`
  - `created_at: date-time` (required) — Дата создания токена. Пример: `"2025-01-15T10:30:00.000Z"`
  - `revoked_at: date-time` (required) — Дата отзыва токена. Пример: `null`
  - `expires_in: integer, int32` (required) — Время жизни токена в секундах. Пример: `null`
  - `last_used_at: date-time` (required) — Дата последнего использования токена. Пример: `"2025-02-24T14:20:00.000Z"`

**Пример ответа:**

```json
{
  "data": {
    "id": 4827,
    "token": "cH5kR9mN...x7Qp",
    "name": "Мой API токен",
    "user_id": 12,
    "scopes": [
      "messages:read",
      "chats:read"
    ],
    "created_at": "2025-01-15T10:30:00.000Z",
    "revoked_at": null,
    "expires_in": null,
    "last_used_at": "2025-02-24T14:20:00.000Z"
  }
}
```

### 401: Access is unauthorized.

**Схема ответа при ошибке:**

- `error: string` (required) — Код ошибки. Пример: `"invalid_token"`
- `error_description: string` (required) — Описание ошибки. Пример: `"Access token is missing"`

**Пример ответа:**

```json
{
  "error": "invalid_token",
  "error_description": "Access token is missing"
}
```

