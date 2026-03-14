
# CLI

[@pachca/cli](https://www.npmjs.com/package/@pachca/cli) 2026.3.5 · 7 марта 2026


Официальный CLI для работы с Pachca API из терминала. Каждый API-метод доступен как команда с типизированными флагами, валидацией и интерактивными подсказками. Требуется Node.js 20 или новее.

```bash
# Глобальная установка
npm install -g @pachca/cli

# Проверка
pachca --version

# Или без установки
npx @pachca/cli users list
```

## Быстрый старт


  ### Шаг 1. Вход в аккаунт

Сохраните API-токен. Получить его можно в интерфейсе Пачки в разделе **«Автоматизации» → «API»** — подробнее в руководстве [Авторизация](/api/authorization).

    ```bash
    # Интерактивный вход
    pachca auth login

    # Для CI и скриптов — передайте токен через флаг
    pachca auth login --token YOUR_ACCESS_TOKEN
    ```


  ### Шаг 2. Первая команда

Получите список сотрудников:

    ```bash
    pachca users list

    # ID    Имя              Email               Роль
    # 1234  Иван Иванов      ivan@company.ru     admin
    # 5678  Мария Петрова    maria@company.ru    user
    ```

    Добавьте `-o json` для JSON-вывода.


  ### Шаг 3. Отправка сообщения

Отправьте сообщение в канал или беседу:

    ```bash
    pachca messages create --entity-id 123 --content "Привет!"
    ```

    Если не указать обязательные флаги — CLI запросит их интерактивно.


## Авторизация

### Профили

CLI поддерживает несколько профилей — удобно, если вы работаете с персональным токеном и токенами ботов одновременно:

```bash
# Добавить профили
pachca auth login --profile personal
pachca auth login --profile bot-notify

# Для CI — передайте токен через флаг
pachca auth login --profile bot-notify --token YOUR_ACCESS_TOKEN

# Список профилей
pachca auth list

# Переключить активный профиль
pachca auth switch bot-notify

# Статус текущего профиля
pachca auth status

# Удалить профиль
pachca auth logout bot-notify
```

Токены хранятся в `~/.config/pachca/config.toml` с правами `chmod 600`.

### Приоритет токена

При выполнении команды CLI определяет токен в следующем порядке:

1. Флаг `--token` — разовое использование, без сохранения
2. Переменная `PACHCA_TOKEN` — удобно для CI
3. Флаг `--profile` или переменная `PACHCA_PROFILE` — конкретный профиль
4. Активный профиль — выбранный через `pachca auth switch`

```bash
# Токен через флаг (разово, без сохранения)
pachca users list --token YOUR_ACCESS_TOKEN

# Токен через переменную окружения (CI)
PACHCA_TOKEN=YOUR_ACCESS_TOKEN pachca users list

# Конкретный профиль для одной команды
pachca messages create --profile bot-notify --entity-id 123 --content "Уведомление"
```

### Обновление скоупов

Скоупы персональных токенов кешируются навсегда — для обновления нужен повторный `auth login`. Скоупы токенов ботов обновляются автоматически раз в сутки. Принудительное обновление:

```bash
pachca auth refresh bot-notify
```

## Команды

Паттерн всех команд: `pachca [секция] [действие] [--флаги]`

Имена команд совпадают с URL документации:

```text noCopy
dev.pachca.com/api/messages/create  →  pachca messages create
dev.pachca.com/api/chats/list       →  pachca chats list
dev.pachca.com/api/members/add      →  pachca members add
```

### Все команды

| Команда | Описание |
|---------|----------|
| `pachca common request-export` | Экспорт сообщений |
| `pachca common direct-url` | Загрузка файла |
| `pachca common uploads` | Получение подписи, ключа и других параметров |
| `pachca common get-exports` | Скачать архив экспорта |
| `pachca common custom-properties` | Список дополнительных полей |
| `pachca profile get-info` | Информация о токене |
| `pachca profile get` | Информация о профиле |
| `pachca profile get-status` | Текущий статус |
| `pachca profile update-status` | Новый статус |
| `pachca profile delete-status` | Удаление статуса |
| `pachca users create` | Создать сотрудника |
| `pachca users list` | Список сотрудников |
| `pachca users get` | Информация о сотруднике |
| `pachca users get-status` | Статус сотрудника |
| `pachca users update` | Редактирование сотрудника |
| `pachca users update-status` | Новый статус сотрудника |
| `pachca users delete` | Удаление сотрудника |
| `pachca users remove-status` | Удаление статуса сотрудника |
| `pachca group-tags create` | Новый тег |
| `pachca group-tags list` | Список тегов сотрудников |
| `pachca group-tags get` | Информация о теге |
| `pachca group-tags list-users` | Список сотрудников тега |
| `pachca group-tags update` | Редактирование тега |
| `pachca group-tags delete` | Удаление тега |
| `pachca chats create` | Новый чат |
| `pachca chats list` | Список чатов |
| `pachca chats get` | Информация о чате |
| `pachca chats update` | Обновление чата |
| `pachca chats archive` | Архивация чата |
| `pachca chats unarchive` | Разархивация чата |
| `pachca members add-group-tags` | Добавление тегов |
| `pachca members add` | Добавление пользователей |
| `pachca members list` | Список участников чата |
| `pachca members update` | Редактирование роли |
| `pachca members remove-group-tag` | Исключение тега |
| `pachca members leave` | Выход из беседы или канала |
| `pachca members remove` | Исключение пользователя |
| `pachca threads add` | Новый тред |
| `pachca threads get` | Информация о треде |
| `pachca messages create` | Новое сообщение |
| `pachca messages pin` | Закрепление сообщения |
| `pachca messages list` | Список сообщений чата |
| `pachca messages get` | Информация о сообщении |
| `pachca messages update` | Редактирование сообщения |
| `pachca messages delete` | Удаление сообщения |
| `pachca messages unpin` | Открепление сообщения |
| `pachca read-member list-readers` | Список прочитавших сообщение |
| `pachca reactions add` | Добавление реакции |
| `pachca reactions list` | Список реакций |
| `pachca reactions remove` | Удаление реакции |
| `pachca link-previews add` | Unfurl (разворачивание ссылок) |
| `pachca search list-chats` | Поиск чатов |
| `pachca search list-messages` | Поиск сообщений |
| `pachca search list-users` | Поиск сотрудников |
| `pachca tasks create` | Новое напоминание |
| `pachca tasks list` | Список напоминаний |
| `pachca tasks get` | Информация о напоминании |
| `pachca tasks update` | Редактирование напоминания |
| `pachca tasks delete` | Удаление напоминания |
| `pachca views open` | Открытие представления |
| `pachca bots list-events` | История событий |
| `pachca bots update` | Редактирование бота |
| `pachca bots remove-event` | Удаление события |
| `pachca security list` | Журнал аудита событий |


### Справка

```bash
# Подробная справка по команде
pachca messages create --help

# Список всех команд
pachca commands

# Только команды, доступные текущему токену (фильтр по скоупам)
pachca commands --available
```

## Вывод

### Форматы

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

## Сценарии

CLI включает готовые пошаговые [сценарии](/guides/workflows) для типичных задач. Каждый сценарий — это последовательность команд с комментариями: какой метод вызвать, какие параметры передать, на что обратить внимание. Не знаете, какую команду использовать — поищите по задаче:

```bash
# Поиск сценариев по ключевым словам
pachca guide "отправить файл"
pachca guide "создать беседу и добавить участников"

# Список всех сценариев
pachca guide
```

```bash title="Примеры сценариев"
pachca guide "создать напоминание"

#  Сценарий: Создать напоминание  (pachca-tasks)
#
#  1. $ pachca tasks create --kind=reminder --content="Позвонить клиенту" --due-at=<дата> --chat-id=<chat_id>

pachca guide "кастомные поля профиля"

#  Сценарий: Получить кастомные поля профиля  (pachca-profile)
#
#  1. $ pachca common custom-properties  # entity_type=User
#  2. $ pachca profile get  # custom_properties содержит значения полей

pachca guide "активные чаты"

#  Сценарий: Найти активные чаты за период  (pachca-chats)
#
#  1. $ pachca chats list --last-message-at-after=<дата> --all
```

## Скрипты и CI

### Глобальные флаги

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

### Exit codes

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

### Переменные окружения

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

### Неинтерактивный режим

CLI автоматически переходит в неинтерактивный режим при любом из условий: stdin или stdout — не TTY, установлена `PACHCA_PROMPT_DISABLED` или `CI`, передан флаг `--no-input`. В этом режиме нет промптов, спиннера, а при пропущенных обязательных флагах — ошибка вместо запроса.

```bash
PACHCA_TOKEN=YOUR_ACCESS_TOKEN pachca messages create --entity-id 123 --content "Деплой завершён" --no-input
```

## Прямые API-запросы

Команда `pachca api` — escape hatch для прямых HTTP-запросов без типизированных команд:

```bash
# GET с query params
pachca api GET /messages --query chat_id=123

# POST с типизированными полями (-F конвертирует числа и boolean)
pachca api POST /messages -F message[entity_id]=12345 -f message[content]="Привет"

# PUT со строковым полем (-f гарантирует string)
pachca api PUT /tasks/42 -f task[due_at]="2026-04-01T10:00:00Z"

# Отправить готовый JSON-файл
pachca api POST /messages --input payload.json

# Из stdin
cat payload.json | pachca api POST /messages --input -
```

> `pachca api` выводит сырой ответ API без извлечения данных из обёртки `data`


## Настройки

Установите постоянные значения по умолчанию:

```bash
# Всегда выводить JSON
pachca config set defaults.output json

# Увеличить таймаут
pachca config set defaults.timeout 60

# Показать все настройки
pachca config list
```

Настройки хранятся в `~/.config/pachca/config.toml`. Флаги команды всегда имеют приоритет над настройками.

## Автодополнение

CLI поддерживает автодополнение для bash, zsh и fish:

```bash
pachca autocomplete zsh
pachca autocomplete bash
pachca autocomplete fish
```

Команда выводит инструкцию по установке для выбранного шелла.

## Диагностика

Команда `pachca doctor` проверяет окружение — Node.js, сеть, конфиг, токен и версию CLI:

```bash
pachca doctor

# ✔ Node.js        v20.11.0 (требуется >=20)
# ✔ Сеть           api.pachca.com доступен (142ms)
# ✔ Конфиг         ~/.config/pachca/config.toml (права: 600)
# ✔ Профиль        personal (user: Иван Иванов)
# ✔ Токен          действителен (11 скоупов)
# ✔ CLI            v2026.3.0 (актуальная версия)
```

## Обновление

CLI автоматически проверяет наличие новой версии раз в сутки и показывает уведомление в терминале. Для обновления:

```bash
# Обновить до последней версии
npm install -g @pachca/cli

# Посмотреть, что нового
pachca changelog
```

Отключить автоматическую проверку можно переменной `PACHCA_SKIP_NEW_VERSION_CHECK`.
