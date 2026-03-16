---
name: pachca-chats
description: >
  Pachca chat, channel, and conversation management. Use this skill whenever the
  user wants to create, list, archive, or manage channels and group conversations,
  add or remove members, change member roles, export chat history, or check chat
  details. Also use for anything about chat settings, member management, or
  conversation structure. NOT for sending messages or replying to threads. Use
  when: create channel, create conversation, create chat, add member, remove
  member, archive chat, member roles, export messages, list chats, active chats,
  inactive chats. NOT for: send message, reply to thread, upload file.
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

### Create channel and invite members

1. Create channel with members:
   ```bash
   pachca chats create --name="Новый канал" --channel --member-ids='[1,2,3]'
   ```
   > `"channel": true` for channel, `false` (default) for conversation. Members can be passed immediately: `member_ids` and/or `group_tag_ids`

2. Or add members later:
   ```bash
   pachca members add <chat_id> --member-ids='[1,2,3]'
   ```

> `channel` — boolean, not string. `member_ids` and `group_tag_ids` — optional on creation.


### Rename or update chat

1. Update chat:
   ```bash
   pachca chats update <ID> --name="Новое название"
   ```
   > Available fields: `name`, `public`

> To change members use POST/DELETE /chats/{id}/members.


### Create project conversation from template

1. Create conversation with members from tag:
   ```bash
   pachca chats create --name="Проект Alpha" --group-tag-ids='[42]' --member-ids='[186,187]'
   ```

2. Send welcome message:
   ```bash
   pachca messages create --entity-id=<chat_id> --content="Добро пожаловать в проект!"
   ```

> `group_tag_ids` on creation adds all tag members at once.


### Find active chats for period

1. Get chats with activity after specified date:
   ```bash
   pachca chats list --last-message-at-after=<дата> --all
   ```
   > For range add `--last-message-at-before`. Date in ISO-8601 UTC+0


### Find and archive inactive chats

1. Get chats with no activity since specified date:
   ```bash
   pachca chats list --last-message-at-before=<порог> --all
   ```

2. For each chat: archive:
   ```bash
   pachca chats archive <ID>
   ```
   > Check `"channel": false` — archiving channels may be undesirable


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
