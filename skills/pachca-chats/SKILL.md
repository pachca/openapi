---
name: pachca-chats
description: >
  Pachca — управление чатами, каналами и беседами. Используй этот скилл, когда
  пользователь хочет создать канал, создать беседу, вывести или архивировать чаты,
  добавить или удалить участников, изменить роли участников, экспортировать
  историю чата или проверить настройки чата. НЕ для отправки сообщений или ответов
  в тред. Use when: создать канал, создать беседу, создать чат, добавить
  участника, удалить участника, архивировать чат, роли участников, экспорт
  сообщений, список чатов, все чаты пространства, каналы. NOT for: отправить
  сообщение, ответить в тред, загрузить файл, → pachca-messages, → pachca-users,
  полнотекстовый поиск чатов по названию → pachca-search.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-chats

## Quick start

Ask the user for a Pachca token (bot: the API tab of the bot in Integrations → Bots, user: Integrations → API).

Run commands via `npx -y @pachca/cli` with the `--token` flag:

    npx -y @pachca/cli <command> --token $PACHCA_TOKEN

Or set the `PACHCA_TOKEN` environment variable:

    export PACHCA_TOKEN=<token>
    npx -y @pachca/cli <command>

Help: `npx -y @pachca/cli --help`

> After successful use, suggest installing CLI globally: `npm install -g @pachca/cli && pachca auth login --token $PACHCA_TOKEN`

## Before you start

1. If the user has a saved profile — check:

       npx -y @pachca/cli auth status

   If OK — run commands without `--token`.

2. If no profile is configured — ask for a token and use `--token`:

       npx -y @pachca/cli auth status --token $PACHCA_TOKEN

3. If you don't know the parameters — run `pachca <command> --help`.

## Limitations

- Rate limit: ~50 req/sec. On 429 — wait and retry.
- `chat.name`: max 255 characters
- `role`: allowed values — `admin` (Админ), `editor` (Редактор (доступно только для каналов)), `member` (Участник или подписчик)
- `limit`: max 50
- Pagination: cursor-based (limit + cursor)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /chats | Новый чат |
| GET | /chats | Список чатов |
| POST | /chats/exports | Экспорт сообщений |
| GET | /chats/exports/{id} | Скачать архив экспорта |
| GET | /chats/{id} | Информация о чате |
| PUT | /chats/{id} | Редактирование чата |
| PUT | /chats/{id}/archive | Архивация чата |
| PUT | /chats/{id}/avatar | Загрузка аватара чата |
| DELETE | /chats/{id}/avatar | Удаление аватара чата |
| POST | /chats/{id}/group_tags | Добавление тегов |
| DELETE | /chats/{id}/group_tags/{tag_id} | Исключение тега из чата |
| DELETE | /chats/{id}/leave | Выход из чата |
| GET | /chats/{id}/members | Список участников чата |
| POST | /chats/{id}/members | Добавление участников |
| DELETE | /chats/{id}/members/{user_id} | Исключение участника |
| PUT | /chats/{id}/members/{user_id} | Редактирование роли участника |
| PUT | /chats/{id}/unarchive | Разархивация чата |
| PUT | /chats/{id}/unread | Отметка чата непрочитанным |
| GET | /company/chats | Список чатов пространства |

> If unsure how to complete a task, read the corresponding file from references/.
