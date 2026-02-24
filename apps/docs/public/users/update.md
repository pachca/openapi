# Редактирование сотрудника

**Метод**: `PUT`

**Путь**: `/users/{id}`

> **Скоуп:** `users:update`

Метод для редактирования сотрудника.

Для редактирования сотрудника вам необходимо знать его `id` и указать его в `URL` запроса. Все редактируемые параметры сотрудника указываются в теле запроса. Получить актуальный список идентификаторов дополнительных полей сотрудника вы можете в методе [Список дополнительных полей](GET /custom_properties).

## Параметры

### Path параметры

- `id` (integer, **обязательный**): Идентификатор пользователя


## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `user` (object, **обязательный**): Собранный объект параметров редактируемого сотрудника
  - `first_name` (string, опциональный): Имя
  - `last_name` (string, опциональный): Фамилия
  - `email` (string, опциональный): Электронная почта
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

### Пример

```json
{
  "user": {
    "nickname": "olegpetrov",
    "role": "user",
    "list_tags": [
      "Product"
    ]
  }
}
```

## Примеры запроса

### cURL

```bash
curl -X PUT "https://api.pachca.com/api/shared/v1/users/12345" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "user": {
    "nickname": "olegpetrov",
    "role": "user",
    "list_tags": [
      "Product"
    ]
  }
}'
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/users/12345', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
      "user": {
          "nickname": "olegpetrov",
          "role": "user",
          "list_tags": [
              "Product"
          ]
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
    'user': {
        'nickname': 'olegpetrov',
        'role': 'user',
        'list_tags': [
            'Product'
        ]
    }
}

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
}

response = requests.put(
    'https://api.pachca.com/api/shared/v1/users/12345',
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
    path: '/api/shared/v1/users/12345',
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
    "user": {
        "nickname": "olegpetrov",
        "role": "user",
        "list_tags": [
            "Product"
        ]
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

uri = URI('https://api.pachca.com/api/shared/v1/users/12345')
request = Net::HTTP::Put.new(uri)
request['Authorization'] = 'Bearer YOUR_ACCESS_TOKEN'
request['Content-Type'] = 'application/json'

request.body = {
  'user' => {
    'nickname' => 'olegpetrov',
    'role' => 'user',
    'list_tags' => [
      'Product'
    ]
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
    CURLOPT_URL => 'https://api.pachca.com/api/shared/v1/users/12345',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'PUT',
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_ACCESS_TOKEN',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
    'user' => [
        'nickname' => 'olegpetrov',
        'role' => 'user',
        'list_tags' => [
            'Product'
        ]
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
    "nickname": "olegpetrov",
    "email": "olegp@example.com",
    "phone_number": "",
    "department": "Продукт",
    "title": "CIO",
    "role": "user",
    "suspended": false,
    "invite_status": "confirmed",
    "list_tags": [
      "Product"
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
    "created_at": "2023-07-08T09:31:17.000Z",
    "last_activity_at": "2025-01-20T13:40:07.000Z",
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

### 404: The server cannot find the requested resource.

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

