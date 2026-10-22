---
name: pachca-bots
description: >
  Pachca — управление ботами и вебхуки. Используй этот скилл, когда пользователь
  хочет настроить бота, создать бота, настроить вебхуки, обработать вебхук,
  проверить подпись вебхука (X-Signature), обработать callback нажатия кнопки или
  создать дайджест-бота. НЕ для отправки обычных сообщений, показа форм или
  модальных окон. Разворачивание ссылок (unfurl) — в pachca-messages. Use when:
  настроить бота, создать бота, вебхук, обработать вебхук, подпись вебхука,
  callback, обработать callback, нажатие кнопки, дайджест, оповещение, все боты
  пространства. NOT for: отправить сообщение, показать форму, модальное окно, →
  pachca-messages, → pachca-forms.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-bots

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
- `webhook.name`: max 255 characters
- `webhook.nickname`: max 255 characters
- `webhook.trigger_on`: allowed values — `commands` (Только на команды (триггер-слова) из commands), `all_messages` (На все сообщения в чатах, где есть бот), `unfurl` (На развёртывание ссылок (link previews))
- `webhook.template_engine`: allowed values — `liquid` (Liquid — условия, циклы и фильтры), `mustache` (Mustache — простая подстановка без логики)
- `webhook.who_can_add`: allowed values — `creator` (Только создатель бота), `creator_admin` (Создатель и администраторы компании), `creator_admin_user` (Создатель, администраторы и участники компании), `anyone` (Публичный бот: добавить его может любой сотрудник, кроме гостей и мульти-гостей)
- `webhook.kind`: allowed values — `simple` (Свой формат: сообщение собирается из тела запроса по шаблону бота), `gitlab` (GitLab: Пачка сама разбирает запрос и собирает сообщение), `grafana` (Grafana: Пачка сама разбирает запрос и собирает сообщение)
- `name`: max 255 characters
- `limit`: max 50
- Pagination: cursor-based (limit + cursor)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /bot/recreate_token | Ротация собственного токена бота |
| PUT | /bot/webhook | Саморегистрация вебхука бота |
| GET | /bots | Список ботов |
| POST | /bots | Новый бот |
| GET | /bots/{id} | Информация о боте |
| PUT | /bots/{id} | Редактирование бота |
| DELETE | /bots/{id} | Удаление бота |
| PUT | /bots/{id}/avatar | Загрузка аватара бота |
| DELETE | /bots/{id}/avatar | Удаление аватара бота |
| POST | /bots/{id}/recreate_token | Ротация токена бота |
| POST | /bots/{id}/rotate_client_secret | Ротация секрета клиента |
| GET | /bots/{id}/scopes | Каталог прав бота |
| GET | /bots/{id}/tokens | Список токенов бота |
| POST | /bots/{id}/tokens | Новый токен бота |
| PUT | /bots/{id}/tokens/{token_id} | Изменение токена бота |
| DELETE | /bots/{id}/tokens/{token_id} | Удаление токена бота |
| POST | /bots/{id}/tokens/{token_id}/reissue | Перевыпуск токена бота |
| GET | /company/bots | Список ботов пространства |
| GET | /webhooks/events | История событий |
| DELETE | /webhooks/events/{id} | Удаление события истории |

  references/webhook-events.md — Webhook event types

> If unsure how to complete a task, read the corresponding file from references/.
