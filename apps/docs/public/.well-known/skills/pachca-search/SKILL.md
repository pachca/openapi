---
name: pachca-search
description: >
  Pachca — полнотекстовый поиск по сотрудникам, чатам и сообщениям. Используй этот
  скилл, когда пользователь хочет найти что-то — найти сотрудника по имени, найти
  сообщение по тексту, найти чат по названию или узнать где обсуждали тему. Также
  когда пользователь спрашивает «найди сотрудника», «где обсуждали X», «найди
  сообщения про Y» или любой запрос с поиском/нахождением контента. НЕ для вывода
  всех сотрудников, всех чатов или отправки сообщений. Use when: поиск, найти
  сообщение, найти чат, найти сотрудника, искать, где обсуждали, кто писал,
  полнотекстовый поиск. NOT for: список сотрудников, список чатов, отправить
  сообщение.
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

### Найти сообщение по тексту

1. Полнотекстовый поиск по сообщениям:
   ```bash
   pachca search list-messages --query="текст"
   ```
   > `limit` (до 200), `cursor`. Фильтры: `chat_ids[]`, `user_ids[]`, `active`, `created_from`/`created_to`

> Поиск по всем доступным чатам. `root_chat_id` в ответе — корневой чат для тредов.


### Найти чат по названию

1. Полнотекстовый поиск по чатам:
   ```bash
   pachca search list-chats --query="название"
   ```
   > `limit` (до 100), `cursor`. Фильтры: `active`, `chat_subtype`, `personal`, `created_from`/`created_to`


### Найти сотрудника по имени

1. Полнотекстовый поиск по сотрудникам:
   ```bash
   pachca search list-users --query="имя"
   ```
   > `sort=alphabetical` для алфавитного порядка, `sort=by_score` (по умолчанию). Фильтры: `company_roles[]`, `created_from`/`created_to`

> Поиск по имени, email, должности и другим полям. Поддерживает сортировку по релевантности.


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
