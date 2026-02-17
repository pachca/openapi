# Новое сообщение

**Метод**: `POST`

**Путь**: `/messages`

Метод для отправки сообщения в беседу или канал, личного сообщения пользователю или комментария в тред.

При использовании `entity_type: "discussion"` (или просто без указания `entity_type`) допускается отправка любого `chat_id` в поле `entity_id`. То есть, сообщение можно отправить зная только идентификатор чата. При этом, вы имеете возможность отправить сообщение в тред по его идентификатору или личное сообщение по идентификатору пользователя.

Для отправки личного сообщения пользователю создавать чат не требуется. Достаточно указать `entity_type: "user"` и идентификатор пользователя. Чат будет создан автоматически, если между вами ещё не было переписки. Между двумя пользователями может быть только один личный чат.

## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `message` (object, **обязательный**): Собранный объект параметров создаваемого сообщения
  - `entity_type` (string, опциональный): Тип сущности
    - **Возможные значения:**
      - `discussion`: Беседа или канал
      - `thread`: Тред
      - `user`: Пользователь
  - `entity_id` (integer, int32, **обязательный**): Идентификатор сущности
  - `content` (string, **обязательный**): Текст сообщения
  - `files` (array[object], опциональный): Прикрепляемые файлы
    - `key` (string, **обязательный**): Путь к файлу, полученный в результате [загрузки файла](POST /direct_url)
    - `name` (string, **обязательный**): Название файла, которое вы хотите отображать пользователю (рекомендуется писать вместе с расширением)
    - `file_type` (string, **обязательный**): Тип файла
      - **Возможные значения:**
        - `file`: Файл
        - `image`: Изображение
    - `size` (integer, int32, **обязательный**): Размер файла в байтах, отображаемый пользователю
    - `width` (integer, int32, опциональный): Ширина изображения в px (используется в случае, если file_type указан как image)
    - `height` (integer, int32, опциональный): Высота изображения в px (используется в случае, если file_type указан как image)
  - `buttons` (array[array], опциональный): Массив строк, каждая из которых представлена массивом кнопок. Максимум 100 кнопок у сообщения, до 8 кнопок в строке.
  - `parent_message_id` (integer, int32, опциональный): Идентификатор сообщения. Указывается в случае, если вы отправляете ответ на другое сообщение.
  - `display_avatar_url` (string, опциональный): Ссылка на специальную аватарку отправителя для этого сообщения. Использование этого поля возможно только с access_token бота.
    - Максимальная длина: 255 символов
  - `display_name` (string, опциональный): Полное специальное имя отправителя для этого сообщения. Использование этого поля возможно только с access_token бота.
    - Максимальная длина: 255 символов
  - `skip_invite_mentions` (boolean, опциональный): Пропуск добавления упоминаемых пользователей в тред. Работает только при отправке сообщения в тред.
    - По умолчанию: `false`
  - `link_preview` (boolean, опциональный): Отображение предпросмотра первой найденной ссылки в тексте сообщения
    - По умолчанию: `false`

### Пример

```json
{
  "message": {
    "entity_type": "discussion",
    "entity_id": 198,
    "content": "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)",
    "buttons": [
      [
        {
          "text": "Подробнее",
          "url": "https://example.com/details"
        },
        {
          "text": "Отлично!",
          "data": "awesome"
        }
      ]
    ]
  }
}
```

## Примеры запроса

### cURL

