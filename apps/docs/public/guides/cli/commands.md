> Это Markdown-версия конкретной страницы. Для контекста за её пределами (правила API, полный перечень методов, авторизация) ОБЯЗАТЕЛЬНО открой [llms.txt](https://dev.pachca.com/llms.txt) перед ответом — это сэкономит токены и предотвратит неполный ответ.


# Команды

Паттерн всех команд: `pachca [секция] [действие] [--флаги]`

Имена команд совпадают с URL документации:

```text noCopy
dev.pachca.com/api/messages/create  →  pachca messages create
dev.pachca.com/api/chats/list       →  pachca chats list
dev.pachca.com/api/members/add      →  pachca members add
```

Глобальные флаги (доступны для всех команд) и переменные окружения — в разделе [Флаги и скрипты](/guides/cli/scripting).

## Все команды

Раскройте строку, чтобы увидеть параметры команды. Обязательные аргументы и флаги помечены `*`.

| Команда | Метод API |
|---------|-----------|
| `pachca api` | Произвольный запрос к API. Список и справка: `api ls` (список эндпоинтов), `api <МЕТОД> <путь> --describe` / `--spec` / `--docs` |
| `pachca auth list` | Список сохранённых профилей |
| `pachca auth login` | Авторизация и сохранение токена |
| `pachca auth logout` | Удаление сохранённого профиля |
| `pachca auth status` | Статус текущего профиля |
| `pachca auth switch` | Переключение активного профиля |
| `pachca bots list-events` | `GET` История событий |
| `pachca bots remove-event` | `DELETE` Удаление события |
| `pachca bots update` | `PUT` Редактирование бота |
| `pachca changelog` | История изменений CLI |
| `pachca chats archive` | `PUT` Архивация чата |
| `pachca chats create` | `POST` Новый чат |
| `pachca chats get` | `GET` Информация о чате |
| `pachca chats list` | `GET` Список чатов |
| `pachca chats unarchive` | `PUT` Разархивация чата |
| `pachca chats update` | `PUT` Обновление чата |
| `pachca commands` | Список всех команд |
| `pachca common custom-properties` | `GET` Список дополнительных полей |
| `pachca common direct-url` | `POST` Загрузка файла |
| `pachca common get-exports` | `GET` Скачать архив экспорта |
| `pachca common request-export` | `POST` Экспорт сообщений |
| `pachca common uploads` | `POST` Получение подписи, ключа и других параметров |
| `pachca config get` | Получение значения конфигурации |
| `pachca config list` | Список всех настроек |
| `pachca config set` | Установка значения конфигурации |
| `pachca doctor` | Диагностика окружения: Node.js, сеть, токен, конфигурация |
| `pachca group-tags create` | `POST` Новый тег |
| `pachca group-tags delete` | `DELETE` Удаление тега |
| `pachca group-tags get` | `GET` Информация о теге |
| `pachca group-tags list` | `GET` Список тегов сотрудников |
| `pachca group-tags list-users` | `GET` Список сотрудников тега |
| `pachca group-tags update` | `PUT` Редактирование тега |
| `pachca guide` | Поиск сценариев использования |
| `pachca introspect` | Метаданные команды в машиночитаемом формате |
| `pachca link-previews add` | `POST` Unfurl (разворачивание ссылок) |
| `pachca members add` | `POST` Добавление пользователей |
| `pachca members add-group-tags` | `POST` Добавление тегов |
| `pachca members leave` | `DELETE` Выход из беседы или канала |
| `pachca members list` | `GET` Список участников чата |
| `pachca members remove` | `DELETE` Исключение пользователя |
| `pachca members remove-group-tag` | `DELETE` Исключение тега |
| `pachca members update` | `PUT` Редактирование роли |
| `pachca messages create` | `POST` Новое сообщение |
| `pachca messages delete` | `DELETE` Удаление сообщения |
| `pachca messages get` | `GET` Информация о сообщении |
| `pachca messages list` | `GET` Список сообщений чата |
| `pachca messages pin` | `POST` Закрепление сообщения |
| `pachca messages unpin` | `DELETE` Открепление сообщения |
| `pachca messages update` | `PUT` Редактирование сообщения |
| `pachca profile delete-avatar` | `DELETE` Удаление аватара |
| `pachca profile delete-status` | `DELETE` Удаление статуса |
| `pachca profile get` | `GET` Информация о профиле |
| `pachca profile get-info` | `GET` Информация о токене |
| `pachca profile get-status` | `GET` Текущий статус |
| `pachca profile update-avatar` | `PUT` Загрузка аватара |
| `pachca profile update-status` | `PUT` Новый статус |
| `pachca reactions add` | `POST` Добавление реакции |
| `pachca reactions list` | `GET` Список реакций |
| `pachca reactions remove` | `DELETE` Удаление реакции |
| `pachca read-member list-readers` | `GET` Список прочитавших сообщение |
| `pachca search list-chats` | `GET` Поиск чатов |
| `pachca search list-messages` | `GET` Поиск сообщений |
| `pachca search list-users` | `GET` Поиск сотрудников |
| `pachca security list` | `GET` Журнал аудита событий |
| `pachca tasks create` | `POST` Новое напоминание |
| `pachca tasks delete` | `DELETE` Удаление напоминания |
| `pachca tasks get` | `GET` Информация о напоминании |
| `pachca tasks list` | `GET` Список напоминаний |
| `pachca tasks update` | `PUT` Редактирование напоминания |
| `pachca threads add` | `POST` Новый тред |
| `pachca threads get` | `GET` Информация о треде |
| `pachca threads list` | `GET` Список тредов |
| `pachca upgrade` | Обновить CLI до последней версии |
| `pachca upload` | Загрузить файл (получает подпись и загружает автоматически) |
| `pachca users create` | `POST` Создать сотрудника |
| `pachca users delete` | `DELETE` Удаление сотрудника |
| `pachca users get` | `GET` Информация о сотруднике |
| `pachca users get-status` | `GET` Статус сотрудника |
| `pachca users list` | `GET` Список сотрудников |
| `pachca users remove-avatar` | `DELETE` Удаление аватара сотрудника |
| `pachca users remove-status` | `DELETE` Удаление статуса сотрудника |
| `pachca users update` | `PUT` Редактирование сотрудника |
| `pachca users update-avatar` | `PUT` Загрузка аватара сотрудника |
| `pachca users update-status` | `PUT` Новый статус сотрудника |
| `pachca version` | Версия CLI |
| `pachca views open` | `POST` Открытие представления |


## Справка

```bash
# Подробная справка по команде
pachca messages create --help

# Список всех команд
pachca commands

# Только команды, доступные текущему токену (фильтр по скоупам)
pachca commands --available
```

Не знаете точный эндпоинт — посмотрите список и справку прямо в CLI: `pachca api ls`, затем `pachca api <МЕТОД> <путь> --describe`. Подробнее — в разделе [Прямые запросы](/guides/cli/api-requests).
