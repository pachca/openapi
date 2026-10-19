> Расположение: Методы API → OAuth и токены
> Краткое содержание: Второй шаг авторизации от имени сотрудника: код из адреса возврата меняется на токен этого сотрудника
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Обмен кода на токен

**Метод**: `POST`

**Путь**: `/oauth/token`

> Авторизация не требуется

Второй шаг авторизации от имени сотрудника: код из адреса возврата меняется на токен этого сотрудника. Код действует 10 минут и обменивается один раз. Как получить код и проверить, чей токен пришёл, — в разделе [Получение токена](/guides/oauth/flow).

Тело передаётся в формате `application/x-www-form-urlencoded`, как требует OAuth 2.0. Серверное приложение подтверждает себя секретом клиента: полями `client_id` и `client_secret` или заголовком `Authorization: Basic`. Приложение без секрета передаёт `client_id` и `code_verifier` — проверочный код PKCE, из которого получен `code_challenge` ссылки авторизации.

Токен бессрочный: `expires_in` в ответе нет, и работает токен, пока сотрудник не отзовёт доступ. Если сотрудник уже авторизовал бота раньше, приходит его прежний токен. Чей это токен, показывает [Информация о токене](/api/oauth/token-info).

Ошибки приходят в формате OAuth: `invalid_grant` — код истёк, уже использован, выдан для другого `redirect_uri` или не подходит `code_verifier`, а `invalid_client` — неверный `client_id` или `client_secret`. У обмена свой [лимит](/api/limits): при его превышении метод отвечает `429` с кодом `rate_limit` в обычном формате ошибок API.

## Тело запроса

**Обязательно**

Формат: `application/x-www-form-urlencoded`

### Схема

- `grant_type: string` (required) — Тип запроса, всегда `authorization_code`. Пример: `"authorization_code"`
  Значения: `authorization_code`
- `code: string` (required) — Код авторизации из адреса возврата. Пример: `"ZmFrZV9hdXRoX2NvZGU"`
- `redirect_uri: string` (required) — Адрес возврата — тот же, что в ссылке авторизации. Пример: `"https://bot.example.com/oauth/callback"`
- `client_id: string` — Идентификатор клиента с вкладки «OAuth» в карточке бота. Не нужен, если клиент передаёт его заголовком `Authorization: Basic`. Пример: `"aB3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1xY"`
- `client_secret: string` — Секрет клиента серверного приложения. Вместе с `client_id` его можно передать заголовком `Authorization: Basic`. Пример: `"dGhpc19pc19ub3RfYV9yZWFsX3NlY3JldA"`
- `code_verifier: string` — Проверочный код PKCE, из которого получен `code_challenge` ссылки авторизации. Обязателен для приложения без секрета. Пример: `"dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"`

### Пример

```json
{
  "grant_type": "authorization_code",
  "code": "ZmFrZV9hdXRoX2NvZGU",
  "redirect_uri": "https://bot.example.com/oauth/callback",
  "client_id": "aB3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1xY",
  "client_secret": "dGhpc19pc19ub3RfYV9yZWFsX3NlY3JldA",
  "code_verifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
}
```

## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/oauth/token" \
  -d 'grant_type=authorization_code' \
  -d 'code=ZmFrZV9hdXRoX2NvZGU' \
  -d 'redirect_uri=https://bot.example.com/oauth/callback' \
  -d 'client_id=aB3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1xY' \
  -d 'client_secret=dGhpc19pc19ub3RfYV9yZWFsX3NlY3JldA' \
  -d 'code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `access_token: string` (required) — Токен сотрудника. Передаётся в заголовке `Authorization: Bearer` при запросах от его имени. Пример: `"pato_bm90X2FfcmVhbF90b2tlbg"`
- `token_type: string` (required) — Тип токена, всегда `Bearer`. Пример: `"Bearer"`
  Значения: `Bearer`
- `refresh_token: string` (required) — Токен обновления. Токен сотрудника бессрочный, поэтому обновлять его не нужно. Пример: `"cmVmcmVzaF9ub3RfcmVhbA"`
- `scope: string` (required) — Выданные права через пробел. Набор берётся из настроек бота. Пример: `"chats:read messages:read tasks:read tasks:create"`
- `created_at: integer, int64` (required) — Время выдачи токена в формате Unix time, в секундах. Пример: `1790242260`

**Пример ответа:**

```json
{
  "access_token": "pato_bm90X2FfcmVhbF90b2tlbg",
  "token_type": "Bearer",
  "refresh_token": "cmVmcmVzaF9ub3RfcmVhbA",
  "scope": "chats:read messages:read tasks:read tasks:create",
  "created_at": 1790242260
}
```

### 400: The server could not understand the request due to invalid syntax.

**Схема ответа при ошибке:** `OAuthError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

**Пример ответа:**

```json
{
  "error": "invalid_token",
  "error_description": "Access token is missing"
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

### 429: Client error

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

