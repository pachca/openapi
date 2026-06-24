> Расположение: Методы API → Сотрудники
> Краткое содержание: Метод для получения актуального списка сотрудников вашей компании.
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Список сотрудников

**Метод**: `GET`

**Путь**: `/users`

> **Скоуп:** `users:read`

Метод для получения актуального списка сотрудников вашей компании.

## Параметры

### Query параметры

- `query: string` — Поисковая фраза для фильтрации результатов. Поиск работает по полям: `first_name` (имя), `last_name` (фамилия), `email` (электронная почта), `phone_number` (телефон) и `nickname` (никнейм).
- `limit: integer, int32` (default: 50) — Количество возвращаемых сущностей за один запрос
- `cursor: string` — Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`)


## Пример запроса

```bash
# Для получения следующей страницы используйте cursor из meta.paginate.next_page
curl "https://api.pachca.com/api/shared/v1/users?query=Олег&limit=1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: array of object` (required)
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
- `meta: object` (required) — Метаданные пагинации
  - `paginate: object` (required) — Вспомогательная информация
    - `next_page: string` (required) — Курсор пагинации следующей страницы. Пример: `"eyJxZCO2MiwiZGlyIjomSNYjIn3"`
    - `prev_page: string` — Курсор пагинации предыдущей страницы. Используется для polling новых записей «сверху» списка.. Пример: `"eyJxZCO2MiwiZGlyIjoiYXNjIn0"`
    - `has_next: boolean` — Есть ли ещё данные на следующей странице. На последней странице — `false`.. Пример: `true`
    - `has_prev: boolean` — Есть ли ещё данные на предыдущей странице. На первом запросе без курсора — `false`.. Пример: `false`

**Пример ответа:**

