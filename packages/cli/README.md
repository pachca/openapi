# @pachca/cli

Официальный CLI для [Пачки](https://pachca.com).

## Установка

```
npm install -g @pachca/cli

# Или без установки:
npx @pachca/cli users list
```

## Быстрый старт

```
pachca auth login          # сохранить токен
pachca users list          # список сотрудников
pachca messages create --entity-id 123 --content "Привет!"
```

Получить токен: https://dev.pachca.com/guides/authorization

## Использование в агентах (Claude, Cursor и др.)

Если агент устанавливает CLI по просьбе пользователя и токена ещё нет — агент должен запросить его у пользователя:

```
# Агент спрашивает: "Нужен API-токен Пачки."
# "Получите его на https://dev.pachca.com/guides/authorization"
pachca auth login --token <токен от пользователя>

# Дальше команды работают без токена в каждой строке
pachca users list
pachca messages create --entity-id 123 --content "Привет!"
```

Если токен уже есть в окружении — `auth login` не нужен:

```
PACHCA_TOKEN=$TOKEN pachca users list
```

## Профили (несколько токенов)

Храните несколько токенов под именами — личный, боты:

```
pachca auth login --profile personal
pachca auth login --profile bot-notify
pachca auth list
pachca auth switch bot-notify
```

Токены хранятся в `~/.config/pachca/config.toml` (chmod 600).
В CI — через переменную окружения PACHCA_TOKEN.

## Поиск по сценариям

Не знаете какую команду использовать? Поищите по задаче:

```
pachca guide "отправить файл"
pachca guide "создать беседу и добавить участников"
pachca guide            # список всех сценариев
```

<!-- AUTO:COMMANDS -->
## Команды

### security

| Команда | Описание |
|---------|---------|
| `pachca security list` | Журнал аудита событий |

### bots

| Команда | Описание |
|---------|---------|
| `pachca bots update` | Редактирование бота |
| `pachca bots list-events` | История событий |
| `pachca bots remove-event` | Удаление события |

### chats

| Команда | Описание |
|---------|---------|
| `pachca chats create` | Новый чат |
| `pachca chats list` | Список чатов |
| `pachca chats get` | Информация о чате |
| `pachca chats update` | Обновление чата |
| `pachca chats archive` | Архивация чата |
| `pachca chats unarchive` | Разархивация чата |

### common

| Команда | Описание |
|---------|---------|
| `pachca common request-export` | Экспорт сообщений |
| `pachca common get-exports` | Скачать архив экспорта |
| `pachca common custom-properties` | Список дополнительных полей |
| `pachca common direct-url` | Загрузка файла |
| `pachca common uploads` | Получение подписи, ключа и других параметров |

### members

| Команда | Описание |
|---------|---------|
| `pachca members add-group-tags` | Добавление тегов |
| `pachca members remove-group-tag` | Исключение тега |
| `pachca members leave` | Выход из беседы или канала |
| `pachca members list` | Список участников чата |
| `pachca members add` | Добавление пользователей |
| `pachca members remove` | Исключение пользователя |
| `pachca members update` | Редактирование роли |

### group-tags

| Команда | Описание |
|---------|---------|
| `pachca group-tags create` | Новый тег |
| `pachca group-tags list` | Список тегов сотрудников |
| `pachca group-tags get` | Информация о теге |
| `pachca group-tags update` | Редактирование тега |
| `pachca group-tags delete` | Удаление тега |
| `pachca group-tags list-users` | Список сотрудников тега |

### messages

| Команда | Описание |
|---------|---------|
| `pachca messages create` | Новое сообщение |
| `pachca messages list` | Список сообщений чата |
| `pachca messages get` | Информация о сообщении |
| `pachca messages update` | Редактирование сообщения |
| `pachca messages delete` | Удаление сообщения |
| `pachca messages pin` | Закрепление сообщения |
| `pachca messages unpin` | Открепление сообщения |

### link-previews

| Команда | Описание |
|---------|---------|
| `pachca link-previews add` | Unfurl (разворачивание ссылок) |

### reactions

| Команда | Описание |
|---------|---------|
| `pachca reactions add` | Добавление реакции |
| `pachca reactions remove` | Удаление реакции |
| `pachca reactions list` | Список реакций |

### read-member

| Команда | Описание |
|---------|---------|
| `pachca read-member list-readers` | Список прочитавших сообщение |

### threads

| Команда | Описание |
|---------|---------|
| `pachca threads add` | Новый тред |
| `pachca threads get` | Информация о треде |

### profile

| Команда | Описание |
|---------|---------|
| `pachca profile get-info` | Информация о токене |
| `pachca profile get` | Информация о профиле |
| `pachca profile update-avatar` | Загрузка аватара |
| `pachca profile delete-avatar` | Удаление аватара |
| `pachca profile get-status` | Текущий статус |
| `pachca profile update-status` | Новый статус |
| `pachca profile delete-status` | Удаление статуса |

### search

| Команда | Описание |
|---------|---------|
| `pachca search list-chats` | Поиск чатов |
| `pachca search list-messages` | Поиск сообщений |
| `pachca search list-users` | Поиск сотрудников |

### tasks

| Команда | Описание |
|---------|---------|
| `pachca tasks create` | Новое напоминание |
| `pachca tasks list` | Список напоминаний |
| `pachca tasks get` | Информация о напоминании |
| `pachca tasks update` | Редактирование напоминания |
| `pachca tasks delete` | Удаление напоминания |

### users

| Команда | Описание |
|---------|---------|
| `pachca users create` | Создать сотрудника |
| `pachca users list` | Список сотрудников |
| `pachca users get` | Информация о сотруднике |
| `pachca users update` | Редактирование сотрудника |
| `pachca users delete` | Удаление сотрудника |
| `pachca users update-avatar` | Загрузка аватара сотрудника |
| `pachca users remove-avatar` | Удаление аватара сотрудника |
| `pachca users get-status` | Статус сотрудника |
| `pachca users update-status` | Новый статус сотрудника |
| `pachca users remove-status` | Удаление статуса сотрудника |

### views

| Команда | Описание |
|---------|---------|
| `pachca views open` | Открытие представления |

<!-- AUTO:COMMANDS:END -->

<!-- AUTO:FLAGS -->
## Глобальные флаги

| Флаг | Короткий | Описание |
|------|----------|----------|
| `--output <format>` | `-o` | Формат вывода: table, json, yaml, csv |
| `--columns <list>` | `-c` | Колонки для table-вывода |
| `--no-header` | | Скрыть заголовок таблицы |
| `--profile <name>` | `-p` | Профиль для этой команды |
| `--token <value>` | | Bearer-токен для этого вызова |
| `--quiet` | `-q` | Подавить вывод кроме ошибок |
| `--verbose` | `-v` | Показывать HTTP-детали |
| `--no-input` | | Отключить промпты |
| `--dry-run` | | Показать запрос без отправки |
| `--timeout <seconds>` | | Таймаут запроса |
| `--no-retry` | | Отключить авто-retry |

<!-- AUTO:FLAGS:END -->

## Загрузка файлов

```
# Загрузить файл (получает подпись и загружает автоматически)
pachca upload photo.jpg

# Из stdin
cat data.csv | pachca upload -
```

Команда `upload` автоматически получает подпись (`POST /uploads`) и загружает файл на S3. Возвращает `key` — используйте его в `--files` при создании сообщений.

## Пагинация

```
# Первая страница (по умолчанию)
pachca users list --limit 20

# Следующая страница вручную
pachca users list --cursor eyJpZCI6NTB9

# Загрузить все страницы автоматически
pachca users list --all
```

## Имена флагов

Флаги CLI используют **kebab-case** (через дефис), а не snake_case как в API-документации — это стандартная конвенция всех современных CLI:

```
API-документация          CLI-флаг
first_name            →   --first-name
phone_number          →   --phone-number
entity_id             →   --entity-id
skip_email_notify     →   --skip-email-notify
list_tags             →   --list-tags
custom_properties     →   --custom-properties
```

При отправке запроса CLI автоматически конвертирует имена обратно в snake_case для API.

## Вывод и скрипты

```
# JSON вместо таблицы
pachca users list -o json

# YAML
pachca users list -o yaml

# CSV (для Excel / Google Sheets)
pachca users list -o csv

# Выбрать колонки
pachca users list --columns id,email,role

# Только значения без заголовка (для скриптов)
pachca users list --columns email --no-header

# Пайп — цвет отключается автоматически
pachca users list -o json | jq '.[].name'

# Текст из файла или pipe
pachca messages create --entity-id 123 < message.txt
echo "Деплой завершён" | pachca messages create --entity-id 123

# Скачать файл (для команд с редиректом)
pachca common get-exports 123 --save ./export.zip

# Посмотреть запрос без отправки
pachca messages create --entity-id 123 --content "Привет" --dry-run

# Тихий режим — только exit code, без вывода
pachca messages create -q --entity-id 123 --content "Деплой завершён"

# CI / неинтерактивный режим
PACHCA_TOKEN=xxx pachca messages create --entity-id 123 --content "Деплой завершён" --no-input

# DELETE без подтверждения (в TTY)
pachca users delete 1234 --force

# Boolean-флаги: --flag (true), --no-flag (false)
pachca users update 123 --suspended
pachca users update 123 --no-suspended
pachca chats update 123 --no-public
```

## Прямые API-запросы

Escape hatch для нестандартных запросов без сгенерированных команд:

```
pachca api GET /messages --query chat_id=123
pachca api POST /messages -F message[chat_id]=12345 -f message[content]="Привет"
pachca api POST /messages --input payload.json
pachca api GET /profile -o yaml --dry-run
```

## Настройки

Установить постоянные дефолты:

```
pachca config set defaults.output json   # всегда JSON
pachca config set defaults.timeout 60    # таймаут 60s
pachca config list                       # все настройки
```

## Диагностика

```
pachca doctor
```

## Доступные команды

```
pachca commands --available
```

## Changelog

```
pachca changelog
```

## Shell completion

```
pachca autocomplete zsh   # zsh completion
pachca autocomplete bash  # bash completion
pachca autocomplete fish  # fish completion
```

## Переменные окружения

| Переменная | Описание |
|-----------|---------|
| `PACHCA_TOKEN` | Bearer-токен (высший приоритет, удобно для CI) |
| `PACHCA_PROFILE` | Активный профиль для команды |
| `PACHCA_TIMEOUT` | Таймаут запроса в секундах (по умолчанию 30) |
| `PACHCA_PROMPT_DISABLED` | Отключить интерактивные промпты |
| `CI` | Стандартная переменная CI-окружений |
| `NO_COLOR` | Отключить цвет в выводе |
| `FORCE_COLOR` | Принудительно включить цвет |
| `PACHCA_SKIP_NEW_VERSION_CHECK` | Отключить проверку обновлений |

## Документация API

Полная документация: https://dev.pachca.com
