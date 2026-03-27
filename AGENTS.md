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
| Pachca — МОЙ профиль, МОЙ статус, МОЙ токен, кастомные поля | `pachca-profile` |
| Pachca — управление сотрудниками (участниками пространства) и тегами (группами) | `pachca-users` |
| Pachca — управление чатами, каналами и беседами | `pachca-chats` |
| Pachca — сообщения: отправка, редактирование, удаление | `pachca-messages` |
| Pachca — управление ботами, вебхуки и превью ссылок | `pachca-bots` |
| Pachca — интерактивные формы и модальные окна для ботов | `pachca-forms` |
| Pachca — задачи и напоминания: создание, список, обновление, выполнение, удаление | `pachca-tasks` |
| Pachca — полнотекстовый поиск по сотрудникам, чатам и сообщениям | `pachca-search` |
| Pachca — журнал безопасности: отслеживание входов, действий пользователей, изменений сообщений и нарушений DLP | `pachca-security` |

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
| pachca-profile | Pachca — МОЙ профиль, МОЙ статус, МОЙ токен, кастомные поля | [skills/pachca-profile/SKILL.md](skills/pachca-profile/SKILL.md) |
| pachca-users | Pachca — управление сотрудниками (участниками пространства) и тегами (группами) | [skills/pachca-users/SKILL.md](skills/pachca-users/SKILL.md) |
| pachca-chats | Pachca — управление чатами, каналами и беседами | [skills/pachca-chats/SKILL.md](skills/pachca-chats/SKILL.md) |
| pachca-messages | Pachca — сообщения: отправка, редактирование, удаление | [skills/pachca-messages/SKILL.md](skills/pachca-messages/SKILL.md) |
| pachca-bots | Pachca — управление ботами, вебхуки и превью ссылок | [skills/pachca-bots/SKILL.md](skills/pachca-bots/SKILL.md) |
| pachca-forms | Pachca — интерактивные формы и модальные окна для ботов | [skills/pachca-forms/SKILL.md](skills/pachca-forms/SKILL.md) |
| pachca-tasks | Pachca — задачи и напоминания: создание, список, обновление, выполнение, удаление | [skills/pachca-tasks/SKILL.md](skills/pachca-tasks/SKILL.md) |
| pachca-search | Pachca — полнотекстовый поиск по сотрудникам, чатам и сообщениям | [skills/pachca-search/SKILL.md](skills/pachca-search/SKILL.md) |
| pachca-security | Pachca — журнал безопасности: отслеживание входов, действий пользователей, изменений сообщений и нарушений DLP | [skills/pachca-security/SKILL.md](skills/pachca-security/SKILL.md) |

## Limitations

- Rate limit: ~4 req/sec per chat (messages), ~50 req/sec (other). Respect `Retry-After` on 429.
- Pagination: cursor-based (`limit` + `cursor`). Check `meta.paginate.next_page`.
- Admin operations (managing employees/tags, deleting messages) require an admin token.

## Installation

```bash
npx skills add pachca/openapi
```

More info: [API Docs](https://dev.pachca.com) · [Full reference](https://dev.pachca.com/llms-full.txt) · [OpenAPI spec](https://dev.pachca.com/openapi.yaml) · CLI help: `pachca --help`

## Generator Development

When modifying the SDK generator (`packages/generator/src/lang/*.ts`):

1. Run tests: `cd packages/generator && npm test`
2. **Regenerate test snapshots**: Ask the user to run `bun bin/regen-snapshots.ts` in `packages/generator`
3. Regenerate SDKs: Run `npm run generate` in each `sdk/*` directory

## Agent Restrictions

**NEVER run these commands directly** — ask the user to run them:
- `bun bin/regen-snapshots.ts` — regenerates test snapshots
- Any command that bulk-modifies test fixtures or snapshots