```json
{
  "data": [
    {
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
  ],
  "meta": {
    "paginate": {
      "next_page": "eyJxZCO2MiwiZGlyIjomSNYjIn3",
      "prev_page": "eyJxZCO2MiwiZGlyIjoiYXNjIn0",
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### 400: The server could not understand the request due to invalid syntax.

**Схема ответа при ошибке:**

- `errors: array of object` (required) — Массив ошибок
  - `key: string` (required) — Ключ поля с ошибкой. Пример: `"field.name"`
  - `value: string` (required) — Значение поля, которое вызвало ошибку. Пример: `"invalid_value"`
  - `message: string` (required) — Сообщение об ошибке. Пример: `"Поле не может быть пустым"`
  - `code: string` (required) — Код ошибки
    Значения: `blank` — Обязательное поле (не может быть пустым), `too_long` — Слишком длинное значение (пояснения вы получите в поле message), `invalid` — Поле не соответствует правилам (пояснения вы получите в поле message), `inclusion` — Поле имеет непредусмотренное значение, `exclusion` — Поле имеет недопустимое значение, `taken` — Название для этого поля уже существует, `wrong_emoji` — Emoji статуса не может содержать значения отличные от Emoji символа, `not_found` — Объект не найден, `already_exists` — Объект уже существует (пояснения вы получите в поле message), `personal_chat` — Ошибка личного чата (пояснения вы получите в поле message), `displayed_error` — Отображаемая ошибка (пояснения вы получите в поле message), `not_authorized` — Действие запрещено, `invalid_date_range` — Выбран слишком большой диапазон дат, `invalid_webhook_url` — Некорректный URL вебхука, `rate_limit` — Достигнут лимит запросов, `licenses_limit` — Превышен лимит активных сотрудников (пояснения вы получите в поле message), `user_limit` — Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций), `unique_limit` — Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций), `general_limit` — Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций), `unhandled` — Ошибка выполнения запроса (пояснения вы получите в поле message), `trigger_not_found` — Не удалось найти идентификатор события, `trigger_expired` — Время жизни идентификатора события истекло, `required` — Обязательный параметр не передан, `in` — Недопустимое значение (не входит в список допустимых), `not_applicable` — Значение неприменимо в данном контексте (пояснения вы получите в поле message), `self_update` — Нельзя изменить свои собственные данные, `owner_protected` — Нельзя изменить данные владельца, `already_assigned` — Значение уже назначено, `forbidden` — Недостаточно прав для выполнения действия (пояснения вы получите в поле message), `permission_denied` — Доступ запрещён (недостаточно прав), `access_denied` — Доступ запрещён, `wrong_params` — Некорректные параметры запроса (пояснения вы получите в поле message), `payment_required` — Требуется оплата, `min_length` — Значение слишком короткое (пояснения вы получите в поле message), `max_length` — Значение слишком длинное (пояснения вы получите в поле message), `use_of_system_words` — Использовано зарезервированное системное слово (here, all), `export_file_not_found` — Файл экспорта не найден или ещё не готов, `cannot_kick_owner` — Нельзя исключить владельца чата, `pin_failed` — Не удалось закрепить сообщение, `message_deleted` — Сообщение удалено, `thread_message` — Нельзя создать тред для сообщения, которое уже находится в треде
  - `payload: Record<string, object>` (required) — Дополнительные данные об ошибке. Содержимое зависит от кода ошибки: `{id: number}` — при ошибке кастомного свойства (идентификатор свойства), `{record: {type: string, id: number}, query: string}` — при ошибке авторизации. В большинстве случаев `null`. Пример: `null`
    **Структура значений Record:**
    - Тип значения: `any`

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

- `error: string` (required) — Код ошибки. Пример: `"invalid_token"`
- `error_description: string` (required) — Описание ошибки. Пример: `"Access token is missing"`

**Пример ответа:**

```json
{
  "error": "invalid_token",
  "error_description": "Access token is missing"
}
```

### 402: Client error

**Схема ответа при ошибке:**

- `errors: array of object` (required) — Массив ошибок
  - `key: string` (required) — Ключ поля с ошибкой. Пример: `"field.name"`
  - `value: string` (required) — Значение поля, которое вызвало ошибку. Пример: `"invalid_value"`
  - `message: string` (required) — Сообщение об ошибке. Пример: `"Поле не может быть пустым"`
  - `code: string` (required) — Код ошибки
    Значения: `blank` — Обязательное поле (не может быть пустым), `too_long` — Слишком длинное значение (пояснения вы получите в поле message), `invalid` — Поле не соответствует правилам (пояснения вы получите в поле message), `inclusion` — Поле имеет непредусмотренное значение, `exclusion` — Поле имеет недопустимое значение, `taken` — Название для этого поля уже существует, `wrong_emoji` — Emoji статуса не может содержать значения отличные от Emoji символа, `not_found` — Объект не найден, `already_exists` — Объект уже существует (пояснения вы получите в поле message), `personal_chat` — Ошибка личного чата (пояснения вы получите в поле message), `displayed_error` — Отображаемая ошибка (пояснения вы получите в поле message), `not_authorized` — Действие запрещено, `invalid_date_range` — Выбран слишком большой диапазон дат, `invalid_webhook_url` — Некорректный URL вебхука, `rate_limit` — Достигнут лимит запросов, `licenses_limit` — Превышен лимит активных сотрудников (пояснения вы получите в поле message), `user_limit` — Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций), `unique_limit` — Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций), `general_limit` — Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций), `unhandled` — Ошибка выполнения запроса (пояснения вы получите в поле message), `trigger_not_found` — Не удалось найти идентификатор события, `trigger_expired` — Время жизни идентификатора события истекло, `required` — Обязательный параметр не передан, `in` — Недопустимое значение (не входит в список допустимых), `not_applicable` — Значение неприменимо в данном контексте (пояснения вы получите в поле message), `self_update` — Нельзя изменить свои собственные данные, `owner_protected` — Нельзя изменить данные владельца, `already_assigned` — Значение уже назначено, `forbidden` — Недостаточно прав для выполнения действия (пояснения вы получите в поле message), `permission_denied` — Доступ запрещён (недостаточно прав), `access_denied` — Доступ запрещён, `wrong_params` — Некорректные параметры запроса (пояснения вы получите в поле message), `payment_required` — Требуется оплата, `min_length` — Значение слишком короткое (пояснения вы получите в поле message), `max_length` — Значение слишком длинное (пояснения вы получите в поле message), `use_of_system_words` — Использовано зарезервированное системное слово (here, all), `export_file_not_found` — Файл экспорта не найден или ещё не готов, `cannot_kick_owner` — Нельзя исключить владельца чата, `pin_failed` — Не удалось закрепить сообщение, `message_deleted` — Сообщение удалено, `thread_message` — Нельзя создать тред для сообщения, которое уже находится в треде
  - `payload: Record<string, object>` (required) — Дополнительные данные об ошибке. Содержимое зависит от кода ошибки: `{id: number}` — при ошибке кастомного свойства (идентификатор свойства), `{record: {type: string, id: number}, query: string}` — при ошибке авторизации. В большинстве случаев `null`. Пример: `null`
    **Структура значений Record:**
    - Тип значения: `any`

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

### 422: Client error

**Схема ответа при ошибке:**

- `errors: array of object` (required) — Массив ошибок
  - `key: string` (required) — Ключ поля с ошибкой. Пример: `"field.name"`
  - `value: string` (required) — Значение поля, которое вызвало ошибку. Пример: `"invalid_value"`
  - `message: string` (required) — Сообщение об ошибке. Пример: `"Поле не может быть пустым"`
  - `code: string` (required) — Код ошибки
    Значения: `blank` — Обязательное поле (не может быть пустым), `too_long` — Слишком длинное значение (пояснения вы получите в поле message), `invalid` — Поле не соответствует правилам (пояснения вы получите в поле message), `inclusion` — Поле имеет непредусмотренное значение, `exclusion` — Поле имеет недопустимое значение, `taken` — Название для этого поля уже существует, `wrong_emoji` — Emoji статуса не может содержать значения отличные от Emoji символа, `not_found` — Объект не найден, `already_exists` — Объект уже существует (пояснения вы получите в поле message), `personal_chat` — Ошибка личного чата (пояснения вы получите в поле message), `displayed_error` — Отображаемая ошибка (пояснения вы получите в поле message), `not_authorized` — Действие запрещено, `invalid_date_range` — Выбран слишком большой диапазон дат, `invalid_webhook_url` — Некорректный URL вебхука, `rate_limit` — Достигнут лимит запросов, `licenses_limit` — Превышен лимит активных сотрудников (пояснения вы получите в поле message), `user_limit` — Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций), `unique_limit` — Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций), `general_limit` — Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций), `unhandled` — Ошибка выполнения запроса (пояснения вы получите в поле message), `trigger_not_found` — Не удалось найти идентификатор события, `trigger_expired` — Время жизни идентификатора события истекло, `required` — Обязательный параметр не передан, `in` — Недопустимое значение (не входит в список допустимых), `not_applicable` — Значение неприменимо в данном контексте (пояснения вы получите в поле message), `self_update` — Нельзя изменить свои собственные данные, `owner_protected` — Нельзя изменить данные владельца, `already_assigned` — Значение уже назначено, `forbidden` — Недостаточно прав для выполнения действия (пояснения вы получите в поле message), `permission_denied` — Доступ запрещён (недостаточно прав), `access_denied` — Доступ запрещён, `wrong_params` — Некорректные параметры запроса (пояснения вы получите в поле message), `payment_required` — Требуется оплата, `min_length` — Значение слишком короткое (пояснения вы получите в поле message), `max_length` — Значение слишком длинное (пояснения вы получите в поле message), `use_of_system_words` — Использовано зарезервированное системное слово (here, all), `export_file_not_found` — Файл экспорта не найден или ещё не готов, `cannot_kick_owner` — Нельзя исключить владельца чата, `pin_failed` — Не удалось закрепить сообщение, `message_deleted` — Сообщение удалено, `thread_message` — Нельзя создать тред для сообщения, которое уже находится в треде
  - `payload: Record<string, object>` (required) — Дополнительные данные об ошибке. Содержимое зависит от кода ошибки: `{id: number}` — при ошибке кастомного свойства (идентификатор свойства), `{record: {type: string, id: number}, query: string}` — при ошибке авторизации. В большинстве случаев `null`. Пример: `null`
    **Структура значений Record:**
    - Тип значения: `any`

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

