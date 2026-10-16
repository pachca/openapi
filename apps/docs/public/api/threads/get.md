> Расположение: Методы API → Треды
> Краткое содержание: Идентификаторы треда и сообщения, под которым он висит
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Информация о треде

**Метод**: `GET`

**Путь**: `/threads/{id}`

> **Скоуп:** `threads:read`

Идентификаторы треда и сообщения, под которым он висит. По `id` в тред пишут методом [Новое сообщение](/api/messages/create) с `entity_type: "thread"`, а по `chat_id` читают его сообщения. У самостоятельного треда `message_id` и `message_chat_id` приходят как `null`.

В ответе только идентификаторы: названия и счётчика сообщений у треда нет, о чём он — видно по переписке внутри. Сообщения треда читаются методом [Список сообщений чата](/api/messages/list), а состав участников — методом [Список участников чата](/api/members/list), оба по `chat_id` треда.

Доступ к треду шире, чем выдача метода [Список тредов](/api/threads/list): тред, который открывается по `id`, в списке может и не появиться.

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор треда


## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/threads/265142" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: object` (required) — Тред
  - `id: integer, int64` (required) — Идентификатор треда. Чтобы написать в тред, передайте его в `entity_id` метода [Новое сообщение](/api/messages/create) с `entity_type: "thread"`. Пример: `265142`
  - `chat_id: integer, int64` (required) — Идентификатор чата треда. По нему читают сообщения треда методом [Список сообщений чата](/api/messages/list) и работают с его участниками. Пример: `2637266155`
  - `message_id: integer, int64` (required, nullable) — Идентификатор сообщения, к которому был создан тред. `null` для самостоятельного треда, созданного без привязки к сообщению. Пример: `154332686`
  - `message_chat_id: integer, int64` (required, nullable) — Идентификатор чата сообщения. `null` для самостоятельного треда, созданного без привязки к сообщению. Пример: `2637266154`
  - `updated_at: date-time` (required) — Дата и время обновления треда (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2023-02-01T19:20:47.204Z"`

**Пример ответа:**

```json
{
  "data": {
    "id": 265142,
    "chat_id": 2637266155,
    "message_id": 154332686,
    "message_chat_id": 2637266154,
    "updated_at": "2023-02-01T19:20:47.204Z"
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

