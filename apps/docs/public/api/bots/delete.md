> Расположение: Методы API → Боты и Webhook
> Краткое содержание: Убирает бота из пространства насовсем
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Удаление бота

**Метод**: `DELETE`

**Путь**: `/bots/{id}`

> **Скоуп:** `bots:write`

Убирает бота из пространства насовсем. Все токены бота сразу перестают работать, как и авторизации, выданные ему сотрудниками. Бот исключается из всех чатов, его вебхуки удаляются, страница в витрине тоже.

Удаление доступно создателю бота, а также администратору пространства, если настройки бота открывают администраторам доступ к редактированию. Владельцы и администраторы чатов удалять бота не могут, даже если им разрешено его редактировать.

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор бота


## Пример запроса

```bash
curl -X DELETE "https://api.pachca.com/api/shared/v1/bots/1738816" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
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

