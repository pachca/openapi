---
name: pachca-bots
description: >
  Pachca — управление ботами, вебхуки и превью ссылок. Используй этот скилл, когда
  пользователь хочет настроить бота, создать бота, настроить вебхуки, обработать
  вебхук, проверить подпись вебхука (X-Signature), обработать callback нажатия
  кнопки, создать дайджест-бота или настроить превью ссылок. НЕ для отправки
  обычных сообщений, показа форм или модальных окон. Use when: настроить бота,
  создать бота, вебхук, обработать вебхук, подпись вебхука, callback, обработать
  callback, нажатие кнопки, дайджест, оповещение, превью ссылки. NOT for:
  отправить сообщение, показать форму, модальное окно.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-bots

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

### Настроить бота с исходящим вебхуком

1. Создай бота в интерфейсе Пачки: Автоматизации → Интеграции → Webhook

2. Получи `access_token` бота во вкладке «API» настроек бота

3. Укажи Webhook URL для получения событий

> Бот создаётся через UI, не через API. Единственный эндпоинт для ботов — PUT /bots/{id} (обновление webhook URL). API используется для отправки сообщений от имени бота.


### Обновить Webhook URL бота

1. Обнови webhook URL бота:
   ```bash
   pachca bots update <bot_id> --webhook='{"outgoing_url":"https://example.com/webhook"}'
   ```
   > `id` бота (его `user_id`) можно узнать во вкладке «API» настроек бота

> Обновлять настройки может только тот, кому разрешено редактирование бота.


### Периодический дайджест/отчёт

1. По расписанию (cron/scheduler): собери данные из своей системы

2. Сформируй текст сообщения с нужными метриками или сводкой

3. Отправь сообщение в канал:
   ```bash
   pachca messages create --entity-id=<chat_id> --content="Дайджест за сегодня: ..."
   ```

> Нет встроенного планировщика — используй cron, celery, sidekiq и т.п. на своей стороне.


## Limitations

- Rate limit: ~50 req/sec. On 429 — wait and retry.
- `limit`: max 50
- Pagination: cursor-based (limit + cursor)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| PUT | /bots/{id} | Редактирование бота |
| POST | /messages/{id}/link_previews | Unfurl (разворачивание ссылок) |
| GET | /webhooks/events | История событий |
| DELETE | /webhooks/events/{id} | Удаление события |

## Advanced workflows

For advanced workflows, read the files in references/:
  references/handle-incoming-webhook-event.md — Handle incoming webhook event
  references/link-unfurling.md — Link unfurling
  references/handle-button-click-callback.md — Handle button click (callback)
  references/monitoring-and-alerts.md — Monitoring and alerts
  references/process-events-via-history-polling.md — Process events via history (polling)

  references/webhook-events.md — Webhook event types

> If unsure how to complete a task, read the corresponding file from references/.
