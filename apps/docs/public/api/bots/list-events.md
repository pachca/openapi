# История событий

**Метод**: `GET`

**Путь**: `/webhooks/events`

> **Скоуп:** `webhooks:events:read`

Метод для получения истории последних событий бота. Данный метод будет полезен, если вы не можете получать события в реальном времени на ваш `URL`, но вам требуется обрабатывать все события, на которые вы подписались.

История событий сохраняется только при активном пункте «Сохранять историю событий» во вкладке «Исходящий webhook» настроек бота. При этом указывать «Webhook `URL`» не требуется.

Для получения истории событий конкретного бота вам необходимо знать его `access_token` и использовать его при запросе. Каждое событие представляет `JSON` объект вебхука.

## Параметры

### Query параметры

- `limit` (integer, опциональный): Количество возвращаемых сущностей за один запрос
  - Пример: `1`
  - По умолчанию: `50`
- `cursor` (string, опциональный): Курсор для пагинации (из meta.paginate.next_page)
  - Пример: `eyJpZCI6MTAsImRpciI6ImFzYyJ9`


## Примеры запроса

### CLI

```bash
pachca api bots \
  --limit=1 \
  --cursor=eyJpZCI6MTAsImRpciI6ImFzYyJ9 \
  --json \
  --token YOUR_ACCESS_TOKEN
```

### cURL

```bash
curl "https://api.pachca.com/api/shared/v1/webhooks/events?limit=1&cursor=eyJpZCI6MTAsImRpciI6ImFzYyJ9" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/webhooks/events?limit=1&cursor=eyJpZCI6MTAsImRpciI6ImFzYyJ9', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
  }
});

const data = await response.json();
console.log(data);
```

### Python

```python
import requests

params = {
    'limit': 1,
    'cursor': 'eyJpZCI6MTAsImRpciI6ImFzYyJ9',
}

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
}

response = requests.get(
    'https://api.pachca.com/api/shared/v1/webhooks/events',
    params=params,
    headers=headers
)

print(response.json())
```

### Node.js

```javascript
const https = require('https');

const options = {
    hostname: 'api.pachca.com',
    port: 443,
    path: '/api/shared/v1/webhooks/events?limit=1&cursor=eyJpZCI6MTAsImRpciI6ImFzYyJ9',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
    }
};

const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(JSON.parse(data));
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.end();
```

### Ruby

```ruby
require 'net/http'
require 'json'

uri = URI('https://api.pachca.com/api/shared/v1/webhooks/events')
params = {
  'limit' => 1,
  'cursor' => 'eyJpZCI6MTAsImRpciI6ImFzYyJ9',
}
uri.query = URI.encode_www_form(params)

request = Net::HTTP::Get.new(uri)
request['Authorization'] = 'Bearer YOUR_ACCESS_TOKEN'

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts JSON.parse(response.body)
```

### PHP

