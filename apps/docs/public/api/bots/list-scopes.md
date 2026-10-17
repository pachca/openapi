> Расположение: Методы API → Боты и Webhook
> Краткое содержание: Права, которые можно выдать этому боту: его токенам и авторизации от имени сотрудника
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Каталог прав бота

**Метод**: `GET`

**Путь**: `/bots/{id}/scopes`

> **Скоуп:** `bots:read`

Права, которые можно выдать этому боту: его токенам и авторизации от имени сотрудника. У каждого права есть описание, категория и готовые наборы, в которые оно входит, как при выборе прав в интерфейсе.

Каталог доступен тем же, кто видит токены бота: создателю бота, а также администратору пространства, если настройки бота открывают администраторам доступ к редактированию.

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор бота


## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/bots/1738816/scopes" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `scopes: array of object` (required) — Права, доступные боту
  - `id: string` (required) — Право. Пример: `"messages:create"`
  - `title: string` (required) — Описание права. Пример: `"Отправка сообщений"`
  - `group: string` (required) — Категория права, `id` из `groups`. Пример: `"messages"`
  - `preset: array of string` (required) — Наборы, в которые входит право, `id` из `presets`. Пример: `["admin"]`
- `groups: array of object` (required) — Категории прав
  - `id: string` (required) — Идентификатор категории. Пример: `"messages"`
  - `title: string` (required) — Название категории. Пример: `"Сообщения"`
  - `description: string` (required) — Описание категории. Пример: `"Работа с сообщениями"`
- `presets: array of object` (required) — Готовые наборы прав
  - `id: string` (required) — Идентификатор набора: `read-only` или `admin`. Пример: `"read-only"`
  - `title: string` (required) — Название набора. Пример: `"Только чтение"`

**Пример ответа:**

```json
{
  "scopes": [
    {
      "id": "messages:create",
      "title": "Отправка сообщений",
      "group": "messages",
      "preset": [
        "admin"
      ]
    }
  ],
  "groups": [
    {
      "id": "messages",
      "title": "Сообщения",
      "description": "Работа с сообщениями"
    }
  ],
  "presets": [
    {
      "id": "read-only",
      "title": "Только чтение"
    },
    {
      "id": "admin",
      "title": "Администратор"
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

