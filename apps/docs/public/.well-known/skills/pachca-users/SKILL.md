---
name: pachca-users
description: >
  Pachca — управление сотрудниками (участниками пространства) и тегами (группами).
  Используй, когда пользователь хочет вывести список сотрудников, создать,
  обновить, заблокировать или удалить сотрудника, установить статус другому
  сотруднику по ID, управлять тегами/группами, назначить теги или провести
  онбординг/оффбординг. НЕ для своего профиля или своего статуса (используй
  pachca-profile), НЕ для поиска сотрудника по имени (используй pachca-search).
  Use when: сотрудник, сотрудники, список сотрудников, создать сотрудника,
  заблокировать сотрудника, уволить сотрудника, тег, теги, группа сотрудников,
  добавить в тег, онбординг, оффбординг. NOT for: мой профиль, мой статус, найди
  сотрудника, найти сотрудника, кастомные поля, дополнительные поля, получить
  профиль, мой профиль, установить свой статус → pachca-profile, → pachca-chats,
  найти сообщение по тексту, полнотекстовый поиск → pachca-search.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-users

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
- `group_tag.name`: max 255 characters
- `user.first_name`: max 255 characters
- `user.last_name`: max 255 characters
- `user.email`: max 255 characters
- `user.phone_number`: max 255 characters
- `user.nickname`: max 255 characters
- `user.department`: max 255 characters
- `user.role`: allowed values — `admin` (Администратор), `user` (Сотрудник), `multi_guest` (Мульти-гость), `guest` (Гость)
- `status.title`: max 50 characters
- `status.away_message`: max 1024 characters
- `limit`: max 50
- Pagination: cursor-based (limit + cursor)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /group_tags | Новый тег |
| GET | /group_tags | Список тегов |
| GET | /group_tags/{id} | Информация о теге |
| PUT | /group_tags/{id} | Редактирование тега |
| DELETE | /group_tags/{id} | Удаление тега |
| GET | /group_tags/{id}/users | Список сотрудников тега |
| POST | /users | Новый сотрудник |
| GET | /users | Список сотрудников |
| GET | /users/{id} | Информация о сотруднике |
| PUT | /users/{id} | Редактирование сотрудника |
| DELETE | /users/{id} | Удаление сотрудника |
| PUT | /users/{user_id}/avatar | Загрузка аватара сотрудника |
| DELETE | /users/{user_id}/avatar | Удаление аватара сотрудника |
| GET | /users/{user_id}/status | Статус сотрудника |
| PUT | /users/{user_id}/status | Новый статус сотрудника |
| DELETE | /users/{user_id}/status | Удаление статуса сотрудника |

> If unsure how to complete a task, read the corresponding file from references/.
