# Создать сотрудника

**Метод**: `POST`

**Путь**: `/users`

> **Скоуп:** `users:create`

Метод для создания нового сотрудника в вашей компании.

Вы можете заполнять дополнительные поля сотрудника, которые созданы в вашей компании. Получить актуальный список идентификаторов дополнительных полей сотрудника вы можете в методе [Список дополнительных полей](GET /custom_properties).

## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `user` (object, **обязательный**)
  - `first_name` (string, опциональный): Имя
    - Пример: `Олег`
  - `last_name` (string, опциональный): Фамилия
    - Пример: `Петров`
  - `email` (string, **обязательный**): Электронная почта
    - Пример: `olegp@example.com`
  - `phone_number` (string, опциональный): Телефон
    - Пример: `+79001234567`
  - `nickname` (string, опциональный): Имя пользователя
    - Пример: `olegpetrov`
  - `department` (string, опциональный): Департамент
    - Пример: `Продукт`
  - `title` (string, опциональный): Должность
    - Пример: `CIO`
  - `role` (string, опциональный): Уровень доступа
    - **Возможные значения:**
      - `admin`: Администратор
      - `user`: Сотрудник
      - `multi_guest`: Мульти-гость
      - `guest`: Гость
  - `suspended` (boolean, опциональный): Деактивация пользователя
    - Пример: `false`
  - `list_tags` (array[string], опциональный): Массив тегов, привязываемых к сотруднику
    - Пример: `["Product","Design"]`
  - `custom_properties` (array[object], опциональный): Задаваемые дополнительные поля
    - `id` (integer, int32, **обязательный**): Идентификатор поля
      - Пример: `1678`
    - `value` (string, **обязательный**): Устанавливаемое значение
      - Пример: `Санкт-Петербург`
- `skip_email_notify` (boolean, опциональный): Пропуск этапа отправки приглашения сотруднику. Сотруднику не будет отправлено письмо на электронную почту с приглашением создать аккаунт. Полезно при предварительном создании аккаунтов перед входом через SSO.
  - Пример: `true`

### Пример

```json
{
  "user": {
    "first_name": "Олег",
    "last_name": "Петров",
    "email": "olegp@example.com",
    "phone_number": "+79001234567",
    "nickname": "olegpetrov",
    "department": "Продукт",
    "title": "CIO",
    "role": "user",
    "suspended": false,
    "list_tags": [
      "Product",
      "Design"
    ],
    "custom_properties": [
      {
        "id": 1678,
        "value": "Санкт-Петербург"
      }
    ]
  },
  "skip_email_notify": true
}
```

## Примеры запроса

### CLI

```bash
pachca api users \
  --first-name=Олег \
  --last-name=Петров \
  --email=olegp@example.com \
  --phone-number=+79001234567 \
  --nickname=olegpetrov \
  --department=Продукт \
  --title=CIO \
  --role=user \
  --no-suspended \
  --list-tags=Product,Design \
  --custom-properties='[{"id":1678,"value":"Санкт-Петербург"}]' \
  --skip-email-notify \
  --json \
  --token YOUR_ACCESS_TOKEN
```

### cURL

```bash
curl "https://api.pachca.com/api/shared/v1/users" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "user": {
    "first_name": "Олег",
    "last_name": "Петров",
    "email": "olegp@example.com",
    "phone_number": "+79001234567",
    "nickname": "olegpetrov",
    "department": "Продукт",
    "title": "CIO",
    "role": "user",
    "suspended": false,
    "list_tags": [
      "Product",
      "Design"
    ],
    "custom_properties": [
      {
        "id": 1678,
        "value": "Санкт-Петербург"
      }
    ]
  },
  "skip_email_notify": true
}'
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/users', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
      "user": {
          "first_name": "Олег",
          "last_name": "Петров",
          "email": "olegp@example.com",
          "phone_number": "+79001234567",
          "nickname": "olegpetrov",
          "department": "Продукт",
          "title": "CIO",
          "role": "user",
          "suspended": false,
          "list_tags": [
              "Product",
              "Design"
          ],
          "custom_properties": [
              {
                  "id": 1678,
                  "value": "Санкт-Петербург"
              }
          ]
      },
      "skip_email_notify": true
  })
});

const data = await response.json();
console.log(data);
```

### Python

```python
import requests

data = {
    'user': {
        'first_name': 'Олег',
        'last_name': 'Петров',
        'email': 'olegp@example.com',
        'phone_number': '+79001234567',
        'nickname': 'olegpetrov',
        'department': 'Продукт',
        'title': 'CIO',
        'role': 'user',
        'suspended': False,
        'list_tags': [
            'Product',
            'Design'
        ],
        'custom_properties': [
            {
                'id': 1678,
                'value': 'Санкт-Петербург'
            }
        ]
    },
    'skip_email_notify': True
}

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
}

response = requests.post(
    'https://api.pachca.com/api/shared/v1/users',
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
    path: '/api/shared/v1/users',
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
    "user": {
        "first_name": "Олег",
        "last_name": "Петров",
        "email": "olegp@example.com",
        "phone_number": "+79001234567",
        "nickname": "olegpetrov",
        "department": "Продукт",
        "title": "CIO",
        "role": "user",
        "suspended": false,
        "list_tags": [
            "Product",
            "Design"
        ],
        "custom_properties": [
            {
                "id": 1678,
                "value": "Санкт-Петербург"
            }
        ]
    },
    "skip_email_notify": true
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

uri = URI('https://api.pachca.com/api/shared/v1/users')
request = Net::HTTP::Post.new(uri)
request['Authorization'] = 'Bearer YOUR_ACCESS_TOKEN'
request['Content-Type'] = 'application/json'

request.body = {
  'user' => {
    'first_name' => 'Олег',
    'last_name' => 'Петров',
    'email' => 'olegp@example.com',
    'phone_number' => '+79001234567',
    'nickname' => 'olegpetrov',
    'department' => 'Продукт',
    'title' => 'CIO',
    'role' => 'user',
    'suspended' => false,
    'list_tags' => [
      'Product',
      'Design'
    ],
    'custom_properties' => [
      {
        'id' => 1678,
        'value' => 'Санкт-Петербург'
      }
    ]
  },
  'skip_email_notify' => true
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
    CURLOPT_URL => 'https://api.pachca.com/api/shared/v1/users',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'POST',
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_ACCESS_TOKEN',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
    'user' => [
        'first_name' => 'Олег',
        'last_name' => 'Петров',
        'email' => 'olegp@example.com',
        'phone_number' => '+79001234567',
        'nickname' => 'olegpetrov',
        'department' => 'Продукт',
        'title' => 'CIO',
        'role' => 'user',
        'suspended' => false,
        'list_tags' => [
            'Product',
            'Design'
        ],
        'custom_properties' => [
            [
                'id' => 1678,
                'value' => 'Санкт-Петербург'
            ]
        ]
    ],
    'skip_email_notify' => true
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

