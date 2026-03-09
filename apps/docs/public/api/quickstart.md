
# Быстрый старт

Это руководство поможет вам выполнить первый запрос к API Пачки — от получения токена до отправки сообщения.

## Получите токен

Для работы с API вам нужен токен доступа. Есть два способа его получить:

- **Персональный токен** — в интерфейсе Пачки: **«Автоматизации»** → **«API»** (доступно администраторам)
- **Токен бота** — создайте бота в **«Автоматизации»** → **«Интеграции»** → **«Чат-боты и Вебхуки»**

Подробнее о типах токенов и скоупах — в разделе [Авторизация](/api/authorization).

## Сделайте первый запрос

Получим список сотрудников — простейший GET-запрос для проверки, что токен работает:

**Получение списка сотрудников**

### cURL

```bash
curl "https://api.pachca.com/api/shared/v1/users?query=Олег&limit=1&cursor=eyJpZCI6MTAsImRpciI6ImFzYyJ9" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/users?query=Олег&limit=1&cursor=eyJpZCI6MTAsImRpciI6ImFzYyJ9', {
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
    'query': 'Олег',
    'limit': 1,
    'cursor': 'eyJpZCI6MTAsImRpciI6ImFzYyJ9',
}

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
}

response = requests.get(
    'https://api.pachca.com/api/shared/v1/users',
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
    path: '/api/shared/v1/users?query=Олег&limit=1&cursor=eyJpZCI6MTAsImRpciI6ImFzYyJ9',
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

uri = URI('https://api.pachca.com/api/shared/v1/users')
params = {
  'query' => 'Олег',
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

$params = ['query' => 'Олег', 'limit' => 1, 'cursor' => 'eyJpZCI6MTAsImRpciI6ImFzYyJ9'];
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.pachca.com/api/shared/v1/users?' . http_build_query($params)',
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


Токен передаётся в заголовке `Authorization: Bearer TOKEN`.

## Разберите ответ

API возвращает данные в формате JSON. Результат оборачивается в массив `data`:

**Пример ответа**

```json
{
  "data": [
    {
      "id": 163,
      "first_name": "Иван",
      "last_name": "Петров",
      "role": "admin",
      "suspended": false,
      ...
    }
  ]
}
```


Для списочных методов в ответе также есть блок `meta` с информацией о пагинации — подробнее в разделе [Пагинация](/api/pagination).

## Отправьте сообщение

Теперь попробуем отправить сообщение — первый write-запрос:

**Отправка сообщения**

### cURL

```bash
curl "https://api.pachca.com/api/shared/v1/messages" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "message": {
    "entity_type": "discussion",
    "entity_id": 334,
    "content": "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)",
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
        },
        {
          "text": "Отлично!",
          "data": "awesome"
        }
      ]
    ],
    "parent_message_id": 194270,
    "display_avatar_url": "https://example.com/avatar.png",
    "display_name": "Бот Поддержки",
    "skip_invite_mentions": false,
    "link_preview": false
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
          "entity_id": 334,
          "content": "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)",
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
                  },
                  {
                      "text": "Отлично!",
                      "data": "awesome"
                  }
              ]
          ],
          "parent_message_id": 194270,
          "display_avatar_url": "https://example.com/avatar.png",
          "display_name": "Бот Поддержки",
          "skip_invite_mentions": false,
          "link_preview": false
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
        'entity_id': 334,
        'content': 'Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)',
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
                },
                {
                    'text': 'Отлично!',
                    'data': 'awesome'
                }
            ]
        ],
        'parent_message_id': 194270,
        'display_avatar_url': 'https://example.com/avatar.png',
        'display_name': 'Бот Поддержки',
        'skip_invite_mentions': False,
        'link_preview': False
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
        "entity_id": 334,
        "content": "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)",
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
                },
                {
                    "text": "Отлично!",
                    "data": "awesome"
                }
            ]
        ],
        "parent_message_id": 194270,
        "display_avatar_url": "https://example.com/avatar.png",
        "display_name": "Бот Поддержки",
        "skip_invite_mentions": false,
        "link_preview": false
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
    'entity_id' => 334,
    'content' => 'Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)',
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
        },
        {
          'text' => 'Отлично!',
          'data' => 'awesome'
        }
      ]
    ],
    'parent_message_id' => 194270,
    'display_avatar_url' => 'https://example.com/avatar.png',
    'display_name' => 'Бот Поддержки',
    'skip_invite_mentions' => false,
    'link_preview' => false
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
        'entity_id' => 334,
        'content' => 'Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)',
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
                ],
                [
                    'text' => 'Отлично!',
                    'data' => 'awesome'
                ]
            ]
        ],
        'parent_message_id' => 194270,
        'display_avatar_url' => 'https://example.com/avatar.png',
        'display_name' => 'Бот Поддержки',
        'skip_invite_mentions' => false,
        'link_preview' => false
    ]
]),
]);

$response = curl_exec($curl);
curl_close($curl);

echo $response;
?>
```


Укажите `entity_type` и `entity_id` — куда отправить сообщение. Подробнее о типах адресатов — в разделе [Сущности](/guides/entities).

## Следующие шаги

- [Авторизация](/api/authorization) — типы токенов, скоупы, роли
- [Запросы и ответы](/api/requests-responses) — формат запросов и ответов
- [Ошибки и лимиты](/api/errors) — коды ошибок и rate limits
- [Боты](/guides/bots) — создание ботов и автоматизаций
- [SDK](/api/sdk) — клиентские библиотеки для 5 языков