```php
<?php

$params = ['limit' => 1, 'cursor' => 'eyJpZCI6MTAsImRpciI6ImFzYyJ9'];
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.pachca.com/api/shared/v1/webhooks/events?' . http_build_query($params)',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'GET',
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_ACCESS_TOKEN',
    ],
]);

$response = curl_exec($curl);
curl_close($curl);

echo $response;
?>
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data` (array[object], **обязательный**)
  - `id` (string, **обязательный**): Идентификатор события
    - Пример: `01KAJZ2XDSS2S3DSW9EXJZ0TBV`
  - `event_type` (string, **обязательный**): Тип события
    - Пример: `message_new`
  - `payload` (anyOf, **обязательный**): Объект вебхука
    **Возможные варианты:**

    - **MessageWebhookPayload**: Структура исходящего вебхука о сообщении
      - `type` (string, **обязательный**): Тип объекта
        - Пример: `message`
        - **Возможные значения:**
          - `message`: Для сообщений всегда message
      - `id` (integer, int32, **обязательный**): Идентификатор сообщения
        - Пример: `1245817`
      - `event` (string, **обязательный**): Тип события
        - **Возможные значения:**
          - `new`: Создание
          - `update`: Обновление
          - `delete`: Удаление
      - `entity_type` (string, **обязательный**): Тип сущности, к которой относится сообщение
        - **Возможные значения:**
          - `discussion`: Беседа или канал
          - `thread`: Тред
          - `user`: Пользователь
      - `entity_id` (integer, int32, **обязательный**): Идентификатор сущности, к которой относится сообщение
        - Пример: `5678`
      - `content` (string, **обязательный**): Текст сообщения
        - Пример: `Текст сообщения`
      - `user_id` (integer, int32, **обязательный**): Идентификатор отправителя сообщения
        - Пример: `2345`
      - `created_at` (string, date-time, **обязательный**): Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
        - Пример: `2025-05-15T14:30:00.000Z`
      - `url` (string, **обязательный**): Прямая ссылка на сообщение
        - Пример: `https://pachca.com/chats/1245817/messages/5678`
      - `chat_id` (integer, int32, **обязательный**): Идентификатор чата, в котором находится сообщение
        - Пример: `9012`
      - `parent_message_id` (integer, int32, опциональный): Идентификатор сообщения, к которому написан ответ
        - Пример: `3456`
      - `thread` (object, опциональный): Объект с параметрами треда
        - `message_id` (integer, int32, **обязательный**): Идентификатор сообщения, к которому был создан тред
          - Пример: `12345`
        - `message_chat_id` (integer, int32, **обязательный**): Идентификатор чата сообщения, к которому был создан тред
          - Пример: `67890`
      - `webhook_timestamp` (integer, int32, **обязательный**): Дата и время отправки вебхука (UTC+0) в формате UNIX
        - Пример: `1747574400`
    - **ReactionWebhookPayload**: Структура исходящего вебхука о реакции
      - `type` (string, **обязательный**): Тип объекта
        - Пример: `reaction`
        - **Возможные значения:**
          - `reaction`: Для реакций всегда reaction
      - `event` (string, **обязательный**): Тип события
        - **Возможные значения:**
          - `new`: Создание
          - `delete`: Удаление
      - `message_id` (integer, int32, **обязательный**): Идентификатор сообщения, к которому относится реакция
        - Пример: `1245817`
      - `code` (string, **обязательный**): Emoji символ реакции
        - Пример: `👍`
      - `name` (string, **обязательный**): Название реакции
        - Пример: `thumbsup`
      - `user_id` (integer, int32, **обязательный**): Идентификатор пользователя, который добавил или удалил реакцию
        - Пример: `2345`
      - `created_at` (string, date-time, **обязательный**): Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
        - Пример: `2025-05-15T14:30:00.000Z`
      - `webhook_timestamp` (integer, int32, **обязательный**): Дата и время отправки вебхука (UTC+0) в формате UNIX
        - Пример: `1747574400`
    - **ButtonWebhookPayload**: Структура исходящего вебхука о нажатии кнопки
      - `type` (string, **обязательный**): Тип объекта
        - Пример: `button`
        - **Возможные значения:**
          - `button`: Для кнопки всегда button
      - `event` (string, **обязательный**): Тип события
        - Пример: `click`
        - **Возможные значения:**
          - `click`: Нажатие кнопки
      - `message_id` (integer, int32, **обязательный**): Идентификатор сообщения, к которому относится кнопка
        - Пример: `1245817`
      - `trigger_id` (string, **обязательный**): Уникальный идентификатор события. Время жизни — 3 секунды. Может быть использован, например, для открытия представления пользователю
        - Пример: `a1b2c3d4-5e6f-7g8h-9i10-j11k12l13m14`
      - `data` (string, **обязательный**): Данные нажатой кнопки
        - Пример: `button_data`
      - `user_id` (integer, int32, **обязательный**): Идентификатор пользователя, который нажал кнопку
        - Пример: `2345`
      - `chat_id` (integer, int32, **обязательный**): Идентификатор чата, в котором была нажата кнопка
        - Пример: `9012`
      - `webhook_timestamp` (integer, int32, **обязательный**): Дата и время отправки вебхука (UTC+0) в формате UNIX
        - Пример: `1747574400`
    - **ChatMemberWebhookPayload**: Структура исходящего вебхука об участниках чата
      - `type` (string, **обязательный**): Тип объекта
        - Пример: `chat_member`
        - **Возможные значения:**
          - `chat_member`: Для участника чата всегда chat_member
      - `event` (string, **обязательный**): Тип события
        - **Возможные значения:**
          - `add`: Добавление
          - `remove`: Удаление
      - `chat_id` (integer, int32, **обязательный**): Идентификатор чата, в котором изменился состав участников
        - Пример: `9012`
      - `thread_id` (integer, int32, опциональный): Идентификатор треда
        - Пример: `5678`
      - `user_ids` (array[integer], **обязательный**): Массив идентификаторов пользователей, с которыми произошло событие
        - Пример: `[2345,6789]`
      - `created_at` (string, date-time, **обязательный**): Дата и время события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
        - Пример: `2025-05-15T14:30:00.000Z`
      - `webhook_timestamp` (integer, int32, **обязательный**): Дата и время отправки вебхука (UTC+0) в формате UNIX
        - Пример: `1747574400`
    - **CompanyMemberWebhookPayload**: Структура исходящего вебхука об участниках пространства
      - `type` (string, **обязательный**): Тип объекта
        - Пример: `company_member`
        - **Возможные значения:**
          - `company_member`: Для участника пространства всегда company_member
      - `event` (string, **обязательный**): Тип события
        - **Возможные значения:**
          - `invite`: Приглашение
          - `confirm`: Подтверждение
          - `update`: Обновление
          - `suspend`: Приостановка
          - `activate`: Активация
          - `delete`: Удаление
      - `user_ids` (array[integer], **обязательный**): Массив идентификаторов пользователей, с которыми произошло событие
        - Пример: `[2345,6789]`
      - `created_at` (string, date-time, **обязательный**): Дата и время события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
        - Пример: `2025-05-15T14:30:00.000Z`
      - `webhook_timestamp` (integer, int32, **обязательный**): Дата и время отправки вебхука (UTC+0) в формате UNIX
        - Пример: `1747574400`
    - **LinkSharedWebhookPayload**: Структура исходящего вебхука о разворачивании ссылок
      - `type` (string, **обязательный**): Тип объекта
        - Пример: `message`
        - **Возможные значения:**
          - `message`: Для разворачивания ссылок всегда message
      - `event` (string, **обязательный**): Тип события
        - Пример: `link_shared`
        - **Возможные значения:**
          - `link_shared`: Обнаружена ссылка на отслеживаемый домен
      - `chat_id` (integer, int32, **обязательный**): Идентификатор чата, в котором обнаружена ссылка
        - Пример: `23438`
      - `message_id` (integer, int32, **обязательный**): Идентификатор сообщения, содержащего ссылку
        - Пример: `268092`
      - `links` (array[object], **обязательный**): Массив обнаруженных ссылок на отслеживаемые домены
        - `url` (string, **обязательный**): URL ссылки
          - Пример: `https://example.com/page1`
        - `domain` (string, **обязательный**): Домен ссылки
          - Пример: `example.com`
      - `created_at` (string, date-time, **обязательный**): Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
        - Пример: `2024-09-18T19:53:14.000Z`
      - `webhook_timestamp` (integer, int32, **обязательный**): Дата и время отправки вебхука (UTC+0) в формате UNIX
        - Пример: `1726685594`
  - `created_at` (string, date-time, **обязательный**): Дата и время создания события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
    - Пример: `2025-05-15T14:30:00.000Z`
