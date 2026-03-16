---
name: pachca-search
description: >
  Pachca full-text search across employees, chats, and messages. Use this skill
  whenever the user wants to search or find something — search messages by text,
  find a chat by name, look up employees, or locate discussions about a topic.
  Also use when the user asks "where was X discussed", "find messages about Y", or
  any query that involves searching/finding content. NOT for listing all
  employees, listing all chats, or sending messages. Use when: search messages,
  find message, full-text search, search, find by text. NOT for: list employees,
  list chats, send message.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-search

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

### Find message by text

1. Full-text search across messages:
   ```bash
   pachca search list-messages --query="текст"
   ```
   > `limit` (up to 200), `cursor`. Filters: `chat_ids[]`, `user_ids[]`, `active`, `created_from`/`created_to`

> Searches all accessible chats. `root_chat_id` in response — root chat for threads.


### Find chat by name

1. Full-text search across chats:
   ```bash
   pachca search list-chats --query="название"
   ```
   > `limit` (up to 100), `cursor`. Filters: `active`, `chat_subtype`, `personal`, `created_from`/`created_to`


### Find employee by name

1. Full-text search across employees:
   ```bash
   pachca search list-users --query="имя"
   ```
   > `sort=alphabetical` for alphabetical order, `sort=by_score` (default). Filters: `company_roles[]`, `created_from`/`created_to`

> Searches by name, email, title and other fields. Supports sorting by relevance.


## Limitations

- Rate limit: ~50 req/sec. On 429 — wait and retry.
- `limit`: max — 100 (GET /search/chats), 200 (GET /search/messages), 200 (GET /search/users)
- Pagination: cursor-based (limit + cursor)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /search/chats | Поиск чатов |
| GET | /search/messages | Поиск сообщений |
| GET | /search/users | Поиск сотрудников |

> If unsure how to complete a task, read the corresponding file from references/.
