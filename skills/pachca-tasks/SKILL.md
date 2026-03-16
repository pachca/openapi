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

### Создать напоминание

1. Создай задачу:
   ```bash
   pachca tasks create --kind=reminder --content="Позвонить клиенту" --due-at=<дата> --chat-id=<chat_id>
   ```
   > `chat_id` для привязки к чату, `custom_properties` для дополнительных полей

> Тип `custom_properties[].value` всегда строка. Дополнительные поля: GET /custom_properties?entity_type=Task.


### Получить список предстоящих задач

1. Получи все задачи, фильтруй по `status` на клиенте:
   ```bash
   pachca tasks list --all
   ```
   > `status`: `"undone"` — не выполнена, `"done"` — выполнена. Фильтрация на API не поддерживается


### Получить задачу по ID

1. Получи информацию о задаче:
   ```bash
   pachca tasks get <ID>
   ```


### Отметить задачу выполненной

1. Обнови статус задачи:
   ```bash
   pachca tasks update <ID> --status=done
   ```


### Обновить задачу (перенести срок, сменить ответственных)

1. Обнови нужные поля задачи:
   ```bash
   pachca tasks update <ID> --due-at=<дата> --priority=2 --performer-ids='[186,187]'
   ```
   > `performer_ids` заменяет весь список. `priority`: 1 (обычный), 2 (важно), 3 (очень важно)


### Удалить задачу

1. Удали задачу:
   ```bash
   pachca tasks delete <ID> --force
   ```

> Удаление необратимо. Чтобы просто закрыть — используй PUT с `"status": "done"`.


### Создать серию напоминаний

1. Подготовь список дат (ежедневно, еженедельно и т.д.)

2. Для каждой даты: создай задачу:
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