- `meta` (object, опциональный): Метаданные пагинации
  - `paginate` (object, опциональный): Вспомогательная информация
    - `next_page` (string, опциональный): Курсор пагинации следующей страницы
      - Пример: `eyJxZCO2MiwiZGlyIjomSNYjIn3`

**Пример ответа:**

```json
{
  "data": [
    {
      "id": "01KAJZ2XDSS2S3DSW9EXJZ0TBV",
      "event_type": "message_new",
      "payload": {
        "type": "message",
        "id": 1245817,
        "event": "new",
        "entity_type": "discussion",
        "entity_id": 5678,
        "content": "Текст сообщения",
        "user_id": 2345,
        "created_at": "2025-05-15T14:30:00.000Z",
        "url": "https://pachca.com/chats/1245817/messages/5678",
        "chat_id": 9012,
        "parent_message_id": 3456,
        "thread": {
          "message_id": 12345,
          "message_chat_id": 67890
        },
        "webhook_timestamp": 1747574400
      },
      "created_at": "2025-05-15T14:30:00.000Z"
    }
  ],
  "meta": {
    "paginate": {
      "next_page": "eyJxZCO2MiwiZGlyIjomSNYjIn3"
    }
  }
}
```

### 400: The server could not understand the request due to invalid syntax.

