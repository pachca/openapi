> Расположение: Методы API → Кастомные приложения
> Краткое содержание: Метод доступен владельцу и администраторам пространства
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Загрузка версии

**Метод**: `POST`

**Путь**: `/apps/{id}/versions`

> **Скоуп:** `apps:write`

Загружает сборку приложения, и она сразу становится текущей версией. Сборку и запрос собирает команда `npx pachca-app ship` из папки приложения (пакет `@pachca/app-sdk`).

Платформа приложений проверяет сборку, версию SDK, изменения прав и схему базы на существующих данных. Бот приложения получает права и подписку на события из манифеста версии.

Ответ `409` ничего не загружает. Код `version_conflict`: текущая версия не `base_version`, приложение загрузили из другой папки, номер текущей версии в `payload.version`. Код `consent_required`: права, хосты или события изменились, а `approve` не передан, список изменений в `payload.items`. Код `invalid` у `409` и `422`: платформа отклонила сборку или изменение схемы, причина в `message`. Тело больше 32 МБ отвечает `413` с кодом `too_long`.

Метод доступен владельцу и администраторам пространства. Раздел «Кастомные приложения» доступен пространствам из бета-программы, записаться можно на https://pachca.com/custom-apps.

## Параметры

### Path параметры

- `id: string` (required) — Идентификатор приложения


## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `code: string` (required) — Код функций приложения (`dist/app.js`). Пример: `"export default {};"`
- `manifest: Record<string, object>` (required) — Манифест сборки (`dist/manifest.json`): права, хосты, вебхуки, версии протокола и SDK. Пример: `{"protocol":3,"sdk":"2026.12.0"}`
  **Структура значений Record:**
  - Тип значения: `any`
- `schema: Record<string, object>` (required) — Схема базы (`dist/schema.json`). Пример: `{"tables":{}}`
  **Структура значений Record:**
  - Тип значения: `any`
- `functions: Record<string, object>` (required) — Описания функций (`dist/functions.json`). Пример: `{}`
  **Структура значений Record:**
  - Тип значения: `any`
- `static: Record<string, object>` (required) — Статика фронта (`dist/static`): относительный путь и содержимое в base64. Пример: `{"index.html":"PCFkb2N0eXBlIGh0bWw+"}`
  **Структура значений Record:**
  - Тип значения: `string`
- `source: Record<string, object>` — Исходники папки приложения: относительный путь и содержимое в base64, до 5 МБ. Платформа хранит их с версией и отдаёт методом [Исходники приложения](/api/apps/get-source). Пример: `{"schema.ts":"aW1wb3J0IHsgZGVmaW5lU2NoZW1hIH0="}`
  **Структура значений Record:**
  - Тип значения: `string`
- `base_version: integer, int32` (required, min: 0) — Номер версии, от которой сделана загрузка, `0` у первой. Пример: `2`
- `approve: boolean` — Человек видел и подтвердил изменения прав, хостов и событий. Пример: `false`
- `force: boolean` — Загрузить, даже если текущая версия не `base_version`. Изменения из другой папки пропадут. Пример: `false`

### Пример

```json
{
  "code": "export default {};",
  "manifest": {
    "protocol": 3,
    "sdk": "2026.12.0"
  },
  "schema": {
    "tables": {}
  },
  "functions": {},
  "static": {
    "index.html": "PCFkb2N0eXBlIGh0bWw+"
  },
  "source": {
    "schema.ts": "aW1wb3J0IHsgZGVmaW5lU2NoZW1hIH0="
  },
  "base_version": 2,
  "approve": false,
  "force": false
}
```

## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/apps/k3x9q2m7a1bz/versions" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "code": "export default {};",
  "manifest": {
    "protocol": 3,
    "sdk": "2026.12.0"
  },
  "schema": {
    "tables": {}
  },
  "functions": {},
  "static": {
    "index.html": "PCFkb2N0eXBlIGh0bWw+"
  },
  "source": {
    "schema.ts": "aW1wb3J0IHsgZGVmaW5lU2NoZW1hIH0="
  },
  "base_version": 2,
  "approve": false,
  "force": false
}'
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: object` (required) — Загруженная версия: она уже текущая
  - `version: integer, int32` (required) — Номер новой текущей версии. Пример: `3`
  - `hash: string` (required) — Хэш манифеста версии. Пример: `"9f2c4e1a7b3d"`
  - `items: array of object` (required) — Права, хосты и события версии с пометками относительно прежней
    - `kind: string` (required) — Вид записи
      Значения: `bot` — Право бота приложения, `user` — Право от имени пользователя, `event` — Событие Пачки, на которое подписан бот, `net` — Сеть: хост запросов, хост фронта, вебхук или ключ внешнего сервиса, `warn` — Предупреждение, например об опасной комбинации прав
    - `text: string` (required) — Описание для человека. Пример: `"Отправка сообщений"`
    - `scope: string` — Скоуп, хост или событие. Пример: `"messages:create"`
    - `new: boolean` — Появилось в этой версии. Пример: `true`
    - `removed: boolean` — Было в прежней версии, в этой нет. Пример: `false`
  - `migrations: array of string` (required) — Что изменилось в базе приложения, строки для показа человеку. Пусто, если схема не менялась. Пример: `["Таблица notes создана"]`
  - `warnings: array of string` (required) — Предупреждения автору, например о сборке на устаревающей версии протокола. Пример: `[]`

**Пример ответа:**

```json
{
  "data": {
    "version": 3,
    "hash": "9f2c4e1a7b3d",
    "items": [
      {
        "kind": "bot",
        "text": "Отправка сообщений",
        "scope": "messages:create",
        "new": true,
        "removed": false
      }
    ],
    "migrations": [
      "Таблица notes создана"
    ],
    "warnings": []
  }
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

### 409: The request conflicts with the current state of the server.

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

### 413: Client error

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

