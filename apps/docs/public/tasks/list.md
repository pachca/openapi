# Список напоминаний

**Метод**: `GET`

**Путь**: `/tasks`

Метод для получения списка напоминаний.

## Параметры

### Query параметры

- `limit` (integer, опциональный): Количество возвращаемых сущностей за один запрос
  - По умолчанию: `50`
- `cursor` (string, опциональный): Курсор для пагинации (из `meta.paginate.next_page`)


## Примеры запроса

### cURL

```bash
curl "https://api.pachca.com/api/shared/v1/tasks?limit=50&cursor=string" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/tasks?limit=50&cursor=string', {
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
    'https://api.pachca.com/api/shared/v1/tasks',
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
    path: '/api/shared/v1/tasks?limit=50&cursor=string',
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

uri = URI('https://api.pachca.com/api/shared/v1/tasks')
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
    CURLOPT_URL => 'https://api.pachca.com/api/shared/v1/tasks?' . http_build_query($params)',
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
  - `id` (integer, int32, **обязательный**): Идентификатор напоминания
  - `kind` (string, **обязательный**): Тип
    - **Возможные значения:**
      - `call`: Позвонить контакту
      - `meeting`: Встреча
      - `reminder`: Простое напоминание
      - `event`: Событие
      - `email`: Написать письмо
  - `content` (string, **обязательный**): Описание
  - `due_at` (string, date-time, **обязательный**): Срок выполнения напоминания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
  - `priority` (integer, int32, **обязательный**): Приоритет
  - `user_id` (integer, int32, **обязательный**): Идентификатор пользователя-создателя напоминания
  - `status` (string, **обязательный**): Статус напоминания
    - **Возможные значения:**
      - `done`: Выполнено
      - `undone`: Активно
  - `created_at` (string, date-time, **обязательный**): Дата и время создания напоминания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
  - `performer_ids` (array[integer], **обязательный**): Массив идентификаторов пользователей, привязанных к напоминанию как «ответственные»
  - `all_day` (boolean, **обязательный**): Напоминание на весь день (без указания времени)
  - `custom_properties` (array[object], **обязательный**): Дополнительные поля напоминания
    - `id` (integer, int32, **обязательный**): Идентификатор поля
    - `name` (string, **обязательный**): Название поля
    - `data_type` (string, **обязательный**): Тип поля
      - **Возможные значения:**
        - `string`: Строковое значение
        - `number`: Числовое значение
        - `date`: Дата
        - `link`: Ссылка
    - `value` (string, **обязательный**): Значение

**Пример ответа:**

```json
{
  "data": [
    {
      "id": 22283,
      "kind": "reminder",
      "content": "Забрать со склада 21 заказ",
      "due_at": "2020-06-05T09:00:00.000Z",
      "priority": 2,
      "user_id": 12,
      "status": "undone",
      "created_at": "2020-06-04T10:37:57.000Z",
      "performer_ids": [
        12
      ],
      "all_day": false,
      "custom_properties": [
        {
          "id": 78,
          "name": "Место",
          "data_type": "string",
          "value": "Синий склад"
        }
      ]
    },
    {
      "id": 22284,
      "kind": "call",
      "content": "Позвонить клиенту",
      "due_at": "2020-06-06T14:00:00.000Z",
      "priority": 3,
      "user_id": 12,
      "status": "done",
      "created_at": "2020-06-04T11:20:00.000Z",
      "performer_ids": [
        12,
        13
      ],
      "all_day": false,
      "custom_properties": []
    }
  ],
  "meta": {
    "paginate": {
      "next_page": "eyJpZCI6MjIyODQsImRpciI6ImFzYyJ9"
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

### 403: Access is forbidden.

**Схема ответа при ошибке:**

- `error` (string, **обязательный**): Код ошибки
- `error_description` (string, **обязательный**): Описание ошибки

