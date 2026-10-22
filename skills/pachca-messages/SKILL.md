---
name: pachca-messages
description: >
  Pachca — сообщения: отправка, редактирование, удаление. Используй этот скилл,
  когда пользователь хочет отправить сообщение, написать в чат или в личку,
  ответить в тред, прикрепить файл, поставить реакцию, закрепить сообщение,
  получить историю сообщений, изменить или удалить сообщение, узнать кто прочитал
  или отправить сообщение с кнопками. Сюда же черновики и отложенные сообщения:
  написать заранее, отправить позже, повторять по расписанию, отменить отложенное.
  Также для упоминаний (@), уведомлений и подписки на тред. НЕ для создания
  каналов, управления участниками или настройки ботов. Use when: отправить
  сообщение, написать в чат, написать в личку, ответить в тред, тред, прикрепить
  файл, загрузить файл, поставить реакцию, история сообщений, закрепить сообщение,
  изменить сообщение, удалить сообщение, упомянуть, кнопки в сообщении, кто
  прочитал, ответь в тред, черновик, отложенное сообщение, отправить позже,
  напомнить в чат по расписанию, отменить отложенное. NOT for: создать канал,
  управление участниками, настроить бота, вебхук, форма, → pachca-chats, →
  pachca-bots, → pachca-forms, найти сообщение по тексту, полнотекстовый поиск →
  pachca-search.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-messages

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

- Rate limit: ~50 req/sec, messages ~4 req/sec per chat. On 429 — wait and retry.
- `draft.entity_type`: allowed values — `discussion` (Беседа или канал), `thread` (Тред), `user` (Пользователь)
- `draft.schedule.repetition.interval`: allowed values — `once` (Один раз), `daily` (Каждый день), `weekly` (Каждую неделю), `monthly` (Каждый месяц), `every_2_months` (Раз в два месяца), `every_3_months` (Раз в три месяца), `every_4_months` (Раз в четыре месяца), `every_6_months` (Раз в полгода), `yearly` (Раз в год)
- `message.entity_type`: allowed values — `discussion` (Беседа или канал), `thread` (Тред), `user` (Пользователь)
- `message.display_avatar_url`: max 255 characters
- `message.display_name`: max 255 characters
- `limit`: max — 50 (GET /drafts), 50 (GET /messages), 50 (GET /messages/{id}/reactions), 300 (GET /messages/{id}/read_member_ids), 50 (GET /threads)
- Pagination: cursor-based (limit + cursor)

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /direct_url | Загрузка файла |
| POST | /drafts | Новый черновик |
| GET | /drafts | Список черновиков |
| GET | /drafts/{id} | Информация о черновике |
| PUT | /drafts/{id} | Редактирование черновика |
| DELETE | /drafts/{id} | Удаление черновика |
| GET | /files/{id} | Скачивание файла |
| POST | /messages | Новое сообщение |
| GET | /messages | Список сообщений чата |
| GET | /messages/{id} | Информация о сообщении |
| PUT | /messages/{id} | Редактирование сообщения |
| DELETE | /messages/{id} | Удаление сообщения |
| POST | /messages/{id}/link_previews | Unfurl (разворачивание ссылок) |
| POST | /messages/{id}/pin | Закрепление сообщения |
| DELETE | /messages/{id}/pin | Открепление сообщения |
| POST | /messages/{id}/reactions | Добавление реакции |
| DELETE | /messages/{id}/reactions | Удаление реакции |
| GET | /messages/{id}/reactions | Список реакций |
| GET | /messages/{id}/read_member_ids | Список прочитавших сообщение |
| POST | /messages/{id}/thread | Новый тред |
| POST | /threads | Новый самостоятельный тред |
| GET | /threads | Список тредов |
| GET | /threads/{id} | Информация о треде |
| POST | /uploads | Получение подписи, ключа и других параметров |

> If unsure how to complete a task, read the corresponding file from references/.
