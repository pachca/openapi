> Расположение: Методы API → Чаты
> Краткое содержание: Меняет название беседы или канала и его доступность
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Редактирование чата

**Метод**: `PUT`

**Путь**: `/chats/{id}`

> **Скоуп:** `chats:update`

Меняет название беседы или канала и его доступность. Оба изменения видны участникам системным сообщением в ленте чата.

Личный чат переименовать нельзя, архивный — тоже: сначала верните его из архива методом [Разархивация чата](/api/chats/unarchive). В закрытом чате метод доступен владельцу и администратору чата, в открытом — любому сотруднику пространства, даже не участнику.

Состав участников этим методом не меняется, для него есть [Добавление участников](/api/members/add) и [Исключение участника](/api/members/remove).

Аватар ставят и убирают отдельные методы [Загрузка аватара чата](/api/chats/update-avatar) и [Удаление аватара чата](/api/chats/remove-avatar).

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор чата


## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `chat: object` (required) — Собранный объект параметров обновляемого чата
  - `name: string` (max length: 255) — Название. Пример: `"Бассейн"`
  - `public: boolean` — Открытый доступ. Пример: `true`

### Пример

```json
{
  "chat": {
    "name": "Бассейн",
    "public": true
  }
}
```

## Пример запроса

```bash
curl -X PUT "https://api.pachca.com/api/shared/v1/chats/334" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "chat": {
    "name": "Бассейн",
    "public": true
  }
}'
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: object` (required) — Чат
  - `id: integer, int32` (required) — Идентификатор созданного чата. Пример: `334`
  - `name: string` (required, max length: 255) — Название. Пример: `"🤿 aqua"`
  - `created_at: date-time` (required) — Дата и время создания чата (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2021-08-28T15:56:53.000Z"`
  - `owner_id: integer, int32` (required) — Идентификатор пользователя, создавшего чат. Пример: `185`
  - `member_ids: array of integer` (required) — Массив идентификаторов пользователей, участников. Пример: `[185,186,187]`
  - `group_tag_ids: array of integer` (required) — Массив идентификаторов тегов, участников. Пример: `[9111]`
  - `channel: boolean` (required) — Является каналом. Пример: `true`
  - `archived: boolean` (required) — Находится в архиве. Пример: `false`
  - `personal: boolean` (required) — Является личным чатом. Пример: `false`
  - `public: boolean` (required) — Открытый доступ. Пример: `false`
  - `last_message_at: date-time` (required) — Дата и время создания последнего сообщения в чате (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2021-08-28T15:56:53.000Z"`
  - `meet_room_url: string` (required) — Ссылка на Видеочат. Пример: `"https://meet.pachca.com/aqua-94bb21b5"`
  - `avatar_url: string` (required, nullable) — Ссылка на аватар чата. `null`, если аватар не задан. Пример: `"https://files.example.com/uploads/0001/0001/image.jpg"`

**Пример ответа:**

```json
{
  "data": {
    "id": 334,
    "name": "🤿 aqua",
    "created_at": "2021-08-28T15:56:53.000Z",
    "owner_id": 185,
    "member_ids": [
      185,
      186,
      187
    ],
    "group_tag_ids": [
      9111
    ],
    "channel": true,
    "archived": false,
    "personal": false,
    "public": false,
    "last_message_at": "2021-08-28T15:56:53.000Z",
    "meet_room_url": "https://meet.pachca.com/aqua-94bb21b5",
    "avatar_url": "https://files.example.com/uploads/0001/0001/image.jpg"
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

