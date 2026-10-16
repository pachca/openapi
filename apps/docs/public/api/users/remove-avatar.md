> Расположение: Методы API → Сотрудники
> Краткое содержание: Убирает аватар другому сотруднику, дальше в интерфейсе показываются инициалы
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Удаление аватара сотрудника

**Метод**: `DELETE`

**Путь**: `/users/{user_id}/avatar`

> **Скоуп:** `user_avatar:write`

Убирает аватар другому сотруднику, дальше в интерфейсе показываются инициалы. Доступно владельцу пространства и администратору, боту метод недоступен, а аватар владельца пространства убирает только он сам.

Если аватара не было, ответ всё равно `204`.

## Параметры

### Path параметры

- `user_id: integer, int32` (required) — Идентификатор пользователя


## Пример запроса

```bash
curl -X DELETE "https://api.pachca.com/api/shared/v1/users/12/avatar" \
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

