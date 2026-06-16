> Расположение: Методы API → Профиль и статус
> Краткое содержание: Метод для получения информации о своем профиле.
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Свой профиль

**Метод**: `GET`

**Путь**: `/profile`

> **Скоуп:** `profile:read`

Метод для получения информации о своем профиле.

## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/profile" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: object` (required) — Сотрудник
  - `id: integer, int32` (required) — Идентификатор пользователя. Пример: `12`
  - `first_name: string` (required) — Имя. Пример: `"Олег"`
  - `last_name: string` (required) — Фамилия. Пример: `"Петров"`
  - `nickname: string` (required) — Имя пользователя. Пример: `"olegpetrov"`
  - `email: string` (required) — Электронная почта. Возвращает `null` для ботов без права просмотра персональных данных, а также при запросе данных другого пользователя ботом, для которого скрыты персональные данные сотрудников.. Пример: `"olegp@example.com"`
  - `phone_number: string` (required) — Телефон. Возвращает `null` для ботов без права просмотра персональных данных, а также при запросе данных другого пользователя ботом, для которого скрыты персональные данные сотрудников.. Пример: `"+79001234567"`
  - `department: string` (required) — Департамент. Пример: `"Продукт"`
  - `title: string` (required) — Должность. Пример: `"CIO"`
  - `role: string` (required) — Уровень доступа
    Значения: `admin` — Администратор, `user` — Сотрудник, `multi_guest` — Мульти-гость, `guest` — Гость
  - `suspended: boolean` (required) — Деактивация пользователя. Пример: `false`
  - `invite_status: string` (required) — Статус приглашения
    Значения: `confirmed` — Принято, `sent` — Отправлено
  - `inviter_id: integer, int32` (required) — Идентификатор сотрудника, который пригласил данного сотрудника. Возвращает `null`, если сотрудник зарегистрировался самостоятельно или если пригласивший сотрудник был удалён.. Пример: `185`
  - `list_tags: array of string` (required) — Массив тегов, привязанных к сотруднику. Пример: `["Product","Design"]`
  - `custom_properties: array of object` (required) — Дополнительные поля сотрудника
    - `id: integer, int32` (required) — Идентификатор поля. Пример: `1678`
    - `name: string` (required) — Название поля. Пример: `"Город"`
    - `data_type: string` (required) — Тип поля
      Значения: `string` — Строковое значение, `number` — Числовое значение, `date` — Дата, `link` — Ссылка
    - `value: string` (required) — Значение. Пример: `"Санкт-Петербург"`
  - `user_status: object` (required) — Статус
    - `emoji: string` (required) — Emoji символ статуса. Пример: `"🎮"`
    - `title: string` (required) — Текст статуса. Пример: `"Очень занят"`
    - `expires_at: date-time` (required) — Срок жизни статуса (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2024-04-08T10:00:00.000Z"`
    - `is_away: boolean` (required) — Режим «Нет на месте». Пример: `false`
    - `away_message: object` (required) — Сообщение при режиме «Нет на месте». Отображается в профиле пользователя, а также при отправке ему личного сообщения или упоминании в чате.
      - `text: string` (required) — Текст сообщения. Пример: `"Я в отпуске до 15 апреля. По срочным вопросам обращайтесь к @ivanov."`
  - `bot: boolean` (required) — Является ботом. Пример: `false`
  - `sso: boolean` (required) — Использует ли пользователь SSO. Пример: `false`
  - `created_at: date-time` (required) — Дата создания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2020-06-08T09:32:57.000Z"`
  - `last_activity_at: date-time` (required) — Дата последней активности пользователя (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-01-20T13:40:07.000Z"`
  - `time_zone: string` (required) — Часовой пояс пользователя. Пример: `"Europe/Moscow"`
  - `image_url: string` (required) — Ссылка на скачивание аватарки пользователя. Пример: `"https://app.pachca.com/users/12/photo.jpg"`

**Пример ответа:**

```json
{
  "data": {
    "id": 12,
    "first_name": "Олег",
    "last_name": "Петров",
    "nickname": "olegpetrov",
    "email": "olegp@example.com",
    "phone_number": "+79001234567",
    "department": "Продукт",
    "title": "CIO",
    "role": "admin",
    "suspended": false,
    "invite_status": "confirmed",
    "inviter_id": 185,
    "list_tags": [
      "Product",
      "Design"
    ],
    "custom_properties": [
      {
        "id": 1678,
        "name": "Город",
        "data_type": "string",
        "value": "Санкт-Петербург"
      }
    ],
    "user_status": {
      "emoji": "🎮",
      "title": "Очень занят",
      "expires_at": "2024-04-08T10:00:00.000Z",
      "is_away": false,
      "away_message": {
        "text": "Я в отпуске до 15 апреля. По срочным вопросам обращайтесь к @ivanov."
      }
    },
    "bot": false,
    "sso": false,
    "created_at": "2020-06-08T09:32:57.000Z",
    "last_activity_at": "2025-01-20T13:40:07.000Z",
    "time_zone": "Europe/Moscow",
    "image_url": "https://app.pachca.com/users/12/photo.jpg"
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

### 403: Access is forbidden.

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

