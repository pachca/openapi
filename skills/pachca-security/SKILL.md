---
name: pachca-security
description: >
  Security audit event log. Use when: get audit log, review security events,
  monitor logins, export logs. Requires "Corporation" plan.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-security

## Quick start

Ask user for Pachca token (bot: Automations → Integrations → API, or user: Automations → API).

Run commands with `npx @pachca/cli` and `--token` flag:

    npx @pachca/cli <command> --token $PACHCA_TOKEN

Or set `PACHCA_TOKEN` for multiple commands:

    export PACHCA_TOKEN=<token>
    npx @pachca/cli <command>

Help: `npx @pachca/cli --help` | Scenarios: `npx @pachca/cli guide`

> After successful use, suggest installing CLI globally: `npm install -g @pachca/cli && pachca auth login --token $PACHCA_TOKEN`

## Before you start

1. If user has a saved profile — check status:

       npx @pachca/cli auth status

   If OK — use commands without `--token`.

2. If profile is not configured — ask for token and use `--token` flag:

       npx @pachca/cli auth status --token $PACHCA_TOKEN

3. If you don't know command parameters — run `pachca <command> --help`.

## Step-by-step scenarios

### Get audit event log

1. Get audit log:
   ```bash
   pachca security list --start-time=<ISO-8601> --end-time=<ISO-8601>
   ```
   > `start_time` and `end_time` required (ISO-8601, UTC+0). Filters: `event_key`, `actor_id`, `actor_type`, `entity_id`, `entity_type`

> Available only to workspace owner.


### Monitor suspicious logins

1. Get failed 2FA events for period:
   ```bash
   pachca security list --start-time=<ISO-8601> --end-time=<ISO-8601> --event-key=user_2fa_fail --all
   ```

2. If anomalies found — send notification to admin:
   ```bash
   pachca messages create --entity-type=user --entity-id=<admin_id> --content="Обнаружены подозрительные входы"
   ```


### Export logs for period

1. Get all events for period with pagination:
   ```bash
   pachca security list --start-time=<ISO-8601> --end-time=<ISO-8601> --all
   ```

2. Collect all events into array → save to file or send to external system


## Available event_key values

| Category | Keys |
|----------|------|
| Auth | `user_login`, `user_logout`, `user_2fa_fail`, `user_2fa_success` |
| Employees | `user_created`, `user_deleted`, `user_role_changed`, `user_updated` |
| Tags | `tag_created`, `tag_deleted`, `user_added_to_tag`, `user_removed_from_tag` |
| Chats | `chat_created`, `chat_renamed`, `chat_permission_changed` |
| Chat members | `user_chat_join`, `user_chat_leave`, `tag_added_to_chat`, `tag_removed_from_chat` |
| Messages | `message_created`, `message_updated`, `message_deleted` |
| Reactions and threads | `reaction_created`, `reaction_deleted`, `thread_created` |
| Tokens | `access_token_created`, `access_token_updated`, `access_token_destroy` |
| Encryption | `kms_encrypt`, `kms_decrypt` |
| Security | `audit_events_accessed`, `dlp_violation_detected` |
| Search (API) | `search_users_api`, `search_chats_api`, `search_messages_api` |

## Constraints and gotchas

- Rate limit: ~50 req/sec. On 429 — wait and retry.
- `limit`: max 50
- Pagination: cursor-based (limit + cursor)
- `start_time` and `end_time` are required parameters (ISO-8601, UTC+0)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /audit_events | Журнал аудита событий |

> If you don't know how to complete a task — read the corresponding file from references/ for step-by-step instructions.