```bash
curl "https://api.pachca.com/api/shared/v1/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "message": {
    "entity_type": "discussion",
    "entity_id": 198,
    "content": "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)",
    "buttons": [
      [
        {
          "text": "Подробнее",
          "url": "https://example.com/details"
        },
        {
          "text": "Отлично!",
          "data": "awesome"
        }
      ]
    ]
  }
}'
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/messages', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
      "message": {
          "entity_type": "discussion",
          "entity_id": 198,
          "content": "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)",
          "buttons": [
              [
                  {
                      "text": "Подробнее",
                      "url": "https://example.com/details"
                  },
                  {
                      "text": "Отлично!",
                      "data": "awesome"
                  }
              ]
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
    'message': {
        'entity_type': 'discussion',
        'entity_id': 198,
        'content': 'Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)',
        'buttons': [
            [
                {
                    'text': 'Подробнее',
                    'url': 'https://example.com/details'
                },
                {
                    'text': 'Отлично!',
                    'data': 'awesome'
                }
            ]
        ]
    }
}

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
}

response = requests.post(
    'https://api.pachca.com/api/shared/v1/messages',
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
    path: '/api/shared/v1/messages',
    method: 'POST',
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
    "message": {
        "entity_type": "discussion",
        "entity_id": 198,
        "content": "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)",
        "buttons": [
            [
                {
                    "text": "Подробнее",
                    "url": "https://example.com/details"
                },
                {
                    "text": "Отлично!",
                    "data": "awesome"
                }
            ]
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

uri = URI('https://api.pachca.com/api/shared/v1/messages')
request = Net::HTTP::Post.new(uri)
request['Authorization'] = 'Bearer YOUR_ACCESS_TOKEN'
request['Content-Type'] = 'application/json'

request.body = {
  'message' => {
    'entity_type' => 'discussion',
    'entity_id' => 198,
    'content' => 'Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)',
    'buttons' => [
      [
        {
          'text' => 'Подробнее',
          'url' => 'https://example.com/details'
        },
        {
          'text' => 'Отлично!',
          'data' => 'awesome'
        }
      ]
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
    CURLOPT_URL => 'https://api.pachca.com/api/shared/v1/messages',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'POST',
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_ACCESS_TOKEN',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
    'message' => [
        'entity_type' => 'discussion',
        'entity_id' => 198,
        'content' => 'Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)',
        'buttons' => [
            [
                [
                    'text' => 'Подробнее',
                    'url' => 'https://example.com/details'
                ],
                [
                    'text' => 'Отлично!',
                    'data' => 'awesome'
                ]
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

### 201: The request has succeeded and a new resource has been created as a result.

**Схема ответа:**

- `data` (object, **обязательный**): Сообщение
  - `id` (integer, int32, **обязательный**): Идентификатор сообщения
  - `entity_type` (string, **обязательный**): Тип сущности, к которой относится сообщение
    - **Возможные значения:**
      - `discussion`: Беседа или канал
      - `thread`: Тред
      - `user`: Пользователь
  - `entity_id` (integer, int32, **обязательный**): Идентификатор сущности, к которой относится сообщение (беседы/канала, треда или пользователя)
  - `chat_id` (integer, int32, **обязательный**): Идентификатор чата, в котором находится сообщение
  - `content` (string, **обязательный**): Текст сообщения
  - `user_id` (integer, int32, **обязательный**): Идентификатор пользователя, создавшего сообщение
  - `created_at` (string, date-time, **обязательный**): Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
  - `url` (string, **обязательный**): Прямая ссылка на сообщение
  - `files` (array[object], **обязательный**): Прикрепленные файлы
    - `id` (integer, int32, **обязательный**): Идентификатор файла
    - `key` (string, **обязательный**): Путь к файлу
    - `name` (string, **обязательный**): Название файла с расширением
    - `file_type` (string, **обязательный**): Тип файла
      - **Возможные значения:**
        - `file`: Обычный файл
        - `image`: Изображение
    - `url` (string, **обязательный**): Прямая ссылка на скачивание файла
    - `width` (integer, int32, опциональный): Ширина изображения в пикселях
    - `height` (integer, int32, опциональный): Высота изображения в пикселях
  - `buttons` (array[array], **обязательный**): Массив строк, каждая из которых представлена массивом кнопок
  - `thread` (object, **обязательный**): Тред сообщения
    - `id` (integer, int64, **обязательный**): Идентификатор созданного треда (используется для отправки [новых комментариев](POST /messages) в тред)
    - `chat_id` (integer, int64, **обязательный**): Идентификатор чата треда (используется для отправки [новых комментариев](POST /messages) в тред и получения [списка комментариев](GET /messages))
    - `message_id` (integer, int64, **обязательный**): Идентификатор сообщения, к которому был создан тред
    - `message_chat_id` (integer, int64, **обязательный**): Идентификатор чата сообщения
    - `updated_at` (string, date-time, **обязательный**): Дата и время обновления треда (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
  - `forwarding` (object, **обязательный**): Информация о пересланном сообщении
    - `original_message_id` (integer, int32, **обязательный**): Идентификатор оригинального сообщения
    - `original_chat_id` (integer, int32, **обязательный**): Идентификатор чата, в котором находится оригинальное сообщение
    - `author_id` (integer, int32, **обязательный**): Идентификатор пользователя, создавшего оригинальное сообщение
    - `original_created_at` (string, date-time, **обязательный**): Дата и время создания оригинального сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
    - `original_thread_id` (integer, int32, **обязательный**): Идентификатор треда, в котором находится оригинальное сообщение
    - `original_thread_message_id` (integer, int32, **обязательный**): Идентификатор сообщения, к которому был создан тред, в котором находится оригинальное сообщение
    - `original_thread_parent_chat_id` (integer, int32, **обязательный**): Идентификатор чата сообщения, к которому был создан тред, в котором находится оригинальное сообщение
  - `parent_message_id` (integer, int32, **обязательный**): Идентификатор сообщения, к которому написан ответ
  - `display_avatar_url` (string, **обязательный**): Ссылка на аватарку отправителя сообщения
  - `display_name` (string, **обязательный**): Полное имя отправителя сообщения

**Пример ответа:**

```json
{
  "data": {
    "id": 194275,
    "entity_type": "discussion",
    "entity_id": 334,
    "chat_id": 334,
    "content": "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)",
    "user_id": 185,
    "created_at": "2021-08-28T15:57:23.000Z",
    "url": "https://app.pachca.com/chats/334?message=194275",
    "files": [],
    "buttons": [
      [
        {
          "text": "Подробнее",
          "url": "https://example.com/details"
        },
        {
          "text": "Отлично!",
          "data": "awesome"
        }
      ]
    ],
    "thread": null,
    "forwarding": null,
    "parent_message_id": null,
    "display_avatar_url": null,
    "display_name": null
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