**Схема ответа при ошибке:**

- `errors` (array[object], **обязательный**): Массив ошибок
  - `key` (string, **обязательный**): Ключ поля с ошибкой
    - Пример: `field.name`
  - `value` (string, **обязательный**): Значение поля, которое вызвало ошибку
    - Пример: `invalid_value`
  - `message` (string, **обязательный**): Сообщение об ошибке
    - Пример: `Поле не может быть пустым`
  - `code` (string, **обязательный**): Код ошибки
    - **Возможные значения:**
      - `blank`: Обязательное поле (не может быть пустым)
      - `too_long`: Слишком длинное значение (пояснения вы получите в поле message)
      - `invalid`: Поле не соответствует правилам (пояснения вы получите в поле message)
      - `inclusion`: Поле имеет непредусмотренное значение
      - `exclusion`: Поле имеет недопустимое значение
      - `taken`: Название для этого поля уже существует
      - `wrong_emoji`: Emoji статуса не может содержать значения отличные от Emoji символа
      - `not_found`: Объект не найден
      - `already_exists`: Объект уже существует (пояснения вы получите в поле message)
      - `personal_chat`: Ошибка личного чата (пояснения вы получите в поле message)
      - `displayed_error`: Отображаемая ошибка (пояснения вы получите в поле message)
      - `not_authorized`: Действие запрещено
      - `invalid_date_range`: Выбран слишком большой диапазон дат
      - `invalid_webhook_url`: Некорректный URL вебхука
      - `rate_limit`: Достигнут лимит запросов
      - `licenses_limit`: Превышен лимит активных сотрудников (пояснения вы получите в поле message)
      - `user_limit`: Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций)
      - `unique_limit`: Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций)
      - `general_limit`: Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций)
      - `unhandled`: Ошибка выполнения запроса (пояснения вы получите в поле message)
      - `trigger_not_found`: Не удалось найти идентификатор события
      - `trigger_expired`: Время жизни идентификатора события истекло
      - `required`: Обязательный параметр не передан
      - `in`: Недопустимое значение (не входит в список допустимых)
      - `not_applicable`: Значение неприменимо в данном контексте (пояснения вы получите в поле message)
      - `self_update`: Нельзя изменить свои собственные данные
      - `owner_protected`: Нельзя изменить данные владельца
      - `already_assigned`: Значение уже назначено
      - `forbidden`: Недостаточно прав для выполнения действия (пояснения вы получите в поле message)
      - `permission_denied`: Доступ запрещён (недостаточно прав)
      - `access_denied`: Доступ запрещён
      - `wrong_params`: Некорректные параметры запроса (пояснения вы получите в поле message)
      - `payment_required`: Требуется оплата
      - `min_length`: Значение слишком короткое (пояснения вы получите в поле message)
      - `max_length`: Значение слишком длинное (пояснения вы получите в поле message)
  - `payload` (string, **обязательный**): Дополнительные данные об ошибке
    - Пример: `null`

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

