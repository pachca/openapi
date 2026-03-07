---
name: pachca-search
description: >
  Full-text search across employees, chats, and messages. Use when: find message
  by text, find chat by name, find employee by name.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-search

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


## Constraints and gotchas

- Rate limit: ~50 req/sec. On 429 — wait and retry.
- `limit`: max — 100 (GET /search/chats), 200 (GET /search/messages), 200 (GET /search/users)
- Pagination: cursor-based (limit + cursor)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /search/chats | Поиск чатов |
| GET | /search/messages | Поиск сообщений |
| GET | /search/users | Поиск сотрудников |

> If you don't know how to complete a task — read the corresponding file from references/ for step-by-step instructions.
