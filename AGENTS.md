# Pachca API — Agent Skills

Pachca — corporate messenger with REST API and CLI.

## Quick start

```bash
npx @pachca/cli <command> --token <TOKEN>
```

For regular use:

```bash
npm install -g @pachca/cli && pachca auth login
```

## Authorization

Use `--token <TOKEN>` flag or `PACHCA_TOKEN` environment variable. Get token: Settings → Automations → API (admin) or bot settings (bot).

## Routing

Identify the task and use the appropriate skill:

| Task | Skill |
|------|-------|
| Pachca user profile, status management, custom fields, and token verification | `pachca-profile` |
| Pachca employee and tag (group) management | `pachca-users` |
| Pachca chat, channel, and conversation management | `pachca-chats` |
| Pachca messaging — send, edit, delete, and manage messages | `pachca-messages` |
| Pachca bot management, webhooks, and link unfurling | `pachca-bots` |
| Pachca interactive forms (modals) for bots — input fields, selects, checkboxes, date/time pickers, file uploads | `pachca-forms` |
| Pachca task and reminder management — create, list, update, complete, and delete tasks | `pachca-tasks` |
| Pachca full-text search across employees, chats, and messages | `pachca-search` |
| Pachca security audit log — track login events, user actions, message changes, and DLP violations | `pachca-security` |

## Top 5 operations

```bash
# Send a message
pachca messages create --entity-id=<chat_id> --content="Hello"

# Search chats
pachca search list-chats --query="..."

# My profile
pachca profile get

# Search messages
pachca search list-messages --query="..."

# Create a chat
pachca chats create --name="Project" --member-ids=1,2,3
```

## Available skills

| Skill | Description | Path |
|-------|-------------|------|
| pachca-profile | Pachca user profile, status management, custom fields, and token verification | [skills/pachca-profile/SKILL.md](skills/pachca-profile/SKILL.md) |
| pachca-users | Pachca employee and tag (group) management | [skills/pachca-users/SKILL.md](skills/pachca-users/SKILL.md) |
| pachca-chats | Pachca chat, channel, and conversation management | [skills/pachca-chats/SKILL.md](skills/pachca-chats/SKILL.md) |
| pachca-messages | Pachca messaging — send, edit, delete, and manage messages | [skills/pachca-messages/SKILL.md](skills/pachca-messages/SKILL.md) |
| pachca-bots | Pachca bot management, webhooks, and link unfurling | [skills/pachca-bots/SKILL.md](skills/pachca-bots/SKILL.md) |
| pachca-forms | Pachca interactive forms (modals) for bots — input fields, selects, checkboxes, date/time pickers, file uploads | [skills/pachca-forms/SKILL.md](skills/pachca-forms/SKILL.md) |
| pachca-tasks | Pachca task and reminder management — create, list, update, complete, and delete tasks | [skills/pachca-tasks/SKILL.md](skills/pachca-tasks/SKILL.md) |
| pachca-search | Pachca full-text search across employees, chats, and messages | [skills/pachca-search/SKILL.md](skills/pachca-search/SKILL.md) |
| pachca-security | Pachca security audit log — track login events, user actions, message changes, and DLP violations | [skills/pachca-security/SKILL.md](skills/pachca-security/SKILL.md) |

## Limitations

- Rate limit: ~4 req/sec per chat (messages), ~50 req/sec (other). Respect `Retry-After` on 429.
- Pagination: cursor-based (`limit` + `cursor`). Check `meta.paginate.next_page`.
- Admin operations (managing employees/tags, deleting messages) require an admin token.

## Installation

```bash
npx skills add pachca/openapi
```

More info: [API Docs](https://dev.pachca.com) · [Full reference](https://dev.pachca.com/llms-full.txt) · [OpenAPI spec](https://dev.pachca.com/openapi.yaml) · CLI help: `pachca --help`
