# Статус сотрудника

**Метод**: `GET`

**Путь**: `/users/{user_id}/status`

> **Скоуп:** `user_status:read`

Метод для получения информации о статусе сотрудника.

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

### 404: The server cannot find the requested resource.

**Схема ответа при ошибке:**

- `errors: array of object` (required) — Массив ошибок
  - `key: string` (required) — Ключ поля с ошибкой
  - `value: string` (required) — Значение поля, которое вызвало ошибку
  - `message: string` (required) — Сообщение об ошибке
  - `code: string` (required) — Код ошибки
    Значения: `blank` — Обязательное поле (не может быть пустым), `too_long` — Слишком длинное значение (пояснения вы получите в поле message), `invalid` — Поле не соответствует правилам (пояснения вы получите в поле message), `inclusion` — Поле имеет непредусмотренное значение, `exclusion` — Поле имеет недопустимое значение, `taken` — Название для этого поля уже существует, `wrong_emoji` — Emoji статуса не может содержать значения отличные от Emoji символа, `not_found` — Объект не найден, `already_exists` — Объект уже существует (пояснения вы получите в поле message), `personal_chat` — Ошибка личного чата (пояснения вы получите в поле message), `displayed_error` — Отображаемая ошибка (пояснения вы получите в поле message), `not_authorized` — Действие запрещено, `invalid_date_range` — Выбран слишком большой диапазон дат, `invalid_webhook_url` — Некорректный URL вебхука, `rate_limit` — Достигнут лимит запросов, `licenses_limit` — Превышен лимит активных сотрудников (пояснения вы получите в поле message), `user_limit` — Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций), `unique_limit` — Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций), `general_limit` — Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций), `unhandled` — Ошибка выполнения запроса (пояснения вы получите в поле message), `trigger_not_found` — Не удалось найти идентификатор события, `trigger_expired` — Время жизни идентификатора события истекло, `required` — Обязательный параметр не передан, `in` — Недопустимое значение (не входит в список допустимых), `not_applicable` — Значение неприменимо в данном контексте (пояснения вы получите в поле message), `self_update` — Нельзя изменить свои собственные данные, `owner_protected` — Нельзя изменить данные владельца, `already_assigned` — Значение уже назначено, `forbidden` — Недостаточно прав для выполнения действия (пояснения вы получите в поле message), `permission_denied` — Доступ запрещён (недостаточно прав), `access_denied` — Доступ запрещён, `wrong_params` — Некорректные параметры запроса (пояснения вы получите в поле message), `payment_required` — Требуется оплата, `min_length` — Значение слишком короткое (пояснения вы получите в поле message), `max_length` — Значение слишком длинное (пояснения вы получите в поле message), `use_of_system_words` — Использовано зарезервированное системное слово (here, all)
  - `payload: string` (required) — Дополнительные данные об ошибке

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

