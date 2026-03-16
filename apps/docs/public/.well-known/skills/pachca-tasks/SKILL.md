---
name: pachca-tasks
description: >
  Pachca task and reminder management — create, list, update, complete, and delete
  tasks. Use this skill whenever the user wants to create a task or reminder, list
  existing tasks, mark a task as done, update task details, manage custom fields
  on tasks, or set due dates. Also use for any to-do, reminder, or task tracking
  needs. NOT for sending messages or managing chats. Use when: create task, list
  tasks, reminder, update task, mark task as done, delete task, task custom
  fields. NOT for: send message, manage chat.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-tasks

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

### Create reminder

1. Create task:
   ```bash
   pachca tasks create --kind=reminder --content="Позвонить клиенту" --due-at=<дата> --chat-id=<chat_id>
   ```
   > `chat_id` to link to chat, `custom_properties` for additional fields

> `custom_properties[].value` type is always string. Additional fields: GET /custom_properties?entity_type=Task.


### Get list of upcoming tasks

1. Get all tasks, filter by `status` on client side:
   ```bash
   pachca tasks list --all
   ```
   > `status`: `"undone"` — not completed, `"done"` — completed. API-side filtering not supported


### Get task by ID

1. Get task info:
   ```bash
   pachca tasks get <ID>
   ```


### Mark task as completed

1. Update task status:
   ```bash
   pachca tasks update <ID> --status=done
   ```


### Update task (reschedule, change assignees)

1. Update task fields:
   ```bash
   pachca tasks update <ID> --due-at=<дата> --priority=2 --performer-ids='[186,187]'
   ```
   > `performer_ids` replaces entire list. `priority`: 1 (normal), 2 (important), 3 (very important)


### Delete task

1. Delete task:
   ```bash
   pachca tasks delete <ID> --force
   ```

> Deletion is irreversible. To just close — use PUT with `"status": "done"`.


### Create series of reminders

1. Prepare list of dates (daily, weekly, etc.)

2. For each date: create task:
   ```bash
   pachca tasks create --kind=reminder --content="Напоминание" --due-at=<дата>
   ```


## Limitations

- Rate limit: ~50 req/sec. On 429 — wait and retry.
- `task.kind`: allowed values — `call` (Позвонить контакту), `meeting` (Встреча), `reminder` (Простое напоминание), `event` (Событие), `email` (Написать письмо)
- `task.status`: allowed values — `done` (Выполнено), `undone` (Активно)
- `limit`: max 50
- Pagination: cursor-based (limit + cursor)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /tasks | Новое напоминание |
| GET | /tasks | Список напоминаний |
| GET | /tasks/{id} | Информация о напоминании |
| PUT | /tasks/{id} | Редактирование напоминания |
| DELETE | /tasks/{id} | Удаление напоминания |

> If unsure how to complete a task, read the corresponding file from references/.
