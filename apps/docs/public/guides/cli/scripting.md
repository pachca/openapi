
# Скрипты и CI

## Форматы вывода

CLI поддерживает четыре формата вывода. В интерактивном терминале (TTY) по умолчанию используется таблица, в пайпах и CI — JSON.

```bash
# Таблица (по умолчанию в терминале)
pachca users list

# JSON
pachca users list -o json

# YAML
pachca users list -o yaml

# CSV (для Excel / Google Sheets)
pachca users list -o csv
```

### Колонки и заголовки

По умолчанию таблица показывает 4-5 основных полей. Выбрать конкретные колонки:

```bash
# Выбрать колонки
pachca users list --columns id,email,role

# Без заголовка (для скриптов)
pachca users list --columns email --no-header

# Не обрезать длинные значения
pachca users list --no-truncate
```

### Пайпы и перенаправление

В пайпах CLI автоматически выводит JSON и отключает цвет и спиннер. Данные идут в stdout, ошибки и прогресс — в stderr.

```bash
# Передать в jq
pachca users list | jq '.[].name'

# Текст сообщения из файла
pachca messages create --entity-id 123 < message.txt

# Текст из pipe
echo "Деплой завершён" | pachca messages create --entity-id 123

# Скачать файл (для команд с редиректом)
pachca common get-exports 123 --save ./export.zip
```

## Пагинация

Pachca использует cursor-based пагинацию. CLI предоставляет три способа навигации:

```bash
# Первая страница (по умолчанию)
pachca users list --limit 20

# Следующая страница вручную
pachca users list --cursor eyJpZCI6NTB9

# Загрузить все страницы автоматически
pachca users list --all
```

При `--all` CLI показывает прогресс загрузки в stderr, а финальный результат выводит в stdout единым массивом.

В API существует **две группы методов с пагинацией**, у которых разная структура `meta` в JSON-выводе:

- **Списочные методы** (`pachca users list`, `pachca chats list`, `pachca messages list` и т.д.) — `meta.paginate` с полями `next_page`, `prev_page`, `has_next`, `has_prev`. Признак конца — `has_next: false`.
- **Методы поиска** (`pachca search list-users`, `pachca search list-chats`, `pachca search list-messages`) — `meta` с полями `total` и `paginate.next_page` (без `prev_page`/`has_next`/`has_prev`). Признак конца — пустой `data` или совпадение числа полученных записей с `total`.

Подробнее — в разделе [Пагинация](/api/pagination).

## Глобальные флаги

| Флаг | Короткий | Описание |
|------|----------|----------|
| `--output <format>` | `-o` | Формат: `table`, `json`, `yaml`, `csv` |
| `--columns <list>` | `-c` | Колонки для table-вывода (через запятую) |
| `--profile <name>` | `-p` | Профиль для этой команды |
| `--token <value>` | | Токен для этого вызова (без сохранения) |
| `--quiet` | `-q` | Без вывода, только exit code |
| `--no-input` | | Без интерактивных промптов |
| `--dry-run` | | Показать запрос без отправки |
| `--force` | | Пропустить подтверждение DELETE |
| `--verbose` | `-v` | Показать HTTP-запросы и ответы |
| `--timeout <sec>` | | Таймаут запроса в секундах (по умолчанию 30) |
| `--no-color` | | Отключить цвета |
| `--no-header` | | Скрыть заголовок таблицы |
| `--no-truncate` | | Не обрезать длинные значения |
| `--no-retry` | | Отключить авто-retry при 429/503 |

### Сортировка

Команды списков поддерживают сортировку через `--sort` и `--order`:

```bash
# Сообщения по возрастанию ID
pachca messages list --chat-id 123 --sort id --order asc

# Чаты по дате последнего сообщения
pachca chats list --sort last-message-at --order desc
```

Доступные поля сортировки зависят от команды — подсказки встроены в `--help`. Если `--order` не указан, используется `desc`.

### Имена флагов

