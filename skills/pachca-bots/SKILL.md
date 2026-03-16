---
name: pachca-bots
description: >
  Pachca bot management, webhooks, and link unfurling. Use this skill whenever the
  user wants to set up a bot, configure incoming or outgoing webhooks, handle
  webhook events, verify webhook signatures, process button callbacks, build
  digest/alert bots, poll message history, or set up link previews (unfurling).
  Also use for any bot-related automation, event handling, or webhook integration.
  NOT for sending regular messages, showing interactive forms, or form
  submissions. Use when: configure bot, webhook, handle event, webhook signature,
  button click, callback, digest, alert, polling, unfurl, link preview. NOT for:
  send message, show form, interactive form.
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

### Set up bot with outgoing webhook

1. Create bot in Pachca UI: Automations → Integrations → Webhook

2. Get bot `access_token` from "API" tab in bot settings

3. Set Webhook URL for receiving events

> Bot is created via UI, not API. The only bot endpoint is PUT /bots/{id} (update webhook URL). API is used to send messages on behalf of bot.


### Update bot webhook URL

1. Update bot webhook URL:
   ```bash
   pachca bots update <bot_id> --webhook='{"outgoing_url":"https://example.com/webhook"}'
   ```
   > Bot `id` (its `user_id`) can be found in "API" tab of bot settings

> Only users with bot edit permissions can update settings.


### Periodic digest/report

1. On schedule (cron/scheduler): collect data from your system

2. Compose message text with metrics or summary

3. Send message to channel:
   ```bash
   pachca messages create --entity-id=<chat_id> --content="Дайджест за сегодня: ..."
   ```

> No built-in scheduler — use cron, celery, sidekiq, etc. on your side.


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
