---
name: pachca-profile
description: >
  Pachca user profile, status management, custom fields, and token verification.
  Use this skill whenever the user wants to get their profile, check who they are,
  set or update their status, manage custom fields, or verify API token scopes.
  Also use for any "who am I" or "my account" queries. NOT for managing other
  employees or listing users. Use when: get profile, my profile, set status,
  update status, clear status, custom fields, additional fields, verify token,
  token scopes. NOT for: manage employees, create user, list employees.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-profile

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


## Limitations

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

> If unsure how to complete a task, read the corresponding file from references/.
