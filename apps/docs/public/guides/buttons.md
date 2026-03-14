
# Кнопки в сообщениях

Кнопки позволяют добавить к сообщению бота интерактивные элементы: ссылки для перехода на внешние ресурсы и кнопки действий для обработки на сервере. Кнопки располагаются под текстом сообщения в виде строк — каждая строка полностью занимается вложенными в неё кнопками.

![Сообщение от бота с кнопками](/images/buttons/buttons_example.gif)

*Сообщение от бота с кнопками*


## Как это работает


  ### Шаг 1. Создайте бота

Перейдите в **Автоматизации** > **Интеграции** > **Чат-боты и Вебхуки** и создайте бота. Подробнее — в разделе [Боты](/guides/bots).


  ### Шаг 2. Отправьте сообщение с кнопками

Используйте метод [Новое сообщение](POST /messages) с полем `buttons` — массив строк, каждая из которых содержит массив кнопок.


  ### Шаг 3. Настройте исходящий вебхук

Для обработки Data-кнопок укажите Webhook URL в настройках бота на вкладке **Исходящий Webhook** и включите событие **Нажатие кнопок**. Подробнее — в разделе [Исходящие вебхуки](/guides/webhook).


  ### Шаг 4. Обработайте нажатие

При нажатии Data-кнопки бот получает вебхук с данными кнопки. Обработайте событие и дайте обратную связь — отредактируйте сообщение, отправьте новое или откройте [модальную форму](/guides/forms/overview).


## Типы кнопок

### URL-кнопки

URL-кнопка перенаправляет пользователя по указанной ссылке. При нажатии отображается модальное окно с подтверждением перехода.

```json
{
  "text": "Все мои проекты",
  "url": "https://projects.com/list"
}
```

![Подтверждение перехода по ссылке](/images/buttons/buttons_url_confirm.png)

*Подтверждение перехода по ссылке*


### Data-кнопки

Data-кнопка отправляет данные на сервер через [исходящий вебхук](/guides/webhook). При нажатии бот получает вебхук с информацией о кнопке, сообщении и пользователе, что позволяет реализовать любую логику обработки.

```json
{
  "text": "👍 Согласиться",
  "data": "vote_yes"
}
```

## Отправка кнопок

Для отправки используйте метод [Новое сообщение](POST /messages) с полем `buttons`. Поле представляет собой массив строк, каждая из которых содержит массив кнопок. В одной строке можно комбинировать URL-кнопки и Data-кнопки.

**Сообщение с кнопками**

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


> Метод [Редактирование сообщения](PUT /messages/{id}) также поддерживает поле `buttons`. Для удаления всех кнопок передайте пустой массив `[]`.


## Обработка нажатий

Для получения событий о нажатиях Data-кнопок настройте [исходящий вебхук](/guides/webhook) и включите событие **Нажатие кнопок**.

При нажатии кнопки бот получает вебхук:

#### ButtonWebhookPayload

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


После получения события вы можете:

- [Отредактировать сообщение](PUT /messages/{id}) — убрать кнопки, добавить новые или обновить текст
- [Отправить новое сообщение](POST /messages) — как ответ пользователю с результатом действия
- [Открыть модальную форму](/guides/forms/overview) — используя `trigger_id` из вебхука (действителен 3 секунды)

## Ограничения

- Максимальное количество кнопок в строке — 8
- Максимальное число кнопок у сообщения — 100
- Максимальная длина `text` на кнопке — 255 символов
- Максимальная длина `data` у кнопки — 255 символов
