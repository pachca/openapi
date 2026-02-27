# Поиск сообщений

**Метод**: `GET`

**Путь**: `/search/messages`

> **Скоуп:** `search:messages`

Метод для полнотекстового поиска сообщений.

## Параметры

### Query параметры

- `query` (string, опциональный): Текст поискового запроса
- `limit` (integer, опциональный): Количество возвращаемых результатов за один запрос
  - По умолчанию: `200`
- `cursor` (string, опциональный): Курсор для пагинации (из meta.paginate.next_page)
- `order` (string (enum: asc, desc), опциональный): Направление сортировки
- `created_from` (string, опциональный): Фильтр по дате создания (от)
- `created_to` (string, опциональный): Фильтр по дате создания (до)
- `chat_ids` (array, опциональный): Фильтр по ID чатов
- `user_ids` (array, опциональный): Фильтр по ID авторов сообщений
- `active` (boolean, опциональный): Фильтр по активности чата (true — активные чаты, false — архивированные)


## Примеры запроса

### cURL

```bash
curl "https://api.pachca.com/api/shared/v1/search/messages?query=%D0%9F%D1%80%D0%B8%D0%BC%D0%B5%D1%80%20%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%B0&limit=200&cursor=string&order=asc&created_from=2024-04-08T10%3A00%3A00.000Z&created_to=2024-04-08T10%3A00%3A00.000Z&chat_ids[]=100&user_ids[]=100&active=true" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/search/messages?query=%D0%9F%D1%80%D0%B8%D0%BC%D0%B5%D1%80%20%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%B0&limit=200&cursor=string&order=asc&created_from=2024-04-08T10%3A00%3A00.000Z&created_to=2024-04-08T10%3A00%3A00.000Z&chat_ids[]=100&user_ids[]=100&active=true', {
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
    'query': 'Пример текста',
    'limit': 200,
    'cursor': 'string',
    'order': 'asc',
    'created_from': '2024-04-08T10:00:00.000Z',
    'created_to': '2024-04-08T10:00:00.000Z',
    'chat_ids': [
    100
],
    'user_ids': [
    100
],
    'active': True,
}

headers = {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
}

response = requests.get(
    'https://api.pachca.com/api/shared/v1/search/messages',
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
    path: '/api/shared/v1/search/messages?query=%D0%9F%D1%80%D0%B8%D0%BC%D0%B5%D1%80%20%D1%82%D0%B5%D0%BA%D1%81%D1%82%D0%B0&limit=200&cursor=string&order=asc&created_from=2024-04-08T10%3A00%3A00.000Z&created_to=2024-04-08T10%3A00%3A00.000Z&chat_ids[]=100&user_ids[]=100&active=true',
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

uri = URI('https://api.pachca.com/api/shared/v1/search/messages')
params = {
  'query' => 'Пример текста',
  'limit' => 200,
  'cursor' => 'string',
  'order' => 'asc',
  'created_from' => '2024-04-08T10:00:00.000Z',
  'created_to' => '2024-04-08T10:00:00.000Z',
  'chat_ids' => [
  100
],
  'user_ids' => [
  100
],
  'active' => true,
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

$params = ['query' => 'Пример текста', 'limit' => 200, 'cursor' => 'string', 'order' => 'asc', 'created_from' => '2024-04-08T10:00:00.000Z', 'created_to' => '2024-04-08T10:00:00.000Z', 'chat_ids' => [
    100
], 'user_ids' => [
    100
], 'active' => true];
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://api.pachca.com/api/shared/v1/search/messages?' . http_build_query($params)',
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

- `data` (array[object], **обязательный**)
  - `id` (integer, int32, **обязательный**): Идентификатор сообщения
  - `entity_type` (string, **обязательный**): Тип сущности, к которой относится сообщение
    - **Возможные значения:**
      - `discussion`: Беседа или канал
      - `thread`: Тред
      - `user`: Пользователь
  - `entity_id` (integer, int32, **обязательный**): Идентификатор сущности, к которой относится сообщение (беседы/канала, треда или пользователя)
  - `chat_id` (integer, int32, **обязательный**): Идентификатор чата, в котором находится сообщение
  - `root_chat_id` (integer, int32, **обязательный**): Идентификатор корневого чата. Для сообщений в тредах — идентификатор чата, в котором был создан тред. Для обычных сообщений совпадает с `chat_id`.
  - `content` (string, **обязательный**): Текст сообщения
  - `user_id` (integer, int32, **обязательный**): Идентификатор пользователя, создавшего сообщение
  - `created_at` (string, date-time, **обязательный**): Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
  - `url` (string, **обязательный**): Прямая ссылка на сообщение
  - `files` (array[object], **обязательный**): Прикрепленные файлы
    - `id` (integer, int32, **обязательный**): Идентификатор файла
    - `key` (string, **обязательный**): Путь к файлу
    - `name` (string, **обязательный**): Название файла с расширением
    - `file_type` (string, **обязательный**): Тип файла
      - **Возможные значения:**
        - `file`: Обычный файл
        - `image`: Изображение
    - `url` (string, **обязательный**): Прямая ссылка на скачивание файла
    - `width` (integer, int32, опциональный): Ширина изображения в пикселях
    - `height` (integer, int32, опциональный): Высота изображения в пикселях
  - `buttons` (array[array], **обязательный**): Массив строк, каждая из которых представлена массивом кнопок
  - `thread` (object, **обязательный**): Тред сообщения
    - `id` (integer, int64, **обязательный**): Идентификатор созданного треда (используется для отправки [новых комментариев](POST /messages) в тред)
    - `chat_id` (integer, int64, **обязательный**): Идентификатор чата треда (используется для отправки [новых комментариев](POST /messages) в тред и получения [списка комментариев](GET /messages))
    - `message_id` (integer, int64, **обязательный**): Идентификатор сообщения, к которому был создан тред
    - `message_chat_id` (integer, int64, **обязательный**): Идентификатор чата сообщения
    - `updated_at` (string, date-time, **обязательный**): Дата и время обновления треда (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
  - `forwarding` (object, **обязательный**): Информация о пересланном сообщении
    - `original_message_id` (integer, int32, **обязательный**): Идентификатор оригинального сообщения
    - `original_chat_id` (integer, int32, **обязательный**): Идентификатор чата, в котором находится оригинальное сообщение
    - `author_id` (integer, int32, **обязательный**): Идентификатор пользователя, создавшего оригинальное сообщение
    - `original_created_at` (string, date-time, **обязательный**): Дата и время создания оригинального сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
    - `original_thread_id` (integer, int32, **обязательный**): Идентификатор треда, в котором находится оригинальное сообщение
    - `original_thread_message_id` (integer, int32, **обязательный**): Идентификатор сообщения, к которому был создан тред, в котором находится оригинальное сообщение
    - `original_thread_parent_chat_id` (integer, int32, **обязательный**): Идентификатор чата сообщения, к которому был создан тред, в котором находится оригинальное сообщение
  - `parent_message_id` (integer, int32, **обязательный**): Идентификатор сообщения, к которому написан ответ
  - `display_avatar_url` (string, **обязательный**): Ссылка на аватарку отправителя сообщения
  - `display_name` (string, **обязательный**): Полное имя отправителя сообщения
  - `changed_at` (string, date-time, **обязательный**): Дата и время последнего редактирования сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
  - `deleted_at` (string, date-time, **обязательный**): Дата и время удаления сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
- `meta` (object, **обязательный**): Мета-информация для пагинации поисковых результатов
  - `total` (integer, int32, **обязательный**): Общее количество найденных результатов
  - `paginate` (object, **обязательный**): Вспомогательная информация
    - `next_page` (string, **обязательный**): Курсор пагинации следующей страницы

**Пример ответа:**

```json
{
  "data": [
    {
      "id": 194275,
      "entity_type": "discussion",
      "entity_id": 334,
      "chat_id": 334,
      "root_chat_id": 334,
      "content": "Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)",
      "user_id": 185,
      "created_at": "2021-08-28T15:57:23.000Z",
      "url": "https://app.pachca.com/chats/334?message=194275",
      "files": [],
      "buttons": [],
      "thread": null,
      "forwarding": null,
      "parent_message_id": null,
      "display_avatar_url": null,
      "display_name": null,
      "changed_at": null,
      "deleted_at": null
    }
  ],
  "meta": {
    "total": 1,
    "paginate": {
      "next_page": "eyJxZCO2MiwiZGlyIjomSNYjIn3"
    }
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

### 402: Client error

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

### 403: Access is forbidden.

**Схема ответа при ошибке:**

- `error` (string, **обязательный**): Код ошибки
- `error_description` (string, **обязательный**): Описание ошибки

