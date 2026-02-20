# Unfurl (разворачивание ссылок)

**Метод**: `POST`

**Путь**: `/messages/{id}/link_previews`

#unfurling_bot_access_token_required

Метод для создания предпросмотров ссылок в сообщениях.

Для создания предпросмотров ссылок вам необходимо знать `id` сообщения и указать его в `URL` запроса.

Изображения вы можете предоставить как публичной ссылкой (параметром `image_url`), так и с помощью прямой загрузки файла на наш сервер (параметром `image`) через метод `Загрузка файлов`. Если вы указали оба параметра сразу, то `image` является более приоритетным.

Если среди присланных `URL`-ключей будет выявлена ошибка (такого `URL` нет в сообщении или боту не прописан в настройках домен указанного `URL`), то запрос не будет выполнен (не будет создано ни одного предпросмотра).

На данный момент поддерживается отображение только первого созданного предпросмотра ссылки к сообщению. Все присланные вами `link_previews` будут сохранены и появятся в сообщениях в ближайших обновлениях.

## Параметры

### Path параметры

- `id` (integer, **обязательный**): Идентификатор сообщения


## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `link_previews` (Record<string, object>, **обязательный**): `JSON` карта предпросмотров ссылок, где каждый ключ — `URL`, который был получен в исходящем вебхуке о новом сообщении.
  **Структура значений Record:**
  - `title` (string, **обязательный**): Заголовок
  - `description` (string, **обязательный**): Описание
  - `image_url` (string, опциональный): Публичная ссылка на изображение (если вы хотите загрузить файл изображения в Пачку, то используйте параметр image)
  - `image` (object, опциональный): Изображение
    - `key` (string, **обязательный**): Путь к изображению, полученный в результате [загрузки файла](POST /direct_url)
    - `name` (string, **обязательный**): Название изображения (рекомендуется писать вместе с расширением)
    - `size` (integer, int32, **обязательный**): Размер изображения в байтах


## Примеры запроса

### cURL

```bash
curl "https://api.pachca.com/api/shared/v1/messages/12345/link_previews" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "link_previews": {
    "key": {
      "title": "Статья: Отправка файлов",
      "description": "Пример отправки файлов на удаленный сервер",
      "image_url": "https://website.com/img/landing.png",
      "image": {
        "key": "attaches/files/93746/e354fd79-9jh6-f2hd-fj83-709dae24c763/$filename",
        "name": "files-to-server.jpg",
        "size": 695604
      }
    }
  }
}'
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/messages/12345/link_previews', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
      "link_previews": {
          "key": {
              "title": "Статья: Отправка файлов",
              "description": "Пример отправки файлов на удаленный сервер",
              "image_url": "https://website.com/img/landing.png",
              "image": {
                  "key": "attaches/files/93746/e354fd79-9jh6-f2hd-fj83-709dae24c763/$filename",
                  "name": "files-to-server.jpg",
                  "size": 695604
              }
          }
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
    'link_previews': {
        'key': {
            'title': 'Статья: Отправка файлов',
            'description': 'Пример отправки файлов на удаленный сервер',
            'image_url': 'https://website.com/img/landing.png',
            'image': {
                'key': 'attaches/files/93746/e354fd79-9jh6-f2hd-fj83-709dae24c763/$filename',
                'name': 'files-to-server.jpg',
                'size': 695604
            }
        }
    }
}

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
}

response = requests.post(
    'https://api.pachca.com/api/shared/v1/messages/12345/link_previews',
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
    path: '/api/shared/v1/messages/12345/link_previews',
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
    "link_previews": {
        "key": {
            "title": "Статья: Отправка файлов",
            "description": "Пример отправки файлов на удаленный сервер",
            "image_url": "https://website.com/img/landing.png",
            "image": {
                "key": "attaches/files/93746/e354fd79-9jh6-f2hd-fj83-709dae24c763/$filename",
                "name": "files-to-server.jpg",
                "size": 695604
            }
        }
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

uri = URI('https://api.pachca.com/api/shared/v1/messages/12345/link_previews')
request = Net::HTTP::Post.new(uri)
request['Authorization'] = 'Bearer YOUR_ACCESS_TOKEN'
request['Content-Type'] = 'application/json'

request.body = {
  'link_previews' => {
    'key' => {
      'title' => 'Статья: Отправка файлов',
      'description' => 'Пример отправки файлов на удаленный сервер',
      'image_url' => 'https://website.com/img/landing.png',
      'image' => {
        'key' => 'attaches/files/93746/e354fd79-9jh6-f2hd-fj83-709dae24c763/$filename',
        'name' => 'files-to-server.jpg',
        'size' => 695604
      }
    }
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
    CURLOPT_URL => 'https://api.pachca.com/api/shared/v1/messages/12345/link_previews',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'POST',
    CURLOPT_HTTPHEADER => [
        'Authorization: Bearer YOUR_ACCESS_TOKEN',
        'Content-Type: application/json',
    ],
    CURLOPT_POSTFIELDS => json_encode([
    'link_previews' => [
        'key' => [
            'title' => 'Статья: Отправка файлов',
            'description' => 'Пример отправки файлов на удаленный сервер',
            'image_url' => 'https://website.com/img/landing.png',
            'image' => [
                'key' => 'attaches/files/93746/e354fd79-9jh6-f2hd-fj83-709dae24c763/$filename',
                'name' => 'files-to-server.jpg',
                'size' => 695604
            ]
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

### 204: There is no content to send for this request, but the headers may be useful. 

**Схема ответа:**

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

