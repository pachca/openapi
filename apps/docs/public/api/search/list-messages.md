# Поиск сообщений

**Метод**: `GET`

**Путь**: `/search/messages`

> **Скоуп:** `search:messages`

Метод для полнотекстового поиска сообщений.

## Параметры

### Query параметры

- `query: string` — Текст поискового запроса
- `limit: integer, int32` (default: 200) — Количество возвращаемых результатов за один запрос
- `cursor: string` — Курсор для пагинации (из meta.paginate.next_page)
- `order: string` — Направление сортировки
  Значения: `asc`, `desc`
- `created_from: date-time` — Фильтр по дате создания (от)
- `created_to: date-time` — Фильтр по дате создания (до)
- `chat_ids: array` — Фильтр по ID чатов
- `user_ids: array` — Фильтр по ID авторов сообщений
- `active: boolean` — Фильтр по активности чата


## Пример запроса

```bash
# Для получения следующей страницы используйте cursor из meta.paginate.next_page
curl "https://api.pachca.com/api/shared/v1/search/messages?query=футболки&limit=10&order=desc&created_from=2025-01-01T00:00:00.000Z&created_to=2025-02-01T00:00:00.000Z&chat_ids[]=198&chat_ids[]=334&user_ids[]=12&user_ids[]=185&active=true" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: array of object` (required)
  - `id: integer, int32` (required) — Идентификатор сообщения
  - `entity_type: string` (required) — Тип сущности, к которой относится сообщение
    Значения: `discussion` — Беседа или канал, `thread` — Тред, `user` — Пользователь
  - `entity_id: integer, int32` (required) — Идентификатор сущности, к которой относится сообщение (беседы/канала, треда или пользователя)
  - `chat_id: integer, int32` (required) — Идентификатор чата, в котором находится сообщение
  - `root_chat_id: integer, int32` (required) — Идентификатор корневого чата. Для сообщений в тредах — идентификатор чата, в котором был создан тред. Для обычных сообщений совпадает с `chat_id`.
  - `content: string` (required) — Текст сообщения
  - `user_id: integer, int32` (required) — Идентификатор пользователя, создавшего сообщение
  - `created_at: date-time` (required) — Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
  - `url: string` (required) — Прямая ссылка на сообщение
  - `files: array of object` (required) — Прикрепленные файлы
    - `id: integer, int32` (required) — Идентификатор файла
    - `key: string` (required) — Путь к файлу
    - `name: string` (required) — Название файла с расширением
    - `file_type: string` (required) — Тип файла
      Значения: `file` — Обычный файл, `image` — Изображение
    - `url: string` (required) — Прямая ссылка на скачивание файла
    - `width: integer, int32` — Ширина изображения в пикселях
    - `height: integer, int32` — Высота изображения в пикселях
  - `buttons: array of array` (required) — Массив строк, каждая из которых представлена массивом кнопок
  - `thread: object` (required) — Тред сообщения
    - `id: integer, int64` (required) — Идентификатор треда
    - `chat_id: integer, int64` (required) — Идентификатор чата треда
  - `forwarding: object` (required) — Информация о пересланном сообщении
    - `original_message_id: integer, int32` (required) — Идентификатор оригинального сообщения
    - `original_chat_id: integer, int32` (required) — Идентификатор чата, в котором находится оригинальное сообщение
    - `author_id: integer, int32` (required) — Идентификатор пользователя, создавшего оригинальное сообщение
    - `original_created_at: date-time` (required) — Дата и время создания оригинального сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
    - `original_thread_id: integer, int32` (required) — Идентификатор треда, в котором находится оригинальное сообщение
    - `original_thread_message_id: integer, int32` (required) — Идентификатор сообщения, к которому был создан тред, в котором находится оригинальное сообщение
    - `original_thread_parent_chat_id: integer, int32` (required) — Идентификатор чата сообщения, к которому был создан тред, в котором находится оригинальное сообщение
  - `parent_message_id: integer, int32` (required) — Идентификатор сообщения, к которому написан ответ
  - `display_avatar_url: string` (required) — Ссылка на аватарку отправителя сообщения
  - `display_name: string` (required) — Полное имя отправителя сообщения
  - `changed_at: date-time` (required) — Дата и время последнего редактирования сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
  - `deleted_at: date-time` (required) — Дата и время удаления сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ
