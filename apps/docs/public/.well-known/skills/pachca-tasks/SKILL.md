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
  -d '{"task":{"kind":"reminder","content":"Позвонить клиенту","due_at":"2026-03-01T10:00:00Z","custom_properties":[{"id":78,"value":"Синий склад"}]}}'
```

> Задачи поддерживают дополнительные поля (`custom_properties`). Передай массив `[{"id": <field_id>, "value": "..."}]` при создании или обновлении. Список доступных полей: GET /custom_properties?entity_type=Task.

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

### Заполнить дополнительные поля задачи

1. GET /custom_properties?entity_type=Task — получи список доступных полей (`id`, `name`, `data_type`)
2. При создании: POST /tasks с `custom_properties: [{"id": <field_id>, "value": "..."}]`
3. При обновлении: PUT /tasks/{id} с `custom_properties: [{"id": <field_id>, "value": "..."}]`
4. В ответе задачи поле `custom_properties` содержит текущие значения всех полей

```bash
curl "https://api.pachca.com/api/shared/v1/custom_properties?entity_type=Task" \
  -H "Authorization: Bearer $TOKEN"
# Ответ: [{"id":78,"name":"Склад","data_type":"string"},{"id":91,"name":"Дата доставки","data_type":"date"}]

curl -X PUT "https://api.pachca.com/api/shared/v1/tasks/12345" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"task":{"custom_properties":[{"id":78,"value":"Синий склад"},{"id":91,"value":"2026-03-01"}]}}'
```

> Если передать `id` удалённого или несуществующего поля — получишь ошибку 422. Тип значения в `value` всегда строка (даже для числовых и date-полей). Дополнительные поля настраиваются администратором пространства.

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
