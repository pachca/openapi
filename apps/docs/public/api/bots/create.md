> Расположение: Методы API → Боты и Webhook
> Краткое содержание: Метод для создания бота и получения его accesstoken.
> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.

# Создание бота

**Метод**: `POST`

**Путь**: `/bots`

> **Скоуп:** `bots:write`

Метод для создания бота и получения его `access_token`.

При создании вы получите `access_token` бота — сразу сохраните его. Повторно получить токен вы сможете только через интерфейс (вкладка «API» настроек бота).

## Тело запроса

**Обязательно**

Формат: `application/json`

### Схема

- `bot: object` (required) — Собранный объект параметров создаваемого бота
  - `webhook: object` (required) — Объект параметров вебхука бота
    - `name: string` (required) — Имя бота. Пример: `"Бот задач"`
    - `nickname: string` — Никнейм бота. Должен заканчиваться на `_bot`.. Пример: `"tasks_bot"`
    - `outgoing_url: string` — URL исходящего вебхука. Пример: `"https://www.website.com/tasks/new"`
    - `events: array of string` — События, на которые подписан бот. Пример: `["message_new"]`
    - `trigger_on: string` — Условие срабатывания исходящего вебхука
      Значения: `commands` — Только на команды (триггер-слова) из commands, `all_messages` — На все сообщения в чатах, где есть бот, `unfurl` — На развёртывание ссылок (link previews)
    - `commands: array of string` — Команды бота (триггер-слова), на которые он реагирует при trigger_on = commands. Пример: `["/task","/help"]`

### Пример

```json
{
  "bot": {
    "webhook": {
      "name": "Бот задач",
      "nickname": "tasks_bot",
      "outgoing_url": "https://www.website.com/tasks/new",
      "events": [
        "message_new"
      ],
      "trigger_on": "commands",
      "commands": [
        "/task",
        "/help"
      ]
    }
  }
}
```

## Пример запроса

```bash
curl "https://api.pachca.com/api/shared/v1/bots" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
  "bot": {
    "webhook": {
      "name": "Бот задач",
      "nickname": "tasks_bot",
      "outgoing_url": "https://www.website.com/tasks/new",
      "events": [
        "message_new"
      ],
      "trigger_on": "commands",
      "commands": [
        "/task",
        "/help"
      ]
    }
  }
}'
```

## Ответы

### 201: The request has succeeded and a new resource has been created as a result.

**Схема ответа:**

- `data: object` (required) — Параметры созданного бота
  - `id: integer, int32` (required) — Идентификатор бота (совпадает с `user_id` бота). Пример: `1738816`
  - `webhook: object` (required) — Объект параметров вебхука
    - `name: string` (required) — Имя бота. Пример: `"Бот задач"`
    - `nickname: string` (required) — Никнейм бота. Пример: `"tasks_bot"`
    - `outgoing_url: string` (required) — URL исходящего вебхука. Пример: `"https://www.website.com/tasks/new"`
    - `events: array of string` (required) — События, на которые подписан бот. Пример: `["message_new"]`
    - `trigger_on: string` (required) — Условие срабатывания исходящего вебхука
      Значения: `commands` — Только на команды (триггер-слова) из commands, `all_messages` — На все сообщения в чатах, где есть бот, `unfurl` — На развёртывание ссылок (link previews)
    - `commands: array of string` (required) — Команды бота (триггер-слова). Пример: `["/task"]`
  - `access_token: string` (required) — Токен доступа бота. Выдаётся только при создании. Повторно получить токен можно только через интерфейс (вкладка «API» настроек бота).. Пример: `"bm90X2FfcmVhbF90b2tlbg"`

**Пример ответа:**

```json
{
  "data": {
    "id": 1738816,
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
      ]
    },
    "access_token": "bm90X2FfcmVhbF90b2tlbg"
  }
}
```

### 400: The server could not understand the request due to invalid syntax.

**Схема ответа при ошибке:**