- `meta: object` (required) — Мета-информация для пагинации поисковых результатов
  - `total: integer, int32` (required) — Общее количество найденных результатов
  - `paginate: object` (required) — Вспомогательная информация
    - `next_page: string` (required) — Курсор пагинации следующей страницы

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
      "user_id": 12,
      "created_at": "2021-08-28T15:57:23.000Z",
      "url": "https://app.pachca.com/chats/334?message=194275",
      "files": [
        {
          "id": 3560,
          "key": "attaches/files/12/21zu7934-02e1-44d9-8df2-0f970c259796/congrat.png",
          "name": "congrat.png",
          "file_type": "image",
          "url": "https://pachca-prod-uploads.s3.storage.selcloud.ru/attaches/files/12/21zu7934-02e1-44d9-8df2-0f970c259796/congrat.png?response-cache-control=max-age%3D3600%3B&response-content-disposition=attachment&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=142155_staply%2F20231107%2Fru-1a%2Fs3%2Faws4_request&X-Amz-Date=20231107T160412&X-Amz-Expires=604800&X-Amz-SignedHeaders=host&X-Amz-Signature=98765asgfadsfdSaDSd4sdfg35asdf67sadf8",
          "width": 1920,
          "height": 1080
        }
      ],
      "buttons": [
        [
          {
            "text": null
          }
        ]
      ],
      "thread": {
        "id": 265142,
        "chat_id": 2637266155
      },
      "forwarding": {
        "original_message_id": 194275,
        "original_chat_id": 334,
        "author_id": 12,
        "original_created_at": "2025-01-15T10:30:00.000Z",
        "original_thread_id": null,
        "original_thread_message_id": null,
        "original_thread_parent_chat_id": null
      },
      "parent_message_id": null,
      "display_avatar_url": null,
      "display_name": null,
      "changed_at": "2021-08-28T16:10:00.000Z",
      "deleted_at": null
    }
  ],
  "meta": {
    "total": 42,
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
  - `payload: Record<string, object>` (required) — Дополнительные данные об ошибке. Содержимое зависит от кода ошибки: `{id: number}` — при ошибке кастомного свойства (идентификатор свойства), `{record: {type: string, id: number}, query: string}` — при ошибке авторизации. В большинстве случаев `null`
    **Структура значений Record:**
    - Тип значения: `any`

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

### 402: Client error

**Схема ответа при ошибке:**

- `errors: array of object` (required) — Массив ошибок
  - `key: string` (required) — Ключ поля с ошибкой
  - `value: string` (required) — Значение поля, которое вызвало ошибку
  - `message: string` (required) — Сообщение об ошибке
  - `code: string` (required) — Код ошибки
    Значения: `blank` — Обязательное поле (не может быть пустым), `too_long` — Слишком длинное значение (пояснения вы получите в поле message), `invalid` — Поле не соответствует правилам (пояснения вы получите в поле message), `inclusion` — Поле имеет непредусмотренное значение, `exclusion` — Поле имеет недопустимое значение, `taken` — Название для этого поля уже существует, `wrong_emoji` — Emoji статуса не может содержать значения отличные от Emoji символа, `not_found` — Объект не найден, `already_exists` — Объект уже существует (пояснения вы получите в поле message), `personal_chat` — Ошибка личного чата (пояснения вы получите в поле message), `displayed_error` — Отображаемая ошибка (пояснения вы получите в поле message), `not_authorized` — Действие запрещено, `invalid_date_range` — Выбран слишком большой диапазон дат, `invalid_webhook_url` — Некорректный URL вебхука, `rate_limit` — Достигнут лимит запросов, `licenses_limit` — Превышен лимит активных сотрудников (пояснения вы получите в поле message), `user_limit` — Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций), `unique_limit` — Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций), `general_limit` — Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций), `unhandled` — Ошибка выполнения запроса (пояснения вы получите в поле message), `trigger_not_found` — Не удалось найти идентификатор события, `trigger_expired` — Время жизни идентификатора события истекло, `required` — Обязательный параметр не передан, `in` — Недопустимое значение (не входит в список допустимых), `not_applicable` — Значение неприменимо в данном контексте (пояснения вы получите в поле message), `self_update` — Нельзя изменить свои собственные данные, `owner_protected` — Нельзя изменить данные владельца, `already_assigned` — Значение уже назначено, `forbidden` — Недостаточно прав для выполнения действия (пояснения вы получите в поле message), `permission_denied` — Доступ запрещён (недостаточно прав), `access_denied` — Доступ запрещён, `wrong_params` — Некорректные параметры запроса (пояснения вы получите в поле message), `payment_required` — Требуется оплата, `min_length` — Значение слишком короткое (пояснения вы получите в поле message), `max_length` — Значение слишком длинное (пояснения вы получите в поле message), `use_of_system_words` — Использовано зарезервированное системное слово (here, all)
  - `payload: Record<string, object>` (required) — Дополнительные данные об ошибке. Содержимое зависит от кода ошибки: `{id: number}` — при ошибке кастомного свойства (идентификатор свойства), `{record: {type: string, id: number}, query: string}` — при ошибке авторизации. В большинстве случаев `null`
    **Структура значений Record:**
    - Тип значения: `any`

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

