---
name: pachca-chats
description: >
  Управление каналами и беседами, участниками чатов. Создание, обновление,
  архивация чатов. Добавление/удаление участников, роли, экспорт сообщений.
  Используй когда нужно: создать канал, добавить участника, архивировать чат,
  экспорт сообщений. НЕ используй для: отправки сообщений (→ pachca-messages).
---

# pachca-chats

Base URL: `https://api.pachca.com/api/shared/v1`
Авторизация: `Authorization: Bearer <ACCESS_TOKEN>`
Токен: бот (Автоматизации → Интеграции → API) или пользователь (Автоматизации → API).

## Когда использовать

- создать канал
- создать беседу
- создать чат
- добавить участника
- удалить участника
- архивировать чат
- роли участников
- экспорт сообщений
- список чатов

## Когда НЕ использовать

- получить профиль, обновить статус, мой профиль → **pachca-profile**
- найти сотрудника, создать пользователя, список сотрудников → **pachca-users**
- отправить сообщение, ответить в тред, прикрепить файл → **pachca-messages**
- настроить бота, вебхук, webhook → **pachca-bots**
- показать форму, интерактивная форма, модальное окно → **pachca-forms**
- создать задачу, список задач, напоминание → **pachca-tasks**
- аудит, журнал событий, безопасность → **pachca-security**

## Пошаговые сценарии

### Создать канал и пригласить участников

1. POST /chats — `"channel": true` для канала, `false` (по умолчанию) для беседы
2. Участников можно передать сразу при создании: `member_ids` и/или `group_tag_ids` в теле запроса
3. Или добавить позже: POST /chats/{id}/members с `member_ids`, POST /chats/{id}/group_tags с `group_tag_ids`

```bash
curl "https://api.pachca.com/api/shared/v1/chats" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chat":{"name":"Новый канал","channel":true,"member_ids":[1,2,3]}}'
```

> `channel` — boolean, не строка. `member_ids` и `group_tag_ids` — опциональны при создании.

### Архивация и управление чатом

1. Архивировать: PUT /chats/{id}/archive
2. Разархивировать: PUT /chats/{id}/unarchive
3. Изменить роль участника: PUT /chats/{id}/members/{user_id} с `role` (`"admin"` | `"member"`; `"editor"` — только для каналов). Роль создателя чата изменить нельзя.
4. Удалить участника: DELETE /chats/{id}/members/{user_id}
5. Покинуть чат: DELETE /chats/{id}/leave

### Создать проектную беседу из шаблона

1. POST /chats с `name`, `"channel": false` и `group_tag_ids` (добавить всех участников тега сразу)
2. Или POST /chats → затем POST /chats/{id}/members с `member_ids` + POST /chats/{id}/group_tags с `group_tag_ids`
3. Отправь приветственное сообщение: POST /messages с `"entity_id": chat.id`

```bash
curl "https://api.pachca.com/api/shared/v1/chats" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chat":{"name":"Проект Alpha","channel":false,"group_tag_ids":[42],"member_ids":[186,187]}}'
```

> `group_tag_ids` при создании добавляет всех участников тега сразу — удобнее, чем добавлять поштучно.

### Экспорт истории чата

1. POST /chats/exports с `start_at` и `end_at` (формат YYYY-MM-DD)
2. Из ответа возьми `id` экспорта
3. Polling: GET /chats/exports/{id} до `"status": "completed"`
4. Скачай архив по ссылке из ответа

> Экспорт доступен только Владельцу пространства на тарифе «Корпорация». Polling каждые 5-10 секунд.

### Найти и заархивировать неактивные чаты

1. GET /chats с пагинацией, `sort[last_message_at]=asc` — сначала самые старые
2. Отфильтруй чаты, где `last_message_at` старше нужного порога
3. Для каждого: PUT /chats/{id}/archive

> Проверяй `"channel": false` — архивация каналов может быть нежелательной. Уточняй у владельца перед массовой архивацией.

## Обработка ошибок

| Код | Причина | Что делать |
|-----|---------|------------|
| 422 | Неверные параметры | Проверь обязательные поля, типы данных, допустимые значения enum |
| 429 | Rate limit | Подожди и повтори. Лимит: ~50 req/sec, сообщения ~4 req/sec |
| 403 | Нет доступа | Бот не в чате, или endpoint только для админов/владельцев |
| 404 | Не найдено | Неверный id. Проверь что сущность существует |
| 401 | Не авторизован | Проверь токен в заголовке Authorization |

## Доступные операции

### Новый чат

`POST /chats`

```json
{
  "chat": {
    "name": ""
  }
}
```

### Список чатов

`GET /chats`

### Экспорт сообщений

`POST /chats/exports`

```json
{
  "start_at": "2025-03-20",
  "end_at": "2025-03-20"
}
```

### Скачать архив экспорта

`GET /chats/exports/{id}`

### Информация о чате

`GET /chats/{id}`

### Обновление чата

`PUT /chats/{id}`

```json
{
  "chat": {}
}
```

### Архивация чата

`PUT /chats/{id}/archive`

### Добавление тегов

`POST /chats/{id}/group_tags`

```json
{
  "group_tag_ids": [
    86,
    18
  ]
}
```

### Исключение тега

`DELETE /chats/{id}/group_tags/{tag_id}`

### Выход из беседы или канала

`DELETE /chats/{id}/leave`

### Список участников чата

`GET /chats/{id}/members`

### Добавление пользователей

`POST /chats/{id}/members`

```json
{
  "member_ids": [
    186,
    187
  ]
}
```

### Исключение пользователя

`DELETE /chats/{id}/members/{user_id}`

### Редактирование роли

`PUT /chats/{id}/members/{user_id}`

```json
{
  "role": "admin"
}
```

### Разархивация чата

`PUT /chats/{id}/unarchive`

## Ограничения и gotchas

- `limit`: максимум 50
- `role`: допустимые значения — `admin` (Админ), `editor` (Редактор (доступно только для каналов)), `member` (Участник или подписчик)
- Пагинация: cursor-based (limit + cursor), НЕ page-based

## Подробнее

см. [references/endpoints.md](references/endpoints.md)
