> Расположение: Методы API → Черновики
> Краткое содержание: Свои черновики, от новых к старым.
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Список черновиков

**Метод**: `GET`

**Путь**: `/drafts`

> **Скоуп:** `drafts:read`

Свои черновики, от новых к старым.

По умолчанию возвращаются только обычные черновики: отложенные нужно запросить параметром `type`. Отличить их в ответе можно по полю `schedule`.

Пара `entity_type` и `entity_id` сужает выдачу до одного чата, треда или личной переписки. Если такого чата нет или он недоступен, метод отвечает пустым списком, а не ошибкой.

## Параметры

### Query параметры

- `type: string` (default: regular) — Что возвращать: `regular` — обычные черновики, `scheduled` — отложенные сообщения, `all` — и те и другие
- `entity_type: string` — Тип чата для фильтра по одному чату. Указывается вместе с `entity_id`: если прислать только один из двух, ответ будет `422`.
  Значения: `discussion`, `thread`, `user`
- `entity_id: integer, int32` — Идентификатор того, что названо в `entity_type`. Указывается вместе с ним.
- `limit: integer, int32` (default: 50) — Количество возвращаемых сущностей за один запрос
- `cursor: string` — Курсор для пагинации (из `meta.paginate.next_page` или `meta.paginate.prev_page`)


## Пример запроса

```bash
# Для получения следующей страницы используйте cursor из meta.paginate.next_page
curl "https://api.pachca.com/api/shared/v1/drafts?type=all&entity_type=discussion&entity_id=334&limit=25" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: array of object` (required)
  - `id: integer, int32` (required) — Идентификатор черновика. Пример: `4821`
  - `entity_type: string` (required) — Куда уйдёт сообщение: в беседу или канал, в тред либо в личную переписку с сотрудником
    Значения: `discussion` — Беседа или канал, `thread` — Тред, `user` — Пользователь
  - `entity_id: integer, int32` (required, nullable) — Идентификатор того, что названо в `entity_type`: беседы или канала, треда либо сотрудника. Пример: `334`
  - `chat_id: integer, int32` (required, nullable) — Идентификатор чата, в котором лежит черновик. У черновика треда это чат самого треда. Пример: `334`
  - `content: string` (required) — Текст черновика. У черновика из одних вложений приходит пустая строка, а не `null`. Пример: `"Отчёт за неделю: продажи выросли на 10%"`
  - `parent_message_id: integer, int32` (required, nullable) — Идентификатор сообщения, ответом на которое уйдёт черновик. `null`, если это не ответ. Пример: `196093`
  - `files: array of object` (required) — Прикреплённые файлы
    - `id: integer, int32` (required) — Идентификатор файла. Пример: `3560`
    - `key: string` (required) — Путь к файлу. Пример: `"attaches/files/12/21zu7934-02e1-44d9-8df2-0f970c259796/congrat.png"`
    - `name: string` (required) — Название файла с расширением. Пример: `"congrat.png"`
    - `file_type: string` (required) — Тип файла
      Значения: `file` — Обычный файл, `image` — Изображение, `audio` — Аудиофайл, `voice` — Голосовое сообщение, `video` — Видеофайл
    - `url: string` (required) — Ссылка на скачивание файла. Обычно ведёт прямо в хранилище и действует до 7 дней, а оставшийся срок может быть меньше — если такая ссылка вернула `403`, запросите сообщение заново и получите свежую. Если в пространстве включено шифрование или задан безопасный контур, ссылка ведёт на [Скачивание файла](/api/files/get): забирать такой файл нужно с заголовком `Authorization`, а токену нужен скоуп `files:read`. Пример: `"https://files.example.com/attaches/files/12/21zu7934-02e1-44d9-8df2-0f970c259796/congrat.png?X-Amz-Expires=604800&X-Amz-Signature=98765asgfadsfdSaDSd4sdfg35asdf67sadf8"`
    - `width: integer, int32` (nullable) — Ширина изображения в пикселях. `null` для файлов, не являющихся изображением, а также если размер не был передан при загрузке. Пример: `1920`
    - `height: integer, int32` (nullable) — Высота изображения в пикселях. `null` для файлов, не являющихся изображением, а также если размер не был передан при загрузке. Пример: `1080`
    - `duration_ms: integer, int32` (nullable) — Длительность в миллисекундах у голосового, аудио- и видеофайла. `null` у остальных файлов и если длительность не была передана при загрузке. Пример: `5400`
  - `voice_content: object` (required) — Голосовое сообщение. `null`, если голосового вложения нет. Расшифровка в `transcript` у черновика всегда `null` — она запускается после отправки.
    - `duration_ms: integer, int32` (required) — Длительность голосового сообщения в миллисекундах. Пример: `5400`
    - `waveform: string` (required) — Форма волны (амплитуды) для визуализации голосового сообщения. Пример: `"4,8,12,20,16,10,6,3"`
    - `transcript: string` (required, nullable) — Расшифровка голосового сообщения в текст. `null`, пока расшифровка не готова или недоступна. Пример: `"Привет, посмотри пожалуйста последний отчёт"`
  - `schedule: object` (required) — Расписание отправки. `null` у обычного черновика.
    - `start_date: date-time` (required) — Первая отправка (ISO-8601). Из неё берутся время суток, число месяца и день недели, по которым дальше строится повтор. Пример: `"2026-09-17T12:00:00.000Z"`
    - `end_date: date-time` (required, nullable) — Дата, после которой повтор прекращается (ISO-8601). `null`, если конец не задан. Пример: `"2026-12-31T12:00:00.000Z"`
    - `repetition: object` (required) — Правило повтора
      - `interval: string` (required) — Периодичность
        Значения: `once` — Один раз, `daily` — Каждый день, `weekly` — Каждую неделю, `monthly` — Каждый месяц, `every_2_months` — Раз в два месяца, `every_3_months` — Раз в три месяца, `every_4_months` — Раз в четыре месяца, `every_6_months` — Раз в полгода, `yearly` — Раз в год
      - `days: array of integer` — Дни недели, по которым уходит сообщение: 0 — воскресенье, 6 — суббота. Приходит только при периодичности `weekly`. Пример: `[1,3]`
      - `nth_day: integer, int32` (nullable) — Какой по счёту день недели в месяце: от 1 до 4 — первый, второй, третий, четвёртый, 5 — последний. Приходит только при периодичности по месяцам, а `null` в ней означает повтор по числу месяца из `start_date`. Пример: `2`
  - `next_send_at: date-time` (required, nullable) — Ближайшая отправка (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null` у обычного черновика. Пример: `"2026-09-17T12:00:00.000Z"`
  - `created_at: date-time` (required) — Дата и время создания (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2026-09-16T10:00:00.000Z"`
  - `updated_at: date-time` (required) — Дата и время последнего изменения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2026-09-16T10:00:00.000Z"`
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
      "id": 4821,
      "entity_type": "discussion",
      "entity_id": 334,
      "chat_id": 334,
      "content": "Отчёт за неделю: продажи выросли на 10%",
      "parent_message_id": 196093,
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
      "schedule": {
        "start_date": "2026-09-17T12:00:00.000Z",
        "end_date": "2026-12-31T12:00:00.000Z",
        "repetition": {
          "interval": "weekly",
          "days": [
            1,
            3
          ],
          "nth_day": 2
        }
      },
      "next_send_at": "2026-09-17T12:00:00.000Z",
      "created_at": "2026-09-16T10:00:00.000Z",
      "updated_at": "2026-09-16T10:00:00.000Z"
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

