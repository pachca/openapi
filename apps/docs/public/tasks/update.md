# Редактирование напоминания

**Метод**: `PUT`

**Путь**: `/tasks/{id}`

> **Скоуп:** `tasks:update`

Метод для редактирования напоминания.

Для редактирования напоминания вам необходимо знать его `id` и указать его в `URL` запроса. Все редактируемые параметры напоминания указываются в теле запроса.

## Параметры

### Path параметры

- `id` (integer, **обязательный**): Идентификатор напоминания
  - Пример: `22283`


## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `task` (object, **обязательный**): Собранный объект параметров обновляемого напоминания
  - `kind` (string, опциональный): Тип
    - **Возможные значения:**
      - `call`: Позвонить контакту
      - `meeting`: Встреча
      - `reminder`: Простое напоминание
      - `event`: Событие
      - `email`: Написать письмо
  - `content` (string, опциональный): Описание
    - Пример: `Забрать со склада 21 заказ`
  - `due_at` (string, date-time, опциональный): Срок выполнения напоминания (ISO-8601) в формате YYYY-MM-DDThh:mm:ss.sssTZD. Если указано время 23:59:59.000, то напоминание будет создано на весь день (без указания времени).
    - Пример: `2020-06-05T12:00:00.000+03:00`
  - `priority` (integer, int32, опциональный): Приоритет: 1, 2 (важно) или 3 (очень важно).
    - Пример: `2`
  - `performer_ids` (array[integer], опциональный): Массив идентификаторов пользователей, привязываемых к напоминанию как «ответственные»
    - Пример: `[12]`
  - `status` (string, опциональный): Статус
    - **Возможные значения:**
      - `done`: Выполнено
      - `undone`: Активно
  - `all_day` (boolean, опциональный): Напоминание на весь день (без указания времени)
    - Пример: `false`
  - `done_at` (string, date-time, опциональный): Дата и время выполнения напоминания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
    - Пример: `2020-06-05T12:00:00.000Z`
  - `custom_properties` (array[object], опциональный): Задаваемые дополнительные поля
    - `id` (integer, int32, **обязательный**): Идентификатор поля
      - Пример: `78`
    - `value` (string, **обязательный**): Устанавливаемое значение
      - Пример: `Синий склад`

### Пример

```json
{
  "task": {
    "kind": "reminder",
    "content": "Забрать со склада 21 заказ",
    "due_at": "2020-06-05T12:00:00.000+03:00",
    "priority": 2,
    "performer_ids": [
      12
    ],
    "status": "done",
    "all_day": false,
    "done_at": "2020-06-05T12:00:00.000Z",
    "custom_properties": [
      {
        "id": 78,
        "value": "Синий склад"
      }
    ]
  }
}
```

## Примеры запроса

### cURL

```bash
curl -X PUT "https://api.pachca.com/api/shared/v1/tasks/22283" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "task": {
    "kind": "reminder",
    "content": "Забрать со склада 21 заказ",
    "due_at": "2020-06-05T12:00:00.000+03:00",
    "priority": 2,
    "performer_ids": [
      12
    ],
    "status": "done",
    "all_day": false,
    "done_at": "2020-06-05T12:00:00.000Z",
    "custom_properties": [
      {
        "id": 78,
        "value": "Синий склад"
      }
    ]
  }
}'
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/tasks/22283', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
      "task": {
          "kind": "reminder",
          "content": "Забрать со склада 21 заказ",
          "due_at": "2020-06-05T12:00:00.000+03:00",
          "priority": 2,
          "performer_ids": [
              12
          ],
          "status": "done",
          "all_day": false,
          "done_at": "2020-06-05T12:00:00.000Z",
          "custom_properties": [
              {
                  "id": 78,
                  "value": "Синий склад"
              }
          ]
      }
  })
});

const data = await response.json();
console.log(data);
```

### Python

```python
import requests

data = {
    'task': {
        'kind': 'reminder',
        'content': 'Забрать со склада 21 заказ',
        'due_at': '2020-06-05T12:00:00.000+03:00',
        'priority': 2,
        'performer_ids': [
            12
        ],
        'status': 'done',
        'all_day': False,
        'done_at': '2020-06-05T12:00:00.000Z',
        'custom_properties': [
            {
                'id': 78,
                'value': 'Синий склад'
            }
        ]
    }
}

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
}

response = requests.put(
    'https://api.pachca.com/api/shared/v1/tasks/22283',
    headers=headers,
    json=data
)

print(response.json())
```

### Node.js

