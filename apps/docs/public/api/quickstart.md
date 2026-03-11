
# Быстрый старт

Это руководство поможет вам выполнить первый запрос к API Пачки — от получения токена до отправки сообщения.

> Для работы с API нужен аккаунт Пачки с доступом к API (настраивается [владельцем пространства](/api/authorization#настройка-доступа)) и любой HTTP-клиент — терминал с cURL, [Postman или Bruno](/api/requests-responses#postman--bruno).


## Первый запрос


  ### Шаг 1. Получите токен

Для работы с API вам нужен токен доступа. Есть два способа его получить:

    - **Персональный токен** — в интерфейсе Пачки: **«Автоматизации»** → **«API»** (доступно администраторам)
    - **Токен бота** — создайте бота в **«Автоматизации»** → **«Интеграции»** → **«Чат-боты и Вебхуки»**

    > **Внимание:** Токен показывается один раз при создании — сохраните его в надёжном месте. Не публикуйте токен в открытых репозиториях и не передавайте третьим лицам.


    Подробнее о типах токенов и скоупах — в разделе [Авторизация](/api/authorization).


  ### Шаг 2. Проверьте токен

Получим информацию о своем профиле — простейший запрос [Информация о профиле](GET /profile) без параметров:

    **Получение профиля**

### cURL

```bash
curl "https://api.pachca.com/api/shared/v1/profile" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/profile', {
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

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
}

response = requests.get(
    'https://api.pachca.com/api/shared/v1/profile',
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
    path: '/api/shared/v1/profile',
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

uri = URI('https://api.pachca.com/api/shared/v1/profile')
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

$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.pachca.com/api/shared/v1/profile',
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


    Все запросы отправляются на базовый URL `https://api.pachca.com/api/shared/v1`. Токен передаётся в заголовке `Authorization: Bearer TOKEN`. Ответ содержит данные в объекте `data`, а для списочных методов — ещё и блок `meta` с информацией о [пагинации](/api/pagination).

    > Если вместо данных вы получили `401 Unauthorized` — проверьте, что токен скопирован без лишних пробелов и что у него есть нужный [скоуп](/api/authorization#скоупы).


  ### Шаг 3. Отправьте сообщение

Теперь отправим сообщение в беседу. Все параметры — в описании метода [Новое сообщение](POST /messages).

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


    Замените `entity_id` на ID вашей беседы или канала — его можно узнать в URL чата в веб-версии Пачки или через метод [Список каналов и бесед](GET /chats).


## Следующие шаги

- [Авторизация](/api/authorization) — типы токенов, скоупы и разрешения
- [Запросы и ответы](/api/requests-responses) — формат данных и инструменты тестирования
- [Ошибки и лимиты](/api/errors) — коды ошибок и rate limits
- [Пагинация](/api/pagination) — обход больших списков
- [Боты](/guides/bots) — создание ботов и автоматизаций
- [SDK](/api/sdk) — типизированные клиентские библиотеки