Флаги CLI используют **kebab-case** (через дефис), а не snake_case как в API-документации — это [стандартная конвенция](https://clig.dev/#arguments-and-flags) для CLI-инструментов:

```text noCopy
API-документация          CLI-флаг
─────────────────         ────────────────
first_name            →   --first-name
phone_number          →   --phone-number
entity_id             →   --entity-id
skip_email_notify     →   --skip-email-notify
list_tags             →   --list-tags
custom_properties     →   --custom-properties
parent_message_id     →   --parent-message-id
```

При отправке запроса CLI автоматически конвертирует имена обратно в snake_case для API. Проверить можно через `--dry-run`:

```bash
pachca users update 123 --first-name "Иван" --phone-number "+7900" --dry-run

# {"user": {"first_name": "Иван", "phone_number": "+7900"}}
```

### Boolean-флаги

Для boolean-параметров API используйте флаг для установки `true` и `--no-` префикс для `false`:

```bash
# Деактивировать сотрудника (suspended: true)
pachca users update 123 --suspended

# Активировать обратно (suspended: false)
pachca users update 123 --no-suspended

# Создать публичный канал (channel: true, public: true)
pachca chats create --name "Новости" --channel --public

# Сделать канал приватным (public: false)
pachca chats update 123 --no-public
```

### Предпросмотр запроса

Флаг `--dry-run` показывает HTTP-запрос без отправки — для отладки и проверки параметров:

```bash
pachca messages create --entity-id 123 --content "Привет" --dry-run

# POST https://api.pachca.com/api/shared/v1/messages
# Authorization: Bearer ••••••••
# Content-Type: application/json
#
# {"message": {"entity_id": 123, "content": "Привет"}}
```

### Деструктивные операции

DELETE-команды требуют подтверждения в терминале. Флаг `--force` пропускает его:

```bash
# С подтверждением (TTY)
pachca users delete 1234

# Без подтверждения
pachca users delete 1234 --force
```

## Exit codes

| Код | Значение |
|-----|----------|
| `0` | Успех |
| `1` | API или runtime ошибка |
| `2` | Неверные флаги или аргументы |
| `3` | Ошибка аутентификации (401 / 403) |
| `4` | Ресурс не найден (404) |

```bash title="Использование exit codes"
pachca users get 123 || case $? in
    3) echo "Нет доступа" ;;
    4) echo "Пользователь не найден" ;;
  esac
```

## Ошибки

При `-o json` (или в пайпе) ошибки выводятся в stderr как JSON. Формат единый для всех типов ошибок:

```json title="API-ошибка (422)"
{
  "error": "content: не может быть пустым",
  "code": 422,
  "type": "PACHCA_VALIDATION_ERROR",
  "request_id": "abc123",
  "field": "content"
}
```

```json title="Множественная валидация (422)"
{
  "error": "Validation failed",
  "code": 422,
  "type": "PACHCA_VALIDATION_ERROR",
  "request_id": "abc123",
  "errors": [
    { "field": "content", "message": "не может быть пустым" },
    { "field": "entity_id", "message": "обязательное поле" }
  ]
}
```

```json title="Ошибка авторизации"
{
  "error": "Token not found",
  "code": null,
  "type": "PACHCA_AUTH_ERROR",
  "hint": "pachca auth login --token <your-token>"
}
```

| Поле | Тип | Описание |
|------|-----|----------|
| `error` | `string` | Сообщение об ошибке |
| `code` | `number \| null` | HTTP-код ответа (`null` для клиентских ошибок) |
| `type` | `string` | Тип ошибки (см. таблицу ниже) |
| `request_id` | `string?` | ID запроса к API (для обращения в поддержку) |
| `hint` | `string?` | Подсказка, как исправить ошибку |
| `field` | `string?` | Поле, вызвавшее ошибку |
| `errors` | `array?` | Список ошибок при множественной валидации |

| Тип | Описание |
|-----|----------|
| `PACHCA_API_ERROR` | Ошибка API (5xx, неожиданные ответы) |
| `PACHCA_AUTH_ERROR` | Ошибка аутентификации (401 / 403) |
| `PACHCA_VALIDATION_ERROR` | Ошибка валидации (422) |
| `PACHCA_SCOPE_ERROR` | Токен не имеет нужного скоупа |
| `PACHCA_NETWORK_ERROR` | Сеть недоступна |
| `PACHCA_TIMEOUT_ERROR` | Таймаут запроса |
| `PACHCA_USAGE_ERROR` | Неверные флаги или аргументы |

```bash title="Обработка ошибок в скрипте"
# Получить ошибку как JSON
ERROR=$(pachca users get 999 -o json 2>&1 >/dev/null)
TYPE=$(echo "$ERROR" | jq -r '.type')

case "$TYPE" in
  PACHCA_AUTH_ERROR) echo "Нет доступа" ;;
  PACHCA_VALIDATION_ERROR) echo "Неверные данные" ;;
  *) echo "Ошибка: $ERROR" ;;
esac
```

## Переменные окружения

| Переменная | Описание |
|-----------|---------|
| `PACHCA_TOKEN` | Bearer-токен (высший приоритет, удобно для CI) |
| `PACHCA_PROFILE` | Активный профиль для команды |
| `PACHCA_TIMEOUT` | Таймаут запроса в секундах (по умолчанию 30) |
| `PACHCA_PROMPT_DISABLED` | Отключить интерактивные промпты (для агентов) |
| `CI` | Автоматический неинтерактивный режим |
| `NO_COLOR` | Отключить цвет |
| `FORCE_COLOR` | Принудительно включить цвет |
| `PACHCA_SKIP_NEW_VERSION_CHECK` | Отключить проверку обновлений |

## Неинтерактивный режим

CLI автоматически переходит в неинтерактивный режим при любом из условий: stdin или stdout — не TTY, установлена `PACHCA_PROMPT_DISABLED` или `CI`, передан флаг `--no-input`. В этом режиме нет промптов, спиннера, а при пропущенных обязательных флагах — ошибка вместо запроса.

```bash
PACHCA_TOKEN=YOUR_ACCESS_TOKEN pachca messages create --entity-id 123 --content "Деплой завершён" --no-input
```
