> Расположение: Методы API → Напоминания
> Краткое содержание: Убирает напоминание насовсем: восстановить его нельзя, и у ответственных оно тоже пропадает
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Удаление напоминания

**Метод**: `DELETE`

**Путь**: `/tasks/{id}`

> **Скоуп:** `tasks:delete`

Убирает напоминание насовсем: восстановить его нельзя, и у ответственных оно тоже пропадает. Если напоминание уехало в подключённый календарь, событие удаляется и там, когда напоминание удаляет его автор. Если удаляет ответственный, событие может остаться в календаре автора.

Доступно автору и ответственным. Повторный вызов отвечает `404`.

Закрыть выполненное напоминание, сохранив его в списке, можно методом [Редактирование напоминания](/api/tasks/update) со `status: "done"`.

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор напоминания


## Пример запроса

```bash
curl -X DELETE "https://api.pachca.com/api/shared/v1/tasks/22283" \
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

