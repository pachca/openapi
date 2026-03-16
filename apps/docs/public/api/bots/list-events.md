# История событий

**Метод**: `GET`

**Путь**: `/webhooks/events`

> **Скоуп:** `webhooks:events:read`

Метод для получения истории последних событий бота. Данный метод будет полезен, если вы не можете получать события в реальном времени на ваш `URL`, но вам требуется обрабатывать все события, на которые вы подписались.

История событий сохраняется только при активном пункте «Сохранять историю событий» во вкладке «Исходящий webhook» настроек бота. При этом указывать «Webhook `URL`» не требуется.

Для получения истории событий конкретного бота вам необходимо знать его `access_token` и использовать его при запросе. Каждое событие представляет `JSON` объект вебхука.

## Параметры

### Query параметры

- `limit: integer, int32` (default: 50) — Количество возвращаемых сущностей за один запрос
- `cursor: string` — Курсор для пагинации (из meta.paginate.next_page)


## Пример запроса

```bash
# Для получения следующей страницы используйте cursor из meta.paginate.next_page
curl "https://api.pachca.com/api/shared/v1/webhooks/events?limit=1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: array of object` (required)
  - `id: string` (required) — Идентификатор события
  - `event_type: string` (required) — Тип события
  - `payload: anyOf` (required) — Объект вебхука
    **Возможные варианты:**

    - **MessageWebhookPayload**: Структура исходящего вебхука о сообщении
      - `type: string` (required) — Тип объекта
        Значения: `message` — Для сообщений всегда message
      - `id: integer, int32` (required) — Идентификатор сообщения
      - `event: string` (required) — Тип события
        Значения: `new` — Создание, `update` — Обновление, `delete` — Удаление
      - `entity_type: string` (required) — Тип сущности, к которой относится сообщение
        Значения: `discussion` — Беседа или канал, `thread` — Тред, `user` — Пользователь
      - `entity_id: integer, int32` (required) — Идентификатор сущности, к которой относится сообщение
      - `content: string` (required) — Текст сообщения
      - `user_id: integer, int32` (required) — Идентификатор отправителя сообщения
      - `created_at: date-time` (required) — Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
      - `url: string` (required) — Прямая ссылка на сообщение
      - `chat_id: integer, int32` (required) — Идентификатор чата, в котором находится сообщение
      - `parent_message_id: integer, int32` — Идентификатор сообщения, к которому написан ответ
      - `thread: object` — Объект с параметрами треда
        - `message_id: integer, int32` (required) — Идентификатор сообщения, к которому был создан тред
        - `message_chat_id: integer, int32` (required) — Идентификатор чата сообщения, к которому был создан тред
      - `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX
    - **ReactionWebhookPayload**: Структура исходящего вебхука о реакции
      - `type: string` (required) — Тип объекта
        Значения: `reaction` — Для реакций всегда reaction
      - `event: string` (required) — Тип события
        Значения: `new` — Создание, `delete` — Удаление
      - `message_id: integer, int32` (required) — Идентификатор сообщения, к которому относится реакция
      - `code: string` (required) — Emoji символ реакции
      - `name: string` (required) — Название реакции
      - `user_id: integer, int32` (required) — Идентификатор пользователя, который добавил или удалил реакцию
      - `created_at: date-time` (required) — Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
      - `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX
    - **ButtonWebhookPayload**: Структура исходящего вебхука о нажатии кнопки
      - `type: string` (required) — Тип объекта
        Значения: `button` — Для кнопки всегда button
      - `event: string` (required) — Тип события
        Значения: `click` — Нажатие кнопки
      - `message_id: integer, int32` (required) — Идентификатор сообщения, к которому относится кнопка
      - `trigger_id: string` (required) — Уникальный идентификатор события. Время жизни — 3 секунды. Может быть использован, например, для открытия представления пользователю
      - `data: string` (required) — Данные нажатой кнопки
      - `user_id: integer, int32` (required) — Идентификатор пользователя, который нажал кнопку
      - `chat_id: integer, int32` (required) — Идентификатор чата, в котором была нажата кнопка
      - `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX
    - **ChatMemberWebhookPayload**: Структура исходящего вебхука об участниках чата
      - `type: string` (required) — Тип объекта
        Значения: `chat_member` — Для участника чата всегда chat_member
      - `event: string` (required) — Тип события
        Значения: `add` — Добавление, `remove` — Удаление
      - `chat_id: integer, int32` (required) — Идентификатор чата, в котором изменился состав участников
      - `thread_id: integer, int32` — Идентификатор треда
      - `user_ids: array of integer` (required) — Массив идентификаторов пользователей, с которыми произошло событие
      - `created_at: date-time` (required) — Дата и время события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
      - `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX
    - **CompanyMemberWebhookPayload**: Структура исходящего вебхука об участниках пространства
      - `type: string` (required) — Тип объекта
        Значения: `company_member` — Для участника пространства всегда company_member
      - `event: string` (required) — Тип события
        Значения: `invite` — Приглашение, `confirm` — Подтверждение, `update` — Обновление, `suspend` — Приостановка, `activate` — Активация, `delete` — Удаление
      - `user_ids: array of integer` (required) — Массив идентификаторов пользователей, с которыми произошло событие
      - `created_at: date-time` (required) — Дата и время события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
      - `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX
    - **LinkSharedWebhookPayload**: Структура исходящего вебхука о разворачивании ссылок
      - `type: string` (required) — Тип объекта
        Значения: `message` — Для разворачивания ссылок всегда message
      - `event: string` (required) — Тип события
        Значения: `link_shared` — Обнаружена ссылка на отслеживаемый домен
      - `chat_id: integer, int32` (required) — Идентификатор чата, в котором обнаружена ссылка
      - `message_id: integer, int32` (required) — Идентификатор сообщения, содержащего ссылку
      - `links: array of object` (required) — Массив обнаруженных ссылок на отслеживаемые домены
        - `url: string` (required) — URL ссылки
        - `domain: string` (required) — Домен ссылки
      - `user_id: integer, int32` (required) — Идентификатор отправителя сообщения
      - `created_at: date-time` (required) — Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
      - `webhook_timestamp: integer, int32` (required) — Дата и время отправки вебхука (UTC+0) в формате UNIX
  - `created_at: date-time` (required) — Дата и время создания события (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
- `meta: object` — Метаданные пагинации
  - `paginate: object` — Вспомогательная информация
    - `next_page: string` — Курсор пагинации следующей страницы

**Пример ответа:**

```json
{
  "data": [
    {
      "id": "01KAJZ2XDSS2S3DSW9EXJZ0TBV",
      "event_type": "message_new",
      "payload": {
        "type": "message",
        "id": 1245817,
        "event": "new",
        "entity_type": "discussion",
        "entity_id": 5678,
        "content": "Текст сообщения",
        "user_id": 2345,
        "created_at": "2025-05-15T14:30:00.000Z",
        "url": "https://pachca.com/chats/1245817/messages/5678",
        "chat_id": 9012,
        "parent_message_id": 3456,
        "thread": {
          "message_id": 12345,
          "message_chat_id": 67890
        },
        "webhook_timestamp": 1747574400
      },
      "created_at": "2025-05-15T14:30:00.000Z"
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

- `errors: array of object` (required) — Массив ошибок
  - `key: string` (required) — Ключ поля с ошибкой
  - `value: string` (required) — Значение поля, которое вызвало ошибку
  - `message: string` (required) — Сообщение об ошибке
  - `code: string` (required) — Код ошибки
    Значения: `blank` — Обязательное поле (не может быть пустым), `too_long` — Слишком длинное значение (пояснения вы получите в поле message), `invalid` — Поле не соответствует правилам (пояснения вы получите в поле message), `inclusion` — Поле имеет непредусмотренное значение, `exclusion` — Поле имеет недопустимое значение, `taken` — Название для этого поля уже существует, `wrong_emoji` — Emoji статуса не может содержать значения отличные от Emoji символа, `not_found` — Объект не найден, `already_exists` — Объект уже существует (пояснения вы получите в поле message), `personal_chat` — Ошибка личного чата (пояснения вы получите в поле message), `displayed_error` — Отображаемая ошибка (пояснения вы получите в поле message), `not_authorized` — Действие запрещено, `invalid_date_range` — Выбран слишком большой диапазон дат, `invalid_webhook_url` — Некорректный URL вебхука, `rate_limit` — Достигнут лимит запросов, `licenses_limit` — Превышен лимит активных сотрудников (пояснения вы получите в поле message), `user_limit` — Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций), `unique_limit` — Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций), `general_limit` — Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций), `unhandled` — Ошибка выполнения запроса (пояснения вы получите в поле message), `trigger_not_found` — Не удалось найти идентификатор события, `trigger_expired` — Время жизни идентификатора события истекло, `required` — Обязательный параметр не передан, `in` — Недопустимое значение (не входит в список допустимых), `not_applicable` — Значение неприменимо в данном контексте (пояснения вы получите в поле message), `self_update` — Нельзя изменить свои собственные данные, `owner_protected` — Нельзя изменить данные владельца, `already_assigned` — Значение уже назначено, `forbidden` — Недостаточно прав для выполнения действия (пояснения вы получите в поле message), `permission_denied` — Доступ запрещён (недостаточно прав), `access_denied` — Доступ запрещён, `wrong_params` — Некорректные параметры запроса (пояснения вы получите в поле message), `payment_required` — Требуется оплата, `min_length` — Значение слишком короткое (пояснения вы получите в поле message), `max_length` — Значение слишком длинное (пояснения вы получите в поле message), `use_of_system_words` — Использовано зарезервированное системное слово (here, all)
  - `payload: string` (required) — Дополнительные данные об ошибке

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

