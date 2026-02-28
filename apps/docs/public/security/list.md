# Журнал аудита событий

**Метод**: `GET`

**Путь**: `/audit_events`

> **Скоуп:** `audit_events:read`

> **Внимание:** Доступно только на тарифе **Корпорация**

Метод для получения логов событий на основе указанных фильтров.

## Параметры

### Query параметры

- `start_time` (string, **обязательный**): Начальная метка времени (включительно)
  - Пример: `2025-05-01T09:11:00Z`
- `end_time` (string, **обязательный**): Конечная метка времени (исключительно)
  - Пример: `2025-05-02T09:11:00Z`
- `event_key` (string (enum: user_login, user_logout, user_2fa_fail, user_2fa_success, user_created, user_deleted, user_role_changed, user_updated, tag_created, tag_deleted, user_added_to_tag, user_removed_from_tag, chat_created, chat_renamed, chat_permission_changed, user_chat_join, user_chat_leave, tag_added_to_chat, tag_removed_from_chat, message_updated, message_deleted, message_created, reaction_created, reaction_deleted, thread_created, access_token_created, access_token_updated, access_token_destroy, kms_encrypt, kms_decrypt, audit_events_accessed, dlp_violation_detected, search_users_api, search_chats_api, search_messages_api), опциональный): Фильтр по конкретному типу события
  - Пример: `user_login`
- `actor_id` (string, опциональный): Идентификатор пользователя, выполнившего действие
  - Пример: `98765`
- `actor_type` (string, опциональный): Тип актора
  - Пример: `User`
- `entity_id` (string, опциональный): Идентификатор затронутой сущности
  - Пример: `98765`
- `entity_type` (string, опциональный): Тип сущности
  - Пример: `User`
- `limit` (integer, опциональный): Количество записей для возврата
  - Пример: `1`
  - По умолчанию: `50`
- `cursor` (string, опциональный): Курсор для пагинации из meta.paginate.next_page
  - Пример: `eyJpZCI6MTAsImRpciI6ImFzYyJ9`


## Примеры запроса

### cURL

