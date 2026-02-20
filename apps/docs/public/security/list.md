# Журнал аудита событий

**Метод**: `GET`

**Путь**: `/audit_events`

#corporation_price_only

Метод для получения логов событий на основе указанных фильтров.

## Параметры

### Query параметры

- `start_time` (string, **обязательный**): Начальная метка времени (включительно)
- `end_time` (string, **обязательный**): Конечная метка времени (исключительно)
- `event_key` (string (enum: user_login, user_logout, user_2fa_fail, user_2fa_success, user_created, user_deleted, user_role_changed, user_updated, tag_created, tag_deleted, user_added_to_tag, user_removed_from_tag, chat_created, chat_renamed, chat_permission_changed, user_chat_join, user_chat_leave, tag_added_to_chat, tag_removed_from_chat, message_updated, message_deleted, message_created, reaction_created, reaction_deleted, access_token_created, access_token_updated, access_token_destroy, kms_encrypt, kms_decrypt, audit_events_accessed, dlp_violation_detected), опциональный): Фильтр по конкретному типу события
- `actor_id` (integer, опциональный): Идентификатор пользователя, выполнившего действие
- `actor_type` (string, опциональный): Тип актора
- `entity_id` (integer, опциональный): Идентификатор затронутой сущности
- `entity_type` (string, опциональный): Тип сущности
- `limit` (integer, опциональный): Количество записей для возврата
  - По умолчанию: `50`
- `cursor` (string, опциональный): Курсор для пагинации из meta.paginate.next_page


## Примеры запроса

### cURL

```bash
curl "https://api.pachca.com/api/shared/v1/audit_events?start_time=2024-04-08T10%3A00%3A00.000Z&end_time=2024-04-08T10%3A00%3A00.000Z&event_key=user_login&actor_id=12345&actor_type=string&entity_id=12345&entity_type=string&limit=50&cursor=string" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/audit_events?start_time=2024-04-08T10%3A00%3A00.000Z&end_time=2024-04-08T10%3A00%3A00.000Z&event_key=user_login&actor_id=12345&actor_type=string&entity_id=12345&entity_type=string&limit=50&cursor=string', {
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
    'start_time': '2024-04-08T10:00:00.000Z',
    'end_time': '2024-04-08T10:00:00.000Z',
    'event_key': 'user_login',
    'actor_id': 12345,
    'actor_type': 'string',
    'entity_id': 12345,
    'entity_type': 'string',
    'limit': 50,
    'cursor': 'string',
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
    path: '/api/shared/v1/audit_events?start_time=2024-04-08T10%3A00%3A00.000Z&end_time=2024-04-08T10%3A00%3A00.000Z&event_key=user_login&actor_id=12345&actor_type=string&entity_id=12345&entity_type=string&limit=50&cursor=string',
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
  'start_time' => '2024-04-08T10:00:00.000Z',
  'end_time' => '2024-04-08T10:00:00.000Z',
  'event_key' => 'user_login',
  'actor_id' => 12345,
  'actor_type' => 'string',
  'entity_id' => 12345,
  'entity_type' => 'string',
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

$params = ['start_time' => '2024-04-08T10:00:00.000Z', 'end_time' => '2024-04-08T10:00:00.000Z', 'event_key' => 'user_login', 'actor_id' => 12345, 'actor_type' => 'string', 'entity_id' => 12345, 'entity_type' => 'string', 'limit' => 50, 'cursor' => 'string'];
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

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `meta` (object, опциональный): Метаданные пагинации
  - `paginate` (object, опциональный): Вспомогательная информация
    - `next_page` (string, опциональный): Курсор пагинации следующей страницы
- `data` (array[object], **обязательный**)
  - `id` (string, **обязательный**): Уникальный идентификатор события
  - `created_at` (string, date-time, **обязательный**): Дата и время создания события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
  - `event_key` (string, **обязательный**): Ключ типа события
    - **Возможные значения:**
      - `user_login`: Пользователь успешно вошел в систему
      - `user_logout`: Пользователь вышел из системы
      - `user_2fa_fail`: Неудачная попытка двухфакторной аутентификации
      - `user_2fa_success`: Успешная двухфакторная аутентификация
      - `user_created`: Создана новая учетная запись пользователя
      - `user_deleted`: Учетная запись пользователя удалена
      - `user_role_changed`: Роль пользователя была изменена
      - `user_updated`: Данные пользователя обновлены
      - `tag_created`: Создан новый тег
      - `tag_deleted`: Тег удален
      - `user_added_to_tag`: Пользователь добавлен в тег
      - `user_removed_from_tag`: Пользователь удален из тега
      - `chat_created`: Создан новый чат
      - `chat_renamed`: Чат переименован
      - `chat_permission_changed`: Изменены права доступа к чату
      - `user_chat_join`: Пользователь присоединился к чату
      - `user_chat_leave`: Пользователь покинул чат
      - `tag_added_to_chat`: Тег добавлен в чат
      - `tag_removed_from_chat`: Тег удален из чата
      - `message_updated`: Сообщение отредактировано
      - `message_deleted`: Сообщение удалено
      - `message_created`
      - `reaction_created`
      - `reaction_deleted`
      - `access_token_created`: Создан новый токен доступа
      - `access_token_updated`: Токен доступа обновлен
      - `access_token_destroy`: Токен доступа удален
      - `kms_encrypt`: Данные зашифрованы
      - `kms_decrypt`: Данные расшифрованы
      - `audit_events_accessed`: Доступ к журналам аудита получен
      - `dlp_violation_detected`: Срабатывание правила DLP-системы
  - `entity_id` (string, **обязательный**): Идентификатор затронутой сущности
  - `entity_type` (string, **обязательный**): Тип затронутой сущности
  - `actor_id` (string, **обязательный**): Идентификатор пользователя, выполнившего действие
  - `actor_type` (string, **обязательный**): Тип актора
  - `details` (Record<string, object>, **обязательный**): Дополнительные детали события
    **Структура значений Record:**
    - Тип значения: `any`
  - `ip_address` (string, **обязательный**): IP-адрес, с которого было выполнено действие
  - `user_agent` (string, **обязательный**): User agent клиента

**Пример ответа:**

```json
{
  "meta": {
    "paginate": {
      "next_page": "eyJfa2QiOiJuIiwiY3JlYXRlZF9hdCI6IjIwMjUtMDUtMTUgMTQ6MzA6MDAuMDAwWiJ9"
    }
  },
  "data": [
    {
      "id": "a1b2c3d4-5e6f-7g8h-9i10-j11k12l13m14",
      "created_at": "2025-05-15T14:30:00.000Z",
      "event_key": "user_chat_join",
      "entity_id": "12345678",
      "entity_type": "Chat",
      "actor_id": "98765",
      "actor_type": "User",
      "details": {
        "inviter_id": "45678"
      },
      "ip_address": "192.168.1.100",
      "user_agent": "Pachca/3.60.0 (co.staply.pachca; build:15; iOS 18.5.0) Alamofire/5.0.0"
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

