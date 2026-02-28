# Информация о токене

**Метод**: `GET`

**Путь**: `/oauth/token/info`

Метод для получения информации о текущем OAuth токене, включая его скоупы, дату создания и последнего использования. Токен в ответе маскируется — видны только первые 8 и последние 4 символа.

## Примеры запроса

### cURL

```bash
curl "https://api.pachca.com/api/shared/v1/oauth/token/info" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/oauth/token/info', {
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
    'https://api.pachca.com/api/shared/v1/oauth/token/info',
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
    path: '/api/shared/v1/oauth/token/info',
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

uri = URI('https://api.pachca.com/api/shared/v1/oauth/token/info')
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
    CURLOPT_URL => 'https://api.pachca.com/api/shared/v1/oauth/token/info',
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

- `data` (object, **обязательный**): Информация о текущем OAuth токене
  - `id` (integer, int64, **обязательный**): Идентификатор токена
    - Пример: `4827`
  - `token` (string, **обязательный**): Маскированный токен (видны первые 8 и последние 4 символа)
    - Пример: `cH5kR9mN...x7Qp`
  - `name` (string, **обязательный**): Пользовательское имя токена
    - Пример: `Мой API токен`
  - `user_id` (integer, int64, **обязательный**): Идентификатор владельца токена
    - Пример: `12`
  - `scopes` (array[string], **обязательный**): Список скоупов токена
    - Пример: `["messages:read","chats:read"]`
  - `created_at` (string, date-time, **обязательный**): Дата создания токена
    - Пример: `2025-01-15T10:30:00.000Z`
  - `revoked_at` (string, date-time, **обязательный**): Дата отзыва токена
    - Пример: `null`
  - `expires_in` (integer, int32, **обязательный**): Время жизни токена в секундах
    - Пример: `null`
  - `last_used_at` (string, date-time, **обязательный**): Дата последнего использования токена
    - Пример: `2025-02-24T14:20:00.000Z`

**Пример ответа:**

```json
{
  "data": {
    "id": 4827,
    "token": "cH5kR9mN...x7Qp",
    "name": "Мой API токен",
    "user_id": 12,
    "scopes": [
      "messages:read",
      "chats:read"
    ],
    "created_at": "2025-01-15T10:30:00.000Z",
    "revoked_at": null,
    "expires_in": null,
    "last_used_at": "2025-02-24T14:20:00.000Z"
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

