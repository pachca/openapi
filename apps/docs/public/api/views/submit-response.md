> Расположение: Методы API → Формы
> Краткое содержание: Закрывает форму сотруднику или показывает ему ошибки под полями
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Ответ на отправку формы

**Метод**: `POST`

**Путь**: `/views/{view_id}/submit_response`

> **Скоуп:** `views:write`

Закрывает форму сотруднику или показывает ему ошибки под полями. Метод нужен боту, у которого не задан адрес исходящего вебхука: отвечать на вебхук такому боту некуда, и событие `view_submit` он получает из метода [История событий](/api/bots/list-events). Если адрес вебхука задан, отвечайте прямо на вебхук — это проще и не требует опроса журнала.

Идентификаторы `view_id` и `submit_id` приходят в теле события. Ответить нужно в течение 5 секунд с момента отправки формы, иначе сотрудник увидит ошибку отправки, а значения полей сохранятся для повторной попытки.

Тело без поля `errors` закрывает форму как успешно отправленную, с полем `errors` — показывает текст ошибки под каждым названным полем.

Ответ принимается один раз. Повторный вызов с той же парой `view_id` и `submit_id`, как и опоздавший, получает `410` с кодом `submit_expired`.

## Параметры

### Path параметры

- `view_id: string` (required) — Идентификатор представления


## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `submit_id: string` (required) — Идентификатор отправки формы из вебхука `view_submit`. Пример: `"791a056b-006c-49dd-834b-c633fde52fe8"`
- `errors: Record<string, object>` — Ошибки заполнения полей. Ключ — `name` блока, значение — текст ошибки под полем. Без этого поля представление закрывается как успешно отправленное. Пример: `{"date_end":"Дата окончания отпуска не может быть меньше даты начала"}`
  **Структура значений Record:**
  - Тип значения: `string`

### Пример

```json
{
  "submit_id": "791a056b-006c-49dd-834b-c633fde52fe8",
  "errors": {
    "date_end": "Дата окончания отпуска не может быть меньше даты начала"
  }
}
```

## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/views/01KAJZ2XDSS2S3DSW9EXJZ0TBV/submit_response" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "submit_id": "791a056b-006c-49dd-834b-c633fde52fe8",
  "errors": {
    "date_end": "Дата окончания отпуска не может быть меньше даты начала"
  }
}'
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `success: boolean` (required) — Признак успешной обработки. Пример: `true`

**Пример ответа:**

```json
{
  "success": true
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

### 410: Client error

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

