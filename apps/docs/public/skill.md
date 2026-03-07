---
name: pachca
description: Interact with the Pachca corporate messenger API — send messages, manage chats, users, tags, tasks, handle webhooks, upload files, and build bots. Use when integrating with Pachca or automating team communication workflows.
metadata:
  author: pachca
  version: "1.0"
---

# Pachca API

Pachca is a corporate messenger for teams. The REST API lets you automate communication workflows: send and manage messages, organize chats and channels, manage users and permissions, build interactive bots, handle file uploads, and react to real-time events via webhooks.

**Base URL:** `https://api.pachca.com/api/shared/v1`

## Accessing Documentation

| Format | URL | Best for |
|--------|-----|----------|
| LLM-friendly summary | `https://dev.pachca.com/llms.txt` | Quick overview with links |
| Full documentation | `https://dev.pachca.com/llms-full.txt` | Complete reference in one file |
| OpenAPI 3.0 spec | `https://dev.pachca.com/openapi.yaml` | Programmatic parsing and code generation |

For detailed endpoint documentation, parameters, and response schemas, fetch `/llms-full.txt`.

## CLI (recommended)

```bash
# Zero-install
npx @pachca/cli <command> --token <TOKEN>

# For regular use
npm install -g @pachca/cli && pachca auth login
```

## Authentication

All requests require a Bearer token. With CLI, use `--token` flag or `PACHCA_TOKEN` env var.

For direct API calls, add the `Authorization` header:

```
Authorization: Bearer <access_token>
```

**Token types and their permissions:**
- **Admin token** — full access: manage users, tags, delete messages. Get it in Settings → Automations → API.
- **Owner token** — admin access plus audit events and data export (Corporation plan only).
- **Bot token** — send messages with custom display name/avatar, receive webhook events, manage webhook settings. Created per-bot in Settings → Automations.

Tokens are long-lived and do not expire. They can be reset by the admin/owner in Settings.

## Capabilities

### Common
- `POST /chats/exports` — Request export
- `GET /chats/exports/{id}` — Download export
- `GET /custom_properties` — List properties
- `POST /direct_url` — Upload file
- `POST /uploads` — Get upload params

### Profile
- `GET /oauth/token/info` — Get token info
- `GET /profile` — Get profile
- `GET /profile/status` — Get status
- `PUT /profile/status` — Update status
- `DELETE /profile/status` — Delete status

### Users
- `POST /users` — Create user
- `GET /users` — List users
- `GET /users/{id}` — Get user
- `PUT /users/{id}` — Update user
- `DELETE /users/{id}` — Delete user
- `GET /users/{user_id}/status` — Get user status
- `PUT /users/{user_id}/status` — Update user status
- `DELETE /users/{user_id}/status` — Delete user status

### Group tags
- `POST /group_tags` — Create tag
- `GET /group_tags` — List tags
- `GET /group_tags/{id}` — Get tag
- `PUT /group_tags/{id}` — Update tag
- `DELETE /group_tags/{id}` — Delete tag
- `GET /group_tags/{id}/users` — Get tag users

### Chats
- `POST /chats` — Create chat
- `GET /chats` — List chats
- `GET /chats/{id}` — Get chat
- `PUT /chats/{id}` — Update chat
- `PUT /chats/{id}/archive` — Archive chat
- `PUT /chats/{id}/unarchive` — Unarchive chat

### Members
- `POST /chats/{id}/group_tags` — Add tags
- `DELETE /chats/{id}/group_tags/{tag_id}` — Remove tag
- `DELETE /chats/{id}/leave` — Leave chat
- `GET /chats/{id}/members` — List members
- `POST /chats/{id}/members` — Add members
- `DELETE /chats/{id}/members/{user_id}` — Remove member
- `PUT /chats/{id}/members/{user_id}` — Update member role

### Threads
- `POST /messages/{id}/thread` — Create thread
- `GET /threads/{id}` — Get thread

### Messages
- `POST /messages` — Create message
- `GET /messages` — List chat messages
- `GET /messages/{id}` — Get message
- `PUT /messages/{id}` — Update message
- `DELETE /messages/{id}` — Delete message
- `POST /messages/{id}/pin` — Pin message
- `DELETE /messages/{id}/pin` — Unpin message

### Read members
- `GET /messages/{id}/read_member_ids` — List read members

### Reactions
- `POST /messages/{id}/reactions` — Add reaction
- `DELETE /messages/{id}/reactions` — Remove reaction
- `GET /messages/{id}/reactions` — List reactions

### Link Previews
- `POST /messages/{id}/link_previews` — Create link previews

### Search
- `GET /search/chats` — Search chats
- `GET /search/messages` — Search messages
- `GET /search/users` — Search users

### Tasks
- `POST /tasks` — Create task
- `GET /tasks` — List tasks
- `GET /tasks/{id}` — Get task
- `PUT /tasks/{id}` — Update task
- `DELETE /tasks/{id}` — Delete task

