# @pachca/cli

Официальный CLI для [Пачки](https://pachca.com).

## Установка

```
npm install -g @pachca/cli

# Или без установки:
npx -y @pachca/cli users list
```

## Быстрый старт

```
pachca auth login          # вход через браузер
pachca users list          # список сотрудников
pachca messages create --entity-id 123 --content "Привет!"
```

Какой токен выбрать: https://dev.pachca.com/api/authorization

## Использование в агентах (Claude, Cursor и др.)

Вход запускает сотрудник в своём терминале командой `pachca auth login` и подтверждает в браузере. Агент проверяет вход командой `pachca auth status`. Токен в разговоре агенту не передают.

```
pachca auth status                       # есть ли вход и под кем
pachca api ls                            # справка по API без входа и без токена
pachca api POST /messages --describe
```

В CI и у агентов без сотрудника токен приходит из переменной окружения, `auth login` не нужен:

```
PACHCA_TOKEN=$TOKEN pachca users list --no-input
```

Готовый токен сохраняют через stdin, а не аргументом: аргумент остаётся в истории оболочки и в списке процессов.

```
pbpaste | pachca auth login --token -
```

## Профили (несколько токенов)

Храните несколько токенов под именами — личный, боты:

```
pachca auth login --profile personal
pachca auth login --profile bot-notify
pachca auth list
pachca auth switch bot-notify
```

Токен хранится в хранилище ключей ОС, в `~/.config/pachca/config.toml` только имя, почта и права. Где хранилища нет, токен лежит в этом файле, CLI говорит об этом при входе.

<!-- AUTO:COMMANDS -->
<!-- AUTO:COMMANDS:END -->

<!-- AUTO:FLAGS -->
<!-- AUTO:FLAGS:END -->

## Загрузка файлов

```
# Загрузить файл (получает подпись и загружает автоматически)
pachca upload photo.jpg

# Из stdin: имя с расширением задаёт --name
cat data.csv | pachca upload - --name data.csv
```

Команда `upload` автоматически получает подпись (`POST /uploads`) и загружает файл на S3. Возвращает `key` — используйте его в `--files` при создании сообщений. Расширение `name` в файле сообщения должно совпадать с расширением имени в `key`.

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
pachca users list -o json | jq -r '.[] | "\(.first_name) \(.last_name)"'

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
pachca api POST /messages -F 'message[entity_id]=12345' -f 'message[content]=Привет'
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
pachca autocomplete zsh         # zsh completion
pachca autocomplete bash        # bash completion
pachca autocomplete powershell  # PowerShell completion
```

## Переменные окружения

| Переменная | Описание |
|-----------|---------|
| `PACHCA_TOKEN` | Bearer-токен, удобно для CI. Приоритетнее профиля, но флаги `--token` и `--profile` его перебивают |
| `PACHCA_PROFILE` | Активный профиль для команды |
| `PACHCA_TIMEOUT` | Таймаут запроса в секундах (по умолчанию 30) |
| `PACHCA_PROMPT_DISABLED` | Отключить интерактивные промпты |
| `CI` | Стандартная переменная CI-окружений |
| `NO_COLOR` | Отключить цвет в выводе |
| `FORCE_COLOR` | Принудительно включить цвет |
| `PACHCA_SKIP_NEW_VERSION_CHECK` | Отключить проверку обновлений |

## Документация API

Полная документация: https://dev.pachca.com
