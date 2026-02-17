# История событий

**Метод**: `GET`

**Путь**: `/webhooks/events`

#bot_access_token_required

Метод для получения истории последних событий бота. Данный метод будет полезен, если вы не можете получать события в реальном времени на ваш `URL`, но вам требуется обрабатывать все события, на которые вы подписались.

История событий сохраняется только при активном пункте «Сохранять историю событий» во вкладке «Исходящий webhook» настроек бота. При этом указывать «Webhook `URL`» не требуется.

Для получения истории событий конкретного бота вам необходимо знать его `access_token` и использовать его при запросе. Каждое событие представляет `JSON` объект вебхука.

## Параметры

### Query параметры

- `limit` (integer, опциональный): Количество возвращаемых сущностей за один запрос
  - По умолчанию: `50`
- `cursor` (string, опциональный): Курсор для пагинации (из meta.paginate.next_page)


## Примеры запроса

### cURL

```bash
curl "https://api.pachca.com/api/shared/v1/webhooks/events?limit=50&cursor=string" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/webhooks/events?limit=50&cursor=string', {
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
    'limit': 50,
    'cursor': 'string',
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
    path: '/api/shared/v1/webhooks/events?limit=50&cursor=string',
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
  'limit' => 50,
  'cursor' => 'string',
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

$params = ['limit' => 50, 'cursor' => 'string'];
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

- `meta` (object, опциональный): Метаданные пагинации
  - `paginate` (object, опциональный): Вспомогательная информация
    - `next_page` (string, опциональный): Курсор пагинации следующей страницы
- `data` (array[object], **обязательный**)
  - `id` (string, **обязательный**): Идентификатор события
  - `event_type` (string, **обязательный**): Тип события
  - `payload` (anyOf, **обязательный**): Объект вебхука
    **Возможные варианты:**

    - **MessageWebhookPayload**: Структура исходящего вебхука о сообщении
      - `type` (string, **обязательный**): Тип объекта
        - **Возможные значения:**
          - `message`: Для сообщений всегда message
      - `id` (integer, int32, **обязательный**): Идентификатор сообщения
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
      - `content` (string, **обязательный**): Текст сообщения
      - `user_id` (integer, int32, **обязательный**): Идентификатор отправителя сообщения
      - `created_at` (string, date-time, **обязательный**): Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
      - `url` (string, **обязательный**): Прямая ссылка на сообщение
      - `chat_id` (integer, int32, **обязательный**): Идентификатор чата, в котором находится сообщение
      - `parent_message_id` (integer, int32, опциональный): Идентификатор сообщения, к которому написан ответ
      - `thread` (object, опциональный): Объект с параметрами треда
        - `message_id` (integer, int32, **обязательный**): Идентификатор сообщения, к которому был создан тред
        - `message_chat_id` (integer, int32, **обязательный**): Идентификатор чата сообщения, к которому был создан тред
      - `webhook_timestamp` (integer, int32, **обязательный**): Дата и время отправки вебхука (UTC+0) в формате UNIX
    - **ReactionWebhookPayload**: Структура исходящего вебхука о реакции
      - `type` (string, **обязательный**): Тип объекта
        - **Возможные значения:**
          - `reaction`: Для реакций всегда reaction
      - `event` (string, **обязательный**): Тип события
        - **Возможные значения:**
          - `new`: Создание
          - `delete`: Удаление
      - `message_id` (integer, int32, **обязательный**): Идентификатор сообщения, к которому относится реакция
      - `code` (string, **обязательный**): Emoji символ реакции
      - `name` (string, **обязательный**): Название реакции
      - `user_id` (integer, int32, **обязательный**): Идентификатор пользователя, который добавил или удалил реакцию
      - `created_at` (string, date-time, **обязательный**): Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
      - `webhook_timestamp` (integer, int32, **обязательный**): Дата и время отправки вебхука (UTC+0) в формате UNIX
    - **ButtonWebhookPayload**: Структура исходящего вебхука о нажатии кнопки
      - `type` (string, **обязательный**): Тип объекта
        - **Возможные значения:**
          - `button`: Для кнопки всегда button
      - `event` (string, **обязательный**): Тип события
        - **Возможные значения:**
          - `click`: Нажатие кнопки
      - `message_id` (integer, int32, **обязательный**): Идентификатор сообщения, к которому относится кнопка
      - `trigger_id` (string, **обязательный**): Уникальный идентификатор события. Время жизни — 3 секунды. Может быть использован, например, для открытия представления пользователю
      - `data` (string, **обязательный**): Данные нажатой кнопки
      - `user_id` (integer, int32, **обязательный**): Идентификатор пользователя, который нажал кнопку
      - `chat_id` (integer, int32, **обязательный**): Идентификатор чата, в котором была нажата кнопка
      - `webhook_timestamp` (integer, int32, **обязательный**): Дата и время отправки вебхука (UTC+0) в формате UNIX
    - **ChatMemberWebhookPayload**: Структура исходящего вебхука об участниках чата
      - `type` (string, **обязательный**): Тип объекта
        - **Возможные значения:**
          - `chat_member`: Для участника чата всегда chat_member
      - `event` (string, **обязательный**): Тип события
        - **Возможные значения:**
          - `add`: Добавление
          - `remove`: Удаление
      - `chat_id` (integer, int32, **обязательный**): Идентификатор чата, в котором изменился состав участников
      - `thread_id` (integer, int32, опциональный): Идентификатор треда
      - `user_ids` (array[integer], **обязательный**): Массив идентификаторов пользователей, с которыми произошло событие
      - `created_at` (string, date-time, **обязательный**): Дата и время события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
      - `webhook_timestamp` (integer, int32, **обязательный**): Дата и время отправки вебхука (UTC+0) в формате UNIX
    - **CompanyMemberWebhookPayload**: Структура исходящего вебхука об участниках пространства
      - `type` (string, **обязательный**): Тип объекта
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
      - `created_at` (string, date-time, **обязательный**): Дата и время события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
      - `webhook_timestamp` (integer, int32, **обязательный**): Дата и время отправки вебхука (UTC+0) в формате UNIX
  - `created_at` (string, date-time, **обязательный**): Дата и время создания события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ

**Пример ответа:**

```json
{
  "meta": {
    "paginate": {
      "next_page": "eyMxFCO2MiwiZGlyIjpiSNYjIn1"
    }
  },
  "data": [
    {
      "id": "01KAJZ2XDSS2S3DSW9EXJZ0TBV",
      "event_type": "company_member_update",
      "payload": {
        "event": "update",
        "type": "company_member",
        "webhook_timestamp": 1763635376,
        "user_ids": [
          13
        ],
        "created_at": "2025-11-20T10:42:56Z"
      },
      "created_at": "2025-11-20T10:42:56Z"
    },
    {
      "id": "01KAJZ5CMZFVK4FSZQOISFBZCS",
      "event_type": "message_new",
      "payload": {
        "event": "new",
        "type": "message",
        "webhook_timestamp": 1763637142,
        "chat_id": 43,
        "user_id": 13,
        "id": 4432345,
        "created_at": "2025-11-20T11:12:22.000Z",
        "parent_message_id": null,
        "content": "Проверьте последнюю задачу",
        "entity_type": "discussion",
        "entity_id": 43,
        "thread": null,
        "url": "https://app.pachca.com/chats/43?message=4432345"
      },
      "created_at": "2025-11-20T11:12:22.000Z"
    },
    {
      "id": "01KAJP5CMZFPA5FSZQOCHKBOIW",
      "event_type": "chat_member_add",
      "payload": {
        "event": "add",
        "type": "chat_member",
        "webhook_timestamp": 1763637574,
        "chat_id": 43,
        "thread_id": null,
        "user_ids": [
          14
        ],
        "created_at": "2025-11-20T11:19:34Z"
      },
      "created_at": "2025-11-20T11:19:34Z"
    }
  ]
}
```

### 400: The server could not understand the request due to invalid syntax.

**Схема ответа при ошибке:**

- `errors` (array[object], **обязательный**): Массив ошибок
  - `key` (string, **обязательный**): Ключ поля с ошибкой
  - `value` (string, **обязательный**): Значение поля, которое вызвало ошибку
  - `message` (string, **обязательный**): Сообщение об ошибке
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

### 401: Access is unauthorized.

**Схема ответа при ошибке:**

- `error` (string, **обязательный**): Код ошибки
- `error_description` (string, **обязательный**): Описание ошибки

### 403: Access is forbidden.

**Схема ответа при ошибке:**

- `error` (string, **обязательный**): Код ошибки
- `error_description` (string, **обязательный**): Описание ошибки

### 422: Client error

**Схема ответа при ошибке:**

- `errors` (array[object], **обязательный**): Массив ошибок
  - `key` (string, **обязательный**): Ключ поля с ошибкой
  - `value` (string, **обязательный**): Значение поля, которое вызвало ошибку
  - `message` (string, **обязательный**): Сообщение об ошибке
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

