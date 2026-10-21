> Расположение: Методы API → Сообщения
> Краткое содержание: Лента сообщений беседы, канала, треда или личной переписки — по chatid нужного чата.
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Список сообщений чата

**Метод**: `GET`

**Путь**: `/messages`

> **Скоуп:** `messages:read`

Лента сообщений беседы, канала, треда или личной переписки — по `chat_id` нужного чата.

Сообщения приходят от новых к старым, то есть первыми идут последние сообщения чата. За более ранними обращайтесь с параметрами `limit` и `cursor`.

Удалённые сообщения в список не попадают.

Сообщения треда отдаются по `chat_id` самого треда, а не по чату, где висит родительское сообщение. Этот `chat_id` приходит в поле `thread.chat_id` родительского сообщения.

## Параметры

### Query параметры

- `chat_id: integer, int32` (required) — Идентификатор чата (беседа, канал, диалог или чат треда)
- `sort: string` (default: id) — Поле сортировки
- `order: string` (default: desc) — Направление сортировки
- `limit: integer, int32` (default: 50) — Количество возвращаемых сущностей за один запрос. Целое число вне допустимых значений заменяется ближайшей границей.
- `cursor: string` — Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`)


## Пример запроса

```bash
# Для получения следующей страницы используйте cursor из meta.paginate.next_page
curl "https://api.pachca.com/api/shared/v1/messages?chat_id=198&sort=id&order=desc&limit=1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: array of object` (required)
  - `id: integer, int32` (required) — Идентификатор сообщения. Пример: `194275`
  - `entity_type: string` (required) — Тип сущности, к которой относится сообщение
    Значения: `discussion` — Беседа или канал, `thread` — Тред, `user` — Пользователь
  - `entity_id: integer, int32` (required) — Идентификатор сущности, к которой относится сообщение (беседы/канала, треда или пользователя). Пример: `334`
  - `chat_id: integer, int32` (required) — Идентификатор чата, в котором находится сообщение. Пример: `334`
  - `root_chat_id: integer, int32` (required) — Идентификатор корневого чата. Для сообщений в тредах — идентификатор чата, в котором был создан тред. Для обычных сообщений совпадает с `chat_id`. Пример: `334`
  - `content: string` (required) — Текст сообщения. Пример: `"Вчера мы продали 756 футболок (что на 10% больше, чем в прошлое воскресенье)"`
  - `user_id: integer, int32` (required) — Идентификатор пользователя, создавшего сообщение. Пример: `12`
  - `created_at: date-time` (required) — Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2021-08-28T15:57:23.000Z"`
  - `url: string` (required) — Прямая ссылка на сообщение. Пример: `"https://app.pachca.com/chats/334?message=194275"`
  - `files: array of object` (required) — Прикрепленные файлы
    - `id: integer, int32` (required) — Идентификатор файла. Пример: `3560`
    - `key: string` (required) — Путь к файлу. Пример: `"attaches/files/12/21zu7934-02e1-44d9-8df2-0f970c259796/congrat.png"`
    - `name: string` (required) — Название файла с расширением. Пример: `"congrat.png"`
    - `file_type: string` (required) — Тип файла
      Значения: `file` — Обычный файл, `image` — Изображение, `audio` — Аудиофайл, `voice` — Голосовое сообщение, `video` — Видеофайл
    - `url: string` (required) — Ссылка на скачивание файла. Обычно ведёт прямо в хранилище и действует до 7 дней, а оставшийся срок может быть меньше — если такая ссылка вернула `403`, запросите сообщение заново и получите свежую. Если в пространстве включено шифрование или задан безопасный контур, ссылка ведёт на [Скачивание файла](/api/files/get): забирать такой файл нужно с заголовком `Authorization`, а токену нужен скоуп `files:read`. Пример: `"https://files.example.com/attaches/files/12/21zu7934-02e1-44d9-8df2-0f970c259796/congrat.png?X-Amz-Expires=604800&X-Amz-Signature=98765asgfadsfdSaDSd4sdfg35asdf67sadf8"`
    - `width: integer, int32` (nullable) — Ширина изображения в пикселях. `null` для файлов, не являющихся изображением, а также если размер не был передан при загрузке. Пример: `1920`
    - `height: integer, int32` (nullable) — Высота изображения в пикселях. `null` для файлов, не являющихся изображением, а также если размер не был передан при загрузке. Пример: `1080`
    - `duration_ms: integer, int32` (nullable) — Длительность в миллисекундах у голосового, аудио- и видеофайла. `null` у остальных файлов и если длительность не была передана при загрузке. Пример: `5400`
  - `voice_content: object` (required) — Данные голосового сообщения. Заполняется только для голосовых сообщений (`file_type` файла — `voice`), иначе `null`.
    - `duration_ms: integer, int32` (required) — Длительность голосового сообщения в миллисекундах. Пример: `5400`
    - `waveform: string` (required) — Форма волны (амплитуды) для визуализации голосового сообщения. Пример: `"4,8,12,20,16,10,6,3"`
    - `transcript: string` (required, nullable) — Расшифровка голосового сообщения в текст. `null`, пока расшифровка не готова или недоступна. Пример: `"Привет, посмотри пожалуйста последний отчёт"`
  - `buttons: array of array` (required, nullable) — Массив строк, каждая из которых представлена массивом кнопок. `null`, если сообщение отправлено без кнопок.
  - `thread: object` (required, nullable) — Тред, созданный к этому сообщению. `null`, если тред не создан, а также у сообщений, которые сами находятся внутри треда.
    - `id: integer, int64` (required) — Идентификатор треда. Чтобы написать в тред, передайте его в `entity_id` метода [Новое сообщение](/api/messages/create) с `entity_type: "thread"`. Пример: `265142`
    - `chat_id: integer, int64` (required) — Идентификатор чата треда. По нему читают сообщения треда методом [Список сообщений чата](/api/messages/list). Пример: `2637266155`
  - `forwarding: object` (required) — Информация о пересланном сообщении. `null`, если сообщение не является пересланным.
    - `original_message_id: integer, int32` (required) — Идентификатор оригинального сообщения. Пример: `194275`
    - `original_chat_id: integer, int32` (required) — Идентификатор чата, в котором находится оригинальное сообщение. Пример: `334`
    - `author_id: integer, int32` (required) — Идентификатор пользователя, создавшего оригинальное сообщение. Пример: `12`
    - `original_created_at: date-time` (required) — Дата и время создания оригинального сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-01-15T10:30:00.000Z"`
    - `original_thread_id: integer, int32` (required, nullable) — Идентификатор треда, в котором находится оригинальное сообщение. Пример: `null`
    - `original_thread_message_id: integer, int32` (required, nullable) — Идентификатор сообщения, к которому был создан тред, в котором находится оригинальное сообщение. `null`, если оригинальное сообщение было не в треде или тред создан без привязки к сообщению. Пример: `null`
    - `original_thread_parent_chat_id: integer, int32` (required, nullable) — Идентификатор чата сообщения, к которому был создан тред, в котором находится оригинальное сообщение. `null`, если оригинальное сообщение было не в треде или тред создан без привязки к сообщению. Пример: `null`
  - `parent_message_id: integer, int32` (required, nullable) — Идентификатор сообщения, к которому написан ответ. `null`, если сообщение не является ответом на другое сообщение. Пример: `null`
  - `display_avatar_url: string` (nullable) — Ссылка на аватарку отправителя сообщения. Поле присутствует только у сообщений от ботов; у сообщений от сотрудников его в ответе нет. `null`, если бот не переопределял значение при отправке. Пример: `null`
  - `display_name: string` (nullable) — Полное имя отправителя сообщения. Поле присутствует только у сообщений от ботов; у сообщений от сотрудников его в ответе нет. `null`, если бот не переопределял значение при отправке. Пример: `null`
  - `changed_at: date-time` (required, nullable) — Дата и время последнего изменения сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. У неотредактированного сообщения совпадает с датой создания. `null` у сообщений, отправленных до появления этого поля. Пример: `"2021-08-28T16:10:00.000Z"`
  - `deleted_at: date-time` (required, nullable) — Дата и время удаления сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null` у неудалённых сообщений. В списке сообщений удалённые не возвращаются. Пример: `null`
- `meta: object` (required) — Метаданные пагинации
  - `paginate: object` (required) — Вспомогательная информация
    - `next_page: string` (required) — Курсор пагинации следующей страницы. Пример: `"eyJxZCO2MiwiZGlyIjomSNYjIn3"`
    - `prev_page: string` — Курсор пагинации предыдущей страницы. Используется для polling новых записей «сверху» списка. Пример: `"eyJxZCO2MiwiZGlyIjoiYXNjIn0"`
    - `has_next: boolean` — Есть ли ещё данные на следующей странице. На последней странице — `false`. Пример: `true`
    - `has_prev: boolean` — Есть ли ещё данные на предыдущей странице. На первом запросе без курсора — `false`. Пример: `false`

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
          "url": "https://files.example.com/attaches/files/12/21zu7934-02e1-44d9-8df2-0f970c259796/congrat.png?X-Amz-Expires=604800&X-Amz-Signature=98765asgfadsfdSaDSd4sdfg35asdf67sadf8",
          "width": 1920,
          "height": 1080,
          "duration_ms": 5400
        }
      ],
      "voice_content": {
        "duration_ms": 5400,
        "waveform": "4,8,12,20,16,10,6,3",
        "transcript": "Привет, посмотри пожалуйста последний отчёт"
      },
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
    "paginate": {
      "next_page": "eyJxZCO2MiwiZGlyIjomSNYjIn3",
      "prev_page": "eyJxZCO2MiwiZGlyIjoiYXNjIn0",
      "has_next": true,
      "has_prev": false
    }
  }
}
```

### 400: The server could not understand the request due to invalid syntax.

**Схема ответа при ошибке:** `ApiError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

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

**Схема ответа при ошибке:** `OAuthError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

**Пример ответа:**

```json
{
  "error": "invalid_token",
  "error_description": "Access token is missing"
}
```

### 402: Client error

**Схема ответа при ошибке:** `ApiError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

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

**Схема ответа при ошибке:** `ApiError` или `OAuthError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

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

### 404: The server cannot find the requested resource.

**Схема ответа при ошибке:** `ApiError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

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

### 422: Client error

**Схема ответа при ошибке:** `ApiError`. Поля и коды описаны в разделе [Ошибки](/api/errors).

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

