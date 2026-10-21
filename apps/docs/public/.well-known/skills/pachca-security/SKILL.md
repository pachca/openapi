---
name: pachca-security
description: >
  Pachca — журнал безопасности: отслеживание входов, действий пользователей,
  изменений сообщений и нарушений DLP. Требуется тариф «Корпорация». Используй
  этот скилл, когда пользователь хочет посмотреть события безопасности, журнал
  аудита, историю входов, подозрительную активность, узнать кто что делал,
  экспортировать логи безопасности или отслеживать нарушения DLP. НЕ для отправки
  сообщений или управления сотрудниками. Use when: журнал безопасности, аудит,
  события безопасности, кто заходил, история входов, подозрительная активность,
  DLP, экспорт логов, токены API. NOT for: отправить сообщение, управление
  сотрудниками.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-security

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

### Получить журнал аудита событий

1. Получи журнал аудита:
   ```bash
   pachca security list --start-time=<ISO-8601> --end-time=<ISO-8601>
   ```
   > `start_time` и `end_time` необязательны (ISO-8601, время без смещения считается UTC), без них приходят все события по страницам. Фильтры: `event_key`, `actor_id`, `actor_type`, `entity_id`, `entity_type`

> Доступно только владельцу пространства.


### Мониторинг подозрительных входов

1. Получи события неудачных 2FA за период:
   ```bash
   pachca security list --start-time=<ISO-8601> --end-time=<ISO-8601> --event-key=user_2fa_fail --all
   ```

2. Повтори запрос с `--event-key=user_2fa_disabled` — отключение второго фактора у сотрудника:
   ```bash
   pachca security list --start-time=<ISO-8601> --end-time=<ISO-8601> --event-key=user_2fa_disabled --all
   ```

3. Если найдены аномалии — отправь уведомление администратору:
   ```bash
   pachca messages create --entity-type=user --entity-id=<admin_id> --content="Обнаружены подозрительные входы"
   ```


### Экспорт логов за период

1. Получи все события за период с пагинацией:
   ```bash
   pachca security list --start-time=<ISO-8601> --end-time=<ISO-8601> --all
   ```

2. Собери все события в массив → сохрани в файл или отправь во внешнюю систему


## Available event_key values

| Category | Keys |
|----------|------|
| Auth | `user_login`, `user_logout`, `user_2fa_fail`, `user_2fa_success`, `user_2fa_disabled`, `login_grant_created`, `login_grant_approved`, `login_grant_denied` |
| Employees | `user_created`, `user_deleted`, `user_role_changed`, `user_updated` |
| Tags | `tag_created`, `tag_deleted`, `user_added_to_tag`, `user_removed_from_tag` |
| Chats | `chat_created`, `chat_renamed`, `chat_permission_changed` |
| Chat members | `user_chat_join`, `user_chat_leave`, `tag_added_to_chat`, `tag_removed_from_chat` |
| Messages | `message_updated`, `message_deleted`, `message_created` |
| Reactions and threads | `reaction_created`, `reaction_deleted`, `thread_created` |
| Tokens | `access_token_created`, `access_token_updated`, `access_token_destroy`, `bot_token_recreated`, `bot_token_created`, `bot_token_updated`, `bot_token_reissued`, `bot_token_deleted`, `oauth_token_revoked` |
| Bots | `bot_scopes_updated`, `bot_webhook_settings_updated`, `bot_deleted`, `bot_oauth_client_updated`, `bot_oauth_client_disabled`, `bot_oauth_client_secret_rotated`, `bot_oauth_client_secret_issued` |
| App authorization | `oauth_authorization_granted`, `oauth_authorization_revoked`, `oauth_device_authorization_approved`, `oauth_device_authorization_denied` |
| Encryption | `kms_encrypt`, `kms_decrypt` |
| Security | `audit_events_accessed`, `company_chats_accessed`, `company_bots_accessed`, `dlp_violation_detected` |
| Search (API) | `search_users_api`, `search_chats_api`, `search_messages_api` |
| Video calls | `video_call_started`, `video_call_finished`, `video_call_recording_ready` |
| Integrations | `exchange_disabled` |

## Limitations

- Rate limit: ~50 req/sec. On 429 — wait and retry.
- `limit`: max 50
- Pagination: cursor-based (limit + cursor)
- `start_time` and `end_time` are optional (ISO-8601, bounds inclusive, a time without an offset is UTC): without them the method returns all events page by page

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /audit_events | Журнал аудита событий |

> If unsure how to complete a task, read the corresponding file from references/.
