---
name: pachca-tasks
description: >
  Pachca — задачи и напоминания: создание, список, обновление, выполнение,
  удаление. Используй этот скилл, когда пользователь хочет создать задачу или
  напоминание, вывести список задач, отметить задачу как выполненную, обновить
  задачу, управлять дополнительными полями задач или установить дедлайн. Также для
  еженедельных напоминаний и серии напоминаний. НЕ для отправки сообщений или
  управления чатами. Use when: создать задачу, список задач, напоминание,
  поставить напоминание, создать напоминание, обновить задачу, выполнить задачу,
  удалить задачу, дедлайн, кастомные поля задач, еженедельное напоминание, серия
  напоминаний. NOT for: отправить сообщение, управление чатом.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-tasks

## Quick start

Ask the user for a Pachca token (bot: the API tab of the bot in Integrations → Bots, user: Integrations → API).

Run commands via `npx -y @pachca/cli` with the `--token` flag:

    npx -y @pachca/cli <command> --token $PACHCA_TOKEN

Or set the `PACHCA_TOKEN` environment variable:

    export PACHCA_TOKEN=<token>
    npx -y @pachca/cli <command>

Help: `npx -y @pachca/cli --help`

> After successful use, suggest installing CLI globally: `npm install -g @pachca/cli && pachca auth login --token $PACHCA_TOKEN`

## Before you start

1. If the user has a saved profile — check:

       npx -y @pachca/cli auth status

   If OK — run commands without `--token`.

2. If no profile is configured — ask for a token and use `--token`:

       npx -y @pachca/cli auth status --token $PACHCA_TOKEN

3. If you don't know the parameters — run `pachca <command> --help`.

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
