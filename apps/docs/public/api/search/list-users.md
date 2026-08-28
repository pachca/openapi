> Расположение: Методы API → Поиск
> Краткое содержание: Метод для полнотекстового поиска сотрудников по имени, email, должности и другим полям.
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Поиск сотрудников

**Метод**: `GET`

**Путь**: `/search/users`

> **Скоуп:** `search:users`

Метод для полнотекстового поиска сотрудников по имени, email, должности и другим полям.

## Параметры

### Query параметры

- `query: string` — Текст поискового запроса
- `limit: integer, int32` (default: 200) — Количество возвращаемых результатов за один запрос
- `cursor: string` — Курсор для пагинации (из `meta.paginate.next_page`)
- `sort: string` — Сортировка результатов
  Значения: `by_score`, `alphabetical`, `creation`
- `order: string` — Направление сортировки
  Значения: `asc`, `desc`
- `created_from: date-time` — Фильтр по дате создания (от)
- `created_to: date-time` — Фильтр по дате создания (до)
- `company_roles: array` — Фильтр по ролям сотрудников


## Пример запроса

```bash
# Для получения следующей страницы используйте cursor из meta.paginate.next_page
curl "https://api.pachca.com/api/shared/v1/search/users?query=Олег&limit=10&sort=by_score&order=desc&created_from=2025-01-01T00:00:00.000Z&created_to=2025-02-01T00:00:00.000Z&company_roles[]=admin&company_roles[]=user" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: array of object` (required)
  - `id: integer, int32` (required) — Идентификатор пользователя. Пример: `12`
  - `first_name: string` (required, nullable, max length: 255) — Имя. Возвращается `null`, пока приглашённый сотрудник не завершил регистрацию (`invite_status` со значением `sent`). Пример: `"Олег"`
  - `last_name: string` (required, nullable, max length: 255) — Фамилия. Если не заполнена, возвращается `null` или пустая строка. Пример: `"Петров"`
  - `nickname: string` (required, max length: 255) — Имя пользователя. Пример: `"olegpetrov"`
  - `email: string` (required, nullable, max length: 255) — Электронная почта. Возвращает `null` для ботов без права просмотра персональных данных, а также при запросе данных другого пользователя ботом, для которого скрыты персональные данные сотрудников. Пример: `"olegp@example.com"`
  - `phone_number: string` (required, nullable, max length: 255) — Телефон. Возвращает `null` для ботов без права просмотра персональных данных, а также при запросе данных другого пользователя ботом, для которого скрыты персональные данные сотрудников. Пример: `"+79001234567"`
  - `department: string` (required, nullable, max length: 255) — Департамент. Если не указан, возвращается `null` или пустая строка. Пример: `"Продукт"`
  - `title: string` (required, nullable) — Должность. Если не указана, возвращается `null` или пустая строка. Пример: `"CIO"`
  - `role: string` (required) — Уровень доступа
    Значения: `admin` — Администратор, `user` — Сотрудник, `multi_guest` — Мульти-гость, `guest` — Гость
  - `suspended: boolean` (required) — Деактивация пользователя. Пример: `false`
  - `invite_status: string` (required) — Статус приглашения
    Значения: `confirmed` — Принято, `sent` — Отправлено
  - `inviter_id: integer, int32` (required, nullable) — Идентификатор сотрудника, который пригласил данного сотрудника. Возвращает `null`, если сотрудник зарегистрировался самостоятельно или если пригласивший сотрудник был удалён. Пример: `185`
  - `list_tags: array of string` (required) — Массив тегов, привязанных к сотруднику. Пример: `["Product","Design"]`
  - `custom_properties: array of object` (required) — Дополнительные поля сотрудника
    - `id: integer, int32` (required) — Идентификатор поля. Пример: `1678`
    - `name: string` (required, max length: 32) — Название поля. Пример: `"Город"`
    - `data_type: string` (required) — Тип поля
      Значения: `string` — Строковое значение, `number` — Числовое значение, `date` — Дата, `link` — Ссылка
    - `value: string` (required, nullable, max length: 768) — Значение. Возвращается `null`, если поле не заполнено. Число передаётся строкой, дата — в формате ISO 8601. Пример: `"Санкт-Петербург"`
  - `user_status: object` (required) — Статус. `null`, если у сотрудника не установлен статус.
    - `emoji: string` (required) — Emoji символ статуса. Пример: `"🎮"`
    - `title: string` (required, max length: 50) — Текст статуса. Пример: `"Очень занят"`
    - `expires_at: date-time` (required, nullable) — Срок жизни статуса (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null`, если срок не задан — такой статус не сбрасывается автоматически. Пример: `"2024-04-08T10:00:00.000Z"`
    - `is_away: boolean` (required) — Режим «Нет на месте». Пример: `false`
    - `away_message: object` (required, nullable) — Сообщение при режиме «Нет на месте». Отображается в профиле пользователя, а также при отправке ему личного сообщения или упоминании в чате. `null`, если текст автоответа не задан.
      - `text: string` (required, max length: 1024) — Текст сообщения. Пример: `"Я в отпуске до 15 апреля. По срочным вопросам обращайтесь к @ivanov."`
  - `bot: boolean` (required) — Является ботом. Пример: `false`
  - `sso: boolean` (required) — Использует ли пользователь SSO. Пример: `false`
  - `created_at: date-time` (required) — Дата создания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2020-06-08T09:32:57.000Z"`
  - `last_activity_at: date-time` (required, nullable) — Дата последней активности пользователя (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null`, если сотрудник ещё ни разу не заходил в Пачку — в этом случае `invite_status` возвращает `sent`. Пример: `"2025-01-20T13:40:07.000Z"`
  - `time_zone: string` (required, nullable, max length: 32) — Часовой пояс пользователя. `null`, если сотрудник не задал личный часовой пояс — тогда применяется часовой пояс компании. Пример: `"Europe/Moscow"`
  - `image_url: string` (required, nullable) — Ссылка на скачивание аватарки пользователя. `null`, если аватарка не загружена. Пример: `"https://app.pachca.com/users/12/photo.jpg"`
- `meta: object` (required) — Мета-информация для пагинации поисковых результатов
  - `total: integer, int32` (required) — Общее количество найденных результатов. Пример: `42`
  - `paginate: object` (required) — Вспомогательная информация
    - `next_page: string` (required) — Курсор пагинации следующей страницы. Пример: `"eyJxZCO2MiwiZGlyIjomSNYjIn3"`

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
    "total": 42,
    "paginate": {
      "next_page": "eyJxZCO2MiwiZGlyIjomSNYjIn3"
    }
  }
}
```

### 400: The server could not understand the request due to invalid syntax.

**Схема ответа при ошибке:**

- `errors: array of object` (required) — Массив ошибок
  - `key: string` (required) — Ключ поля с ошибкой. Пример: `"field.name"`
  - `value: string` (required, nullable) — Значение поля, которое вызвало ошибку. `null`, если ошибка не относится к конкретному значению. Пример: `"invalid_value"`
  - `message: string` (required) — Сообщение об ошибке. Пример: `"Поле не может быть пустым"`
  - `code: string` (required) — Код ошибки
    Значения: `blank` — Обязательное поле (не может быть пустым), `too_long` — Слишком длинное значение (пояснения вы получите в поле message), `invalid` — Поле не соответствует правилам (пояснения вы получите в поле message), `inclusion` — Поле имеет непредусмотренное значение, `exclusion` — Поле имеет недопустимое значение, `taken` — Название для этого поля уже существует, `wrong_emoji` — Emoji статуса не может содержать значения отличные от Emoji символа, `not_found` — Объект не найден, `already_exists` — Объект с такими данными уже есть. Конфликтующее поле приходит в key, если его удалось определить, `personal_chat` — Ошибка личного чата (пояснения вы получите в поле message), `displayed_error` — Отображаемая ошибка (пояснения вы получите в поле message), `not_authorized` — Действие запрещено, `invalid_date_range` — Выбран слишком большой диапазон дат, `invalid_webhook_url` — Некорректный URL вебхука, `rate_limit` — Достигнут лимит запросов, `licenses_limit` — Превышен лимит активных сотрудников (пояснения вы получите в поле message), `user_limit` — Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций), `unique_limit` — Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций), `general_limit` — Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций), `unhandled` — Ошибка выполнения запроса (пояснения вы получите в поле message), `trigger_not_found` — Не удалось найти идентификатор события, `trigger_expired` — Время жизни идентификатора события истекло, `required` — Обязательный параметр не передан, `in` — Недопустимое значение (не входит в список допустимых), `not_applicable` — Значение неприменимо в данном контексте (пояснения вы получите в поле message), `self_update` — Нельзя изменить свои собственные данные, `owner_protected` — Нельзя изменить данные владельца, `already_assigned` — Значение уже назначено, `forbidden` — Недостаточно прав для выполнения действия (пояснения вы получите в поле message), `permission_denied` — Доступ запрещён (недостаточно прав), `access_denied` — Доступ запрещён, `wrong_params` — Некорректные параметры запроса (пояснения вы получите в поле message), `payment_required` — Требуется оплата, `min_length` — Значение слишком короткое (пояснения вы получите в поле message), `max_length` — Значение слишком длинное (пояснения вы получите в поле message), `use_of_system_words` — Использовано зарезервированное системное слово (here, all), `export_file_not_found` — Файл экспорта не найден или ещё не готов, `cannot_kick_owner` — Нельзя исключить владельца чата, `pin_failed` — Не удалось закрепить сообщение, `message_deleted` — Сообщение удалено, `thread_message` — Нельзя создать тред для сообщения, которое уже находится в треде
  - `payload: Record<string, object>` (required, nullable) — Дополнительные данные об ошибке. Содержимое зависит от кода ошибки: `{id: number}` — при ошибке кастомного свойства (идентификатор свойства), `{record: {type: string, id: number}, query: string}` — при ошибке авторизации. В большинстве случаев `null`. Пример: `null`
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
  - `value: string` (required, nullable) — Значение поля, которое вызвало ошибку. `null`, если ошибка не относится к конкретному значению. Пример: `"invalid_value"`
  - `message: string` (required) — Сообщение об ошибке. Пример: `"Поле не может быть пустым"`
  - `code: string` (required) — Код ошибки
    Значения: `blank` — Обязательное поле (не может быть пустым), `too_long` — Слишком длинное значение (пояснения вы получите в поле message), `invalid` — Поле не соответствует правилам (пояснения вы получите в поле message), `inclusion` — Поле имеет непредусмотренное значение, `exclusion` — Поле имеет недопустимое значение, `taken` — Название для этого поля уже существует, `wrong_emoji` — Emoji статуса не может содержать значения отличные от Emoji символа, `not_found` — Объект не найден, `already_exists` — Объект с такими данными уже есть. Конфликтующее поле приходит в key, если его удалось определить, `personal_chat` — Ошибка личного чата (пояснения вы получите в поле message), `displayed_error` — Отображаемая ошибка (пояснения вы получите в поле message), `not_authorized` — Действие запрещено, `invalid_date_range` — Выбран слишком большой диапазон дат, `invalid_webhook_url` — Некорректный URL вебхука, `rate_limit` — Достигнут лимит запросов, `licenses_limit` — Превышен лимит активных сотрудников (пояснения вы получите в поле message), `user_limit` — Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций), `unique_limit` — Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций), `general_limit` — Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций), `unhandled` — Ошибка выполнения запроса (пояснения вы получите в поле message), `trigger_not_found` — Не удалось найти идентификатор события, `trigger_expired` — Время жизни идентификатора события истекло, `required` — Обязательный параметр не передан, `in` — Недопустимое значение (не входит в список допустимых), `not_applicable` — Значение неприменимо в данном контексте (пояснения вы получите в поле message), `self_update` — Нельзя изменить свои собственные данные, `owner_protected` — Нельзя изменить данные владельца, `already_assigned` — Значение уже назначено, `forbidden` — Недостаточно прав для выполнения действия (пояснения вы получите в поле message), `permission_denied` — Доступ запрещён (недостаточно прав), `access_denied` — Доступ запрещён, `wrong_params` — Некорректные параметры запроса (пояснения вы получите в поле message), `payment_required` — Требуется оплата, `min_length` — Значение слишком короткое (пояснения вы получите в поле message), `max_length` — Значение слишком длинное (пояснения вы получите в поле message), `use_of_system_words` — Использовано зарезервированное системное слово (here, all), `export_file_not_found` — Файл экспорта не найден или ещё не готов, `cannot_kick_owner` — Нельзя исключить владельца чата, `pin_failed` — Не удалось закрепить сообщение, `message_deleted` — Сообщение удалено, `thread_message` — Нельзя создать тред для сообщения, которое уже находится в треде
  - `payload: Record<string, object>` (required, nullable) — Дополнительные данные об ошибке. Содержимое зависит от кода ошибки: `{id: number}` — при ошибке кастомного свойства (идентификатор свойства), `{record: {type: string, id: number}, query: string}` — при ошибке авторизации. В большинстве случаев `null`. Пример: `null`
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

