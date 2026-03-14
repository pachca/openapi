# Редактирование сотрудника

**Метод**: `PUT`

**Путь**: `/users/{id}`

> **Скоуп:** `users:update`

Метод для редактирования сотрудника.

Для редактирования сотрудника вам необходимо знать его `id` и указать его в `URL` запроса. Все редактируемые параметры сотрудника указываются в теле запроса. Получить актуальный список идентификаторов дополнительных полей сотрудника вы можете в методе [Список дополнительных полей](GET /custom_properties).

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор пользователя


## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `user: object` (required) — Собранный объект параметров редактируемого сотрудника
  - `first_name: string` — Имя
  - `last_name: string` — Фамилия
  - `email: string` — Электронная почта
  - `phone_number: string` — Телефон
  - `nickname: string` — Имя пользователя
  - `department: string` — Департамент
  - `title: string` — Должность
  - `role: string` — Уровень доступа
    Значения: `admin` — Администратор, `user` — Сотрудник, `multi_guest` — Мульти-гость, `guest` — Гость
  - `suspended: boolean` — Деактивация пользователя
  - `list_tags: array of string` — Массив тегов, привязываемых к сотруднику
  - `custom_properties: array of object` — Задаваемые дополнительные поля
    - `id: integer, int32` (required) — Идентификатор поля
    - `value: string` (required) — Устанавливаемое значение

### Пример

```json
{
  "user": {
    "first_name": "Олег",
    "last_name": "Петров",
    "email": "olegpetrov@example.com",
    "phone_number": "+79001234567",
    "nickname": "olegpetrov",
    "department": "Отдел разработки",
    "title": "Старший разработчик",
    "role": "user",
    "suspended": false,
    "list_tags": [
      "Product"
    ],
    "custom_properties": [
      {
        "id": 1678,
        "value": "Санкт-Петербург"
      }
    ]
  }
}
```

## Пример запроса

