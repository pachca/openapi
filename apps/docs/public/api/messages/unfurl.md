> Расположение: Методы API → Сообщения
> Краткое содержание: Метод доступен только боту, у которого исходящий вебхук настроен на разворачивание ссылок
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Unfurl (разворачивание ссылок)

**Метод**: `POST`

**Путь**: `/messages/{id}/link_previews`

> **Скоуп:** `link_previews:write`

Подставляет в сообщение предпросмотр ссылки, собранный самим ботом: заголовок, описание и картинку. Так внутренние адреса компании, которые Пачка сама открыть не может, показываются в переписке карточкой.

Метод доступен только боту, у которого исходящий вебхук настроен на разворачивание ссылок. Такой бот получает событие `message_link_shared` и отвечает на него этим методом, причём состоять в чате с сообщением ему не нужно — достаточно, чтобы чат был в его пространстве.

Домен ссылки должен быть в списке разрешённых у бота, а сама ссылка — присутствовать в тексте сообщения, иначе метод ответит ошибкой. Ответ приходит пустым даже тогда, когда ни одно превью не применилось. В объекте сообщения превью нет: их видно только в приложении.

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор сообщения


## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `link_previews: Record<string, object>` (required) — `JSON` карта предпросмотров ссылок, где каждый ключ — `URL`, который был получен в исходящем вебхуке о новом сообщении
  **Структура значений Record:**
  - `title: string` (required) — Заголовок. Пример: `"Статья: Отправка файлов"`
  - `description: string` (required) — Описание. Пример: `"Пример отправки файлов на удаленный сервер"`
  - `image_url: string` — Публичная ссылка на изображение (если вы хотите загрузить файл изображения в Пачку, то используйте параметр image). Пример: `"https://example.com/img/landing.png"`
  - `image: object` — Изображение
    - `key: string` (required) — Путь к изображению, полученный в методе [Загрузка файла](/api/files/direct-url). Пример: `"attaches/files/93746/e354fd79-9jh6-f2hd-fj83-709dae24c763/${filename}"`
    - `name: string` (required) — Название изображения (рекомендуется писать вместе с расширением). Пример: `"files-to-server.jpg"`
    - `size: integer, int32` — Размер изображения в байтах. Пример: `695604`

### Пример

```json
{
  "link_previews": {
    "https://example.com/articles/123": {
      "title": "Статья: Отправка файлов",
      "description": "Пример отправки файлов на удаленный сервер",
      "image_url": "https://example.com/img/landing.png",
      "image": {
        "key": "attaches/files/93746/e354fd79-9jh6-f2hd-fj83-709dae24c763/${filename}",
        "name": "files-to-server.jpg",
        "size": 695604
      }
    }
  }
}
```

## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/messages/194275/link_previews" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "link_previews": {
    "https://example.com/articles/123": {
      "title": "Статья: Отправка файлов",
      "description": "Пример отправки файлов на удаленный сервер",
      "image_url": "https://example.com/img/landing.png",
      "image": {
        "key": "attaches/files/93746/e354fd79-9jh6-f2hd-fj83-709dae24c763/${filename}",
        "name": "files-to-server.jpg",
        "size": 695604
      }
    }
  }
}'
```

## Ответы

### 204: There is no content to send for this request, but the headers may be useful. 

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

