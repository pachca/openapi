---
name: pachca-api
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

## Authentication

All requests require a Bearer token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

**Token types and their permissions:**
- **Admin token** — full access: manage users, tags, delete messages. Get it in Settings → Automations → API.
- **Owner token** — admin access plus audit events and data export (Corporation plan only).
- **Bot token** — send messages with custom display name/avatar, receive webhook events, manage webhook settings. Created per-bot in Settings → Automations.

Tokens are long-lived and do not expire. They can be reset by the admin/owner in Settings.

## Capabilities

### Messages
- `POST /messages` — send a message to a chat, direct message to a user, or reply in a thread
- `GET /messages` — list messages in a chat (cursor pagination, sorting)
- `GET /messages/{id}` — get a single message
- `PUT /messages/{id}` — edit message content
- `DELETE /messages/{id}` — delete a message (admin token required)
- `POST /messages/{id}/pin` — pin a message in chat
- `DELETE /messages/{id}/pin` — unpin a message
- `POST /messages/{id}/reactions` — add emoji reaction
- `DELETE /messages/{id}/reactions` — remove emoji reaction
- `GET /messages/{id}/reactions` — list reactions on a message
- `GET /messages/{id}/read_member_ids` — list users who read a message

### Threads
- `POST /messages/{id}/thread` — create a thread on a message
- `GET /threads/{id}` — get thread info

### Chats
- `POST /chats` — create a chat or channel
- `GET /chats` — list chats (with filters, sorting, cursor pagination)
- `GET /chats/{id}` — get chat details
- `PUT /chats/{id}` — update chat (name, public status)
- `PUT /chats/{id}/archive` — archive a chat
- `PUT /chats/{id}/unarchive` — restore a chat from archive

### Chat Members
- `GET /chats/{id}/members` — list members (with role filter, cursor pagination)
- `POST /chats/{id}/members` — add members to chat or thread
- `DELETE /chats/{chatId}/members/{userId}` — remove a member
- `PUT /chats/{chatId}/members/{userId}` — change member role (admin/editor/member)
- `DELETE /chats/{id}/leave` — leave a chat
- `POST /chats/{chatId}/group_tags` — add a tag to a chat
- `DELETE /chats/{chatId}/group_tags/{tagId}` — remove a tag from a chat

### Users
- `POST /users` — create an employee (admin token required)
- `GET /users` — list employees (search, cursor pagination)
- `GET /users/{id}` — get employee details
- `PUT /users/{id}` — update employee (admin token required)
- `DELETE /users/{id}` — delete employee (admin token required)

### Profile
- `GET /profile` — get own profile
- `GET /profile/status` — get current status
- `PUT /profile/status` — set status
- `DELETE /profile/status` — clear status

### Group Tags (Employee Tags)
- `POST /group_tags` — create a tag (admin token required)
- `GET /group_tags` — list tags (with name filter)
- `GET /group_tags/{id}` — get tag details
- `PUT /group_tags/{id}` — update a tag (admin token required)
- `DELETE /group_tags/{id}` — delete a tag (admin token required)
- `GET /group_tags/{id}/users` — list tag members

### Tasks (Reminders)
- `POST /tasks` — create a reminder
- `GET /tasks` — list reminders (with pagination)
- `GET /tasks/{id}` — get reminder details
- `PUT /tasks/{id}` — update a reminder
- `DELETE /tasks/{id}` — delete a reminder

### Bots & Webhooks
- `PUT /bots/{id}` — update bot webhook URL and subscribed events
- `GET /webhooks/events` — get webhook event delivery history (bot token required)
- `DELETE /webhooks/events/{id}` — delete an event from history (bot token required)

### File Uploads
- `POST /uploads` — get S3 upload signature and parameters
- `POST /uploads/direct_url` — upload a file directly (multipart/form-data, no auth required)

### Interactive Forms
- `POST /views/open` — open a modal form for a user (requires trigger_id from button click)

### Custom Properties
- `GET /custom_properties` — list custom fields for users or tasks

### Export & Audit (Corporation plan, owner token)
- `POST /chats/exports` — request message export as JSON/ZIP
- `GET /chats/exports/{id}` — download export archive (returns 302 redirect)
- `GET /audit-events` — query security audit log (90-day retention)

## Common Workflows

### Send a message to a chat

```
POST /messages
{
  "message": {
    "entity_type": "discussion",
    "entity_id": 123,
    "content": "Hello from the API!"
  }
}
```

`entity_type` is `"discussion"` for chats/channels, `"user"` for direct messages, `"thread"` for thread replies. `entity_id` is the chat ID, user ID, or thread ID respectively.

### Send a message with a file

1. Get upload parameters: `POST /uploads` with `file_name` and `file_size`
2. Upload to the returned S3 URL using the provided form fields
3. Send a message referencing the uploaded file key in the `files` array

### React to webhook events

Configure a webhook URL in your bot settings (Settings → Automations → Bots). The bot receives POST requests for subscribed events:

**Message events:** `message.new`, `message.updated`, `message.deleted`
**Reaction events:** `reaction.add`, `reaction.remove`
**Interactive events:** `button.click`, `view.submission`
**Chat membership:** `chat_member.add`, `chat_member.remove`
**Workspace membership:** `company_member.invite`, `company_member.confirm`, `company_member.update`, `company_member.suspend`, `company_member.activate`, `company_member.delete`

Verify webhook authenticity using the `Pachca-Signature` header (HMAC-SHA256 with your bot's signing secret).

### Open an interactive form

When a user clicks a button in a message, your bot receives a `button.click` webhook with a `trigger_id`. Use it to open a modal:

```
POST /views/open
{
  "trigger_id": "<from webhook>",
  "view": {
    "title": "Feedback Form",
    "blocks": [
      { "block_id": "input1", "type": "input", "label": "Your feedback" }
    ]
  }
}
```

Form submission results arrive via the `view.submission` webhook event.

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
- `POST /uploads/direct_url` is the only endpoint that does not require authentication.

### Error Handling
- `400` — validation error
- `401` — missing or invalid token
- `403` — insufficient permissions
- `404` — resource not found
- `429` — rate limited (check `Retry-After`)

Error response body: `{ "errors": [{ "key": "field", "value": "description" }] }`

## Guides

Detailed documentation on specific topics is available at:

- [Requests & Responses](https://dev.pachca.com/guides/requests-responses) — base URL, headers, status codes
- [Errors & Rate Limits](https://dev.pachca.com/guides/errors) — error schemas, retry strategies
- [Webhooks](https://dev.pachca.com/guides/webhook) — setup, event types, signature verification
- [Interactive Forms](https://dev.pachca.com/guides/forms) — block types, form submission flow
- [Data Export](https://dev.pachca.com/guides/export) — message export, async processing
- [Audit Events](https://dev.pachca.com/guides/audit-events) — security log, event types
- [DLP](https://dev.pachca.com/guides/dlp) — data loss prevention rules