**Схема ответа при ошибке:**

- `error` (string, **обязательный**): Код ошибки
  - Пример: `invalid_token`
- `error_description` (string, **обязательный**): Описание ошибки
  - Пример: `Access token is missing`

**Пример ответа:**

```json
{
  "error": "invalid_token",
  "error_description": "Access token is missing"
}
```

### 403: Access is forbidden.

**Схема ответа при ошибке:**

- `error` (string, **обязательный**): Код ошибки
  - Пример: `invalid_token`
- `error_description` (string, **обязательный**): Описание ошибки
  - Пример: `Access token is missing`

**Пример ответа:**

```json
{
  "error": "invalid_token",
  "error_description": "Access token is missing"
}
```

### 422: Client error

**Схема ответа при ошибке:**

- `errors` (array[object], **обязательный**): Массив ошибок
  - `key` (string, **обязательный**): Ключ поля с ошибкой
    - Пример: `field.name`
  - `value` (string, **обязательный**): Значение поля, которое вызвало ошибку
    - Пример: `invalid_value`
  - `message` (string, **обязательный**): Сообщение об ошибке
    - Пример: `Поле не может быть пустым`
  - `code` (string, **обязательный**): Код ошибки
    - **Возможные значения:**
      - `blank`: Обязательное поле (не может быть пустым)
      - `too_long`: Слишком длинное значение (пояснения вы получите в поле message)
      - `invalid`: Поле не соответствует правилам (пояснения вы получите в поле message)
      - `inclusion`: Поле имеет непредусмотренное значение
      - `exclusion`: Поле имеет недопустимое значение
      - `taken`: Название для этого поля уже существует
      - `wrong_emoji`: Emoji статуса не может содержать значения отличные от Emoji символа
      - `not_found`: Объект не найден
      - `already_exists`: Объект уже существует (пояснения вы получите в поле message)
      - `personal_chat`: Ошибка личного чата (пояснения вы получите в поле message)
      - `displayed_error`: Отображаемая ошибка (пояснения вы получите в поле message)
      - `not_authorized`: Действие запрещено
      - `invalid_date_range`: Выбран слишком большой диапазон дат
      - `invalid_webhook_url`: Некорректный URL вебхука
      - `rate_limit`: Достигнут лимит запросов
      - `licenses_limit`: Превышен лимит активных сотрудников (пояснения вы получите в поле message)
      - `user_limit`: Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций)
      - `unique_limit`: Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций)
      - `general_limit`: Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций)
      - `unhandled`: Ошибка выполнения запроса (пояснения вы получите в поле message)
      - `trigger_not_found`: Не удалось найти идентификатор события
      - `trigger_expired`: Время жизни идентификатора события истекло
      - `required`: Обязательный параметр не передан
      - `in`: Недопустимое значение (не входит в список допустимых)
      - `not_applicable`: Значение неприменимо в данном контексте (пояснения вы получите в поле message)
      - `self_update`: Нельзя изменить свои собственные данные
      - `owner_protected`: Нельзя изменить данные владельца
      - `already_assigned`: Значение уже назначено
      - `forbidden`: Недостаточно прав для выполнения действия (пояснения вы получите в поле message)
      - `permission_denied`: Доступ запрещён (недостаточно прав)
      - `access_denied`: Доступ запрещён
      - `wrong_params`: Некорректные параметры запроса (пояснения вы получите в поле message)
      - `payment_required`: Требуется оплата
      - `min_length`: Значение слишком короткое (пояснения вы получите в поле message)
      - `max_length`: Значение слишком длинное (пояснения вы получите в поле message)
  - `payload` (string, **обязательный**): Дополнительные данные об ошибке
    - Пример: `null`

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

