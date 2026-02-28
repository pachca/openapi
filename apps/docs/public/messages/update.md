# Редактирование сообщения

**Метод**: `PUT`

**Путь**: `/messages/{id}`

> **Скоуп:** `messages:update`

Метод для редактирования сообщения или комментария.

Для редактирования сообщения вам необходимо знать его `id` и указать его в `URL` запроса. Все редактируемые параметры сообщения указываются в теле запроса.

## Параметры

### Path параметры

- `id` (integer, **обязательный**): Идентификатор сообщения
  - Пример: `194275`


## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `message` (object, **обязательный**): Собранный объект параметров редактируемого сообщения
  - `content` (string, опциональный): Текст сообщения
    - Пример: `Вот попробуйте написать правильно это с первого раза: Будущий, Полощи, Прийти, Грейпфрут, Мозаика, Бюллетень, Дуршлаг, Винегрет.`
  - `files` (array[object], опциональный): Прикрепляемые файлы
    - `key` (string, **обязательный**): Путь к файлу, полученный в результате [загрузки файла](POST /direct_url)
      - Пример: `attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/logo.png`
    - `name` (string, **обязательный**): Название файла, которое вы хотите отображать пользователю (рекомендуется писать вместе с расширением)
      - Пример: `logo.png`
    - `file_type` (string, опциональный): Тип файла: файл (file), изображение (image)
      - Пример: `image`
    - `size` (integer, int32, опциональный): Размер файла в байтах, отображаемый пользователю
      - Пример: `12345`
    - `width` (integer, int32, опциональный): Ширина изображения в px (используется в случае, если file_type указан как image)
      - Пример: `800`
    - `height` (integer, int32, опциональный): Высота изображения в px (используется в случае, если file_type указан как image)
      - Пример: `600`
  - `buttons` (array[array], опциональный): Массив строк, каждая из которых представлена массивом кнопок. Максимум 100 кнопок у сообщения, до 8 кнопок в строке. Для удаления кнопок пришлите пустой массив.
    - Пример: `[[{"text":"Подробнее","url":"https://example.com/details"}]]`
  - `display_avatar_url` (string, опциональный): Ссылка на специальную аватарку отправителя для этого сообщения. Использование этого поля возможно только с access_token бота.
    - Пример: `https://example.com/avatar.png`
  - `display_name` (string, опциональный): Полное специальное имя отправителя для этого сообщения. Использование этого поля возможно только с access_token бота.
    - Пример: `Бот Поддержки`

### Пример

```json
{
  "message": {
    "content": "Вот попробуйте написать правильно это с первого раза: Будущий, Полощи, Прийти, Грейпфрут, Мозаика, Бюллетень, Дуршлаг, Винегрет.",
    "files": [
      {
        "key": "attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/logo.png",
        "name": "logo.png",
        "file_type": "image",
        "size": 12345,
        "width": 800,
        "height": 600
      }
    ],
    "buttons": [
      [
        {
          "text": "Подробнее",
          "url": "https://example.com/details"
        }
      ]
    ],
    "display_avatar_url": "https://example.com/avatar.png",
    "display_name": "Бот Поддержки"
  }
}
```

## Примеры запроса

### cURL

