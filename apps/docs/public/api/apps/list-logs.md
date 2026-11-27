> Расположение: Методы API → Кастомные приложения
> Краткое содержание: Метод доступен владельцу и администраторам пространства
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Журнал приложения

**Метод**: `GET`

**Путь**: `/apps/{id}/logs`

> **Скоуп:** `apps:read`

Что делало приложение на платформе: ошибки функций, запросы в сеть и к API Пачки, вызовы вебхуков, нарушения ограничений фронта. Видно, что платформа разрешила и что заблокировала. Новые записи первыми.

Журнал хранится в памяти платформы, последние 200 записей. После её перезапуска он пуст.

Метод доступен владельцу и администраторам пространства. Раздел «Кастомные приложения» доступен пространствам из бета-программы, записаться можно на https://pachca.com/custom-apps.

## Параметры

### Path параметры

- `id: string` (required) — Идентификатор приложения

### Query параметры

- `n: integer, int32` (default: 50) — Сколько записей вернуть. Целое число вне допустимых значений заменяется ближайшей границей.


## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/apps/k3x9q2m7a1bz/logs?n=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: array of object` (required)
  - `time: date-time` (required) — Время записи (ISO-8601, UTC+0). Пример: `"2026-11-20T10:31:00.000Z"`
  - `kind: string` (required) — Вид записи
    Значения: `function` — Вызов функции приложения закончился ошибкой, `fetch` — Запрос функции во внешнюю сеть, `pachca` — Запрос к API Пачки, `webhook` — Вызов вебхука приложения, `csp` — Фронт приложения нарушил ограничения браузера
  - `text: string` (required) — Что делало приложение: функция, адрес запроса или операция API Пачки. Пример: `"GET https://api.example.com/rates"`
  - `allowed: boolean` (required) — Платформа разрешила действие и оно прошло. У `function` всегда `false`: записи есть только об ошибках. Пример: `true`
  - `reason: string` — Причина отказа, код ответа или начало ответа с ошибкой. Пример: `"200"`

**Пример ответа:**

```json
{
  "data": [
    {
      "time": "2026-11-20T10:31:00.000Z",
      "kind": "fetch",
      "text": "GET https://api.example.com/rates",
      "allowed": true,
      "reason": "200"
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

### 502: Server error

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

### 503: Service unavailable.

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

