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
  - `id: integer, int64` (required) — Идентификатор токена
  - `token: string` (required) — Маскированный токен (видны первые 8 и последние 4 символа)
  - `name: string` (required) — Пользовательское имя токена
  - `user_id: integer, int64` (required) — Идентификатор владельца токена
  - `scopes: array of string` (required) — Список скоупов токена
  - `created_at: date-time` (required) — Дата создания токена
  - `revoked_at: date-time` (required) — Дата отзыва токена
  - `expires_in: integer, int32` (required) — Время жизни токена в секундах
  - `last_used_at: date-time` (required) — Дата последнего использования токена

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

- `error: string` (required) — Код ошибки
- `error_description: string` (required) — Описание ошибки

**Пример ответа:**

```json
{
  "error": "invalid_token",
  "error_description": "Access token is missing"
}
```

