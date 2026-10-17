> Расположение: Методы API → Дополнительные поля
> Краткое содержание: Схема дополнительных полей пространства: идентификатор, название и тип каждого
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Список дополнительных полей

**Метод**: `GET`

**Путь**: `/custom_properties`

> **Скоуп:** `custom_properties:read`

Схема дополнительных полей пространства: идентификатор, название и тип каждого. Такие поля доступны только для сотрудников и напоминаний, наборы у них независимые, а нужный выбирает параметр `entity_type`. Значения приходят в самой сущности — в карточке сотрудника или в напоминании. Идентификаторы отсюда нужны, чтобы эти значения задавать.

Поля типов «Файл» и «Множественный выбор» через API недоступны и в выдачу не попадают. Базовые поля карточки — имя, телефон, почта, отдел, теги — тоже: это не дополнительные поля.

Набор полей задаёт администратор пространства, он же их переименовывает и удаляет. Поэтому список стоит перечитывать перед работой: обращение к полю, которого уже нет, возвращает ошибку.

## Параметры

### Query параметры

- `entity_type: string` (required) — Тип сущности
  Значения: `User`, `Task`


## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/custom_properties?entity_type=User" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: array of object` (required)
  - `id: integer, int32` (required) — Идентификатор поля. Пример: `1678`
  - `name: string` (required, max length: 32) — Название поля. Пример: `"Город"`
  - `data_type: string` (required) — Тип поля
    Значения: `string` — Строковое значение, `number` — Числовое значение, `date` — Дата, `link` — Ссылка

**Пример ответа:**

```json
{
  "data": [
    {
      "id": 1678,
      "name": "Город",
      "data_type": "string"
    }
  ]
}
```

### 400: The server could not understand the request due to invalid syntax.

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

