> Расположение: Методы API → Боты и Webhook
> Краткое содержание: Ссылка, по которой события бота приходят сразу, как они происходят, в формате Server-Sent Events
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Поток событий

**Метод**: `GET`

**Путь**: `/webhooks/events/stream`

> **Скоуп:** `webhooks:events:read`

Ссылка, по которой события бота приходят сразу, как они происходят, в формате Server-Sent Events. Это те же события, что ложатся в [Историю событий](/api/bots/list-events). Поток подходит боту, который не принимает вебхуки на свой адрес, но должен отвечать быстро, например на нажатие кнопки или отправку формы.

Поток работает, только когда в настройках бота включён пункт «Сохранять историю событий». Если пункт выключен или поток недоступен, метод отвечает `404` без тела. Метод работает только с токеном бота.

Ссылку открывают без токена, например через `EventSource` или `curl -N`: доступ даёт сама ссылка, поэтому храните её как секрет. Каждое событие приходит записью истории с полями `id`, `event_type`, `payload` и `created_at`, а служебные сообщения подключения отличаются полем `type`.

Ссылка действует до `expires_at`, а потом поток перестаёт присылать события, не закрывая соединение. Новую ссылку берите в последние пять минут перед `expires_at`: более ранний запрос вернёт ту же ссылку. Чтобы ничего не пропустить, после подключения дождитесь подтверждения подписки и только потом прочитайте [Историю событий](/api/bots/list-events), и так после каждого переподключения и смены ссылки. Доставка в поток не гарантирована: обработанные события по-прежнему удаляйте методом [Удаление события истории](/api/bots/remove-event), а повторы отсекайте по `id`. Если у бота есть адрес вебхука, повторная доставка на него приходит в поток ещё раз с новым `id`: такие повторы отсекают по ключу из `payload`, как в разделе [Идемпотентная обработка](/guides/webhook/handler#idempotentnaya-obrabotka). Подробнее — в разделе [Поллинг](/guides/webhook/polling).

## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/webhooks/events/stream" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: object` (required) — Ссылка на поток событий бота
  - `url: string` (required) — Ссылка на поток событий в формате Server-Sent Events. Открывается без токена, поэтому храните её как секрет. Пример: `"https://api.pachca.com/events?signed_stream=d2ViaG9vay1ldmVudHMvMTczODgxNi8x&jid=eyJhbGciOiJIUzI1NiJ9.eyJ3ZWJob29rX2lkIjoxfQ.c2lnbmF0dXJl"`
  - `expires_at: date-time` (required) — Дата и время, до которых действует ссылка (ISO-8601, UTC+0). Пример: `"2026-10-27T12:20:00.000Z"`

**Пример ответа:**

```json
{
  "data": {
    "url": "https://api.pachca.com/events?signed_stream=d2ViaG9vay1ldmVudHMvMTczODgxNi8x&jid=eyJhbGciOiJIUzI1NiJ9.eyJ3ZWJob29rX2lkIjoxfQ.c2lnbmF0dXJl",
    "expires_at": "2026-10-27T12:20:00.000Z"
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

