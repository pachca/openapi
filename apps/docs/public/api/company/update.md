> Расположение: Методы API → Пространство
> Краткое содержание: Метод доступен владельцу и администраторам пространства
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Редактирование пространства

**Метод**: `PUT`

**Путь**: `/company`

> **Скоуп:** `company:write`

Меняет название пространства, показ личных данных и сквозные треды. Поля передаются без обёртки, перезаписываются только переданные. В ответе приходит пространство целиком, как в методе [Информация о пространстве](/api/company/get).

Метод доступен владельцу и администраторам пространства. Слишком длинное название отклоняется с `422` и кодом `too_long`, а название, похожее на спам, с `422` и кодом `invalid`. Ключ ошибки в обоих случаях `company.name`.

Кто может создавать персональные токены и интеграции, метод не меняет.

## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `name: string` (max length: 255) — Новое название пространства. Пример: `"Синий склад"`
- `show_personal_data: boolean` — Видят ли сотрудники и боты `email` и `phone_number` коллег. Пример: `false`
- `use_global_threads: boolean` — Включена ли настройка «Использовать сквозные треды». Пример: `true`

### Пример

```json
{
  "name": "Синий склад",
  "show_personal_data": false,
  "use_global_threads": true
}
```

## Пример запроса

```bash
curl -X PUT "https://api.pachca.com/api/shared/v1/company" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "name": "Синий склад",
  "show_personal_data": false,
  "use_global_threads": true
}'
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: object` (required) — Пространство
  - `id: integer, int32` (required) — Идентификатор пространства. Пример: `4372`
  - `name: string` (required) — Название пространства. Пример: `"Синий склад"`
  - `owner_id: integer, int32` (required) — Идентификатор владельца пространства. Пример: `185`
  - `show_personal_data: boolean` (required) — Видят ли сотрудники и боты `email` и `phone_number` коллег. Владелец и администраторы видят их всегда, гости и мульти-гости не видят. Пример: `true`
  - `use_global_threads: boolean` (required) — Настройка «Использовать сквозные треды»: с `true` упоминание в треде добавляет в него и сотрудника, которого нет в родительском чате. Пример: `true`
  - `integrations_management: string` (required) — Кому доступен раздел интеграций, в том числе создание ботов и их токенов. Меняется только в интерфейсе.
    Значения: `all` — Все сотрудники, `admins` — Только администраторы
  - `api_management: string` (required) — Кто может создавать персональные токены. С `admins` остальные сотрудники не создают токены и не входят через браузер и CLI. Меняется только в интерфейсе.
    Значения: `all` — Все сотрудники, `admins` — Только администраторы
  - `plan: string` (required) — Название тарифа текстом, как в интерфейсе. Пример: `"Корпорация"`
  - `export_personal_chats: boolean` — Выгружаются ли личные переписки с текстом и тредами в [экспорт сообщений](/guides/export). Приходит только владельцу пространства. Пример: `false`

**Пример ответа:**

```json
{
  "data": {
    "id": 4372,
    "name": "Синий склад",
    "owner_id": 185,
    "show_personal_data": true,
    "use_global_threads": true,
    "integrations_management": "all",
    "api_management": "admins",
    "plan": "Корпорация",
    "export_personal_chats": false
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

