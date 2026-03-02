---
name: pachca-users
description: >
  Управление сотрудниками и тегами (группами). Создание, обновление, удаление,
  поиск сотрудников. Онбординг и offboarding. Создание и управление тегами.
  Управление статусом сотрудника. Используй когда нужно: найти сотрудника, создать
  пользователя, онбординг/offboarding, управлять тегами, установить статус
  сотруднику. НЕ используй для: собственного профиля (→ pachca-profile).
allowed-tools: Bash(curl *)
---

# pachca-users

Base URL: `https://api.pachca.com/api/shared/v1`
Авторизация: `Authorization: Bearer <ACCESS_TOKEN>`
Токен: бот (Автоматизации → Интеграции → API) или пользователь (Автоматизации → API).
Если токен неизвестен — спроси у пользователя перед выполнением запросов.

## Когда НЕ использовать

- получить профиль, мой профиль, установить статус → **pachca-profile**
- создать канал, создать беседу, создать чат → **pachca-chats**

## Пошаговые сценарии

### Массовое создание сотрудников с тегами

1. Создай тег (если нужен): POST /group_tags с `{"group_tag": {"name": ...}}`
2. Для каждого сотрудника: POST /users — теги назначаются через поле `list_tags` в теле запроса
3. Или обнови существующего: PUT /users/{id} с `list_tags`

> Создание сотрудников доступно только администраторам и владельцам (не ботам). Нет отдельного эндпоинта "добавить юзера в тег" — теги назначаются через `list_tags` при создании (POST /users) или обновлении (PUT /users/{id}).

### Найти сотрудника по имени или email

1. GET /users?query=Иван — поиск по имени/email (частичное совпадение)
2. Если нужен точный поиск по email — перебери страницы и отфильтруй на клиенте

```bash
curl "https://api.pachca.com/api/shared/v1/users?query=Иван&limit=50" \
  -H "Authorization: Bearer $TOKEN"
# Ответ: {"data":[{"id":186,"first_name":"Иван","last_name":"Петров","email":"ivan@example.com",...}]}
```

> GET /users поддерживает параметр `query` для поиска. Пагинация cursor-based: используй `limit` и `cursor` из `meta`.

### Онбординг нового сотрудника

1. POST /users с `email`, именем, тегами (`list_tags`) — создать аккаунт
2. POST /chats/{id}/members с `member_ids` — добавить в нужные каналы (онбординг, общий, тематические)
3. POST /messages с `"entity_type": "user"`, `"entity_id": user.id` — отправить welcome-сообщение в личные сообщения

> Шаг 1 требует токена администратора/владельца. Шаги 2-3 можно делать ботом.

### Offboarding сотрудника

1. PUT /users/{id} с `"suspended": true` — заблокировать доступ
2. Опционально: DELETE /users/{id} — удалить аккаунт полностью

> Приостановка (`suspended`) сохраняет данные, удаление — необратимо. Уточняй политику перед удалением.

### Получить всех сотрудников тега/департамента

1. GET /group_tags?names[]=Backend — найти тег по названию
2. Из ответа взять `id` тега
3. GET /group_tags/{id}/users с пагинацией (`limit` + `cursor`) — получить всех участников

### Управление статусом сотрудника

1. GET /users/{user_id}/status — получить текущий статус сотрудника
2. PUT /users/{user_id}/status с `emoji`, `title` и опционально `is_away: true`, `away_message: "текст"` — установить статус
3. DELETE /users/{user_id}/status — удалить статус сотрудника

```bash
curl -X PUT "https://api.pachca.com/api/shared/v1/users/13/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":{"emoji":"🏖️","title":"В отпуске","is_away":true,"away_message":"Я в отпуске до 15 апреля"}}'
```

> Для установки режима «Нет на месте» передай `is_away: true`. `away_message` — сообщение, отображаемое в профиле и при личных сообщениях/упоминаниях (макс 1024 символа). Скоупы: `user_status:read` для чтения, `user_status:write` для записи/удаления.

## Ограничения и gotchas

- Rate limit: ~50 req/sec, сообщения ~4 req/sec. При 429 — подожди и повтори.
- `user.role`: допустимые значения — `admin` (Администратор), `user` (Сотрудник), `multi_guest` (Мульти-гость), `guest` (Гость)
- `status.away_message`: максимум 1024 символов
- `limit`: максимум 50
- Пагинация: cursor-based (limit + cursor), НЕ page-based

## Эндпоинты

| Метод | Путь | Скоуп |
|-------|------|-------|
| POST | /group_tags | group_tags:write |
| GET | /group_tags | group_tags:read |
| GET | /group_tags/{id} | group_tags:read |
| PUT | /group_tags/{id} | group_tags:write |
| DELETE | /group_tags/{id} | group_tags:write |
| GET | /group_tags/{id}/users | group_tags:read |
| POST | /users | users:create |
| GET | /users | users:read |
| GET | /users/{id} | users:read |
| PUT | /users/{id} | users:update |
| DELETE | /users/{id} | users:delete |
| GET | /users/{user_id}/status | user_status:read |
| PUT | /users/{user_id}/status | user_status:write |
| DELETE | /users/{user_id}/status | user_status:write |

## Подробнее

см. [references/endpoints.md](references/endpoints.md)
