
# Команды

Паттерн всех команд: `pachca [секция] [действие] [--флаги]`

Имена команд совпадают с URL документации:

```text noCopy
dev.pachca.com/api/messages/create  →  pachca messages create
dev.pachca.com/api/chats/list       →  pachca chats list
dev.pachca.com/api/members/add      →  pachca members add
```

## Глобальные флаги

Доступны для каждой команды ниже (генерируются из исходного определения флагов в CLI):

| Флаг | Короткий | Описание |
|------|----------|----------|
| `--output <value>` | `-o` | Формат вывода: table, json, yaml, csv |
| `--columns <value>` | `-c` | Колонки для table-вывода (через запятую) |
| `--no-header` |  | Скрыть заголовок таблицы |
| `--no-truncate` |  | Не обрезать длинные значения |
| `--profile <value>` | `-p` | Профиль для этой команды |
| `--token <value>` |  | Токен для этого вызова (без сохранения) |
| `--quiet` | `-q` | Подавить вывод (только exit code и ошибки) |
| `--no-color` |  | Отключить цвета |
| `--verbose` | `-v` | Показывать HTTP-запросы и ответы |
| `--no-input` |  | Отключить интерактивные промпты |
| `--dry-run` |  | Показать запрос без отправки |
| `--timeout <value>` |  | Таймаут запроса в секундах (по умолчанию 30) |
| `--no-retry` |  | Отключить авто-retry при 429/503 |
| `--plain` |  | Плоский вывод: TSV без заголовка, ID первым, без цвета (для скриптов) |


