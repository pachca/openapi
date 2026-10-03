> Расположение: Методы API → Боты и Webhook
> Краткое содержание: Боты, которых вызывающий вправе настраивать: созданные им самим и те, чьи настройки открывают ему доступ к редактированию.
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Список ботов

**Метод**: `GET`

**Путь**: `/bots`

> **Скоуп:** `bots:read`

Боты, которых вызывающий вправе настраивать: созданные им самим и те, чьи настройки открывают ему доступ к редактированию.

Параметр `query` отбирает ботов по части имени, без опечаток. Токены ботов в списке не приходят: значение токена показывают один раз, а сами токены бота отдаёт [Список токенов бота](/api/bots/list-tokens).

Перечень всех ботов пространства, включая чужих, доступен владельцу на тарифе «Корпорация» — [Список ботов пространства](/api/bots/list-company). Там чужие боты приходят с одними лишь именем и ником, остальные настройки скрыты.

## Параметры

### Query параметры

- `query: string` — Поисковая фраза для фильтрации ботов по имени
- `limit: integer, int32` (default: 50) — Количество возвращаемых сущностей за один запрос
- `cursor: string` — Курсор для пагинации (из `meta.paginate.next_page`)


## Пример запроса

```bash
# Для получения следующей страницы используйте cursor из meta.paginate.next_page
curl "https://api.pachca.com/api/shared/v1/bots?query=задач&limit=1" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Ответы

### 200: The request has succeeded.

**Схема ответа:**

- `data: array of object` (required)
  - `id: integer, int32` (required) — Идентификатор бота (совпадает с `user_id` бота). Пример: `1738816`
  - `name: string` (required) — Имя бота. Пример: `"Бот задач"`
  - `nickname: string` (required) — Никнейм бота. Пример: `"tasks_bot"`
  - `avatar_url: string` (required, nullable) — Ссылка на аватар бота. `null`, если аватар не задан. Пример: `"https://pachca-prod.s3.amazonaws.com/uploads/0001/0001/image.jpg"`
  - `creator_id: integer, int32` (required, nullable) — Идентификатор сотрудника, создавшего бота. `null`, если создатель не записан. Пример: `12`
  - `created_at: date-time` (required) — Дата и время создания бота (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. Пример: `"2025-05-15T14:30:00.000Z"`
  - `authorized_users_count: integer, int32` (required) — Сколько сотрудников авторизовали бота. Пример: `3`
  - `last_used_at: date-time` (required, nullable) — Дата и время, когда бот последний раз работал (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ: запрос на входящий вебхук или вызов API любым токеном бота, включая токены сотрудников. `null`, если такого не было. Использование токена учитывается не чаще раза в час. Пример: `"2025-05-15T14:30:00.000Z"`
  - `webhook: object` (required) — Объект параметров вебхука
    - `name: string` (required, max length: 255) — Имя бота. Пример: `"Бот задач"`
    - `nickname: string` (required, max length: 255) — Никнейм бота. Пример: `"tasks_bot"`
    - `outgoing_url: string` (required, nullable) — URL исходящего вебхука. `null`, если исходящий вебхук у бота не настроен. Пример: `"https://www.website.com/tasks/new"`
    - `events: array of string` (required) — События, на которые подписан бот. Пример: `["message_new"]`
    - `trigger_on: string` (required) — Условие срабатывания исходящего вебхука
      Значения: `commands` — Только на команды (триггер-слова) из commands, `all_messages` — На все сообщения в чатах, где есть бот, `unfurl` — На развёртывание ссылок (link previews)
    - `commands: array of string` (required) — Команды бота (триггер-слова). Пример: `["/task"]`
    - `scopes: array of string` (required) — Скоупы (права доступа) токена бота. Набор по умолчанию шире того, что можно назначить явно, поэтому здесь могут встречаться значения, недоступные для явной установки. Пример: `["messages:create"]`
    - `template: string` (required, nullable) — Шаблон форматирования входящего вебхука. `null`, если не задан. Пример: `"Заказ от {{ client }} на сумму {{ amount }} ₽"`
    - `template_engine: string` (required) — Шаблонизатор для обработки шаблона входящего вебхука
      Значения: `liquid` — Liquid — условия, циклы и фильтры, `mustache` — Mustache — простая подстановка без логики
    - `challenge_key: string` (required, nullable) — Название поля проверки для верификации входящего вебхука. `null`, если не задано. Пример: `"challenge"`
    - `link_preview_enabled: boolean` (required) — Показывать превью ссылок в сообщениях входящего вебхука. Пример: `true`
    - `ignore_self_messages: boolean` (required) — Не присылать боту события о его собственных сообщениях и реакциях. Пример: `false`
    - `events_history_enabled: boolean` (required) — Сохранять историю событий бота для последующего получения через метод истории событий. Пример: `false`
    - `single_chat: boolean` (required) — Ограничивает бота одной беседой или каналом: `true` — бота можно добавить только в один такой чат, `false` — в несколько. Личные чаты и треды в ограничение не входят. Пример: `false`
    - `can_edit: array of string` (required) — Роли, которым, помимо создателя, разрешено редактировать настройки бота. Создатель может редактировать всегда. Пустой массив — редактировать может только создатель. Пример: `["admin"]`
    - `who_can_add: string` (required) — Кто может добавлять бота в чаты
      Значения: `creator` — Только создатель бота, `creator_admin` — Создатель и администраторы компании, `creator_admin_user` — Создатель, администраторы и участники компании, `anyone` — Публичный бот: добавить его может любой сотрудник, кроме гостей и мульти-гостей
    - `kind: string` (required) — Источник входящего вебхука. `null`, если входящий вебхук у бота выключен.
      Значения: `simple` — Свой формат: сообщение собирается из тела запроса по шаблону бота, `gitlab` — GitLab: Пачка сама разбирает запрос и собирает сообщение, `grafana` — Grafana: Пачка сама разбирает запрос и собирает сообщение
    - `unfurl_domains: array of string` (required) — Домены, ссылки на которые бот разворачивает. Пример: `["example.com"]`
    - `last_request_at: date-time` (required, nullable) — Дата и время последнего запроса на входящий вебхук бота (ISO-8601, UTC+0) в формате YYYY-MM-DDThh:mm:ss.sssZ. `null`, если запросов не было. Пример: `"2025-05-15T14:30:00.000Z"`
  - `oauth_client_enabled: boolean` (required) — Включена ли у бота авторизация от имени сотрудника. Пример: `true`
  - `oauth_client: object` (required) — Параметры авторизации от имени сотрудника. Может прийти и у бота с выключенной авторизацией, поэтому включена ли она, смотрите в `oauth_client_enabled`. У бота без токенов может прийти `null`.
    - `client_id: string` (required) — Идентификатор клиента для ссылки авторизации. Пример: `"aB3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1xY"`
    - `client_secret_preview: string` (required) — Секрет клиента в маскированном виде. Полное значение приходит в `client_secret` один раз: при включении серверного клиента и при ротации секрета. Пример: `"cH5kR9mN...x7Qp"`
    - `confidential: boolean` (required) — Где хранится секрет: `true` — серверное приложение, `false` — приложение без секрета, обмен кода по PKCE. Пример: `true`
    - `redirect_uris: array of string` (required) — Адреса возврата после согласия. Пример: `["https://example.com/oauth/callback"]`
    - `scopes: array of string` (required) — Права, которые бот запрашивает у сотрудника на экране согласия. Пример: `["messages:read","messages:create"]`
  - `promo: object` (required) — Страница бота в витрине. `null`, если авторизация у бота выключена.
    - `description: string` (required, nullable) — Описание бота. `null`, если не задано. Пример: `"Собирает сводку по задачам Jira и присылает её в чат"`
    - `published: boolean` (required) — Опубликован ли бот в витрине. Пример: `true`
    - `promo_images: array of object` (required) — Скриншоты страницы бота
      - `key: string` (required) — Ключ изображения. Пример: `"attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/screenshot.png"`
      - `url: string` (required) — Ссылка на изображение. Пример: `"https://pachca-prod-uploads.s3.storage.selcloud.ru/attaches/files/93746/e354fd79-4f3e-4b5a-9c8d-1a2b3c4d5e6f/screenshot.png"`
  - `permissions: object` (required) — Что вы можете делать с этим ботом
    - `update_oauth_client: boolean` (required) — Менять авторизацию от имени сотрудника, страницу в витрине и имя бота. Пример: `true`
    - `recreate_token: boolean` (required) — Выпускать, менять и удалять токены бота и обновлять секрет клиента. Пример: `true`
    - `destroy: boolean` (required) — Удалить бота. Пример: `true`
  - `client_secret: string` — Секрет клиента. Приходит один раз: при включении серверного клиента, при переходе на него и при ротации секрета. Пример: `"dGhpc19pc19ub3RfYV9yZWFsX3NlY3JldA"`
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
      "id": 1738816,
      "name": "Бот задач",
      "nickname": "tasks_bot",
      "avatar_url": null,
      "creator_id": 12,
      "created_at": "2025-05-15T14:30:00.000Z",
      "authorized_users_count": 3,
      "last_used_at": "2025-05-20T09:15:00.000Z",
      "webhook": {
        "name": "Бот задач",
        "nickname": "tasks_bot",
        "outgoing_url": "https://www.website.com/tasks/new",
        "events": [
          "message_new"
        ],
        "trigger_on": "commands",
        "commands": [
          "/task"
        ],
        "scopes": [
          "messages:create"
        ],
        "template": "Заказ от {{ client }} на сумму {{ amount }} ₽",
        "template_engine": "liquid",
        "challenge_key": "challenge",
        "link_preview_enabled": true,
        "ignore_self_messages": false,
        "events_history_enabled": false,
        "single_chat": false,
        "can_edit": [
          "admin"
        ],
        "who_can_add": "creator",
        "kind": "simple",
        "unfurl_domains": [],
        "last_request_at": "2025-05-20T09:15:00.000Z"
      },
      "oauth_client_enabled": true,
      "oauth_client": {
        "client_id": "aB3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1xY",
        "client_secret_preview": "dGhpc19p...ZWNy",
        "confidential": true,
        "redirect_uris": [
          "https://example.com/oauth/callback"
        ],
        "scopes": [
          "messages:read",
          "messages:create"
        ]
      },
      "promo": {
        "description": "Собирает сводку по задачам и присылает её в чат",
        "published": true,
        "promo_images": []
      },
      "permissions": {
        "update_oauth_client": true,
        "recreate_token": true,
        "destroy": true
      }
    }
  ],
  "meta": {
    "paginate": {
      "next_page": "eyJpZCI6MTczODgxNn0"
    }
  }
}
```

