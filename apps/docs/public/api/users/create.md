> Расположение: Методы API → Сотрудники
> Краткое содержание: Заводит сотрудника в пространстве и отправляет ему приглашение на почту
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Новый сотрудник

**Метод**: `POST`

**Путь**: `/users`

> **Скоуп:** `users:create`

Заводит сотрудника в пространстве и отправляет ему приглашение на почту. Доступно владельцу пространства и администратору, боту метод недоступен.

Если сотрудник с этим адресом уже есть в пространстве, метод отвечает `409`. Занятый ник ошибкой не считается: к нему молча дописываются случайные символы, и в ответе приходит уже изменённый.

Бесплатное пространство, в том числе на пробном периоде, может отправить за сутки ограниченное число писем: приглашения и письма о смене почты считаются вместе, а предел указан на странице [Лимиты](/api/limits). Сверх него метод отвечает `422` с кодом `daily_invites_limit` и сотрудника не заводит, а остаток и время сброса приходят в `payload`. С `skip_email_notify: true` письмо не отправляется и в лимит не идёт.

Вы можете заполнять дополнительные поля сотрудника, которые созданы в вашей компании. Получить актуальный список идентификаторов дополнительных полей сотрудника вы можете в методе [Список дополнительных полей](/api/custom-properties/list).

Поле `list_tags` сразу заводит сотрудника в теги, а вместе с тегами — и в чаты, к которым эти теги привязаны. Имя, которого в пространстве ещё нет, создаёт новый тег. У гостя теги не назначаются вовсе: ответ приходит успешный, а `list_tags` в нём пустой.

Через параметр `chat_ids` сотрудника можно сразу добавить в указанные чаты. Чтобы создать гостя, передайте `role: "guest"` — для этой роли `chat_ids` обязателен и должен содержать ровно один активный чат, в который у токена есть право добавлять участников. При нарушении правил гостевого доступа возвращается `400` с ошибкой по полю `chat_ids`.

Аватар сотруднику ставят после создания методом [Загрузка аватара сотрудника](/api/users/update-avatar).

## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `user: object` (required)
  - `first_name: string` (max length: 255) — Имя. Пример: `"Олег"`
  - `last_name: string` (max length: 255) — Фамилия. Пример: `"Петров"`
  - `email: string` (required, max length: 255) — Электронная почта. Пример: `"olegp@example.com"`
  - `phone_number: string` (max length: 255) — Телефон. Пример: `"+79001234567"`
  - `nickname: string` (max length: 255) — Имя пользователя. Пример: `"olegpetrov"`
  - `department: string` (max length: 255) — Департамент. Пример: `"Продукт"`
  - `title: string` — Должность. Пример: `"CIO"`
  - `role: string` — Уровень доступа
    Значения: `admin` — Администратор, `user` — Сотрудник, `multi_guest` — Мульти-гость, `guest` — Гость
  - `suspended: boolean` (default: false) — Деактивация пользователя. Пример: `false`
  - `list_tags: array of string` — Массив названий тегов, привязываемых к сотруднику. Значение, которое не является массивом непустых строк, игнорируется. Пример: `["Product","Design"]`
  - `chat_ids: array of integer` — Идентификаторы чатов, в которые сотрудник будет добавлен сразу при создании. Для роли `guest` параметр обязателен и должен содержать ровно один активный чат. Пример: `[12345]`
  - `custom_properties: array of object` — Задаваемые дополнительные поля
    - `id: integer, int32` (required) — Идентификатор поля. Пример: `1678`
    - `value: string` (required, max length: 768) — Устанавливаемое значение. Пример: `"Санкт-Петербург"`
- `skip_email_notify: boolean` (default: false) — Пропуск этапа отправки приглашения сотруднику. Сотруднику не будет отправлено письмо на электронную почту с приглашением создать аккаунт. Полезно при предварительном создании аккаунтов перед входом через SSO. Пример: `false`

### Пример

```json
{
  "user": {
    "first_name": "Олег",
    "last_name": "Петров",
    "email": "olegp@example.com",
    "phone_number": "+79001234567",
    "nickname": "olegpetrov",
    "department": "Продукт",
    "title": "CIO",
    "role": "user",
    "list_tags": [
      "Product",
      "Design"
    ],
    "chat_ids": [
      12345
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
curl "https://api.pachca.com/api/shared/v1/users" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "user": {
    "first_name": "Олег",
    "last_name": "Петров",
    "email": "olegp@example.com",
    "phone_number": "+79001234567",
    "nickname": "olegpetrov",
    "department": "Продукт",
    "title": "CIO",
    "role": "user",
    "list_tags": [
      "Product",
      "Design"
    ],
    "chat_ids": [
      12345
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

### 201: The request has succeeded and a new resource has been created as a result.

**Схема ответа:**

- `data: object` (required) — Сотрудник
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

### 409: The request conflicts with the current state of the server.

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

### 422: Client error

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