- `errors: array of object` (required) — Массив ошибок
  - `key: string` (required) — Ключ поля с ошибкой. Пример: `"field.name"`
  - `value: string` (required) — Значение поля, которое вызвало ошибку. Пример: `"invalid_value"`
  - `message: string` (required) — Сообщение об ошибке. Пример: `"Поле не может быть пустым"`
  - `code: string` (required) — Код ошибки
    Значения: `blank` — Обязательное поле (не может быть пустым), `too_long` — Слишком длинное значение (пояснения вы получите в поле message), `invalid` — Поле не соответствует правилам (пояснения вы получите в поле message), `inclusion` — Поле имеет непредусмотренное значение, `exclusion` — Поле имеет недопустимое значение, `taken` — Название для этого поля уже существует, `wrong_emoji` — Emoji статуса не может содержать значения отличные от Emoji символа, `not_found` — Объект не найден, `already_exists` — Объект уже существует (пояснения вы получите в поле message), `personal_chat` — Ошибка личного чата (пояснения вы получите в поле message), `displayed_error` — Отображаемая ошибка (пояснения вы получите в поле message), `not_authorized` — Действие запрещено, `invalid_date_range` — Выбран слишком большой диапазон дат, `invalid_webhook_url` — Некорректный URL вебхука, `rate_limit` — Достигнут лимит запросов, `licenses_limit` — Превышен лимит активных сотрудников (пояснения вы получите в поле message), `user_limit` — Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций), `unique_limit` — Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций), `general_limit` — Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций), `unhandled` — Ошибка выполнения запроса (пояснения вы получите в поле message), `trigger_not_found` — Не удалось найти идентификатор события, `trigger_expired` — Время жизни идентификатора события истекло, `required` — Обязательный параметр не передан, `in` — Недопустимое значение (не входит в список допустимых), `not_applicable` — Значение неприменимо в данном контексте (пояснения вы получите в поле message), `self_update` — Нельзя изменить свои собственные данные, `owner_protected` — Нельзя изменить данные владельца, `already_assigned` — Значение уже назначено, `forbidden` — Недостаточно прав для выполнения действия (пояснения вы получите в поле message), `permission_denied` — Доступ запрещён (недостаточно прав), `access_denied` — Доступ запрещён, `wrong_params` — Некорректные параметры запроса (пояснения вы получите в поле message), `payment_required` — Требуется оплата, `min_length` — Значение слишком короткое (пояснения вы получите в поле message), `max_length` — Значение слишком длинное (пояснения вы получите в поле message), `use_of_system_words` — Использовано зарезервированное системное слово (here, all)
  - `payload: Record<string, object>` (required) — Дополнительные данные об ошибке. Содержимое зависит от кода ошибки: `{id: number}` — при ошибке кастомного свойства (идентификатор свойства), `{record: {type: string, id: number}, query: string}` — при ошибке авторизации. В большинстве случаев `null`. Пример: `null`
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
  - `value: string` (required) — Значение поля, которое вызвало ошибку. Пример: `"invalid_value"`
  - `message: string` (required) — Сообщение об ошибке. Пример: `"Поле не может быть пустым"`
  - `code: string` (required) — Код ошибки
    Значения: `blank` — Обязательное поле (не может быть пустым), `too_long` — Слишком длинное значение (пояснения вы получите в поле message), `invalid` — Поле не соответствует правилам (пояснения вы получите в поле message), `inclusion` — Поле имеет непредусмотренное значение, `exclusion` — Поле имеет недопустимое значение, `taken` — Название для этого поля уже существует, `wrong_emoji` — Emoji статуса не может содержать значения отличные от Emoji символа, `not_found` — Объект не найден, `already_exists` — Объект уже существует (пояснения вы получите в поле message), `personal_chat` — Ошибка личного чата (пояснения вы получите в поле message), `displayed_error` — Отображаемая ошибка (пояснения вы получите в поле message), `not_authorized` — Действие запрещено, `invalid_date_range` — Выбран слишком большой диапазон дат, `invalid_webhook_url` — Некорректный URL вебхука, `rate_limit` — Достигнут лимит запросов, `licenses_limit` — Превышен лимит активных сотрудников (пояснения вы получите в поле message), `user_limit` — Превышен лимит количества реакций, которые может добавить пользователь (20 уникальных реакций), `unique_limit` — Превышен лимит количества уникальных реакций, которые можно добавить на сообщение (30 уникальных реакций), `general_limit` — Превышен лимит количества реакций, которые можно добавить на сообщение (1000 реакций), `unhandled` — Ошибка выполнения запроса (пояснения вы получите в поле message), `trigger_not_found` — Не удалось найти идентификатор события, `trigger_expired` — Время жизни идентификатора события истекло, `required` — Обязательный параметр не передан, `in` — Недопустимое значение (не входит в список допустимых), `not_applicable` — Значение неприменимо в данном контексте (пояснения вы получите в поле message), `self_update` — Нельзя изменить свои собственные данные, `owner_protected` — Нельзя изменить данные владельца, `already_assigned` — Значение уже назначено, `forbidden` — Недостаточно прав для выполнения действия (пояснения вы получите в поле message), `permission_denied` — Доступ запрещён (недостаточно прав), `access_denied` — Доступ запрещён, `wrong_params` — Некорректные параметры запроса (пояснения вы получите в поле message), `payment_required` — Требуется оплата, `min_length` — Значение слишком короткое (пояснения вы получите в поле message), `max_length` — Значение слишком длинное (пояснения вы получите в поле message), `use_of_system_words` — Использовано зарезервированное системное слово (here, all)
  - `payload: Record<string, object>` (required) — Дополнительные данные об ошибке. Содержимое зависит от кода ошибки: `{id: number}` — при ошибке кастомного свойства (идентификатор свойства), `{record: {type: string, id: number}, query: string}` — при ошибке авторизации. В большинстве случаев `null`. Пример: `null`
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

