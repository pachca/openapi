> Расположение: Методы API → Боты и Webhook
> Краткое содержание: Метод нужен, когда токен утёк или его меняют по плану
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Перевыпуск токена бота

**Метод**: `POST`

**Путь**: `/bots/{id}/tokens/{token_id}/reissue`

> **Скоуп:** `bots:write`

Заменяет значение токена новым: прежнее сразу перестаёт работать, имя и права остаются. Новое значение приходит в ответе один раз — сохраните его сразу.

Метод нужен, когда токен утёк или его меняют по плану. Основной токен бота перевыпускает и [Ротация токена бота](/api/bots/recreate-token).

Работать с токенами бота могут только его создатель и администратор пространства, если настройки бота открывают администраторам доступ к редактированию. Владельцу чата с ботом метод отвечает `403`, даже когда остальные настройки бота ему открыты.

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор бота
- `token_id: integer, int64` (required) — Идентификатор токена


## Пример запроса

```bash
curl -X POST "https://api.pachca.com/api/shared/v1/bots/1738816/tokens/4827/reissue" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: object` (required) — Токен бота
  - `id: integer, int64` (required) — Идентификатор токена. Пример: `4827`
  - `token: string` (required) — Токен в маскированном виде (видны первые 8 и последние 4 символа). Полное значение приходит один раз: при выпуске и перевыпуске токена. Пример: `"cH5kR9mN...x7Qp"`
  - `name: string` (required, nullable) — Имя токена. `null` у токена, выпущенного без имени. Пример: `"Сервер уведомлений"`
  - `user_id: integer, int64` (required) — Идентификатор бота, которому принадлежит токен. Пример: `1738816`
  - `scopes: array of string` (required) — Права токена. Пример: `["messages:create","chats:read"]`
  - `created_at: date-time` (required) — Дата и время выпуска токена (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-01-15T10:30:00.000Z"`
  - `revoked_at: date-time` (required, nullable) — Дата отзыва токена. Всегда `null`: отозванные токены в ответ не попадают. Пример: `null`
  - `expires_in: integer, int32` (required, nullable) — Время жизни токена в секундах. У токенов бота `null`: они бессрочные. Пример: `null`
  - `last_used_at: date-time` (required, nullable) — Дата последнего использования токена. `null`, пока по токену не было ни одного запроса. Обновляется не чаще раза в минуту, поэтому может отставать. Пример: `"2025-02-24T14:20:00.000Z"`
  - `authorized_at: date-time` (required, nullable) — Дата авторизации. У токенов бота `null`. Пример: `null`

**Пример ответа:**

```json
{
  "data": {
    "id": 4827,
    "token": "bm90X2FfcmVhbF90b2tlbg",
    "name": "Сервер уведомлений",
    "user_id": 1738816,
    "scopes": [
      "messages:create",
      "chats:read"
    ],
    "created_at": "2025-01-15T10:30:00.000Z",
    "revoked_at": null,
    "expires_in": null,
    "last_used_at": "2025-02-24T14:20:00.000Z",
    "authorized_at": null
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

