> Расположение: Методы API → Сотрудники
> Краткое содержание: Статус другого сотрудника: эмодзи, подпись, срок и режим «Нет на месте».
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Статус сотрудника

**Метод**: `GET`

**Путь**: `/users/{user_id}/status`

> **Скоуп:** `user_status:read`

Статус другого сотрудника: эмодзи, подпись, срок и режим «Нет на месте».

Мульти-гостю метод отдаёт статусы только тех, кто приходит ему в [Список сотрудников](/api/users/list), а на остальных отвечает `404`.

Если статус не установлен, метод возвращает `200` и `null` в теле ответа — без объекта-обёртки. Статус с истёкшим `expires_at` какое-то время ещё возвращается, пока не будет очищен, поэтому проверяйте `expires_at` на стороне клиента.

## Параметры

### Path параметры

- `user_id: integer, int32` (required) — Идентификатор пользователя


## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/users/12/status" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: object` (required) — Статус пользователя
  - `emoji: string` (required) — Emoji символ статуса. Пример: `"🎮"`
  - `title: string` (required, max length: 50) — Текст статуса. Пример: `"Очень занят"`
  - `expires_at: date-time` (required, nullable) — Срок жизни статуса (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null`, если срок не задан — такой статус не сбрасывается автоматически. Пример: `"2024-04-08T10:00:00.000Z"`
  - `is_away: boolean` (required) — Режим «Нет на месте». Пример: `false`
  - `away_message: object` (required, nullable) — Сообщение при режиме «Нет на месте». Отображается в профиле пользователя, а также при отправке ему личного сообщения или упоминании в чате. `null`, если текст не задан.
    - `text: string` (required, max length: 1024) — Текст сообщения. Пример: `"Я в отпуске до 15 апреля. По срочным вопросам обращайтесь к @ivanov."`

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

