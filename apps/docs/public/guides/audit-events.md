
# Пачка Audit Events API

> **Внимание:** Доступно только на тарифе **Корпорация**. Для работы с журналом аудита токен должен иметь скоуп `audit_events:read`, доступный только владельцу пространства.


`Audit events API` Пачки предоставляет командам безопасности доступ к логам о критически важных событиях в мессенджере. Это позволяет обеспечивать надежный мониторинг и соответствовать требованиям информационной безопасности и регуляторов.

Для получения логов событий на основе указанных фильтров используйте метод [Журнал аудита событий](GET /audit_events).

## Реализованные типы событий

#### AuditEventKey


## Примеры использования

**Получение всех событий входа в систему за определенный период**

### cURL

```bash
curl "https://api.pachca.com/api/shared/v1/audit_events?start_time=2025-05-01T00%3A00%3A00Z&end_time=2025-05-02T00%3A00%3A00Z&event_key=user_login&limit=50" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/audit_events?start_time=2025-05-01T00%3A00%3A00Z&end_time=2025-05-02T00%3A00%3A00Z&event_key=user_login&limit=50', {
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
    'start_time': '2025-05-01T00:00:00Z',
    'end_time': '2025-05-02T00:00:00Z',
    'event_key': 'user_login',
    'limit': 50,
}

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
}

response = requests.get(
    'https://api.pachca.com/api/shared/v1/audit_events',
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
    path: '/api/shared/v1/audit_events?start_time=2025-05-01T00%3A00%3A00Z&end_time=2025-05-02T00%3A00%3A00Z&event_key=user_login&limit=50',
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

uri = URI('https://api.pachca.com/api/shared/v1/audit_events')
params = {
  'start_time' => '2025-05-01T00:00:00Z',
  'end_time' => '2025-05-02T00:00:00Z',
  'event_key' => 'user_login',
  'limit' => 50,
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

$params = ['start_time' => '2025-05-01T00:00:00Z', 'end_time' => '2025-05-02T00:00:00Z', 'event_key' => 'user_login', 'limit' => 50];
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.pachca.com/api/shared/v1/audit_events?' . http_build_query($params)',
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


**Получение всех событий, связанных с конкретным пользователем**

### cURL

```bash
curl "https://api.pachca.com/api/shared/v1/audit_events?start_time=2025-05-01T00%3A00%3A00Z&end_time=2025-05-02T00%3A00%3A00Z&actor_id=133321&actor_type=User" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/audit_events?start_time=2025-05-01T00%3A00%3A00Z&end_time=2025-05-02T00%3A00%3A00Z&actor_id=133321&actor_type=User', {
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
    'start_time': '2025-05-01T00:00:00Z',
    'end_time': '2025-05-02T00:00:00Z',
    'actor_id': 133321,
    'actor_type': 'User',
}

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
}

response = requests.get(
    'https://api.pachca.com/api/shared/v1/audit_events',
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
    path: '/api/shared/v1/audit_events?start_time=2025-05-01T00%3A00%3A00Z&end_time=2025-05-02T00%3A00%3A00Z&actor_id=133321&actor_type=User',
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

uri = URI('https://api.pachca.com/api/shared/v1/audit_events')
params = {
  'start_time' => '2025-05-01T00:00:00Z',
  'end_time' => '2025-05-02T00:00:00Z',
  'actor_id' => 133321,
  'actor_type' => 'User',
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

$params = ['start_time' => '2025-05-01T00:00:00Z', 'end_time' => '2025-05-02T00:00:00Z', 'actor_id' => 133321, 'actor_type' => 'User'];
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.pachca.com/api/shared/v1/audit_events?' . http_build_query($params)',
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


**Получение всех изменений прав доступа к чатам**

### cURL

```bash
curl "https://api.pachca.com/api/shared/v1/audit_events?start_time=2025-05-01T00%3A00%3A00Z&end_time=2025-05-08T00%3A00%3A00Z&event_key=chat_permission_changed" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/audit_events?start_time=2025-05-01T00%3A00%3A00Z&end_time=2025-05-08T00%3A00%3A00Z&event_key=chat_permission_changed', {
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
    'start_time': '2025-05-01T00:00:00Z',
    'end_time': '2025-05-08T00:00:00Z',
    'event_key': 'chat_permission_changed',
}

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
}

response = requests.get(
    'https://api.pachca.com/api/shared/v1/audit_events',
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
    path: '/api/shared/v1/audit_events?start_time=2025-05-01T00%3A00%3A00Z&end_time=2025-05-08T00%3A00%3A00Z&event_key=chat_permission_changed',
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

uri = URI('https://api.pachca.com/api/shared/v1/audit_events')
params = {
  'start_time' => '2025-05-01T00:00:00Z',
  'end_time' => '2025-05-08T00:00:00Z',
  'event_key' => 'chat_permission_changed',
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

$params = ['start_time' => '2025-05-01T00:00:00Z', 'end_time' => '2025-05-08T00:00:00Z', 'event_key' => 'chat_permission_changed'];
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.pachca.com/api/shared/v1/audit_events?' . http_build_query($params)',
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


## Хранение данных

Журналы аудита хранятся в течение 90 дней для баланса между требованиями соответствия и эффективностью хранения. Все журналы неизменяемы и хранятся в системе только для чтения, чтобы обеспечить целостность данных.

## Типичные сценарии использования

- Расследовать подозрительные попытки входа в систему
- Отслеживать изменения прав доступа
- Отслеживать действия по удалению сообщений
- Расследовать изменения ролей пользователей
- Отслеживать изменения в составе участников чатов
- Составлять отчеты о соответствии требованиям и во время аудита

## Ограничения

- Текущая версия API поддерживает только типы событий, указанные в документации
- Данные собираются только с 12 мая 2025 года
- За один запрос можно запросить только один тип события
- Список событий и фильтры планируется развивать в следующих версиях
