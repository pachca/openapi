> Расположение: Методы API → Профиль и статус
> Краткое содержание: Ставит или заменяет аватар владельца токена
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Загрузка своего аватара

**Метод**: `PUT`

**Путь**: `/profile/avatar`

> **Скоуп:** `profile_avatar:write`

Ставит или заменяет аватар владельца токена. Файл передаётся в формате `multipart/form-data`, в ответе приходит только ссылка на новое изображение.

Принимаются `jpg`, `jpeg`, `png` и `gif`, причём анимированный `gif` — не больше 2 МБ. Картинка уменьшается до 1024 на 1024 пикселя, а непрозрачный `png` сохраняется как `jpg`.

Аватар другого сотрудника ставит [Загрузка аватара сотрудника](/api/users/update-avatar), и это доступно только владельцу пространства и администратору.

## Тело запроса

**Обязательно**

Формат: `multipart/form-data`

### Схема

- `image: binary` (required) — Файл изображения для аватара


## Пример запроса

```bash
curl -X PUT "https://api.pachca.com/api/shared/v1/profile/avatar" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F 'image=@filename.png'
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: object` (required) — Данные аватара
  - `image_url: string` (required) — URL аватара. Пример: `"https://files.example.com/uploads/0001/0001/image.jpg"`

**Пример ответа:**

```json
{
  "data": {
    "image_url": "https://files.example.com/uploads/0001/0001/image.jpg"
  }
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

