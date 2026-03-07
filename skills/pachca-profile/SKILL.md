---
name: pachca-profile
description: >
  User profile, status management, custom fields, token verification. Use when:
  get own profile, set/reset status, check custom fields, verify token scopes.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-profile

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

### Get own profile

1. Get current user info:
   ```bash
   pachca profile get
   ```

> Returns `id`, `first_name`, `last_name`, `nickname`, `email`, `phone_number`, `department`, `title`, `role`, `suspended`, `invite_status`, `list_tags`, `custom_properties`, `user_status`, `bot`, `sso`, `created_at`, `last_activity_at`, `time_zone`, `image_url`.


### Verify own token

1. Get token info: scopes, creation date, lifetime:
   ```bash
   pachca profile get-info
   ```

> Useful for diagnostics: which scopes the token has, when it expires.


### Set status

1. Set status:
   ```bash
   pachca profile update-status --emoji="🏖️" --title="В отпуске" --is-away --away-message="Я в отпуске до 10 марта" --expires-at="2025-03-10T23:59:59.000Z"
   ```
   > `is_away: true` — away mode. `expires_at` — auto-reset (ISO-8601, UTC+0). `away_message` — max 1024 chars


### Reset status

1. Delete status:
   ```bash
   pachca profile delete-status --force
   ```


### Get custom profile fields

1. Get list of additional fields for employees:
   ```bash
   pachca common custom-properties --entity-type=User
   ```
   > Add `entity_type=User` to filter

2. Get profile — `custom_properties` contains field values:
   ```bash
   pachca profile get
   ```

> Custom fields are configured by workspace admin.


## Constraints and gotchas

- Rate limit: ~50 req/sec. On 429 — wait and retry.
- `status.away_message`: max 1024 characters
- Pagination: cursor-based (limit + cursor)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /custom_properties | Список дополнительных полей |
| GET | /oauth/token/info | Информация о токене |
| GET | /profile | Информация о профиле |
| GET | /profile/status | Текущий статус |
| PUT | /profile/status | Новый статус |
| DELETE | /profile/status | Удаление статуса |

> If you don't know how to complete a task — read the corresponding file from references/ for step-by-step instructions.
