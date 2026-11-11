> Расположение: Методы API → Пространство
> Краткое содержание: Метод доступен владельцу и администраторам пространства
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Ссылка-приглашение

**Метод**: `GET`

**Путь**: `/company/invite_link`

> **Скоуп:** `invite_links:write`

Ссылка, по которой сотрудник сам входит в пространство. Это та же ссылка, что администратор получает в интерфейсе: у каждого администратора она своя, и метод отдаёт ссылку владельца токена.

Ссылка действует 14 дней, срок приходит в `expires_at`. Если действующей ссылки нет или ей осталось меньше часа, метод выпускает новую, а прежняя перестаёт работать. Перевыпустить ссылку раньше срока можно методом [Перевыпуск ссылки-приглашения](/api/company/reissue-invite-link).

Вошедший по ссылке становится сотрудником с ролью `user` и без тегов, а в его `inviter_id` записан владелец ссылки. Теги ему назначает [Редактирование сотрудника](/api/users/update).

Метод доступен владельцу и администраторам пространства. Пока название пространства похоже на спам, ссылка не выдаётся и метод отвечает `403`. Чтение ссылки входит в общий [лимит](/api/limits) со списками чатов и ботов пространства.

## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/company/invite_link" \
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

