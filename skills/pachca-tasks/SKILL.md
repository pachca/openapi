---
name: pachca-tasks
description: >
  Создание, получение, обновление и удаление задач (напоминаний). Используй когда
  нужно: создать задачу, получить список задач, обновить задачу, удалить задачу.
allowed-tools: Bash(curl *)
---

# pachca-tasks

Base URL: `https://api.pachca.com/api/shared/v1`
Авторизация: `Authorization: Bearer <ACCESS_TOKEN>`
Токен: бот (Автоматизации → Интеграции → API) или пользователь (Автоматизации → API).
Если токен неизвестен — спроси у пользователя перед выполнением запросов.

## Пошаговые сценарии

### Создать напоминание

1. POST /tasks с `kind`, `content` и `due_at`
2. Чтобы привязать к чату — добавь `chat_id`
3. Чтобы заполнить дополнительные поля — добавь `custom_properties: [{"id": <field_id>, "value": "..."}]` (список полей: GET /custom_properties?entity_type=Task)

```bash
curl "https://api.pachca.com/api/shared/v1/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"task":{"kind":"reminder","content":"Позвонить клиенту","due_at":"$DUE_AT","chat_id":$CHAT_ID,"custom_properties":[{"id":78,"value":"Синий склад"}]}}'
```

> Для привязки к чату нужно быть его участником. Если чат не найден — 404. Тип значения `custom_properties[].value` всегда строка (даже для числовых и date-полей). Дополнительные поля настраиваются администратором пространства.

### Получить список предстоящих задач

1. GET /tasks с пагинацией (`limit`, `cursor`)
2. Отфильтруй на клиенте по полю `status`: `"undone"` — не выполнена, `"done"` — выполнена

```bash
curl "https://api.pachca.com/api/shared/v1/tasks?limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

> Фильтрация по `status` на стороне API не поддерживается — фильтруй самостоятельно после получения.

### Отметить задачу выполненной

1. PUT /tasks/{id} с `"status": "done"`

```bash
curl -X PUT "https://api.pachca.com/api/shared/v1/tasks/12345" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"task":{"status":"done"}}'
```

### Создать серию напоминаний

1. Подготовь список дат (ежедневно, еженедельно и т.д.)
2. Для каждой даты: POST /tasks с нужным `kind`, `content` и `due_at`

## Ограничения и gotchas

- Rate limit: ~50 req/sec, сообщения ~4 req/sec. При 429 — подожди и повтори.
- `task.kind`: допустимые значения — `call` (Позвонить контакту), `meeting` (Встреча), `reminder` (Простое напоминание), `event` (Событие), `email` (Написать письмо)
- `task.status`: допустимые значения — `done` (Выполнено), `undone` (Активно)
- `limit`: максимум 50
- Пагинация: cursor-based (limit + cursor), НЕ page-based

## Эндпоинты

| Метод | Путь | Скоуп |
|-------|------|-------|
| POST | /tasks | tasks:create |
| GET | /tasks | tasks:read |
| GET | /tasks/{id} | tasks:read |
| PUT | /tasks/{id} | tasks:update |
| DELETE | /tasks/{id} | tasks:delete |

## Подробнее

см. [references/endpoints.md](references/endpoints.md)
