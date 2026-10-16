> Расположение: Методы API → Сотрудники
> Краткое содержание: Меняет карточку сотрудника: перезаписываются только переданные поля
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Редактирование сотрудника

**Метод**: `PUT`

**Путь**: `/users/{id}`

> **Скоуп:** `users:update`

Меняет карточку сотрудника: перезаписываются только переданные поля. Идентификаторы дополнительных полей отдаёт [Список дополнительных полей](/api/custom-properties/list).

Запрос применяется целиком: если какое-то поле не прошло проверку, например новый `email` уже занят, не меняется ничего. Смена почты отправляет письма на прежний и новый адрес. В бесплатном пространстве они идут в тот же суточный лимит, что и приглашения из метода [Новый сотрудник](/api/users/create), и сверх него ответ `422` с кодом `daily_invites_limit`.

Поле `list_tags` заменяет набор тегов целиком, поэтому присылайте вместе с новым тегом и те, что сохраняются. Снятый тег выводит сотрудника из чатов, куда его привёл этот тег, а имя, которого в пространстве ещё нет, создаёт новый тег вместе с назначением.

`suspended: true` приостанавливает сотрудника: он теряет доступ, но остаётся в чатах, тегах и задачах, а `suspended: false` возвращает его обратно. Насовсем убирает сотрудника [Удаление сотрудника](/api/users/delete).

Владельца пространства редактирует только он сам, а его роль меняется лишь на администратора. Перевести обычного сотрудника в гостя нельзя — в обоих случаях ответ `403`.

Незнакомое значение роли метод молча пропускает: ответ приходит успешный, а роль остаётся прежней.

У бота метод меняет только имя (`first_name`), ник, теги и `suspended`, остальные поля в запросе пропускает. Какой ник и какие теги можно дать боту, сказано у полей `nickname` и `list_tags`. Если настройки бота поменялись во время запроса, ответ `422` приходит с кодом `bot_changed_concurrently`: повторите запрос.

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор пользователя


## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `user: object` (required) — Собранный объект параметров редактируемого сотрудника
  - `first_name: string` (max length: 255) — Имя. Пример: `"Олег"`
  - `last_name: string` (max length: 255) — Фамилия. Пример: `"Петров"`
  - `email: string` (max length: 255) — Электронная почта. Пример: `"olegpetrov@example.com"`
  - `phone_number: string` (max length: 255) — Телефон. Пример: `"+79001234567"`
  - `nickname: string` (max length: 255) — Имя пользователя. Ник бота должен оканчиваться на `_bot` и быть уникальным в пространстве, иначе метод отвечает `422` с ошибкой на поле `nickname`: `invalid` или `already_exists`. Прежний ник бота проверяется, только когда его меняют. Пример: `"olegpetrov"`
  - `department: string` (max length: 255) — Департамент. Пример: `"Отдел разработки"`
  - `title: string` — Должность. Пример: `"Старший разработчик"`
  - `role: string` — Уровень доступа
    Значения: `admin` — Администратор, `user` — Сотрудник, `multi_guest` — Мульти-гость
  - `suspended: boolean` — Деактивация пользователя. Пример: `false`
  - `list_tags: array of string` — Массив названий тегов, привязываемых к сотруднику. Список заменяет прежний целиком, пустой снимает все теги. Значение, которое не является массивом непустых строк, игнорируется: теги сотрудника не меняются. В тег можно добавить только бота, которого может добавить в чат любой сотрудник и у которого выключена настройка «Ограничить одним чатом». Если бот этим условиям не отвечает, а в списке есть тег, которого у него ещё нет, метод отвечает `422` на поле `group_tags` и ничего не меняет: с кодом `single_chat_bot_tag_denied`, когда бот ограничен одним чатом, и `restricted_bot_tag_denied`, когда добавлять его в чаты могут не все. Подробнее — в разделе [Бот в тегах](/guides/bots/settings#bot-v-tegah). Пример: `["Product","Design"]`
  - `custom_properties: array of object` — Задаваемые дополнительные поля
    - `id: integer, int32` (required) — Идентификатор поля. Пример: `1678`
    - `value: string` (required, max length: 768) — Устанавливаемое значение. Пример: `"Санкт-Петербург"`

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
      "Product",
      "Design"
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
      "Product",
      "Design"
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

