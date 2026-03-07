---
name: pachca-users
description: >
  Employee and tag (group) management. Create, update, delete, search employees.
  Onboarding and offboarding. Tag management and employee status. Use when: find
  employee, create user, onboard/offboard, manage tags, set employee status.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-users

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

### Get employee by ID

1. Get employee info:
   ```bash
   pachca users get <ID>
   ```

> Returns all fields including `custom_properties`, `user_status`, `list_tags`.


### Bulk create employees with tags

1. Create tag (if needed):
   ```bash
   pachca group-tags create --name="Backend"
   ```

2. For each employee: create account with tags:
   ```bash
   pachca users create --first-name="Иван" --last-name="Петров" --email="ivan@example.com" --list-tags='[{"name":"Backend"}]'
   ```
   > Tags are assigned via `list_tags` field in request body

3. Or update existing:
   ```bash
   pachca users update <ID> --list-tags='[{"name":"Backend"}]'
   ```

> Creation available only to admins and owners (not bots). No separate "add user to tag" endpoint.


### Find employee by name or email

1. Search by name/email (partial match):
   ```bash
   pachca users list --query=Иван
   ```

> Cursor-based pagination: `limit` and `cursor` from `meta`. For exact email — iterate pages.


### Onboard new employee

1. Create account:
   ```bash
   pachca users create --email="new@example.com" --first-name="Иван" --last-name="Петров"
   ```

2. Add to required channels:
   ```bash
   pachca members add <chat_id> --member-ids='[<user_id>]'
   ```

3. Send welcome message:
   ```bash
   pachca messages create --entity-type=user --entity-id=<user_id> --content="Добро пожаловать!"
   ```

> Step 1 requires admin/owner token. Steps 2-3 can be done by bot.


### Offboard employee

1. Suspend access:
   ```bash
   pachca users update <ID> --suspended
   ```

2. Optionally: delete account permanently:
   ```bash
   pachca users delete <ID> --force
   ```

> Suspension (`suspended`) preserves data, deletion is irreversible.


### Get all employees of a tag/department

1. Find tag by name, take `id`:
   ```bash
   pachca group-tags list
   ```

2. Get all tag members:
   ```bash
   pachca group-tags list-users <tag_id> --all
   ```


### Manage employee status

1. Get current status:
   ```bash
   pachca users get-status <user_id>
   ```

2. Set status:
   ```bash
   pachca users update-status <user_id> --emoji="🏖️" --title="В отпуске" --is-away
   ```
   > `is_away: true` — away mode. `away_message` — max 1024 chars

3. Delete status:
   ```bash
   pachca users remove-status <user_id> --force
   ```


## Constraints and gotchas

- Rate limit: ~50 req/sec. On 429 — wait and retry.
- `user.role`: allowed values — `admin` (Администратор), `user` (Сотрудник), `multi_guest` (Мульти-гость), `guest` (Гость)
- `status.away_message`: max 1024 characters
- `limit`: max 50
- Pagination: cursor-based (limit + cursor)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /group_tags | Новый тег |
| GET | /group_tags | Список тегов сотрудников |
| GET | /group_tags/{id} | Информация о теге |
| PUT | /group_tags/{id} | Редактирование тега |
| DELETE | /group_tags/{id} | Удаление тега |
| GET | /group_tags/{id}/users | Список сотрудников тега |
| POST | /users | Создать сотрудника |
| GET | /users | Список сотрудников |
| GET | /users/{id} | Информация о сотруднике |
| PUT | /users/{id} | Редактирование сотрудника |
| DELETE | /users/{id} | Удаление сотрудника |
| GET | /users/{user_id}/status | Статус сотрудника |
| PUT | /users/{user_id}/status | Новый статус сотрудника |
| DELETE | /users/{user_id}/status | Удаление статуса сотрудника |

> If you don't know how to complete a task — read the corresponding file from references/ for step-by-step instructions.