```bash
curl -X PUT "https://api.pachca.com/api/shared/v1/messages/194275" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "message": {
    "content": "Вот попробуйте написать правильно это с первого раза: Будущий, Полощи, Прийти, Грейпфрут, Мозаика, Бюллетень, Дуршлаг, Винегрет.",
    "files": [
      {
        "key": "attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/logo.png",
        "name": "logo.png",
        "file_type": "image",
        "size": 12345,
        "width": 800,
        "height": 600
      }
    ],
    "buttons": [
      [
        {
          "text": "Подробнее",
          "url": "https://example.com/details"
        }
      ]
    ],
    "display_avatar_url": "https://example.com/avatar.png",
    "display_name": "Бот Поддержки"
  }
}'
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/messages/194275', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
      "message": {
          "content": "Вот попробуйте написать правильно это с первого раза: Будущий, Полощи, Прийти, Грейпфрут, Мозаика, Бюллетень, Дуршлаг, Винегрет.",
          "files": [
              {
                  "key": "attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/logo.png",
                  "name": "logo.png",
                  "file_type": "image",
                  "size": 12345,
                  "width": 800,
                  "height": 600
              }
          ],
          "buttons": [
              [
                  {
                      "text": "Подробнее",
                      "url": "https://example.com/details"
                  }
              ]
          ],
          "display_avatar_url": "https://example.com/avatar.png",
          "display_name": "Бот Поддержки"
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
        'content': 'Вот попробуйте написать правильно это с первого раза: Будущий, Полощи, Прийти, Грейпфрут, Мозаика, Бюллетень, Дуршлаг, Винегрет.',
        'files': [
            {
                'key': 'attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/logo.png',
                'name': 'logo.png',
                'file_type': 'image',
                'size': 12345,
                'width': 800,
                'height': 600
            }
        ],
        'buttons': [
            [
                {
                    'text': 'Подробнее',
                    'url': 'https://example.com/details'
                }
            ]
        ],
        'display_avatar_url': 'https://example.com/avatar.png',
        'display_name': 'Бот Поддержки'
    }
}

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
}

response = requests.put(
    'https://api.pachca.com/api/shared/v1/messages/194275',
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
    path: '/api/shared/v1/messages/194275',
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
    "message": {
        "content": "Вот попробуйте написать правильно это с первого раза: Будущий, Полощи, Прийти, Грейпфрут, Мозаика, Бюллетень, Дуршлаг, Винегрет.",
        "files": [
            {
                "key": "attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/logo.png",
                "name": "logo.png",
                "file_type": "image",
                "size": 12345,
                "width": 800,
                "height": 600
            }
        ],
        "buttons": [
            [
                {
                    "text": "Подробнее",
                    "url": "https://example.com/details"
                }
            ]
        ],
        "display_avatar_url": "https://example.com/avatar.png",
        "display_name": "Бот Поддержки"
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

uri = URI('https://api.pachca.com/api/shared/v1/messages/194275')
request = Net::HTTP::Put.new(uri)
request['Authorization'] = 'Bearer YOUR_ACCESS_TOKEN'
request['Content-Type'] = 'application/json'

request.body = {
  'message' => {
    'content' => 'Вот попробуйте написать правильно это с первого раза: Будущий, Полощи, Прийти, Грейпфрут, Мозаика, Бюллетень, Дуршлаг, Винегрет.',
    'files' => [
      {
        'key' => 'attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/logo.png',
        'name' => 'logo.png',
        'file_type' => 'image',
        'size' => 12345,
        'width' => 800,
        'height' => 600
      }
    ],
    'buttons' => [
      [
        {
          'text' => 'Подробнее',
          'url' => 'https://example.com/details'
        }
      ]
    ],
    'display_avatar_url' => 'https://example.com/avatar.png',
    'display_name' => 'Бот Поддержки'
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
    CURLOPT_URL => 'https://api.pachca.com/api/shared/v1/messages/194275',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'PUT',
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_ACCESS_TOKEN',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
    'message' => [
        'content' => 'Вот попробуйте написать правильно это с первого раза: Будущий, Полощи, Прийти, Грейпфрут, Мозаика, Бюллетень, Дуршлаг, Винегрет.',
        'files' => [
            [
                'key' => 'attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/logo.png',
                'name' => 'logo.png',
                'file_type' => 'image',
                'size' => 12345,
                'width' => 800,
                'height' => 600
            ]
        ],
        'buttons' => [
            [
                [
                    'text' => 'Подробнее',
                    'url' => 'https://example.com/details'
                ]
            ]
        ],
        'display_avatar_url' => 'https://example.com/avatar.png',
        'display_name' => 'Бот Поддержки'
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

- `data` (object, **обязательный**): Сообщение
  - `id` (integer, int32, **обязательный**): Идентификатор сообщения
    - Пример: `194275`
  - `entity_type` (string, **обязательный**): Тип сущности, к которой относится сообщение
    - **Возможные значения:**
      - `discussion`: Беседа или канал
      - `thread`: Тред
      - `user`: Пользователь
  - `entity_id` (integer, int32, **обязательный**): Идентификатор сущности, к которой относится сообщение (беседы/канала, треда или пользователя)
    - Пример: `334`
  - `chat_id` (integer, int32, **обязательный**): Идентификатор чата, в котором находится сообщение
    - Пример: `334`
  - `root_chat_id` (integer, int32, **обязательный**): Идентификатор корневого чата. Для сообщений в тредах — идентификатор чата, в котором был создан тред. Для обычных сообщений совпадает с `chat_id`.
    - Пример: `334`
  - `content` (string, **обязательный**): Текст сообщения
    - Пример: `Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)`
  - `user_id` (integer, int32, **обязательный**): Идентификатор пользователя, создавшего сообщение
    - Пример: `12`
  - `created_at` (string, date-time, **обязательный**): Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
    - Пример: `2021-08-28T15:57:23.000Z`
  - `url` (string, **обязательный**): Прямая ссылка на сообщение
    - Пример: `https://app.pachca.com/chats/334?message=194275`
  - `files` (array[object], **обязательный**): Прикрепленные файлы
    - `id` (integer, int32, **обязательный**): Идентификатор файла
      - Пример: `3560`
    - `key` (string, **обязательный**): Путь к файлу
      - Пример: `attaches/files/12/21zu7934-02e1-44d9-8df2-0f970c259796/congrat.png`
    - `name` (string, **обязательный**): Название файла с расширением
      - Пример: `congrat.png`
    - `file_type` (string, **обязательный**): Тип файла
      - **Возможные значения:**
        - `file`: Обычный файл
        - `image`: Изображение
    - `url` (string, **обязательный**): Прямая ссылка на скачивание файла
      - Пример: `https://pachca-prod-uploads.s3.storage.selcloud.ru/attaches/files/12/21zu7934-02e1-44d9-8df2-0f970c259796/congrat.png?response-cache-control=max-age%3D3600%3B&response-content-disposition=attachment&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=142155_staply%2F20231107%2Fru-1a%2Fs3%2Faws4_request&X-Amz-Date=20231107T160412&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=98765asgfadsfdSaDSd4sdfg35asdf67sadf8`
    - `width` (integer, int32, опциональный): Ширина изображения в пикселях
      - Пример: `1920`
    - `height` (integer, int32, опциональный): Высота изображения в пикселях
      - Пример: `1080`
  - `buttons` (array[array], **обязательный**): Массив строк, каждая из которых представлена массивом кнопок
  - `thread` (object, **обязательный**): Тред сообщения
    - `id` (integer, int64, **обязательный**): Идентификатор созданного треда (используется для отправки [новых комментариев](POST /messages) в тред)
      - Пример: `265142`
    - `chat_id` (integer, int64, **обязательный**): Идентификатор чата треда (используется для отправки [новых комментариев](POST /messages) в тред и получения [списка комментариев](GET /messages))
      - Пример: `2637266155`
    - `message_id` (integer, int64, **обязательный**): Идентификатор сообщения, к которому был создан тред
      - Пример: `154332686`
    - `message_chat_id` (integer, int64, **обязательный**): Идентификатор чата сообщения
      - Пример: `2637266154`
    - `updated_at` (string, date-time, **обязательный**): Дата и время обновления треда (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
      - Пример: `2023-02-01T19:20:47.204Z`
  - `forwarding` (object, **обязательный**): Информация о пересланном сообщении
    - `original_message_id` (integer, int32, **обязательный**): Идентификатор оригинального сообщения
      - Пример: `194275`
    - `original_chat_id` (integer, int32, **обязательный**): Идентификатор чата, в котором находится оригинальное сообщение
      - Пример: `334`
    - `author_id` (integer, int32, **обязательный**): Идентификатор пользователя, создавшего оригинальное сообщение
      - Пример: `12`
    - `original_created_at` (string, date-time, **обязательный**): Дата и время создания оригинального сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
      - Пример: `2025-01-15T10:30:00.000Z`
    - `original_thread_id` (integer, int32, **обязательный**): Идентификатор треда, в котором находится оригинальное сообщение
      - Пример: `null`
    - `original_thread_message_id` (integer, int32, **обязательный**): Идентификатор сообщения, к которому был создан тред, в котором находится оригинальное сообщение
      - Пример: `null`
    - `original_thread_parent_chat_id` (integer, int32, **обязательный**): Идентификатор чата сообщения, к которому был создан тред, в котором находится оригинальное сообщение
      - Пример: `null`
  - `parent_message_id` (integer, int32, **обязательный**): Идентификатор сообщения, к которому написан ответ
    - Пример: `null`
  - `display_avatar_url` (string, **обязательный**): Ссылка на аватарку отправителя сообщения
    - Пример: `null`
  - `display_name` (string, **обязательный**): Полное имя отправителя сообщения
    - Пример: `null`
  - `changed_at` (string, date-time, **обязательный**): Дата и время последнего редактирования сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
    - Пример: `2021-08-28T16:10:00.000Z`
  - `deleted_at` (string, date-time, **обязательный**): Дата и время удаления сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
    - Пример: `null`

**Пример ответа:**

```json
{
  "data": {
    "id": 194275,
    "entity_type": "discussion",
    "entity_id": 334,
    "chat_id": 334,
    "root_chat_id": 334,
    "content": "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)",
    "user_id": 12,
    "created_at": "2021-08-28T15:57:23.000Z",
    "url": "https://app.pachca.com/chats/334?message=194275",
    "files": [
      {
        "id": 3560,
        "key": "attaches/files/12/21zu7934-02e1-44d9-8df2-0f970c259796/congrat.png",
        "name": "congrat.png",
        "file_type": "image",
        "url": "https://pachca-prod-uploads.s3.storage.selcloud.ru/attaches/files/12/21zu7934-02e1-44d9-8df2-0f970c259796/congrat.png?response-cache-control=max-age%3D3600%3B&response-content-disposition=attachment&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=142155_staply%2F20231107%2Fru-1a%2Fs3%2Faws4_request&X-Amz-Date=20231107T160412&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=98765asgfadsfdSaDSd4sdfg35asdf67sadf8",
        "width": 1920,
        "height": 1080
      }
    ],
    "buttons": [
      [
        {
          "text": "Подробнее",
          "url": "https://example.com/details",
          "data": "awesome"
        }
      ]
    ],
    "thread": {
      "id": 265142,
      "chat_id": 2637266155,
      "message_id": 154332686,
      "message_chat_id": 2637266154,
      "updated_at": "2023-02-01T19:20:47.204Z"
    },
    "forwarding": {
      "original_message_id": 194275,
      "original_chat_id": 334,
      "author_id": 12,
      "original_created_at": "2025-01-15T10:30:00.000Z",
      "original_thread_id": null,
      "original_thread_message_id": null,
      "original_thread_parent_chat_id": null
    },
    "parent_message_id": null,
    "display_avatar_url": null,
    "display_name": null,
    "changed_at": "2021-08-28T16:10:00.000Z",
    "deleted_at": null
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

