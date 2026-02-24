# Список участников чата

**Метод**: `GET`

**Путь**: `/chats/{id}/members`

> **Скоуп:** `chat_members:read`

Метод для получения актуального списка участников чата.

Владелец пространства может получить состав участников любого чата пространства. Администраторы и боты могут получить список участников только тех чатов, в которых состоят (или которые являются открытыми).

## Параметры

### Path параметры

- `id` (integer, **обязательный**): Идентификатор чата

### Query параметры

- `role` (string, опциональный): Роль в чате
  - По умолчанию: `all`
- `limit` (integer, опциональный): Количество возвращаемых сущностей за один запрос
  - По умолчанию: `50`
- `cursor` (string, опциональный): Курсор для пагинации (из meta.paginate.next_page)


## Примеры запроса

### cURL

```bash
curl "https://api.pachca.com/api/shared/v1/chats/12345/members?role=value&limit=50&cursor=string" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/chats/12345/members?role=value&limit=50&cursor=string', {
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
    'role': 'value',
    'limit': 50,
    'cursor': 'string',
}

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
}

response = requests.get(
    'https://api.pachca.com/api/shared/v1/chats/12345/members',
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
    path: '/api/shared/v1/chats/12345/members?role=value&limit=50&cursor=string',
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

uri = URI('https://api.pachca.com/api/shared/v1/chats/12345/members')
params = {
  'role' => 'value',
  'limit' => 50,
  'cursor' => 'string',
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

$params = ['role' => 'value', 'limit' => 50, 'cursor' => 'string'];
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.pachca.com/api/shared/v1/chats/12345/members?' . http_build_query($params)',
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

- `meta` (object, опциональный): Метаданные пагинации
  - `paginate` (object, опциональный): Вспомогательная информация
    - `next_page` (string, опциональный): Курсор пагинации следующей страницы
- `data` (array[object], **обязательный**)
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
  "meta": {
    "paginate": {
      "next_page": "eyJpZCI6MTIwiwiZGlyIjoiYXNjIn0"
    }
  },
  "data": [
    {
      "id": 12,
      "first_name": "Олег",
      "last_name": "Петров",
      "nickname": "olegpetrov",
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
      "user_status": null,
      "bot": false,
      "sso": false,
      "created_at": "2020-06-08T09:10:11.000Z",
      "last_activity_at": "2025-01-20T13:40:07.000Z",
      "time_zone": "Europe/Moscow",
      "image_url": null
    }
  ]
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