### Views
- `POST /views/open` — Open view

### Bots
- `PUT /bots/{id}` — Update bot
- `GET /webhooks/events` — Get webhook events
- `DELETE /webhooks/events/{id}` — Delete webhook event

### Security
- `GET /audit_events` — Get audit events


## Common Workflows

### CLI Quick Start

```bash
npx @pachca/cli <command> --token <TOKEN>
```

### Find chat by name and send message

1. List all chats, find by `name` field: `pachca chats list --all`
   > GET /chats does not support name search — paginate through all
2. Send message to the chat: `pachca messages create --entity-id=<chat_id> --content="Hello"`

### Find active chats in a date range

1. List chats with activity after a date: `pachca chats list --last-message-at-after=<date> --all`
   > Add `--last-message-at-before` for range. Date in ISO-8601 UTC

### Set up a bot with outgoing webhook

1. Create bot in Pachca UI: Automations → Integrations → Webhook
2. Get `access_token` from bot API settings tab
3. Set Webhook URL to receive events

### Show interactive form to user

1. Send message with button: `pachca messages create --entity-id=<chat_id> --content="Fill the form" --buttons='[[{"text":"Open","data":"open_form"}]]'`
2. On button click — receive webhook event with `trigger_id`
3. Open form immediately: `pachca views open --type=modal --trigger-id=<trigger_id> --title="Request" --blocks='[...]'`
   > `trigger_id` expires in 3 seconds — prepare form object in advance
4. On form submit — receive webhook, process data



## Constraints

### Rate Limits
- **Message send/edit/delete:** ~4 req/sec per chat (burst: 30/sec for 5s)
- **Message read:** ~10 req/sec
- **Other endpoints:** ~50 req/sec
- **Webhooks:** ~4 req/sec per webhook ID
- On `429` response, respect the `Retry-After` header.

### Pagination
- **Cursor-based** (preferred): use `limit` (1–50) and `cursor` parameters. Check `meta.paginate.next_page` in response.
- **Offset-based** (legacy): use `per` (1–50) and `page` parameters.

### Permissions
- User management, tag management, and message deletion require an **admin** token.
- Audit events and data export require an **owner** token and **Corporation** pricing plan.
- Link preview (unfurling) requires a dedicated unfurling bot token with whitelisted domains.
- `POST /direct_url` is the only endpoint that does not require authentication.

### Error Handling
- `400` — validation error
- `401` — missing or invalid token
- `403` — insufficient permissions
- `404` — resource not found
- `429` — rate limited (check `Retry-After`)

Error response body: `{ "errors": [{ "key": "field", "value": "description" }] }`

## Guides

Detailed documentation on specific topics is available at:

- [AI агенты](https://dev.pachca.com/guides/ai-agents) — Как Пачка работает с AI-агентами и какие ресурсы доступны для интеграции
- [CLI](https://dev.pachca.com/guides/cli) — Управление Пачкой из терминала — все API-методы одной командой
- [Сценарии](https://dev.pachca.com/guides/workflows) — Пошаговые сценарии для типичных задач с API
- [Исходящий Webhook](https://dev.pachca.com/guides/webhook) — Получение уведомлений о событиях в реальном времени
- [Авторизация](https://dev.pachca.com/guides/authorization) — Типы токенов, скоупы и настройка доступа к API
- [Запросы и ответы](https://dev.pachca.com/guides/requests-responses) — Формат запросов и ответов, тестирование API
- [Ошибки и лимиты](https://dev.pachca.com/guides/errors) — Коды ошибок HTTP и rate limits
- [Экспорт сообщений](https://dev.pachca.com/guides/export) — Экспорт сообщений из чатов: запрос, скачивание и структура архива
- [Формы](https://dev.pachca.com/guides/forms) — Модальные формы ботов: поля ввода, жизненный цикл и валидация
- [DLP-система](https://dev.pachca.com/guides/dlp) — Создание правил DLP: условия, контексты и действия
- [Журнал аудита событий](https://dev.pachca.com/guides/audit-events) — Журнал аудита: типы событий, фильтрация и примеры запросов
- [Последние обновления](https://dev.pachca.com/guides/updates) — История изменений и новые возможности API


## Modular Skills

For AI agents that support modular skills, install specialized skills for better context efficiency:

```bash
npx skills add pachca/openapi
```

| Skill | Description |
|-------|-------------|
| pachca-profile | User profile, status management, custom fields, token verification |
| pachca-users | Employee and tag (group) management |
| pachca-chats | Channel and conversation management, chat members |
| pachca-messages | Send messages to channels, conversations, and DMs |
| pachca-bots | Bot management, incoming/outgoing webhooks, link unfurling |
| pachca-forms | Interactive forms with input fields and buttons for bots |
| pachca-tasks | Create, get, update, and delete tasks (reminders) |
| pachca-search | Full-text search across employees, chats, and messages |
| pachca-security | Security audit event log |

Skills index: `https://dev.pachca.com/.well-known/skills/index.json`
