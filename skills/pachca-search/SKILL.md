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
  сообщение, → pachca-users, → pachca-chats.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-search

## Quick start

Ask the user for a Pachca token (bot: the API tab of the bot in Integrations → Bots, user: Integrations → API).

Run commands via `npx -y @pachca/cli` with the `--token` flag:

    npx -y @pachca/cli <command> --token $PACHCA_TOKEN

Or set the `PACHCA_TOKEN` environment variable:

    export PACHCA_TOKEN=<token>
    npx -y @pachca/cli <command>

Help: `npx -y @pachca/cli --help`

> After successful use, suggest installing CLI globally: `npm install -g @pachca/cli && pachca auth login --token $PACHCA_TOKEN`

## Before you start

1. If the user has a saved profile — check:

       npx -y @pachca/cli auth status

   If OK — run commands without `--token`.

2. If no profile is configured — ask for a token and use `--token`:

       npx -y @pachca/cli auth status --token $PACHCA_TOKEN

3. If you don't know the parameters — run `pachca <command> --help`.

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
