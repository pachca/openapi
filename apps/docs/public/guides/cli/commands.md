
# Команды

Паттерн всех команд: `pachca [секция] [действие] [--флаги]`

Имена команд совпадают с URL документации:

```text noCopy
dev.pachca.com/api/messages/create  →  pachca messages create
dev.pachca.com/api/chats/list       →  pachca chats list
dev.pachca.com/api/members/add      →  pachca members add
```

## Все команды

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
| `pachca profile update-avatar` | Загрузка аватара |
| `pachca profile update-status` | Новый статус |
| `pachca profile delete-avatar` | Удаление аватара |
| `pachca profile delete-status` | Удаление статуса |
| `pachca users create` | Создать сотрудника |
| `pachca users list` | Список сотрудников |
| `pachca users get` | Информация о сотруднике |
| `pachca users get-status` | Статус сотрудника |
| `pachca users update` | Редактирование сотрудника |
| `pachca users update-avatar` | Загрузка аватара сотрудника |
| `pachca users update-status` | Новый статус сотрудника |
| `pachca users delete` | Удаление сотрудника |
| `pachca users remove-avatar` | Удаление аватара сотрудника |
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


## Справка

```bash
# Подробная справка по команде
pachca messages create --help

# Список всех команд
pachca commands

# Только команды, доступные текущему токену (фильтр по скоупам)
pachca commands --available
```

Не знаете точный эндпоинт — CLI описывает API сам: `pachca api ls`, затем `pachca api <МЕТОД> <путь> --describe`. Подробнее — в разделе [Запросы к API](/guides/cli/api-requests).