- `error: string` (required) — Код ошибки
- `error_description: string` (required) — Описание ошибки

**Пример ответа:**

```json
{
  "error": "invalid_token",
  "error_description": "Access token is missing"
}
```

### 403: Access is forbidden.

**Схема ответа при ошибке:**

- `error: string` (required) — Код ошибки
- `error_description: string` (required) — Описание ошибки

**Пример ответа:**

```json
{
  "error": "invalid_token",
  "error_description": "Access token is missing"
}
```

### 422: Client error

**Схема ответа при ошибке:**

- `errors: array of object` (required) — Массив ошибок
  - `key: string` (required) — Ключ поля с ошибкой
  - `value: string` (required) — Значение поля, которое вызвало ошибку
  - `message: string` (required) — Сообщение об ошибке
  - `code: string` (required) — Код ошибки
    Значения: `blank` — Обязательное поле (не может быть пустым), `too_long` — Слишком длинное значение (пояснения вы получите в поле message), `invalid` — Поле не соответствует правилам (пояснения вы получите в поле message), `inclusion` — Поле имеет непредусмотренное значение, `exclusion` — Поле имеет недопустимое значение, `taken` — Название для этого поля уже существует, `wrong_emoji` — Emoji статуса не может содержать значения отличные от Emoji символа, `not_found` — Объект не найден, `already_exists` — Объект уже существует (пояснения вы получите в поле message), `personal_chat` — Ошибка личного чата (пояснения вы получите в поле message), `displayed_error` — Отображаемая ошибка (пояснения вы получите в поле message), `not_authorized` — Действие запрещено, `invalid_date_range` — Выбран слишком большой диапазон дат, `invalid_webhook_url` — Некорректный URL вебхука, `rate_limit` — Достигнут лимит запросов, `licenses_limit` — Превышен лимит активных сотрудников (пояснения вы получите в поле message), `user_limit` — Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций), `unique_limit` — Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций), `general_limit` — Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций), `unhandled` — Ошибка выполнения запроса (пояснения вы получите в поле message), `trigger_not_found` — Не удалось найти идентификатор события, `trigger_expired` — Время жизни идентификатора события истекло, `required` — Обязательный параметр не передан, `in` — Недопустимое значение (не входит в список допустимых), `not_applicable` — Значение неприменимо в данном контексте (пояснения вы получите в поле message), `self_update` — Нельзя изменить свои собственные данные, `owner_protected` — Нельзя изменить данные владельца, `already_assigned` — Значение уже назначено, `forbidden` — Недостаточно прав для выполнения действия (пояснения вы получите в поле message), `permission_denied` — Доступ запрещён (недостаточно прав), `access_denied` — Доступ запрещён, `wrong_params` — Некорректные параметры запроса (пояснения вы получите в поле message), `payment_required` — Требуется оплата, `min_length` — Значение слишком короткое (пояснения вы получите в поле message), `max_length` — Значение слишком длинное (пояснения вы получите в поле message), `use_of_system_words` — Использовано зарезервированное системное слово (here, all)
  - `payload: string` (required) — Дополнительные данные об ошибке

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