### 401: Access is unauthorized.

**Схема ответа при ошибке:**

- `error: string` (required) — Код ошибки. Пример: `"invalid_token"`
- `error_description: string` (required) — Описание ошибки. Пример: `"Access token is missing"`

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
  - `key: string` (required) — Ключ поля с ошибкой. Пример: `"field.name"`
  - `value: string` (required, nullable) — Значение поля, которое вызвало ошибку. `null`, если ошибка не относится к конкретному значению. Пример: `"invalid_value"`
  - `message: string` (required) — Сообщение об ошибке. Пример: `"Поле не может быть пустым"`
  - `code: string` (required) — Код ошибки
    Значения: `blank` — Обязательное поле (не может быть пустым), `too_long` — Слишком длинное значение (пояснения вы получите в поле message), `invalid` — Поле не соответствует правилам (пояснения вы получите в поле message), `inclusion` — Поле имеет непредусмотренное значение, `exclusion` — Поле имеет недопустимое значение, `taken` — Название для этого поля уже существует, `wrong_emoji` — Emoji статуса не может содержать значения отличные от Emoji символа, `not_found` — Объект не найден, `already_exists` — Объект с такими данными уже есть. Конфликтующее поле приходит в key, если его удалось определить, `personal_chat` — Ошибка личного чата (пояснения вы получите в поле message), `displayed_error` — Отображаемая ошибка (пояснения вы получите в поле message), `not_authorized` — Действие запрещено, `invalid_date_range` — Выбран слишком большой диапазон дат, `invalid_webhook_url` — Некорректный URL вебхука, `rate_limit` — Достигнут лимит запросов, `licenses_limit` — Превышен лимит активных сотрудников (пояснения вы получите в поле message), `user_limit` — Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций), `unique_limit` — Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций), `general_limit` — Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций), `unhandled` — Ошибка выполнения запроса (пояснения вы получите в поле message), `trigger_not_found` — Не удалось найти идентификатор события, `trigger_expired` — Время жизни идентификатора события истекло, `required` — Обязательный параметр не передан, `in` — Недопустимое значение (не входит в список допустимых), `not_applicable` — Значение неприменимо в данном контексте (пояснения вы получите в поле message), `self_update` — Нельзя изменить свои собственные данные, `owner_protected` — Нельзя изменить данные владельца, `already_assigned` — Значение уже назначено, `next_send_at_invalid` — Ближайшая отправка отложенного сообщения приходится на прошлое, `schedule_invalid` — Расписание отложенного сообщения не складывается в повтор, `schedule_end_date_invalid` — Расписание заканчивается раньше ближайшей отправки, `scheduled_messages_limit` — Превышен лимит отложенных сообщений на чат (50), `draft_type_change_forbidden` — Отложенное сообщение нельзя превратить обратно в черновик, `confidential_download_denied` — Скачивание файла запрещено: нужен запрос из безопасного контура, `decryption_failed` — Не удалось расшифровать файл, `bot_add_denied` — Правило бота «Кто может добавлять бота в чаты» не разрешает вам добавить его: `id` таких ботов приходят в `value`, `timeout` — Поиск не уложился по времени: сузьте запрос и повторите, `forbidden` — Недостаточно прав для выполнения действия (пояснения вы получите в поле message), `permission_denied` — Доступ запрещён (недостаточно прав), `access_denied` — Доступ запрещён, `wrong_params` — Некорректные параметры запроса (пояснения вы получите в поле message), `payment_required` — Требуется оплата, `min_length` — Значение слишком короткое (пояснения вы получите в поле message), `max_length` — Значение слишком длинное (пояснения вы получите в поле message), `use_of_system_words` — Использовано зарезервированное системное слово (here, all), `export_file_not_found` — Файл экспорта не найден или ещё не готов, `cannot_kick_owner` — Нельзя исключить владельца чата, `pin_failed` — Не удалось закрепить сообщение, `message_deleted` — Сообщение удалено, `thread_message` — Нельзя создать тред для сообщения, которое уже находится в треде, `view_not_found` — Представление не найдено или принадлежит другому боту, `submit_expired` — Время на ответ об отправке формы истекло или ответ уже был принят, `service_unavailable` — Сервис временно недоступен, повторите запрос
  - `payload: Record<string, object>` (required, nullable) — Дополнительные данные об ошибке. Содержимое зависит от кода ошибки: `{id: number}` — при ошибке кастомного свойства (идентификатор свойства), `{record: {type: string, id: number}, query: string}` — при ошибке авторизации, `{draft_id: number}` — когда черновик в этом чате уже есть. В большинстве случаев `null`. Пример: `null`
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

- `error: string` (required) — Код ошибки. Пример: `"invalid_token"`
- `error_description: string` (required) — Описание ошибки. Пример: `"Access token is missing"`

**Пример ответа:**

```json
{
  "error": "invalid_token",
  "error_description": "Access token is missing"
}
```

