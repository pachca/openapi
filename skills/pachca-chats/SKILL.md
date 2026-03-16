---
name: pachca-chats
description: >
  Pachca — управление чатами, каналами и беседами. Используй этот скилл, когда
  пользователь хочет создать канал, создать беседу, вывести или архивировать чаты,
  добавить или удалить участников, изменить роли участников, экспортировать
  историю чата или проверить настройки чата. НЕ для отправки сообщений или ответов
  в тред. Use when: создать канал, создать беседу, создать чат, добавить
  участника, удалить участника, архивировать чат, роли участников, экспорт
  сообщений, список чатов, каналы. NOT for: отправить сообщение, ответить в тред,
  загрузить файл.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-chats

## Quick start

Ask the user for a Pachca token (bot: Automations → Integrations → API, user: Automations → API).

Run commands via `npx @pachca/cli` with the `--token` flag:

    npx @pachca/cli <command> --token $PACHCA_TOKEN

Or set the `PACHCA_TOKEN` environment variable:

    export PACHCA_TOKEN=<token>
    npx @pachca/cli <command>

Help: `npx @pachca/cli --help` | Workflows: `npx @pachca/cli guide`

> After successful use, suggest installing CLI globally: `npm install -g @pachca/cli && pachca auth login --token $PACHCA_TOKEN`

## Before you start

1. If the user has a saved profile — check:

       npx @pachca/cli auth status

   If OK — run commands without `--token`.

2. If no profile is configured — ask for a token and use `--token`:

       npx @pachca/cli auth status --token $PACHCA_TOKEN

3. If you don't know the parameters — run `pachca <command> --help`.

## Workflows

### Создать канал и пригласить участников

1. Создай канал с участниками:
   ```bash
   pachca chats create --name="Новый канал" --channel --member-ids='[1,2,3]'
   ```
   > `"channel": true` для канала, `false` (по умолчанию) для беседы. Участников можно передать сразу: `member_ids` и/или `group_tag_ids`

2. Или добавь участников позже:
   ```bash
   pachca members add <chat_id> --member-ids='[1,2,3]'
   ```

> `channel` — boolean, не строка. `member_ids` и `group_tag_ids` — опциональны при создании.


### Переименовать или обновить чат

1. Обнови чат:
   ```bash
   pachca chats update <ID> --name="Новое название"
   ```
   > Доступные поля: `name`, `public`

> Для изменения состава участников используй POST/DELETE /chats/{id}/members.


### Создать проектную беседу из шаблона

1. Создай беседу с участниками из тега:
   ```bash
   pachca chats create --name="Проект Alpha" --group-tag-ids='[42]' --member-ids='[186,187]'
   ```

2. Отправь приветственное сообщение:
   ```bash
   pachca messages create --entity-id=<chat_id> --content="Добро пожаловать в проект!"
   ```

> `group_tag_ids` при создании добавляет всех участников тега сразу.


### Найти активные чаты за период

1. Получи чаты с активностью после указанной даты:
   ```bash
   pachca chats list --last-message-at-after=<дата> --all
   ```
   > Для диапазона добавь `--last-message-at-before`. Дата в ISO-8601 UTC+0


### Найти и заархивировать неактивные чаты

1. Получи чаты без активности с нужной даты:
   ```bash
   pachca chats list --last-message-at-before=<порог> --all
   ```

2. Для каждого чата: архивируй:
   ```bash
   pachca chats archive <ID>
   ```
   > Проверяй `"channel": false` — архивация каналов может быть нежелательной


## Limitations

- Rate limit: ~50 req/sec. On 429 — wait and retry.
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
| PUT | /chats/{id} | Обновление чата |
| PUT | /chats/{id}/archive | Архивация чата |
| POST | /chats/{id}/group_tags | Добавление тегов |
| DELETE | /chats/{id}/group_tags/{tag_id} | Исключение тега |
| DELETE | /chats/{id}/leave | Выход из беседы или канала |
| GET | /chats/{id}/members | Список участников чата |
| POST | /chats/{id}/members | Добавление пользователей |
| DELETE | /chats/{id}/members/{user_id} | Исключение пользователя |
| PUT | /chats/{id}/members/{user_id} | Редактирование роли |
| PUT | /chats/{id}/unarchive | Разархивация чата |

## Advanced workflows

For advanced workflows, read the files in references/:
  references/archive-and-manage-chat.md — Archive and manage chat
  references/export-chat-history.md — Export chat history

> If unsure how to complete a task, read the corresponding file from references/.