```bash
curl -X PUT "https://api.pachca.com/api/shared/v1/users/12" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "user": {
    "first_name": "Олег",
    "last_name": "Петров",
    "email": "olegpetrov@example.com",
    "phone_number": "+79001234567",
    "nickname": "olegpetrov",
    "department": "Отдел разработки",
    "title": "Старший разработчик",
    "role": "user",
    "suspended": false,
    "list_tags": [
      "Product"
    ],
    "custom_properties": [
      {
        "id": 1678,
        "value": "Санкт-Петербург"
      }
    ]
  }
}'
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: object` (required) — Сотрудник
  - `id: integer, int32` (required) — Идентификатор пользователя
  - `first_name: string` (required) — Имя
  - `last_name: string` (required) — Фамилия
  - `nickname: string` (required) — Имя пользователя
  - `email: string` (required) — Электронная почта
  - `phone_number: string` (required) — Телефон
  - `department: string` (required) — Департамент
  - `title: string` (required) — Должность
  - `role: string` (required) — Уровень доступа
    Значения: `admin` — Администратор, `user` — Сотрудник, `multi_guest` — Мульти-гость, `guest` — Гость
  - `suspended: boolean` (required) — Деактивация пользователя
  - `invite_status: string` (required) — Статус приглашения
    Значения: `confirmed` — Принято, `sent` — Отправлено
  - `list_tags: array of string` (required) — Массив тегов, привязанных к сотруднику
  - `custom_properties: array of object` (required) — Дополнительные поля сотрудника
    - `id: integer, int32` (required) — Идентификатор поля
    - `name: string` (required) — Название поля
    - `data_type: string` (required) — Тип поля
      Значения: `string` — Строковое значение, `number` — Числовое значение, `date` — Дата, `link` — Ссылка
    - `value: string` (required) — Значение
  - `user_status: object` (required) — Статус
    - `emoji: string` (required) — Emoji символ статуса
    - `title: string` (required) — Текст статуса
    - `expires_at: date-time` (required) — Срок жизни статуса (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
    - `is_away: boolean` (required) — Режим «Нет на месте»
    - `away_message: object` (required) — Сообщение при режиме «Нет на месте». Отображается в профиле пользователя, а также при отправке ему личного сообщения или упоминании в чате.
      - `text: string` (required) — Текст сообщения
  - `bot: boolean` (required) — Является ботом
  - `sso: boolean` (required) — Использует ли пользователь SSO
  - `created_at: date-time` (required) — Дата создания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
  - `last_activity_at: date-time` (required) — Дата последней активности пользователя (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
  - `time_zone: string` (required) — Часовой пояс пользователя
  - `image_url: string` (required) — Ссылка на скачивание аватарки пользователя

**Пример ответа:**

```json
{
  "data": {
    "id": 12,
    "first_name": "Олег",
    "last_name": "Петров",
    "nickname": "",
    "email": "olegp@example.com",
    "phone_number": "",
    "department": "Продукт",
    "title": "CIO",
    "role": "admin",
    "suspended": false,
    "invite_status": "confirmed",
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

### 400: The server could not understand the request due to invalid syntax.

**Схема ответа при ошибке:**

- `errors: array of object` (required) — Массив ошибок
  - `key: string` (required) — Ключ поля с ошибкой
  - `value: string` (required) — Значение поля, которое вызвало ошибку
  - `message: string` (required) — Сообщение об ошибке
  - `code: string` (required) — Код ошибки
    Значения: `blank` — Обязательное поле (не может быть пустым), `too_long` — Слишком длинное значение (пояснения вы получите в поле message), `invalid` — Поле не соответствует правилам (пояснения вы получите в поле message), `inclusion` — Поле имеет непредусмотренное значение, `exclusion` — Поле имеет недопустимое значение, `taken` — Название для этого поля уже существует, `wrong_emoji` — Emoji статуса не может содержать значения отличные от Emoji символа, `not_found` — Объект не найден, `already_exists` — Объект уже существует (пояснения вы получите в поле message), `personal_chat` — Ошибка личного чата (пояснения вы получите в поле message), `displayed_error` — Отображаемая ошибка (пояснения вы получите в поле message), `not_authorized` — Действие запрещено, `invalid_date_range` — Выбран слишком большой диапазон дат, `invalid_webhook_url` — Некорректный URL вебхука, `rate_limit` — Достигнут лимит запросов, `licenses_limit` — Превышен лимит активных сотрудников (пояснения вы получите в поле message), `user_limit` — Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций), `unique_limit` — Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций), `general_limit` — Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций), `unhandled` — Ошибка выполнения запроса (пояснения вы получите в поле message), `trigger_not_found` — Не удалось найти идентификатор события, `trigger_expired` — Время жизни идентификатора события истекло, `required` — Обязательный параметр не передан, `in` — Недопустимое значение (не входит в список допустимых), `not_applicable` — Значение неприменимо в данном контексте (пояснения вы получите в поле message), `self_update` — Нельзя изменить свои собственные данные, `owner_protected` — Нельзя изменить данные владельца, `already_assigned` — Значение уже назначено, `forbidden` — Недостаточно прав для выполнения действия (пояснения вы получите в поле message), `permission_denied` — Доступ запрещён (недостаточно прав), `access_denied` — Доступ запрещён, `wrong_params` — Некорректные параметры запроса (пояснения вы получите в поле message), `payment_required` — Требуется оплата, `min_length` — Значение слишком короткое (пояснения вы получите в поле message), `max_length` — Значение слишком длинное (пояснения вы получите в поле message)
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
    Значения: `blank` — Обязательное поле (не может быть пустым), `too_long` — Слишком длинное значение (пояснения вы получите в поле message), `invalid` — Поле не соответствует правилам (пояснения вы получите в поле message), `inclusion` — Поле имеет непредусмотренное значение, `exclusion` — Поле имеет недопустимое значение, `taken` — Название для этого поля уже существует, `wrong_emoji` — Emoji статуса не может содержать значения отличные от Emoji символа, `not_found` — Объект не найден, `already_exists` — Объект уже существует (пояснения вы получите в поле message), `personal_chat` — Ошибка личного чата (пояснения вы получите в поле message), `displayed_error` — Отображаемая ошибка (пояснения вы получите в поле message), `not_authorized` — Действие запрещено, `invalid_date_range` — Выбран слишком большой диапазон дат, `invalid_webhook_url` — Некорректный URL вебхука, `rate_limit` — Достигнут лимит запросов, `licenses_limit` — Превышен лимит активных сотрудников (пояснения вы получите в поле message), `user_limit` — Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций), `unique_limit` — Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций), `general_limit` — Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций), `unhandled` — Ошибка выполнения запроса (пояснения вы получите в поле message), `trigger_not_found` — Не удалось найти идентификатор события, `trigger_expired` — Время жизни идентификатора события истекло, `required` — Обязательный параметр не передан, `in` — Недопустимое значение (не входит в список допустимых), `not_applicable` — Значение неприменимо в данном контексте (пояснения вы получите в поле message), `self_update` — Нельзя изменить свои собственные данные, `owner_protected` — Нельзя изменить данные владельца, `already_assigned` — Значение уже назначено, `forbidden` — Недостаточно прав для выполнения действия (пояснения вы получите в поле message), `permission_denied` — Доступ запрещён (недостаточно прав), `access_denied` — Доступ запрещён, `wrong_params` — Некорректные параметры запроса (пояснения вы получите в поле message), `payment_required` — Требуется оплата, `min_length` — Значение слишком короткое (пояснения вы получите в поле message), `max_length` — Значение слишком длинное (пояснения вы получите в поле message)
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

### 422: Client error

**Схема ответа при ошибке:**

- `errors: array of object` (required) — Массив ошибок
  - `key: string` (required) — Ключ поля с ошибкой
  - `value: string` (required) — Значение поля, которое вызвало ошибку
  - `message: string` (required) — Сообщение об ошибке
  - `code: string` (required) — Код ошибки
    Значения: `blank` — Обязательное поле (не может быть пустым), `too_long` — Слишком длинное значение (пояснения вы получите в поле message), `invalid` — Поле не соответствует правилам (пояснения вы получите в поле message), `inclusion` — Поле имеет непредусмотренное значение, `exclusion` — Поле имеет недопустимое значение, `taken` — Название для этого поля уже существует, `wrong_emoji` — Emoji статуса не может содержать значения отличные от Emoji символа, `not_found` — Объект не найден, `already_exists` — Объект уже существует (пояснения вы получите в поле message), `personal_chat` — Ошибка личного чата (пояснения вы получите в поле message), `displayed_error` — Отображаемая ошибка (пояснения вы получите в поле message), `not_authorized` — Действие запрещено, `invalid_date_range` — Выбран слишком большой диапазон дат, `invalid_webhook_url` — Некорректный URL вебхука, `rate_limit` — Достигнут лимит запросов, `licenses_limit` — Превышен лимит активных сотрудников (пояснения вы получите в поле message), `user_limit` — Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций), `unique_limit` — Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций), `general_limit` — Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций), `unhandled` — Ошибка выполнения запроса (пояснения вы получите в поле message), `trigger_not_found` — Не удалось найти идентификатор события, `trigger_expired` — Время жизни идентификатора события истекло, `required` — Обязательный параметр не передан, `in` — Недопустимое значение (не входит в список допустимых), `not_applicable` — Значение неприменимо в данном контексте (пояснения вы получите в поле message), `self_update` — Нельзя изменить свои собственные данные, `owner_protected` — Нельзя изменить данные владельца, `already_assigned` — Значение уже назначено, `forbidden` — Недостаточно прав для выполнения действия (пояснения вы получите в поле message), `permission_denied` — Доступ запрещён (недостаточно прав), `access_denied` — Доступ запрещён, `wrong_params` — Некорректные параметры запроса (пояснения вы получите в поле message), `payment_required` — Требуется оплата, `min_length` — Значение слишком короткое (пояснения вы получите в поле message), `max_length` — Значение слишком длинное (пояснения вы получите в поле message)
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

