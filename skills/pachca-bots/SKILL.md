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

## Workflows

### Создать бота через API и получить токен

1. Создай бота. Только пользовательским токеном (не токеном бота); `nickname` обязан заканчиваться на `_bot`. Параметры вебхука (Webhook URL, события, команды) можно задать сразу или позже. Скоупы токена бота можно ограничить флагом `--scopes` (если не указать — бот получит набор по умолчанию):
   ```bash
   pachca bots create --name="Бот задач" --nickname="tasks_bot" --scopes='["messages:create"]'
   ```

2. Сохрани `access_token` из ответа — он возвращается единственный раз. Повторно получить токен можно только через интерфейс (вкладка «API» настроек бота)

3. В ответе также придёт `id` бота (его `user_id`) — он нужен для дальнейших вызовов, например чтобы добавить бота в чат

> Создавать ботов можно только пользовательским токеном — токеном бота нельзя. `access_token` отдаётся один раз при создании, дальше его можно посмотреть и скопировать в интерфейсе.


### Настроить бота с исходящим вебхуком

1. Создай бота, сразу указав Webhook URL и события в одном вызове (детали создания и работы с токеном — в сценарии «Создать бота через API и получить токен»):
   ```bash
   pachca bots create --name="Бот задач" --nickname="tasks_bot" --outgoing-url="https://example.com/webhook" --events='["message_new"]' --trigger-on=commands --commands='["/task"]'
   ```

2. Сохрани `access_token` из ответа (возвращается единственный раз)

3. Используй сохранённый `access_token` для отправки сообщений от имени бота

> Альтернатива — создать и настроить бота в интерфейсе. Webhook URL и события можно задать и позже методом PUT /bots/{id}.


### Обновить Webhook URL бота

1. Пользовательским токеном (с правом редактировать бота) — обнови URL по `id` бота. Пустая строка отключает вебхук:
   ```bash
   pachca bots update <bot_id> --outgoing-url="https://example.com/webhook"
   ```
   > `id` бота (его `user_id`) можно узнать во вкладке «API» настроек бота

2. Или: бот сам обновляет свой webhook своим же токеном — без `id` и без участия администратора (нужен скоуп `bot_self:webhook:write`):
   ```bash
   pachca bots update-webhook --outgoing-url="https://example.com/webhook"
   ```

> Два пути: по `id` пользовательским токеном (право редактировать бота) или самим ботом своим токеном (`PUT /bot/webhook`). Пустой `outgoing_url` отключает вебхук.


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
- `webhook.trigger_on`: allowed values — `commands` (Только на команды (триггер-слова) из commands), `all_messages` (На все сообщения в чатах, где есть бот), `unfurl` (На развёртывание ссылок (link previews))
- `webhook.template_engine`: allowed values — `liquid` (Liquid — условия, циклы и фильтры), `mustache` (Mustache — простая подстановка без логики)
- `limit`: max 50
- Pagination: cursor-based (limit + cursor)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| PUT | /bot/webhook | Саморегистрация вебхука бота |
| POST | /bots | Новый бот |
| GET | /bots/{id} | Информация о боте |
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