```bash
curl "https://api.pachca.com/api/shared/v1/audit_events?start_time=2025-05-01T09:11:00Z&end_time=2025-05-02T09:11:00Z&event_key=user_login&actor_id=98765&actor_type=User&entity_id=98765&entity_type=User&limit=1&cursor=eyJpZCI6MTAsImRpciI6ImFzYyJ9" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### JavaScript

```javascript
const response = await fetch('https://api.pachca.com/api/shared/v1/audit_events?start_time=2025-05-01T09:11:00Z&end_time=2025-05-02T09:11:00Z&event_key=user_login&actor_id=98765&actor_type=User&entity_id=98765&entity_type=User&limit=1&cursor=eyJpZCI6MTAsImRpciI6ImFzYyJ9', {
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
    'start_time': '2025-05-01T09:11:00Z',
    'end_time': '2025-05-02T09:11:00Z',
    'event_key': 'user_login',
    'actor_id': '98765',
    'actor_type': 'User',
    'entity_id': '98765',
    'entity_type': 'User',
    'limit': 1,
    'cursor': 'eyJpZCI6MTAsImRpciI6ImFzYyJ9',
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
    path: '/api/shared/v1/audit_events?start_time=2025-05-01T09:11:00Z&end_time=2025-05-02T09:11:00Z&event_key=user_login&actor_id=98765&actor_type=User&entity_id=98765&entity_type=User&limit=1&cursor=eyJpZCI6MTAsImRpciI6ImFzYyJ9',
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
  'start_time' => '2025-05-01T09:11:00Z',
  'end_time' => '2025-05-02T09:11:00Z',
  'event_key' => 'user_login',
  'actor_id' => '98765',
  'actor_type' => 'User',
  'entity_id' => '98765',
  'entity_type' => 'User',
  'limit' => 1,
  'cursor' => 'eyJpZCI6MTAsImRpciI6ImFzYyJ9',
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

$params = ['start_time' => '2025-05-01T09:11:00Z', 'end_time' => '2025-05-02T09:11:00Z', 'event_key' => 'user_login', 'actor_id' => '98765', 'actor_type' => 'User', 'entity_id' => '98765', 'entity_type' => 'User', 'limit' => 1, 'cursor' => 'eyJpZCI6MTAsImRpciI6ImFzYyJ9'];
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

- `data` (array[object], **обязательный**)
  - `id` (string, **обязательный**): Уникальный идентификатор события
    - Пример: `a1b2c3d4-5e6f-7g8h-9i10-j11k12l13m14`
  - `created_at` (string, date-time, **обязательный**): Дата и время создания события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
    - Пример: `2025-05-15T14:30:00.000Z`
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
      - `message_created`: Сообщение создано
      - `reaction_created`: Реакция добавлена
      - `reaction_deleted`: Реакция удалена
      - `thread_created`: Тред создан
      - `access_token_created`: Создан новый токен доступа
      - `access_token_updated`: Токен доступа обновлен
      - `access_token_destroy`: Токен доступа удален
      - `kms_encrypt`: Данные зашифрованы
      - `kms_decrypt`: Данные расшифрованы
      - `audit_events_accessed`: Доступ к журналам аудита получен
      - `dlp_violation_detected`: Срабатывание правила DLP-системы
      - `search_users_api`: Поиск сотрудников через API
      - `search_chats_api`: Поиск чатов через API
      - `search_messages_api`: Поиск сообщений через API
  - `entity_id` (string, **обязательный**): Идентификатор затронутой сущности
    - Пример: `98765`
  - `entity_type` (string, **обязательный**): Тип затронутой сущности
    - Пример: `User`
  - `actor_id` (string, **обязательный**): Идентификатор пользователя, выполнившего действие
    - Пример: `98765`
  - `actor_type` (string, **обязательный**): Тип актора
    - Пример: `User`
  - `details` (anyOf, **обязательный**): Дополнительные детали события. Структура зависит от значения event_key — см. описания значений поля event_key. Для событий без деталей возвращается пустой объект
    **Возможные варианты:**

    - **AuditDetailsEmpty**: Пустые детали. При: user_login, user_logout, user_2fa_fail, user_2fa_success, user_created, user_deleted, chat_created, message_created, message_updated, message_deleted, reaction_created, reaction_deleted, thread_created, audit_events_accessed
    - **AuditDetailsUserUpdated**: При: user_updated
      - `changed_attrs` (array[string], **обязательный**): Список изменённых полей
    - **AuditDetailsRoleChanged**: При: user_role_changed
      - `new_company_role` (string, **обязательный**): Новая роль
      - `previous_company_role` (string, **обязательный**): Предыдущая роль
      - `initiator_id` (integer, int32, **обязательный**): Идентификатор инициатора
    - **AuditDetailsTagName**: При: tag_created, tag_deleted
      - `name` (string, **обязательный**): Название тега
    - **AuditDetailsInitiator**: При: user_added_to_tag, user_removed_from_tag, user_chat_leave
      - `initiator_id` (integer, int32, **обязательный**): Идентификатор инициатора действия
    - **AuditDetailsInviter**: При: user_chat_join
      - `inviter_id` (integer, int32, **обязательный**): Идентификатор пригласившего
    - **AuditDetailsChatRenamed**: При: chat_renamed
      - `old_name` (string, **обязательный**): Прежнее название чата
      - `new_name` (string, **обязательный**): Новое название чата
    - **AuditDetailsChatPermission**: При: chat_permission_changed
      - `public_access` (boolean, **обязательный**): Публичный доступ
    - **AuditDetailsTagChat**: При: tag_added_to_chat
      - `chat_id` (integer, int32, **обязательный**): Идентификатор чата
      - `tag_name` (string, **обязательный**): Название тега
    - **AuditDetailsChatId**: При: tag_removed_from_chat
      - `chat_id` (integer, int32, **обязательный**): Идентификатор чата
    - **AuditDetailsTokenScopes**: При: access_token_created, access_token_updated, access_token_destroy
      - `scopes` (array[string], **обязательный**): Скоупы токена
    - **AuditDetailsKms**: При: kms_encrypt, kms_decrypt
      - `chat_id` (integer, int32, **обязательный**): Идентификатор чата
      - `message_id` (integer, int32, **обязательный**): Идентификатор сообщения
      - `reason` (string, **обязательный**): Причина операции
    - **AuditDetailsDlp**: При: dlp_violation_detected
      - `dlp_rule_id` (integer, int32, **обязательный**): Идентификатор правила DLP
      - `dlp_rule_name` (string, **обязательный**): Название правила DLP
      - `message_id` (integer, int32, **обязательный**): Идентификатор сообщения
      - `chat_id` (integer, int32, **обязательный**): Идентификатор чата
      - `user_id` (integer, int32, **обязательный**): Идентификатор пользователя
      - `action_message` (string, **обязательный**): Описание действия
      - `conditions_matched` (boolean, **обязательный**): Результат проверки условий правила (true — условия сработали)
    - **AuditDetailsSearch**: При: search_users_api, search_chats_api, search_messages_api
      - `search_type` (string, **обязательный**): Тип поиска
      - `query_present` (boolean, **обязательный**): Указан ли поисковый запрос
      - `cursor_present` (boolean, **обязательный**): Использован ли курсор
      - `limit` (integer, int32, **обязательный**): Количество возвращённых результатов
      - `filters` (Record<string, object>, **обязательный**): Применённые фильтры. Возможные ключи зависят от типа поиска: order, sort, created_from, created_to, company_roles (users), active, chat_subtype, personal (chats), chat_ids, user_ids (messages)
        **Структура значений Record:**
        - Тип значения: `any`
  - `ip_address` (string, **обязательный**): IP-адрес, с которого было выполнено действие
    - Пример: `192.168.1.100`
  - `user_agent` (string, **обязательный**): User agent клиента
    - Пример: `Pachca/3.60.0 (co.staply.pachca; build:15; iOS 18.5.0) Alamofire/5.0.0`
- `meta` (object, опциональный): Метаданные пагинации
  - `paginate` (object, опциональный): Вспомогательная информация
    - `next_page` (string, опциональный): Курсор пагинации следующей страницы
      - Пример: `eyJxZCO2MiwiZGlyIjomSNYjIn3`

**Пример ответа:**

```json
{
  "data": [
    {
      "id": "a1b2c3d4-5e6f-7g8h-9i10-j11k12l13m14",
      "created_at": "2025-05-15T14:30:00.000Z",
      "event_key": "user_login",
      "entity_id": "98765",
      "entity_type": "User",
      "actor_id": "98765",
      "actor_type": "User",
      "details": null,
      "ip_address": "192.168.1.100",
      "user_agent": "Pachca/3.60.0 (co.staply.pachca; build:15; iOS 18.5.0) Alamofire/5.0.0"
    }
  ],
  "meta": {
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

