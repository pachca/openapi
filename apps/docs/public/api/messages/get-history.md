> Расположение: Методы API → Сообщения
> Краткое содержание: Метод доступен владельцу пространства
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# История сообщения

**Метод**: `GET`

**Путь**: `/company/messages/{id}/history`

> **Скоуп:** `company_messages:read`

> **Внимание:** Доступно только на тарифе **Корпорация**

Сохранённые состояния сообщения от раннего к последнему: текст и файлы до каждой правки текста или файлов и на момент удаления, кто и когда их изменил. В историю входят 50 последних изменений. Сообщение может быть из любого чата пространства, включая закрытые чаты, где вы не состоите, личные переписки и треды. Удалённое сообщение тоже отдаётся.

Каждое состояние в `data`, кроме текущего, заканчивается правкой или удалением. Последнее состояние живого сообщения текущее (`action: current`), а удалённого — снимок на момент удаления (`action: deleted`), если снимок сохранился. `version_id` совпадает с `message_version_id` событий `message_updated` и `message_deleted` в [журнале аудита событий](/api/security/list): так от записи журнала переходят к тексту до правки или удаления.

Текст личных переписок и тредов в них приходит, только если поле `export_personal_chats` метода [Информация о пространстве](/api/company/get) равно `true`. Иначе `text` и `content` у их состояний — `null` с причиной `personal_chat_rule`, а файлы, авторы и время изменений приходят.

Метод доступен владельцу пространства. Каждый успешный запрос записывается в [журнал аудита событий](/guides/audit-events) с типом `company_messages_accessed`. Сообщение другого пространства отвечает `404`, как несуществующее. Если сервис временно недоступен, метод отвечает `503` с кодом `service_unavailable`.

## Параметры

### Path параметры

- `id: integer, int32` (required) — Идентификатор сообщения


## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/company/messages/194275/history" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `message: object` (required) — Сообщение, историю которого запросили
  - `id: integer, int32` (required) — Идентификатор сообщения. Пример: `194275`
  - `chat_id: integer, int32` (required) — Идентификатор чата сообщения. У сообщения в треде это чат сообщения-родителя треда, а у самостоятельного треда чат самого треда. Пример: `334`
  - `thread_chat_id: integer, int32` (required, nullable) — Идентификатор чата треда. `null`, если сообщение не в треде. Пример: `null`
  - `user_id: integer, int32` (required) — Идентификатор отправителя. У пересланного сообщения это тот, кто его переслал. Пример: `12`
  - `author_id: integer, int32` (required, nullable) — Идентификатор автора исходного сообщения, если сообщение переслали. `null` у сообщения, которое не пересылали. Пример: `null`
  - `created_at: date-time` (required) — Дата и время создания сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2026-11-24T09:15:00.000Z"`
  - `deleted_at: date-time` (required, nullable) — Дата и время удаления сообщения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null`, если сообщение не удалено. Пример: `null`
- `data: array of object` (required) — Состояния сообщения от самого раннего к последнему. В историю входят 50 последних изменений. У удалённого сообщения без сохранённых состояний массив пустой, у сообщения, которое не меняли, в нём одно текущее состояние.
  - `version_id: integer, int64` (required, nullable) — Идентификатор изменения, которым закончилось состояние. Совпадает с `message_version_id` событий `message_updated` и `message_deleted` в [журнале аудита](/api/security/list). `null` у текущего состояния. Пример: `81234`
  - `editor_id: integer, int32` (required, nullable) — Идентификатор сотрудника или бота, который внёс изменение. У изменений правила DLP и самой Пачки это отправитель сообщения. `null` у текущего состояния. Пример: `12`
  - `changed_at: date-time` (required, nullable) — Дата и время изменения (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. У текущего состояния это время последнего изменения сообщения, у давно не менявшегося сообщения может прийти `null`. Пример: `"2026-11-24T09:20:00.000Z"`
  - `action: string` (required) — Чем закончилось состояние
    Значения: `edited` — Сообщение отредактировали, `deleted` — Сообщение удалили, `current` — Текущее состояние сообщения, `unknown` — Старая запись, по которой не определить, правка это или удаление
  - `source: string` (required) — Кто внёс изменение. `null` у текущего состояния и в старых записях.
    Значения: `employee` — Сотрудник, `bot` — Бот, `dlp` — Правило DLP заменило текст, `system` — Сама Пачка, например когда прикрепляет к сообщению картинку по ссылке
  - `dlp_masked: boolean` (required) — Текст скрыт правилом DLP: вместо него приходит `***`, прежний текст не восстанавливается. Пример: `false`
  - `text: string` (required, nullable) — Текст без форматирования, если сообщение хранит текст в таком виде. `null`, если такого текста нет или его не удалось получить. Пример: `null`
  - `text_unavailable_reason: string` (required) — Почему не пришёл текст в `text` или `content`. `null`, если текст пришёл или его в состоянии нет. В личной переписке при выключенной выгрузке личных переписок приходит `personal_chat_rule` у каждого состояния, даже без текста.
    Значения: `personal_chat_rule` — Сообщение из личной переписки, а выгрузка личных переписок в пространстве выключена, `no_key_snapshot` — Старое зашифрованное состояние, для которого не сохранился ключ, `decrypt_failed` — Текст не удалось расшифровать
  - `content: string` (required, nullable) — Текст в Markdown, если сообщение хранит текст в таком виде. Пустая строка или `null`, если текст хранится в `text`, текста в состоянии нет или его не удалось получить. Пример: `"Релиз переносим на четверг"`
  - `files: array of object` (required) — Файлы сообщения в этом состоянии
    - `id: integer, int32` (nullable) — Идентификатор файла. Пример: `3560`
    - `name: string` (nullable) — Название файла с расширением. Пример: `"report.pdf"`
    - `file_type: string` — Тип файла
      Значения: `file` — Обычный файл, `image` — Изображение, `audio` — Аудиофайл, `voice` — Голосовое сообщение, `video` — Видеофайл
    - `size: integer, int64` (nullable) — Размер файла в байтах. Пример: `48213`
- `meta: object` (required) — Полнота истории
  - `history_is_partial: boolean` (required) — Ранние состояния известны не полностью: сообщение создано до 22 апреля 2026 года, удалено до 15 августа 2026 года, удалено без снимка на момент удаления или изменения его файлов нельзя восстановить однозначно. Пример: `false`
  - `truncated: boolean` (required) — Изменений больше 50: в историю вошли только 50 последних. Пример: `false`

**Пример ответа:**

```json
{
  "message": {
    "id": 194275,
    "chat_id": 334,
    "thread_chat_id": null,
    "user_id": 12,
    "author_id": null,
    "created_at": "2026-11-24T09:15:00.000Z",
    "deleted_at": null
  },
  "data": [
    {
      "version_id": 81234,
      "editor_id": 12,
      "changed_at": "2026-11-24T09:20:00.000Z",
      "action": "edited",
      "source": "employee",
      "dlp_masked": false,
      "text": null,
      "text_unavailable_reason": null,
      "content": "Релиз в среду",
      "files": []
    },
    {
      "version_id": null,
      "editor_id": null,
      "changed_at": "2026-11-24T09:20:00.000Z",
      "action": "current",
      "source": null,
      "dlp_masked": false,
      "text": null,
      "text_unavailable_reason": null,
      "content": "Релиз переносим на четверг",
      "files": [
        {
          "id": 3560,
          "name": "report.pdf",
          "file_type": "file",
          "size": 48213
        }
      ]
    }
  ],
  "meta": {
    "history_is_partial": false,
    "truncated": false
  }
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

### 503: Service unavailable.

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

