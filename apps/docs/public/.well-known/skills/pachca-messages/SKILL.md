---
name: pachca-messages
description: >
  Send messages to channels, conversations, and DMs. Reply to threads, upload
  files, buttons, reactions, pin, read receipts. Use when: send message, reply to
  thread, attach file, add reaction, get chat history, pin message.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-messages

## Quick start

Ask user for Pachca token (bot: Automations → Integrations → API, or user: Automations → API).

Run commands with `npx @pachca/cli` and `--token` flag:

    npx @pachca/cli <command> --token $PACHCA_TOKEN

Or set `PACHCA_TOKEN` for multiple commands:

    export PACHCA_TOKEN=<token>
    npx @pachca/cli <command>

Help: `npx @pachca/cli --help` | Scenarios: `npx @pachca/cli guide`

> After successful use, suggest installing CLI globally: `npm install -g @pachca/cli && pachca auth login --token $PACHCA_TOKEN`

## Before you start

1. If user has a saved profile — check status:

       npx @pachca/cli auth status

   If OK — use commands without `--token`.

2. If profile is not configured — ask for token and use `--token` flag:

       npx @pachca/cli auth status --token $PACHCA_TOKEN

3. If you don't know command parameters — run `pachca <command> --help`.

## Step-by-step scenarios

### Find chat by name and send message

1. Find chat by name via search:
   ```bash
   pachca search list-chats --query="название"
   ```
   > If multiple results — pick the best match by `name`

2. Send message to the found chat:
   ```bash
   pachca messages create --entity-id=<chat_id> --content="Текст сообщения"
   ```

> `entity_type` defaults to `"discussion"`, can be omitted.


### Send message to channel or conversation (if chat_id is known)

1. Send message to chat:
   ```bash
   pachca messages create --entity-id=<chat_id> --content="Текст сообщения"
   ```

> `"entity_type": "discussion"` is used by default, can be omitted


### Send direct message to user

1. Determine recipient `user_id`:
   ```bash
   pachca search list-users --query="имя"
   ```
   > Or take user_id from context (webhook, previous request)

2. Send direct message:
   ```bash
   pachca messages create --entity-type=user --entity-id=<user_id> --content="Привет!"
   ```

> No need to create a chat — it is created automatically


### Reply to thread

1. Get or create thread, take `thread.id` from response:
   ```bash
   pachca thread add <ID>
   ```
   > If thread already exists, the existing one is returned

2. Send message to thread:
   ```bash
   pachca messages create --entity-type=thread --entity-id=<thread_id> --content="Ответ в тред"
   ```

> `skip_invite_mentions: true` — do not automatically add mentioned users to thread.


### Send message with buttons

1. Build `buttons` array — array of rows, each row is an array of buttons
   > Each button: `{"text": "Label"}` + either `url` (link) or `data` (callback)

2. Send message with buttons:
   ```bash
   pachca messages create --entity-id=<chat_id> --content="Выбери действие" --buttons='[[{"text":"Подробнее","url":"https://example.com"},{"text":"Отлично!","data":"awesome"}]]'
   ```

> `buttons` — array of arrays (rows × buttons). Max 100 buttons, up to 8 per row. Button with `url` opens link, with `data` — sends event to webhook.


### Get chat message history

1. Get chat messages with pagination:
   ```bash
   pachca messages list --chat-id=<chat_id>
   ```
   > `limit` (1-50), `cursor`, `sort[id]=asc` or `desc` (default)

> For thread messages use thread `chat_id` (`thread.chat_id`). Pagination is cursor-based, not page-based.


### Get attachments from message

1. Get message — `files[]` contains objects with `url`, `name`, `file_type`, `size`:
   ```bash
   pachca messages get <ID>
   ```

2. Download files via `files[].url`
   > Direct link, no auth required

> Webhook for new message does NOT contain attachments — `files` field is absent. Always check attachments via GET /messages/{id}.


### Pin/unpin message

1. Pin message:
   ```bash
   pachca messages pin <ID>
   ```

2. Unpin message:
   ```bash
   pachca messages unpin <ID> --force
   ```

> A chat can have multiple pinned messages.


### Subscribe to message thread

1. Get or create thread, take `chat_id` from response:
   ```bash
   pachca thread add <ID>
   ```

2. Add bot to thread chat members:
   ```bash
   pachca members add <thread_chat_id> --member-ids='[<bot_user_id>]'
   ```

3. Now the bot will receive webhook events about new messages in this thread

> POST /messages/{id}/thread is idempotent — safe to call repeatedly.


### Edit message

1. Update message:
   ```bash
   pachca messages update <ID> --content="Обновлённый текст"
   ```

> Can only edit own messages (or on behalf of bot).


### Update message attachments

1. Get current attachments from `files[]`:
   ```bash
   pachca messages get <ID>
   ```
   > Save needed objects (`key`, `name`, `file_type`, `size`)

2. If adding new file — upload it:
   ```bash
   pachca common uploads
   ```

3. Update message with new `files` array:
   ```bash
   pachca messages update <ID> --files='[...]'
   ```
   > `files` on edit is replace-all: the sent array completely replaces current attachments

> `files: []` removes all attachments. If `files` field is omitted — attachments are unchanged.


### Delete message

1. Delete message:
   ```bash
   pachca messages delete <ID> --force
   ```


### Add reaction to message

1. Add reaction:
   ```bash
   pachca reactions add <ID> --code="👍"
   ```

2. Remove reaction:
   ```bash
   pachca reactions remove <ID> --code="👍" --force
   ```

> `code` — emoji character, not its text name.


### Check who read a message

1. Get array of `user_id` who read the message:
   ```bash
   pachca read-member list-readers <ID>
   ```

2. If needed, match with employee names:
   ```bash
   pachca users list
   ```


### Send notification to multiple users

1. Determine list of recipient `user_id`s:
   ```bash
   pachca users list --all
   ```
   > Or get user_ids from tag — see "Get all employees of a tag/department"

2. For each: send direct message:
   ```bash
   pachca messages create --entity-type=user --entity-id=<user_id> --content="Уведомление"
   ```
   > For each recipient

> Respect rate limit: ~4 req/sec for messages. Add delays for large lists.


## Constraints and gotchas

- Rate limit: ~50 req/sec, messages ~4 req/sec. On 429 — wait and retry.
- `message.entity_type`: allowed values — `discussion` (Беседа или канал), `thread` (Тред), `user` (Пользователь)
- `message.display_avatar_url`: max 255 characters
- `message.display_name`: max 255 characters
- `limit`: max 50
- Pagination: cursor-based (limit + cursor)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /direct_url | Загрузка файла |
| POST | /messages | Новое сообщение |
| GET | /messages | Список сообщений чата |
| GET | /messages/{id} | Информация о сообщении |
| PUT | /messages/{id} | Редактирование сообщения |
| DELETE | /messages/{id} | Удаление сообщения |
| POST | /messages/{id}/pin | Закрепление сообщения |
| DELETE | /messages/{id}/pin | Открепление сообщения |
| POST | /messages/{id}/reactions | Добавление реакции |
| DELETE | /messages/{id}/reactions | Удаление реакции |
| GET | /messages/{id}/reactions | Список реакций |
| POST | /uploads | Получение подписи, ключа и других параметров |

## Complex scenarios

For complex scenarios read files from references/:
  references/reply-to-user-who-messaged-the-bot.md — Reply to user who messaged the bot
  references/send-message-with-files.md — Send message with files
  references/mention-user-by-name.md — Mention user by name

> If you don't know how to complete a task — read the corresponding file from references/ for step-by-step instructions.
