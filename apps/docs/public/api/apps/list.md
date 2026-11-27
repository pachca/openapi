> Расположение: Методы API → Кастомные приложения
> Краткое содержание: Метод доступен владельцу и администраторам пространства
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Список приложений

**Метод**: `GET`

**Путь**: `/apps`

> **Скоуп:** `apps:read`

Кастомные приложения пространства по порядку создания, одним списком без пагинации.


Метод доступен владельцу и администраторам пространства. Раздел «Кастомные приложения» доступен пространствам из бета-программы, записаться можно на https://pachca.com/custom-apps.

## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/apps" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: array of object` (required)
  - `id: string` (required) — Идентификатор приложения: 12 символов `[0-9a-z]`. Пример: `"k3x9q2m7a1bz"`
  - `name: string` (required) — Название приложения. Оно же имя бота приложения. Пример: `"Заметки"`
  - `icon: string` (required, nullable) — Иконка приложения: один эмодзи. `null`, пока не задана. Пример: `"📝"`
  - `bot_id: integer, int64` (required, nullable) — Идентификатор бота приложения. От его имени приложение пишет в чаты, его права задаёт манифест версии. Пример: `1738816`
  - `avatar_url: string` (required, nullable) — Аватарка приложения: это аватарка его бота. `null`, пока не задана. Пример: `null`
  - `visibility: string` (required) — Кто может открыть приложение
    Значения: `private` — Только автор приложения, `link` — Любой сотрудник пространства по ссылке, в обзоре приложений его нет, `public` — Любой сотрудник пространства по ссылке и в обзоре приложений
  - `created_by_id: integer, int64` (required, nullable) — Идентификатор сотрудника, который создал приложение. `null` у приложений, созданных до появления поля. Пример: `12`
  - `version: integer, int32` (required) — Номер текущей версии. Его выдаёт платформа приложений при каждой загрузке, `0`, пока версий нет. Пример: `3`
  - `published_hash: string` (required, nullable) — Хэш манифеста текущей версии. `null`, пока версий нет. Пример: `"9f2c4e1a7b3d"`
  - `created_at: date-time` (required) — Дата и время создания приложения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2026-11-20T10:30:00.000Z"`

**Пример ответа:**

```json
{
  "data": [
    {
      "id": "k3x9q2m7a1bz",
      "name": "Заметки",
      "icon": "📝",
      "bot_id": 1738816,
      "avatar_url": null,
      "visibility": "private",
      "created_by_id": 12,
      "version": 3,
      "published_hash": "9f2c4e1a7b3d",
      "created_at": "2026-11-20T10:30:00.000Z"
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

