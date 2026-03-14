# Текущий статус

**Метод**: `GET`

**Путь**: `/profile/status`

> **Скоуп:** `profile_status:read`

Метод для получения информации о своем статусе.

## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/profile/status" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: object` (required) — Статус пользователя
  - `emoji: string` (required) — Emoji символ статуса
  - `title: string` (required) — Текст статуса
  - `expires_at: date-time` (required) — Срок жизни статуса (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
  - `is_away: boolean` (required) — Режим «Нет на месте»
  - `away_message: object` (required) — Сообщение при режиме «Нет на месте». Отображается в профиле пользователя, а также при отправке ему личного сообщения или упоминании в чате.
    - `text: string` (required) — Текст сообщения

**Пример ответа:**

```json
{
  "data": {
    "emoji": "🎮",
    "title": "Очень занят",
    "expires_at": "2024-04-08T10:00:00.000Z",
    "is_away": false,
    "away_message": {
      "text": "Я в отпуске до 15 апреля. По срочным вопросам обращайтесь к @ivanov."
    }
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

### 403: Access is forbidden.

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

