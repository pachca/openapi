# Поиск чатов

**Метод**: `GET`

**Путь**: `/search/chats`

> **Скоуп:** `search:chats`

Метод для полнотекстового поиска каналов и бесед.

## Параметры

### Query параметры

- `query` (string, опциональный): Текст поискового запроса
- `limit` (integer, опциональный): Количество возвращаемых результатов за один запрос
  - По умолчанию: `100`
- `cursor` (string, опциональный): Курсор для пагинации (из meta.paginate.next_page)
- `order` (string (enum: asc, desc), опциональный): Направление сортировки
- `created_from` (string, опциональный): Фильтр по дате создания (от)
- `created_to` (string, опциональный): Фильтр по дате создания (до)
- `active` (boolean, опциональный): Фильтр по активности чата (true — активные, false — архивированные)
- `chat_subtype` (string (enum: discussion, thread), опциональный): Фильтр по типу чата
- `personal` (boolean, опциональный): Фильтр по личным чатам (true — только личные)


## Примеры запроса

### cURL

```bash
curl "https://api.pachca.com/api/shared/v1/search/chats?query=%D0%9F%D1%80%D0%B8%D0%BC%D0%B5%D1%80%20%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%B0&limit=100&cursor=string&order=asc&created_from=2024-04-08T10%3A00%3A00.000Z&created_to=2024-04-08T10%3A00%3A00.000Z&active=true&chat_subtype=discussion&personal=true" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/search/chats?query=%D0%9F%D1%80%D0%B8%D0%BC%D0%B5%D1%80%20%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%B0&limit=100&cursor=string&order=asc&created_from=2024-04-08T10%3A00%3A00.000Z&created_to=2024-04-08T10%3A00%3A00.000Z&active=true&chat_subtype=discussion&personal=true', {
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
    'query': 'Пример текста',
    'limit': 100,
    'cursor': 'string',
    'order': 'asc',
    'created_from': '2024-04-08T10:00:00.000Z',
    'created_to': '2024-04-08T10:00:00.000Z',
    'active': True,
    'chat_subtype': 'discussion',
    'personal': True,
}

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
}

response = requests.get(
    'https://api.pachca.com/api/shared/v1/search/chats',
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
    path: '/api/shared/v1/search/chats?query=%D0%9F%D1%80%D0%B8%D0%BC%D0%B5%D1%80%20%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%B0&limit=100&cursor=string&order=asc&created_from=2024-04-08T10%3A00%3A00.000Z&created_to=2024-04-08T10%3A00%3A00.000Z&active=true&chat_subtype=discussion&personal=true',
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

uri = URI('https://api.pachca.com/api/shared/v1/search/chats')
params = {
  'query' => 'Пример текста',
  'limit' => 100,
  'cursor' => 'string',
  'order' => 'asc',
  'created_from' => '2024-04-08T10:00:00.000Z',
  'created_to' => '2024-04-08T10:00:00.000Z',
  'active' => true,
  'chat_subtype' => 'discussion',
  'personal' => true,
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

$params = ['query' => 'Пример текста', 'limit' => 100, 'cursor' => 'string', 'order' => 'asc', 'created_from' => '2024-04-08T10:00:00.000Z', 'created_to' => '2024-04-08T10:00:00.000Z', 'active' => true, 'chat_subtype' => 'discussion', 'personal' => true];
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.pachca.com/api/shared/v1/search/chats?' . http_build_query($params)',
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
  - `id` (integer, int32, **обязательный**): Идентификатор созданного чата
  - `name` (string, **обязательный**): Название
  - `created_at` (string, date-time, **обязательный**): Дата и время создания чата (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
  - `owner_id` (integer, int32, **обязательный**): Идентификатор пользователя, создавшего чат
  - `member_ids` (array[integer], **обязательный**): Массив идентификаторов пользователей, участников
  - `group_tag_ids` (array[integer], **обязательный**): Массив идентификаторов тегов, участников
  - `channel` (boolean, **обязательный**): Является каналом
  - `personal` (boolean, **обязательный**): Является личным чатом
  - `public` (boolean, **обязательный**): Открытый доступ
  - `last_message_at` (string, date-time, **обязательный**): Дата и время создания последнего сообщения в чате (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
  - `meet_room_url` (string, **обязательный**): Ссылка на Видеочат
- `meta` (object, **обязательный**): Мета-информация для пагинации поисковых результатов
  - `total` (integer, int32, **обязательный**): Общее количество найденных результатов
  - `paginate` (object, **обязательный**): Вспомогательная информация
    - `next_page` (string, **обязательный**): Курсор пагинации следующей страницы

**Пример ответа:**

```json
{
  "data": [
    {
      "id": 198,
      "name": "Канал разработки",
      "created_at": "2020-06-08T09:32:57.000Z",
      "owner_id": 12,
      "member_ids": [
        12,
        13,
        14
      ],
      "group_tag_ids": [
        9111
      ],
      "channel": true,
      "personal": false,
      "public": true,
      "last_message_at": "2025-01-20T13:40:07.000Z",
      "meet_room_url": "https://meet.pachca.com/dev-94bb21b5"
    }
  ],
  "meta": {
    "total": 1,
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

### 402: Client error

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

### 403: Access is forbidden.

**Схема ответа при ошибке:**

- `error` (string, **обязательный**): Код ошибки
- `error_description` (string, **обязательный**): Описание ошибки

