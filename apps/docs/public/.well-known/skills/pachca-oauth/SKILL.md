---
name: pachca-oauth
description: >
  Pachca — информация о текущем OAuth-токене: его скоупы (права доступа), даты
  создания и последнего использования, тип владельца (пользователь или бот).
  Используй, когда пользователь хочет проверить токен, узнать какие у токена
  скоупы/права, чей это токен, когда токен создан или последний раз использовался.
  НЕ для управления своим профилем или статусом (используй pachca-profile), НЕ для
  выпуска или ротации токенов ботов (используй pachca-bots). Use when: информация
  о токене, проверить токен, скоупы токена, права токена, чей токен, token info.
  NOT for: мой профиль, мой статус, создать бота, ротация токена.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-oauth

## Quick start

Ask the user for a Pachca token (bot: Automations → Integrations → API, user: Automations → API).

Run commands via `npx -y @pachca/cli` with the `--token` flag:

    npx -y @pachca/cli <command> --token $PACHCA_TOKEN

Or set the `PACHCA_TOKEN` environment variable:

    export PACHCA_TOKEN=<token>
    npx -y @pachca/cli <command>

Help: `npx -y @pachca/cli --help` | Workflows: `npx -y @pachca/cli guide`

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
- Pagination: cursor-based (limit + cursor)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /oauth/token/info | Информация о токене |

> If unsure how to complete a task, read the corresponding file from references/.
