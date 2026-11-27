> Расположение: Методы API → Кастомные приложения
> Краткое содержание: Метод доступен владельцу и администраторам пространства
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Задание секрета приложения

**Метод**: `PUT`

**Путь**: `/apps/{id}/secrets/{name}`

> **Скоуп:** `apps:write`

Создаёт или заменяет секрет. Секрет объявляет манифест приложения: ключ внешнего сервиса платформа сама добавляет в запросы функций к его хосту, а секретом подписи проверяет вызовы вебхука. Код приложения значения не видит.

Имя не из `[A-Z][A-Z0-9_]`, длиннее 64 символов или значение больше 4 КБ отвечает `422` с кодом `invalid`.

Метод доступен владельцу и администраторам пространства. Раздел «Кастомные приложения» доступен пространствам из бета-программы, записаться можно на https://pachca.com/custom-apps.

## Параметры

### Path параметры

- `id: string` (required) — Идентификатор приложения
- `name: string` (required) — Имя секрета


## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `value: string` (required) — Значение секрета, до 4 КБ. Пример: `"sk_live_51Hx"`

### Пример

```json
{
  "value": "sk_live_51Hx"
}
```

## Пример запроса

```bash
curl -X PUT "https://api.pachca.com/api/shared/v1/apps/k3x9q2m7a1bz/secrets/API_KEY" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "value": "sk_live_51Hx"
}'
```

## Ответы

### 204: There is no content to send for this request, but the headers may be useful. 

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

