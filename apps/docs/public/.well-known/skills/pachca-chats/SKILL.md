---
name: pachca-chats
description: >
  Управление каналами и беседами, участниками чатов. Создание, обновление,
  архивация чатов. Добавление/удаление участников, роли, экспорт сообщений.
  Используй когда нужно: создать канал, добавить участника, архивировать чат,
  найти активные/неактивные чаты, экспорт сообщений. НЕ используй для: отправки
  сообщений (→ pachca-messages).
allowed-tools: Bash(curl *)
---

# pachca-chats

Base URL: `https://api.pachca.com/api/shared/v1`
Авторизация: `Authorization: Bearer <ACCESS_TOKEN>`
Токен: бот (Автоматизации → Интеграции → API) или пользователь (Автоматизации → API).
Если токен неизвестен — спроси у пользователя перед выполнением запросов.

## Когда НЕ использовать

- отправить сообщение, ответить в тред, прикрепить файл → **pachca-messages**
- найти сотрудника, создать пользователя, список сотрудников → **pachca-users**

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

1. POST /chats/exports с `start_at`, `end_at` (формат YYYY-MM-DD) и обязательным `webhook_url` — запрос выполняется асинхронно
2. Дождись вебхука на `webhook_url`: придёт JSON с `"type": "export"`, `"event": "ready"` и полем `export_id` — по `"type": "export"` можно отличить от других вебхуков
3. GET /chats/exports/{id} — сервер вернёт 302, большинство HTTP-клиентов скачают файл автоматически

```bash
curl "https://api.pachca.com/api/shared/v1/chats/exports" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"start_at":"$START_DATE","end_at":"$END_DATE","webhook_url":"$WEBHOOK_URL"}'
```

> `webhook_url` обязателен — без него невозможно получить `export_id`. POST не возвращает id в ответе. Экспорт доступен только Владельцу пространства на тарифе «Корпорация». Максимальный период: 45 дней (366 дней при указании конкретных чатов).

### Найти активные чаты за период

1. GET /chats с `last_message_at_after={дата}` — только чаты с активностью после указанной даты
2. Для диапазона добавь `last_message_at_before={дата}` — чаты с активностью между двумя датами
3. Перебери страницы: `cursor` из `meta.paginate.next_page`, пока он не пустой

```bash
curl "https://api.pachca.com/api/shared/v1/chats?last_message_at_after=$DATE_FROM&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

> Дата в формате ISO-8601 UTC+0: `YYYY-MM-DDThh:mm:ss.sssZ`. Для «последних N дней» вычисли `now - N days` в UTC.

### Найти и заархивировать неактивные чаты

1. GET /chats с `last_message_at_before={порог}` — сразу только чаты без активности с нужной даты
2. Перебери страницы: `cursor` из `meta.paginate.next_page`, пока он не пустой
3. Для каждого чата: PUT /chats/{id}/archive

```bash
curl "https://api.pachca.com/api/shared/v1/chats?last_message_at_before=$DATE_BEFORE&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

> Проверяй `"channel": false` — архивация каналов может быть нежелательной. Уточняй у владельца перед массовой архивацией.

## Ограничения и gotchas

- Rate limit: ~50 req/sec, сообщения ~4 req/sec. При 429 — подожди и повтори.
- `role`: допустимые значения — `admin` (Админ), `editor` (Редактор (доступно только для каналов)), `member` (Участник или подписчик)
- `limit`: максимум 50
- Пагинация: cursor-based (limit + cursor), НЕ page-based

## Эндпоинты

| Метод | Путь | Скоуп |
|-------|------|-------|
| POST | /chats | chats:create |
| GET | /chats | chats:read |
| POST | /chats/exports | chat_exports:write · тариф: Корпорация |
| GET | /chats/exports/{id} | chat_exports:read · тариф: Корпорация |
| GET | /chats/{id} | chats:read |
| PUT | /chats/{id} | chats:update |
| PUT | /chats/{id}/archive | chats:archive |
| POST | /chats/{id}/group_tags | chat_members:write |
| DELETE | /chats/{id}/group_tags/{tag_id} | chat_members:write |
| DELETE | /chats/{id}/leave | chats:leave |
| GET | /chats/{id}/members | chat_members:read |
| POST | /chats/{id}/members | chat_members:write |
| DELETE | /chats/{id}/members/{user_id} | chat_members:write |
| PUT | /chats/{id}/members/{user_id} | chat_members:write |
| PUT | /chats/{id}/unarchive | chats:archive |

## Подробнее

см. [references/endpoints.md](references/endpoints.md)
