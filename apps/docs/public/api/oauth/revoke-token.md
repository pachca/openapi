> Расположение: Методы API → OAuth и токены
> Краткое содержание: Отзывает токен сотрудника, выданный боту, по стандарту OAuth 2.0 (RFC 7009)
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Отзыв токена

**Метод**: `POST`

**Путь**: `/oauth/revoke`

Отзывает токен сотрудника, выданный боту, по стандарту OAuth 2.0 ([RFC 7009](https://datatracker.ietf.org/doc/html/rfc7009)). Так бот отключает доступ сам, например когда сотрудник выключает интеграцию в вашем сервисе. В `token` можно передать и токен сотрудника, и его токен обновления: перестают работать оба.

Тело передаётся в формате `application/x-www-form-urlencoded`. Серверное приложение подтверждает себя секретом клиента: полями `client_id` и `client_secret` или заголовком `Authorization: Basic`. Приложение без секрета отзывает только сам токен: передаёт его и в теле, и в заголовке `Authorization: Bearer`.

Ответ `200` с пустым объектом приходит и тогда, когда токен уже отозван или не найден. Токен другого бота метод не отзывает и отвечает `403` с кодом `unauthorized_client`. Отзыв записывается в [журнал аудита событий](/guides/audit-events) с типом `oauth_token_revoked`. Как сотрудник отзывает доступ сам — в разделе [Согласие и отзыв](/guides/oauth/consent).

## Тело запроса

**Обязательно**

Формат: `application/x-www-form-urlencoded`

### Схема

- `token: string` (required) — Токен сотрудника или его токен обновления. Пример: `"pato_bm90X2FfcmVhbF90b2tlbg"`
- `token_type_hint: string` — Что передано в `token`. Без подсказки сервер определит сам.
  Значения: `access_token` — Токен сотрудника, `refresh_token` — Токен обновления
- `client_id: string` — Идентификатор клиента серверного приложения. Пример: `"aB3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1xY"`
- `client_secret: string` — Секрет клиента серверного приложения. Вместе с `client_id` его можно передать заголовком `Authorization: Basic`. Пример: `"dGhpc19pc19ub3RfYV9yZWFsX3NlY3JldA"`

### Пример

```json
{
  "token": "pato_bm90X2FfcmVhbF90b2tlbg",
  "client_id": "aB3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1xY",
  "client_secret": "dGhpc19pc19ub3RfYV9yZWFsX3NlY3JldA"
}
```

## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/oauth/revoke" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d 'token=pato_bm90X2FfcmVhbF90b2tlbg' \
  -d 'client_id=aB3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1xY' \
  -d 'client_secret=dGhpc19pc19ub3RfYV9yZWFsX3NlY3JldA'
```

## Ответы

### 200: The request has succeeded.

### 403: Access is forbidden.

**Схема ответа при ошибке:**

- `error: string` (required) — Код ошибки. Пример: `"invalid_token"`
- `error_description: string` (required) — Описание ошибки. Пример: `"Access token is missing"`

**Пример ответа:**

```json
{
  "error": "invalid_token",
  "error_description": "Access token is missing"
}
```