Переменные окружения (`PACHCA_TOKEN`, `PACHCA_PROFILE`, `CI` и др.) — в разделе [Скрипты и CI](/guides/cli/scripting#peremennye-okruzheniya).

## Все команды

Аргументы и обязательные флаги помечены `*`. Полный список — генерируется из манифеста CLI:

### api

| Команда | Описание |
|---------|----------|
| `pachca api` | Произвольный запрос к API. Самоописание: `api ls` (список эндпоинтов), `api <МЕТОД> <путь> --describe|--spec|--docs` |

### auth

| Команда | Описание |
|---------|----------|
| `pachca auth list` | Список сохранённых профилей |
| `pachca auth login` | Авторизация и сохранение токена |
| `pachca auth logout` | Удаление сохранённого профиля |
| `pachca auth status` | Статус текущего профиля |
| `pachca auth switch` | Переключение активного профиля |

### bots

| Команда | Описание |
|---------|----------|
| `pachca bots list-events` | История событий |
| `pachca bots remove-event` | Удаление события |
| `pachca bots update` | Редактирование бота |

### changelog

| Команда | Описание |
|---------|----------|
| `pachca changelog` | История изменений CLI |

### chats

| Команда | Описание |
|---------|----------|
| `pachca chats archive` | Архивация чата |
| `pachca chats create` | Новый чат |
| `pachca chats get` | Информация о чате |
| `pachca chats list` | Список чатов |
| `pachca chats unarchive` | Разархивация чата |
| `pachca chats update` | Обновление чата |

### commands

| Команда | Описание |
|---------|----------|
| `pachca commands` | Список всех команд |

### common

| Команда | Описание |
|---------|----------|
| `pachca common custom-properties` | Список дополнительных полей |
| `pachca common direct-url` | Загрузка файла |
| `pachca common get-exports` | Скачать архив экспорта |
| `pachca common request-export` | Экспорт сообщений |
| `pachca common uploads` | Получение подписи, ключа и других параметров |

### config

| Команда | Описание |
|---------|----------|
| `pachca config get` | Получение значения конфигурации |
| `pachca config list` | Список всех настроек |
| `pachca config set` | Установка значения конфигурации |

### doctor

| Команда | Описание |
|---------|----------|
| `pachca doctor` | Диагностика окружения: Node.js, сеть, токен, конфигурация |

### group-tags

| Команда | Описание |
|---------|----------|
| `pachca group-tags create` | Новый тег |
| `pachca group-tags delete` | Удаление тега |
| `pachca group-tags get` | Информация о теге |
| `pachca group-tags list` | Список тегов сотрудников |
| `pachca group-tags list-users` | Список сотрудников тега |
| `pachca group-tags update` | Редактирование тега |

### guide

| Команда | Описание |
|---------|----------|
| `pachca guide` | Поиск сценариев использования |

### introspect

| Команда | Описание |
|---------|----------|
| `pachca introspect` | Метаданные команды в машиночитаемом формате |

### link-previews

| Команда | Описание |
|---------|----------|
| `pachca link-previews add` | Unfurl (разворачивание ссылок) |

### members

| Команда | Описание |
|---------|----------|
| `pachca members add` | Добавление пользователей |
| `pachca members add-group-tags` | Добавление тегов |
| `pachca members leave` | Выход из беседы или канала |
| `pachca members list` | Список участников чата |
| `pachca members remove` | Исключение пользователя |
| `pachca members remove-group-tag` | Исключение тега |
| `pachca members update` | Редактирование роли |

### messages

| Команда | Описание |
|---------|----------|
| `pachca messages create` | Новое сообщение |
| `pachca messages delete` | Удаление сообщения |
| `pachca messages get` | Информация о сообщении |
| `pachca messages list` | Список сообщений чата |
| `pachca messages pin` | Закрепление сообщения |
| `pachca messages unpin` | Открепление сообщения |
| `pachca messages update` | Редактирование сообщения |

### profile

| Команда | Описание |
|---------|----------|
| `pachca profile delete-avatar` | Удаление аватара |
| `pachca profile delete-status` | Удаление статуса |
| `pachca profile get` | Информация о профиле |
| `pachca profile get-info` | Информация о токене |
| `pachca profile get-status` | Текущий статус |
| `pachca profile update-avatar` | Загрузка аватара |
| `pachca profile update-status` | Новый статус |

### reactions

| Команда | Описание |
|---------|----------|
| `pachca reactions add` | Добавление реакции |
| `pachca reactions list` | Список реакций |
| `pachca reactions remove` | Удаление реакции |

### read-member

| Команда | Описание |
|---------|----------|
| `pachca read-member list-readers` | Список прочитавших сообщение |

### search

| Команда | Описание |
|---------|----------|
| `pachca search list-chats` | Поиск чатов |
| `pachca search list-messages` | Поиск сообщений |
| `pachca search list-users` | Поиск сотрудников |

### security

| Команда | Описание |
|---------|----------|
| `pachca security list` | Журнал аудита событий |

### tasks

| Команда | Описание |
|---------|----------|
| `pachca tasks create` | Новое напоминание |
| `pachca tasks delete` | Удаление напоминания |
| `pachca tasks get` | Информация о напоминании |
| `pachca tasks list` | Список напоминаний |
| `pachca tasks update` | Редактирование напоминания |

### threads

| Команда | Описание |
|---------|----------|
| `pachca threads add` | Новый тред |
| `pachca threads get` | Информация о треде |

### upgrade

| Команда | Описание |
|---------|----------|
| `pachca upgrade` | Обновить CLI до последней версии |

### upload

| Команда | Описание |
|---------|----------|
| `pachca upload` | Загрузить файл (получает подпись и загружает автоматически) |

### users

| Команда | Описание |
|---------|----------|
| `pachca users create` | Создать сотрудника |
| `pachca users delete` | Удаление сотрудника |
| `pachca users get` | Информация о сотруднике |
| `pachca users get-status` | Статус сотрудника |
| `pachca users list` | Список сотрудников |
| `pachca users remove-avatar` | Удаление аватара сотрудника |
| `pachca users remove-status` | Удаление статуса сотрудника |
| `pachca users update` | Редактирование сотрудника |
| `pachca users update-avatar` | Загрузка аватара сотрудника |
| `pachca users update-status` | Новый статус сотрудника |

### version

| Команда | Описание |
|---------|----------|
| `pachca version` | Версия CLI |

### views

| Команда | Описание |
|---------|----------|
| `pachca views open` | Открытие представления |


## Справка

```bash
# Подробная справка по команде
pachca messages create --help

# Список всех команд
pachca commands

# Только команды, доступные текущему токену (фильтр по скоупам)
pachca commands --available
```

Не знаете точный эндпоинт — посмотрите список и справку прямо в CLI: `pachca api ls`, затем `pachca api <МЕТОД> <путь> --describe`. Подробнее — в разделе [Запросы к API](/guides/cli/api-requests).
