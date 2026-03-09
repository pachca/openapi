# Новый статус сотрудника

**Метод**: `PUT`

**Путь**: `/users/{user_id}/status`

> **Скоуп:** `user_status:write`

Метод для установки нового статуса сотруднику.

## Параметры

### Path параметры

- `user_id` (integer, **обязательный**): Идентификатор пользователя
  - Пример: `12`


## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `status` (object, **обязательный**)
  - `emoji` (string, **обязательный**): Emoji символ статуса
    - Пример: `🎮`
  - `title` (string, **обязательный**): Текст статуса
    - Пример: `Очень занят`
  - `expires_at` (string, date-time, опциональный): Срок жизни статуса (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
    - Пример: `2024-04-08T10:00:00.000Z`
  - `is_away` (boolean, опциональный): Режим «Нет на месте»
    - Пример: `true`
  - `away_message` (string, опциональный): Текст сообщения при режиме «Нет на месте». Отображается в профиле и при личных сообщениях/упоминаниях.
    - Пример: `Вернусь после 15:00`
    - Максимальная длина: 1024 символов

### Пример

```json
{
  "status": {
    "emoji": "🎮",
    "title": "Очень занят",
    "expires_at": "2024-04-08T10:00:00.000Z",
    "is_away": true,
    "away_message": "Вернусь после 15:00"
  }
}
```

## Примеры запроса

### CLI

```bash
pachca api users 12 \
  --emoji=🎮 \
  --title="Очень занят" \
  --expires-at=2024-04-08T10:00:00.000Z \
  --is-away \
  --away-message="Вернусь после 15:00" \
  --json \
  --token YOUR_ACCESS_TOKEN
```

### cURL

```bash
curl -X PUT "https://api.pachca.com/api/shared/v1/users/12/status" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "status": {
    "emoji": "🎮",
    "title": "Очень занят",
    "expires_at": "2024-04-08T10:00:00.000Z",
    "is_away": true,
    "away_message": "Вернусь после 15:00"
  }
}'
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/users/12/status', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
      "status": {
          "emoji": "🎮",
          "title": "Очень занят",
          "expires_at": "2024-04-08T10:00:00.000Z",
          "is_away": true,
          "away_message": "Вернусь после 15:00"
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
    'status': {
        'emoji': '🎮',
        'title': 'Очень занят',
        'expires_at': '2024-04-08T10:00:00.000Z',
        'is_away': True,
        'away_message': 'Вернусь после 15:00'
    }
}

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
}

response = requests.put(
    'https://api.pachca.com/api/shared/v1/users/12/status',
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
    path: '/api/shared/v1/users/12/status',
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
    "status": {
        "emoji": "🎮",
        "title": "Очень занят",
        "expires_at": "2024-04-08T10:00:00.000Z",
        "is_away": true,
        "away_message": "Вернусь после 15:00"
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

uri = URI('https://api.pachca.com/api/shared/v1/users/12/status')
request = Net::HTTP::Put.new(uri)
request['Authorization'] = 'Bearer YOUR_ACCESS_TOKEN'
request['Content-Type'] = 'application/json'

request.body = {
  'status' => {
    'emoji' => '🎮',
    'title' => 'Очень занят',
    'expires_at' => '2024-04-08T10:00:00.000Z',
    'is_away' => true,
    'away_message' => 'Вернусь после 15:00'
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
    CURLOPT_URL => 'https://api.pachca.com/api/shared/v1/users/12/status',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'PUT',
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_ACCESS_TOKEN',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
    'status' => [
        'emoji' => '🎮',
        'title' => 'Очень занят',
        'expires_at' => '2024-04-08T10:00:00.000Z',
        'is_away' => true,
        'away_message' => 'Вернусь после 15:00'
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

- `data` (object, **обязательный**): Статус пользователя
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

**Пример ответа:**

```json
{
  "data": {
    "emoji": "🎮",
    "title": "Очень занят",
    "expires_at": "2024-04-08T10:00:00.000Z",
    "is_away": false,
    "away_message": {
      "text": "Я в отпуске до 15 апреля. По срочным вопросам обращайтесь к @ivanov."
    }
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

