> Расположение: Методы API → Пространство
> Краткое содержание: Метод нужен, когда ссылка попала к посторонним или её меняют по плану
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Перевыпуск ссылки-приглашения

**Метод**: `POST`

**Путь**: `/company/invite_link`

> **Скоуп:** `invite_links:write`

Выпускает новую ссылку-приглашение владельца токена. Прежняя ссылка этого администратора сразу перестаёт работать, в том числе уже разосланная из интерфейса. Ссылки других администраторов остаются.

Метод нужен, когда ссылка попала к посторонним или её меняют по плану. Текущую ссылку без перевыпуска отдаёт [Ссылка-приглашение](/api/company/get-invite-link).

Метод доступен владельцу и администраторам пространства. Пока название пространства похоже на спам, метод отвечает `403`.

## Пример запроса

```bash
curl -X POST "https://api.pachca.com/api/shared/v1/company/invite_link" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: object` (required) — Ссылка-приглашение в пространство
  - `url: string` (required) — Ссылка, по которой сотрудник входит в пространство. Пример: `"https://app.pachca.com/join?company_id=4372&company_name=%D0%A1%D0%B8%D0%BD%D0%B8%D0%B9+%D1%81%D0%BA%D0%BB%D0%B0%D0%B4&invite_token=Xk3pQ9vLm2TbR7wZ"`
  - `expires_at: date-time` (required) — Дата и время, когда ссылка перестанет работать (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2026-11-25T10:00:00.000Z"`

**Пример ответа:**

```json
{
  "data": {
    "url": "https://app.pachca.com/join?company_id=4372&company_name=%D0%A1%D0%B8%D0%BD%D0%B8%D0%B9+%D1%81%D0%BA%D0%BB%D0%B0%D0%B4&invite_token=Xk3pQ9vLm2TbR7wZ",
    "expires_at": "2026-11-25T10:00:00.000Z"
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

