# Pachca API — Agent Skills

Pachca — corporate messenger with REST API and CLI.

## Quick start (zero-install)

```bash
npx @pachca/cli <command> --token <TOKEN>
```

For regular use:

```bash
npm install -g @pachca/cli && pachca auth login
```

## Auth

`--token <TOKEN>` flag or `PACHCA_TOKEN` env var. Get token: Settings → Automations → API (admin) or bot settings (bot).

## Routing

Match the user's task to the right skill:

| User task | Skill |
|-----------|-------|
| User profile, status management, custom fields, token verification | `pachca-profile` |
| Employee and tag (group) management | `pachca-users` |
| Channel and conversation management, chat members | `pachca-chats` |
| Send messages to channels, conversations, and DMs | `pachca-messages` |
| Bot management, incoming/outgoing webhooks, link unfurling | `pachca-bots` |
| Interactive forms with input fields and buttons for bots | `pachca-forms` |
| Create, get, update, and delete tasks (reminders) | `pachca-tasks` |
| Full-text search across employees, chats, and messages | `pachca-search` |
| Security audit event log | `pachca-security` |

## Top-5 operations

```bash
# Send message
pachca messages create --entity-id=<chat_id> --content="Hello"

# Search chats
pachca search list-chats --query="..."

# Get profile
pachca profile get

# Search messages
pachca search list-messages --query="..."

# Create chat
pachca chats create --name="Project X" --member-ids=1,2,3
```

## Available skills

| Skill | Description | Path |
|-------|-------------|------|
| pachca-profile | User profile, status management, custom fields, token verification | [skills/pachca-profile/SKILL.md](skills/pachca-profile/SKILL.md) |
| pachca-users | Employee and tag (group) management | [skills/pachca-users/SKILL.md](skills/pachca-users/SKILL.md) |
| pachca-chats | Channel and conversation management, chat members | [skills/pachca-chats/SKILL.md](skills/pachca-chats/SKILL.md) |
| pachca-messages | Send messages to channels, conversations, and DMs | [skills/pachca-messages/SKILL.md](skills/pachca-messages/SKILL.md) |
| pachca-bots | Bot management, incoming/outgoing webhooks, link unfurling | [skills/pachca-bots/SKILL.md](skills/pachca-bots/SKILL.md) |
| pachca-forms | Interactive forms with input fields and buttons for bots | [skills/pachca-forms/SKILL.md](skills/pachca-forms/SKILL.md) |
| pachca-tasks | Create, get, update, and delete tasks (reminders) | [skills/pachca-tasks/SKILL.md](skills/pachca-tasks/SKILL.md) |
| pachca-search | Full-text search across employees, chats, and messages | [skills/pachca-search/SKILL.md](skills/pachca-search/SKILL.md) |
| pachca-security | Security audit event log | [skills/pachca-security/SKILL.md](skills/pachca-security/SKILL.md) |

## Key constraints

- Rate limit: ~4 req/sec per chat (messages), ~50 req/sec (other). Respect `Retry-After` on 429.
- Pagination: cursor-based (`limit` + `cursor`). Check `meta.paginate.next_page`.
- Admin operations (user/tag management, message deletion) require admin token.

## Install

```bash
npx skills add pachca/openapi
```

More: [API docs](https://dev.pachca.com) · [Full reference](https://dev.pachca.com/llms-full.txt) · [OpenAPI spec](https://dev.pachca.com/openapi.yaml) · CLI help: `pachca --help`