```javascript
const https = require('https');

const options = {
    hostname: 'api.pachca.com',
    port: 443,
    path: '/api/shared/v1/tasks/22283',
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
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

req.write(JSON.stringify({
    "task": {
        "kind": "reminder",
        "content": "Забрать со склада 21 заказ",
        "due_at": "2020-06-05T12:00:00.000+03:00",
        "priority": 2,
        "performer_ids": [
            12
        ],
        "status": "done",
        "all_day": false,
        "done_at": "2020-06-05T12:00:00.000Z",
        "custom_properties": [
            {
                "id": 78,
                "value": "Синий склад"
            }
        ]
    }
}));
req.on('error', (error) => {
    console.error(error);
});

req.end();
```

### Ruby

```ruby
require 'net/http'
require 'json'

uri = URI('https://api.pachca.com/api/shared/v1/tasks/22283')
request = Net::HTTP::Put.new(uri)
request['Authorization'] = 'Bearer YOUR_ACCESS_TOKEN'
request['Content-Type'] = 'application/json'

request.body = {
  'task' => {
    'kind' => 'reminder',
    'content' => 'Забрать со склада 21 заказ',
    'due_at' => '2020-06-05T12:00:00.000+03:00',
    'priority' => 2,
    'performer_ids' => [
      12
    ],
    'status' => 'done',
    'all_day' => false,
    'done_at' => '2020-06-05T12:00:00.000Z',
    'custom_properties' => [
      {
        'id' => 78,
        'value' => 'Синий склад'
      }
    ]
  }
}.to_json

response = Net::HTTP.start(uri.hostname, uri.port, use_ssl: true) do |http|
  http.request(request)
end

puts JSON.parse(response.body)
```

### PHP

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.pachca.com/api/shared/v1/tasks/22283',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'PUT',
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_ACCESS_TOKEN',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
    'task' => [
        'kind' => 'reminder',
        'content' => 'Забрать со склада 21 заказ',
        'due_at' => '2020-06-05T12:00:00.000+03:00',
        'priority' => 2,
        'performer_ids' => [
            12
        ],
        'status' => 'done',
        'all_day' => false,
        'done_at' => '2020-06-05T12:00:00.000Z',
        'custom_properties' => [
            [
                'id' => 78,
                'value' => 'Синий склад'
            ]
        ]
    ]
]),
]);

$response = curl_exec($curl);
curl_close($curl);

echo $response;
?>
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data` (object, **обязательный**): Напоминание
  - `id` (integer, int32, **обязательный**): Идентификатор напоминания
    - Пример: `22283`
  - `kind` (string, **обязательный**): Тип
    - **Возможные значения:**
      - `call`: Позвонить контакту
      - `meeting`: Встреча
      - `reminder`: Простое напоминание
      - `event`: Событие
      - `email`: Написать письмо
  - `content` (string, **обязательный**): Описание
    - Пример: `Забрать со склада 21 заказ`
  - `due_at` (string, date-time, **обязательный**): Срок выполнения напоминания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
    - Пример: `2020-06-05T09:00:00.000Z`
  - `priority` (integer, int32, **обязательный**): Приоритет
    - Пример: `2`
  - `user_id` (integer, int32, **обязательный**): Идентификатор пользователя-создателя напоминания
    - Пример: `12`
  - `chat_id` (integer, int32, **обязательный**): Идентификатор чата, к которому привязано напоминание
    - Пример: `334`
  - `status` (string, **обязательный**): Статус напоминания
    - **Возможные значения:**
      - `done`: Выполнено
      - `undone`: Активно
  - `created_at` (string, date-time, **обязательный**): Дата и время создания напоминания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
    - Пример: `2020-06-04T10:37:57.000Z`
  - `performer_ids` (array[integer], **обязательный**): Массив идентификаторов пользователей, привязанных к напоминанию как «ответственные»
    - Пример: `[12]`
  - `all_day` (boolean, **обязательный**): Напоминание на весь день (без указания времени)
    - Пример: `false`
  - `custom_properties` (array[object], **обязательный**): Дополнительные поля напоминания
    - `id` (integer, int32, **обязательный**): Идентификатор поля
      - Пример: `1678`
    - `name` (string, **обязательный**): Название поля
      - Пример: `Город`
    - `data_type` (string, **обязательный**): Тип поля
      - **Возможные значения:**
        - `string`: Строковое значение
        - `number`: Числовое значение
        - `date`: Дата
        - `link`: Ссылка
    - `value` (string, **обязательный**): Значение
      - Пример: `Санкт-Петербург`

**Пример ответа:**

```json
{
  "data": {
    "id": 22283,
    "kind": "reminder",
    "content": "Забрать со склада 21 заказ",
    "due_at": "2020-06-05T09:00:00.000Z",
    "priority": 2,
    "user_id": 12,
    "chat_id": 334,
    "status": "undone",
    "created_at": "2020-06-04T10:37:57.000Z",
    "performer_ids": [
      12
    ],
    "all_day": false,
    "custom_properties": [
      {
        "id": 1678,
        "name": "Город",
        "data_type": "string",
        "value": "Санкт-Петербург"
      }
    ]
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

### 404: The server cannot find the requested resource.

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

