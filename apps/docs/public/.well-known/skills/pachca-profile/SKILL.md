---
name: pachca-profile
description: >
  Pachca — МОЙ профиль, МОЙ статус, кастомные поля. Всегда только про себя — без
  параметров, данные определяются по токену. Используй, когда пользователь хочет
  получить свой профиль, узнать кто он, установить или убрать свой статус,
  посмотреть свой email/отдел, или узнать какие кастомные/дополнительные поля
  существуют (custom_properties). Также для запросов «кто я», «мой аккаунт», «мой
  email». НЕ для управления другими сотрудниками, НЕ для изменения статуса другого
  сотрудника, НЕ для информации о токене и его скоупах (используй pachca-oauth).
  Use when: мой профиль, покажи профиль, мой статус, установить статус, убрать
  статус, кто я, мой email, мои данные, дополнительные поля, кастомные поля. NOT
  for: сотрудники, список сотрудников, создать сотрудника, статус сотрудника, →
  pachca-users, → pachca-oauth.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-profile

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
- `status.title`: max 50 characters
- `status.away_message`: max 1024 characters
- Pagination: cursor-based (limit + cursor)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /custom_properties | Список дополнительных полей |
| GET | /profile | Свой профиль |
| PUT | /profile/avatar | Загрузка своего аватара |
| DELETE | /profile/avatar | Удаление своего аватара |
| GET | /profile/status | Свой статус |
| PUT | /profile/status | Новый свой статус |
| DELETE | /profile/status | Удаление своего статуса |

> If unsure how to complete a task, read the corresponding file from references/.
