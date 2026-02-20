# Создать сотрудника

**Метод**: `POST`

**Путь**: `/users`

#admin_access_token_required

Метод для создания нового сотрудника в вашей компании.

Вы можете заполнять дополнительные поля сотрудника, которые созданы в вашей компании. Получить актуальный список идентификаторов дополнительных полей сотрудника вы можете в методе [Список дополнительных полей](GET /custom_properties).

## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `user` (object, **обязательный**)
  - `first_name` (string, опциональный): Имя
  - `last_name` (string, опциональный): Фамилия
  - `email` (string, **обязательный**): Электронная почта
  - `phone_number` (string, опциональный): Телефон
  - `nickname` (string, опциональный): Имя пользователя
  - `department` (string, опциональный): Департамент
  - `title` (string, опциональный): Должность
  - `role` (string, опциональный): Уровень доступа
    - **Возможные значения:**
      - `admin`: Администратор
      - `user`: Сотрудник
      - `multi_guest`: Мульти-гость
  - `suspended` (boolean, опциональный): Деактивация пользователя
  - `list_tags` (array[string], опциональный): Массив тегов, привязываемых к сотруднику
  - `custom_properties` (array[object], опциональный): Задаваемые дополнительные поля
    - `id` (integer, int32, **обязательный**): Идентификатор поля
    - `value` (string, **обязательный**): Устанавливаемое значение
- `skip_email_notify` (boolean, опциональный): Пропуск этапа отправки приглашения сотруднику. Сотруднику не будет отправлено письмо на электронную почту с приглашением создать аккаунт. Полезно при предварительном создании аккаунтов перед входом через SSO.

### Пример

```json
{
  "user": {
    "first_name": "Олег",
    "last_name": "Петров",
    "email": "olegp@example.com",
    "department": "Продукт",
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
    "department": "Продукт",
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
          "department": "Продукт",
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
        'department': 'Продукт',
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
        "department": "Продукт",
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
    'department' => 'Продукт',
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
        'department' => 'Продукт',
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
  - `first_name` (string, **обязательный**): Имя
  - `last_name` (string, **обязательный**): Фамилия
  - `nickname` (string, **обязательный**): Имя пользователя
  - `email` (string, **обязательный**): Электронная почта
  - `phone_number` (string, **обязательный**): Телефон
  - `department` (string, **обязательный**): Департамент
  - `title` (string, **обязательный**): Должность
  - `role` (string, **обязательный**): Уровень доступа
    - **Возможные значения:**
      - `admin`: Администратор
      - `user`: Сотрудник
      - `multi_guest`: Мульти-гость
  - `suspended` (boolean, **обязательный**): Деактивация пользователя
  - `invite_status` (string, **обязательный**): Статус приглашения
    - **Возможные значения:**
      - `confirmed`: Принято
      - `sent`: Отправлено
  - `list_tags` (array[string], **обязательный**): Массив тегов, привязанных к сотруднику
  - `custom_properties` (array[object], **обязательный**): Дополнительные поля сотрудника
    - `id` (integer, int32, **обязательный**): Идентификатор поля
    - `name` (string, **обязательный**): Название поля
    - `data_type` (string, **обязательный**): Тип поля
      - **Возможные значения:**
        - `string`: Строковое значение
        - `number`: Числовое значение
        - `date`: Дата
        - `link`: Ссылка
    - `value` (string, **обязательный**): Значение
  - `user_status` (object, **обязательный**): Статус
    - `emoji` (string, **обязательный**): Emoji символ статуса
    - `title` (string, **обязательный**): Текст статуса
    - `expires_at` (string, date-time, **обязательный**): Срок жизни статуса (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
  - `bot` (boolean, **обязательный**): Является ботом
  - `sso` (boolean, **обязательный**): Использует ли пользователь SSO
  - `created_at` (string, date-time, **обязательный**): Дата создания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
  - `last_activity_at` (string, date-time, **обязательный**): Дата последней активности пользователя (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
  - `time_zone` (string, **обязательный**): Часовой пояс пользователя
  - `image_url` (string, **обязательный**): Ссылка на скачивание аватарки пользователя

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
    "title": "",
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
    "user_status": null,
    "bot": false,
    "sso": false,
    "created_at": "2023-06-08T09:31:17.000Z",
    "last_activity_at": "2023-06-08T09:31:17.000Z",
    "time_zone": "Europe/Moscow",
    "image_url": null
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

