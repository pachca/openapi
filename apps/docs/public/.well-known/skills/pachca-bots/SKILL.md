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

2. Сохрани `access_token` из ответа — он возвращается единственный раз. Повторно его не показывают, можно только перевыпустить командой `pachca bots recreate-token <ID>`

3. В ответе также придёт `id` бота (его `user_id`) — он нужен для дальнейших вызовов, например чтобы добавить бота в чат

> Создавать ботов можно только пользовательским токеном — токеном бота нельзя. `access_token` отдаётся один раз при создании, увидеть его снова нельзя, только перевыпустить. С флагом `--empty` бот создаётся без токена и входящего вебхука, как в интерфейсе, а токены ему выпускает `pachca bots create-token`.


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
   > `id` бота можно узнать методом `pachca bots list`

2. Или: бот сам обновляет свой webhook своим же токеном — без `id` и без участия администратора (нужен скоуп `bot_self:webhook:write`):
   ```bash
   pachca bots update-webhook --outgoing-url="https://example.com/webhook"
   ```

> Два пути: по `id` пользовательским токеном (право редактировать бота) или самим ботом своим токеном (`PUT /bot/webhook`). Пустой `outgoing_url` отключает вебхук.


### Ротация токена бота

1. Пользовательским токеном (создатель бота или администратор, если бот открыт администраторам) — перевыпусти основной токен по `id` бота: тот, что без имени, а если такого нет, самый старый. Прежнее значение инвалидируется сразу:
   ```bash
   pachca bots recreate-token <bot_id>
   ```

2. Или: бот перевыпускает свой основной токен сам (скоуп `bot_self:write`). Если запрос сделан основным токеном, он инвалидируется сразу — обязательно сохрани новый `access_token` из ответа, иначе бот потеряет доступ к API:
   ```bash
   pachca bots recreate-token-self
   ```

3. Отдельный токен бота перевыпускай по его `id` из `pachca bots list-tokens`: значение меняется, имя и права остаются:
   ```bash
   pachca bots reissue-token <bot_id> <token_id>
   ```

4. Сохрани новый `access_token` из ответа — он возвращается единственный раз. Обнови секрет в CI или хранилище секретов

> Новое значение возвращается один раз. Self-путь (`POST /bot/recreate_token`) перевыпускает основной токен бота — если бот ходит им, захвати новый токен из ответа в той же операции.


### Выпустить боту отдельный токен

1. Пользовательским токеном (создатель бота или администратор, если бот открыт администраторам) получи каталог прав, которые можно выдать этому боту:
   ```bash
   pachca bots list-scopes <bot_id>
   ```

2. Выпусти токен с именем и правами из каталога. Без `--scopes` токен выпускается без прав, право не из каталога отклоняется с `400`:
   ```bash
   pachca bots create-token <bot_id> --name="Сервер уведомлений" --scopes='["messages:create"]'
   ```

3. Сохрани `token` из ответа — полное значение возвращается единственный раз. Дальше в списке `pachca bots list-tokens` он приходит замаскированным

> Отдельный токен удобен на каждый сервис, который работает от имени бота: его отзывают командой `pachca bots delete-token`, не трогая остальные. Права меняет `pachca bots update-token` — они действуют сразу, перевыпускать токен не нужно.


### Включить боту авторизацию от имени сотрудника

1. Пользовательским токеном (создатель бота или администратор, если бот открыт администраторам) включи авторизацию: где хранится секрет, адреса возврата и права, которые бот попросит у сотрудника. Права бери из `pachca bots list-scopes`:
   ```bash
   pachca bots update <bot_id> --oauth-client='{"confidential":true,"redirect_uris":["https://example.com/oauth/callback"],"scopes":["messages:read","messages:create"]}'
   ```

2. Сохрани `client_secret` из ответа серверного клиента — он возвращается единственный раз. `client_id` приходит в `oauth_client` и не секретный

3. Чтобы бот появился в витрине, добавь описание и опубликуй страницу:
   ```bash
   pachca bots update <bot_id> --promo='{"description":"Собирает сводку по задачам","published":true}'
   ```

> Включена ли авторизация, показывает `oauth_client_enabled`: `oauth_client` может прийти и у бота с выключенной авторизацией. `--oauth-client=null` выключает её и отзывает выданные сотрудниками авторизации, новый секрет выпускает `pachca bots rotate-client-secret`.


### Найти и удалить бота

1. Пользовательским токеном (скоуп `bots:read`) получи список ботов, доступных тебе для редактирования: созданных тобой и тех, чьи настройки открывают тебе доступ. Фильтруй по имени параметром `query`, следующую страницу бери из `meta.paginate.next_page`:
   ```bash
   pachca bots list --query="задач"
   ```

2. Возьми `id` нужного бота из списка и удали его (скоуп `bots:write`). Доступно создателю бота и администратору, если бот открыт администраторам, — владельцы чатов удалять бота не могут. Все токены бота инвалидируются сразу, бот исключается из всех чатов, его вебхуки удаляются:
   ```bash
   pachca bots delete <bot_id>
   ```

> Удаление необратимо: токен бота инвалидируется сразу, бот исключается из чатов. Событие фиксируется в журнале аудита как `bot_deleted`.


### Периодический дайджест/отчёт

1. По расписанию (cron/scheduler): собери данные из своей системы

2. Сформируй текст сообщения с нужными метриками или сводкой

3. Отправь сообщение в канал:
   ```bash
   pachca messages create --entity-id=<chat_id> --content="Дайджест за сегодня: ..."
   ```

> Нет встроенного планировщика — используй cron, celery, sidekiq и т.п. на своей стороне.


### Инвентаризация всех ботов пространства

1. Получи всех ботов пространства, а не только доступных для редактирования:
   ```bash
   pachca bots list-company --all
   ```
   > Нужен скоуп `company_bots:read`, роль владельца пространства и тариф «Корпорация», иначе метод отвечает `403`. Фильтр по имени — флаг `--query`

2. Для каждого бота проверь, раскрыты ли настройки: у ботов, недоступных владельцу токена для редактирования, заполнены только `name` и `nickname`, остальные поля вебхука приходят `null`
   > Настройки такого бота можно получить только тем токеном, которому доступно его редактирование

> Каждый запрос к списку ботов пространства пишется в журнал аудита как `company_bots_accessed`.


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
