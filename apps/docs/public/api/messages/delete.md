> Расположение: Методы API → Сообщения
> Краткое содержание: Удаление сообщения доступно отправителю, админам и редакторам в чате
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Удаление сообщения

**Метод**: `DELETE`

**Путь**: `/messages/{id}`

> **Скоуп:** `messages:delete`

Удаление сообщения доступно отправителю, админам и редакторам в чате. В личных сообщениях оба пользователя являются редакторами. Ограничений по давности отправки сообщения нет.

Текст, файлы и реакции пропадают у всех и не восстанавливаются, закрепление снимается, а в переписке на месте сообщения остаётся пометка «Сообщение удалено».

Тред, заведённый под этим сообщением, остаётся вместе со всей перепиской в нём. На уже удалённое сообщение метод отвечает `403`, а удалено ли оно, видно по полю `deleted_at` в ответе метода [Информация о сообщении](/api/messages/get).

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор сообщения


## Пример запроса

```bash
curl -X DELETE "https://api.pachca.com/api/shared/v1/messages/194275" \
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

