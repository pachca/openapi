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
  сотрудника, найти сотрудника, кастомные поля, дополнительные поля.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-users

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

### Получить сотрудника по ID

1. Получи информацию о сотруднике:
   ```bash
   pachca users get <ID>
   ```

> Возвращает все поля, включая `custom_properties`, `user_status`, `list_tags`.


### Массовое создание сотрудников с тегами

1. Создай тег (если нужен):
   ```bash
   pachca group-tags create --name="Backend"
   ```

2. Для каждого сотрудника: создай аккаунт с тегами:
   ```bash
   pachca users create --first-name="Иван" --last-name="Петров" --email="ivan@example.com" --list-tags='[{"name":"Backend"}]'
   ```
   > Теги назначаются через поле `list_tags` в теле запроса

3. Или обнови существующего:
   ```bash
   pachca users update <ID> --list-tags='[{"name":"Backend"}]'
   ```

> Создание доступно только администраторам и владельцам (не ботам). Нет отдельного эндпоинта "добавить юзера в тег".


### Найти сотрудника по имени или email

1. Поиск по имени/email (частичное совпадение):
   ```bash
   pachca users list --query=Иван
   ```

> Пагинация cursor-based: `limit` и `cursor` из `meta`. Для точного email — перебери страницы.


### Онбординг нового сотрудника

1. Создай аккаунт:
   ```bash
   pachca users create --email="new@example.com" --first-name="Иван" --last-name="Петров"
   ```

2. Добавь в нужные каналы:
   ```bash
   pachca members add <chat_id> --member-ids='[<user_id>]'
   ```

3. Отправь welcome-сообщение:
   ```bash
   pachca messages create --entity-type=user --entity-id=<user_id> --content="Добро пожаловать!"
   ```

> Шаг 1 требует токена администратора/владельца. Шаги 2-3 можно делать ботом.


### Offboarding сотрудника

1. Заблокировать доступ:
   ```bash
   pachca users update <ID> --suspended
   ```

2. Опционально: удалить аккаунт полностью:
   ```bash
   pachca users delete <ID> --force
   ```

> Приостановка (`suspended`) сохраняет данные, удаление — необратимо.


### Получить всех сотрудников тега/департамента

1. Найди тег по названию, возьми `id`:
   ```bash
   pachca group-tags list --names='["Backend"]'
   ```
   > Фильтр `names` — серверная фильтрация по названию тега

2. Получи всех участников тега:
   ```bash
   pachca group-tags list-users <tag_id> --all
   ```


### Управление статусом сотрудника

1. Получить текущий статус:
   ```bash
   pachca users get-status <user_id>
   ```

2. Установить статус:
   ```bash
   pachca users update-status <user_id> --emoji="🏖️" --title="В отпуске" --is-away
   ```
   > `is_away: true` — режим «Нет на месте». `away_message` — макс 1024 символа

3. Удалить статус:
   ```bash
   pachca users remove-status <user_id> --force
   ```


## Limitations

- Rate limit: ~50 req/sec. On 429 — wait and retry.
- `user.role`: allowed values — `admin` (Администратор), `user` (Сотрудник), `multi_guest` (Мульти-гость)
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

> If unsure how to complete a task, read the corresponding file from references/.
