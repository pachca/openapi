> Расположение: Методы API → Поиск
> Краткое содержание: Ищет сотрудников по имени и фамилии, нику, должности и отделу
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Поиск сотрудников

**Метод**: `GET`

**Путь**: `/search/users`

> **Скоуп:** `search:users`

Ищет сотрудников по имени и фамилии, нику, должности и отделу. Опечатки прощаются только в имени и фамилии, остальным полям нужно точное слово.

По почте метод ищет лишь тем, кому в пространстве видны персональные данные. По телефону он не ищет вовсе — для этого есть [Список сотрудников](/api/users/list) с параметром `query`.

Удалённые сотрудники не находятся никогда, приостановленные — только когда задан текстовый запрос, и стоят в выдаче ниже остальных. Из ботов находятся лишь публичные.

Слишком тяжёлый запрос может не уложиться по времени: тогда метод отвечает `504` с кодом `timeout`, и запрос стоит сузить.

## Параметры

### Query параметры

- `query: string` — Текст поискового запроса. Запрос длиннее 500 знаков обрезается.
- `limit: integer, int32` (default: 200) — Количество возвращаемых результатов за один запрос. Целое число вне допустимых значений заменяется ближайшей границей.
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
  - `email: string` (required, nullable, max length: 255) — Электронная почта. В чужой карточке приходит `null`, если у вызывающего нет права видеть персональные данные: у владельца пространства и администратора оно есть всегда, у сотрудника и бота — только когда в пространстве включён показ персональных данных, у гостя и мульти-гостя — никогда. В своей карточке поле приходит всегда. Пример: `"olegp@example.com"`
  - `phone_number: string` (required, nullable, max length: 255) — Телефон. В чужой карточке приходит `null`, если у вызывающего нет права видеть персональные данные: у владельца пространства и администратора оно есть всегда, у сотрудника и бота — только когда в пространстве включён показ персональных данных, у гостя и мульти-гостя — никогда. В своей карточке поле приходит всегда. Пример: `"+79001234567"`
  - `department: string` (required, nullable, max length: 255) — Департамент. Если не указан, возвращается `null` или пустая строка. Пример: `"Продукт"`
  - `title: string` (required, nullable) — Должность. Если не указана, возвращается `null` или пустая строка. Пример: `"CIO"`
  - `role: string` (required) — Уровень доступа
    Значения: `admin` — Администратор, `user` — Сотрудник, `multi_guest` — Мульти-гость, `guest` — Гость
  - `suspended: boolean` (required) — Деактивация пользователя. Пример: `false`
  - `invite_status: string` (required) — Статус приглашения
    Значения: `confirmed` — Принято, `sent` — Отправлено
  - `inviter_id: integer, int32` (required, nullable) — Идентификатор сотрудника, который пригласил данного сотрудника. Возвращает `null`, если сотрудник зарегистрировался самостоятельно или если пригласивший сотрудник был удалён. Пример: `185`
  - `list_tags: array of string` (required) — Массив тегов, привязанных к сотруднику. Мульти-гостю в чужой карточке приходит пустым. Пример: `["Product","Design"]`
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
    - `away_message: object` (required, nullable) — Сообщение при режиме «Нет на месте». Отображается в профиле пользователя, а также при отправке ему личного сообщения или упоминании в чате. `null`, если текст не задан.
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
    - `has_next: boolean` (required) — Есть ли ещё данные на следующей странице. На последней странице — `false`. Пример: `true`

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
      "next_page": "eyJxZCO2MiwiZGlyIjomSNYjIn3",
      "has_next": true
    }
  }
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

### 504: Server error

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

