---
name: pachca-tasks
description: >
  Создание, получение, обновление и удаление задач (напоминаний). Используй когда
  нужно: создать задачу, получить список задач, обновить задачу, удалить задачу.
---

# pachca-tasks

Base URL: `https://api.pachca.com/api/shared/v1`
Авторизация: `Authorization: Bearer <ACCESS_TOKEN>`
Токен: бот (Автоматизации → Интеграции → API) или пользователь (Автоматизации → API).

## Когда использовать

- создать задачу
- список задач
- напоминание
- обновить задачу

## Когда НЕ использовать

- получить профиль, обновить статус, мой профиль → **pachca-profile**
- найти сотрудника, создать пользователя, список сотрудников → **pachca-users**
- создать канал, создать беседу, создать чат → **pachca-chats**
- отправить сообщение, ответить в тред, прикрепить файл → **pachca-messages**
- настроить бота, вебхук, webhook → **pachca-bots**
- показать форму, интерактивная форма, модальное окно → **pachca-forms**
- аудит, журнал событий, безопасность → **pachca-security**

## Пошаговые сценарии

### Создать напоминание для себя

1. POST /tasks с `kind`, `content` и `due_at`

```bash
curl "https://api.pachca.com/api/shared/v1/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"task":{"kind":"reminder","content":"Позвонить клиенту","due_at":"2026-03-01T10:00:00Z"}}'
```

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

## Обработка ошибок

| Код | Причина | Что делать |
|-----|---------|------------|
| 422 | Неверные параметры | Проверь обязательные поля, типы данных, допустимые значения enum |
| 429 | Rate limit | Подожди и повтори. Лимит: ~50 req/sec, сообщения ~4 req/sec |
| 403 | Нет доступа | Бот не в чате, или endpoint только для админов/владельцев |
| 404 | Не найдено | Неверный id. Проверь что сущность существует |
| 401 | Не авторизован | Проверь токен в заголовке Authorization |

## Доступные операции

### Новое напоминание

`POST /tasks`

```json
{
  "task": {
    "kind": "call"
  }
}
```

### Список напоминаний

`GET /tasks`

### Информация о напоминании

`GET /tasks/{id}`

### Редактирование напоминания

`PUT /tasks/{id}`

```json
{
  "task": {}
}
```

### Удаление напоминания

`DELETE /tasks/{id}`

## Ограничения и gotchas

- `task.kind`: допустимые значения — `call` (Позвонить контакту), `meeting` (Встреча), `reminder` (Простое напоминание), `event` (Событие), `email` (Написать письмо)
- `limit`: максимум 50
- `task.status`: допустимые значения — `done` (Выполнено), `undone` (Не выполнено)
- Пагинация: cursor-based (limit + cursor), НЕ page-based

## Подробнее

см. [references/endpoints.md](references/endpoints.md)
