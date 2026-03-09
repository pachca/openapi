# Информация о профиле

**Метод**: `GET`

**Путь**: `/profile`

> **Скоуп:** `profile:read`

Метод для получения информации о своем профиле.

## Примеры запроса

### CLI

```bash
pachca api profile \
  --json \
  --token YOUR_ACCESS_TOKEN
```

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

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data` (object, **обязательный**): Сотрудник
  - `id` (integer, int32, **обязательный**): Идентификатор пользователя
    - Пример: `12`
  - `first_name` (string, **обязательный**): Имя
    - Пример: `Олег`
  - `last_name` (string, **обязательный**): Фамилия
    - Пример: `Петров`
  - `nickname` (string, **обязательный**): Имя пользователя
    - Пример: ``
  - `email` (string, **обязательный**): Электронная почта
    - Пример: `olegp@example.com`
  - `phone_number` (string, **обязательный**): Телефон
    - Пример: ``
  - `department` (string, **обязательный**): Департамент
    - Пример: `Продукт`
  - `title` (string, **обязательный**): Должность
    - Пример: `CIO`
  - `role` (string, **обязательный**): Уровень доступа
    - **Возможные значения:**
      - `admin`: Администратор
      - `user`: Сотрудник
      - `multi_guest`: Мульти-гость
      - `guest`: Гость
  - `suspended` (boolean, **обязательный**): Деактивация пользователя
    - Пример: `false`
  - `invite_status` (string, **обязательный**): Статус приглашения
    - **Возможные значения:**
      - `confirmed`: Принято
      - `sent`: Отправлено
  - `list_tags` (array[string], **обязательный**): Массив тегов, привязанных к сотруднику
    - Пример: `["Product","Design"]`
  - `custom_properties` (array[object], **обязательный**): Дополнительные поля сотрудника
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
  - `user_status` (object, **обязательный**): Статус
    - `emoji` (string, **обязательный**): Emoji символ статуса
      - Пример: `🎮`
    - `title` (string, **обязательный**): Текст статуса
      - Пример: `Очень занят`
    - `expires_at` (string, date-time, **обязательный**): Срок жизни статуса (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
      - Пример: `2024-04-08T10:00:00.000Z`
    - `is_away` (boolean, **обязательный**): Режим «Нет на месте»
      - Пример: `false`
    - `away_message` (object, **обязательный**): Сообщение при режиме «Нет на месте». Отображается в профиле пользователя, а также при отправке ему личного сообщения или упоминании в чате.
      - `text` (string, **обязательный**): Текст сообщения
        - Пример: `Я в отпуске до 15 апреля. По срочным вопросам обращайтесь к @ivanov.`
  - `bot` (boolean, **обязательный**): Является ботом
    - Пример: `false`
  - `sso` (boolean, **обязательный**): Использует ли пользователь SSO
    - Пример: `false`
  - `created_at` (string, date-time, **обязательный**): Дата создания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
    - Пример: `2020-06-08T09:32:57.000Z`
  - `last_activity_at` (string, date-time, **обязательный**): Дата последней активности пользователя (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
    - Пример: `2025-01-20T13:40:07.000Z`
  - `time_zone` (string, **обязательный**): Часовой пояс пользователя
    - Пример: `Europe/Moscow`
  - `image_url` (string, **обязательный**): Ссылка на скачивание аватарки пользователя
    - Пример: `https://app.pachca.com/users/12/photo.jpg`

**Пример ответа:**

```json
{
  "data": {
    "id": 12,
    "first_name": "Олег",
    "last_name": "Петров",
    "nickname": "",
    "email": "olegp@example.com",
    "phone_number": "",
    "department": "Продукт",
    "title": "CIO",
    "role": "admin",
    "suspended": false,
    "invite_status": "confirmed",
    "list_tags": [
      "Product",
      "Design"
    ],
    "custom_properties": [
      {
        "id": 1678,
        "name": "Город",
        "data_type": "string",
        "value": "Санкт-Петербург"
      }
    ],
    "user_status": {
      "emoji": "🎮",
      "title": "Очень занят",
      "expires_at": "2024-04-08T10:00:00.000Z",
      "is_away": false,
      "away_message": {
        "text": "Я в отпуске до 15 апреля. По срочным вопросам обращайтесь к @ivanov."
      }
    },
    "bot": false,
    "sso": false,
    "created_at": "2020-06-08T09:32:57.000Z",
    "last_activity_at": "2025-01-20T13:40:07.000Z",
    "time_zone": "Europe/Moscow",
    "image_url": "https://app.pachca.com/users/12/photo.jpg"
  }
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

