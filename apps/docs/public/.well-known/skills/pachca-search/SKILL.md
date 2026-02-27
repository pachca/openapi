---
name: pachca-search
description: >
  Полнотекстовый поиск по сотрудникам, чатам и сообщениям. Используй когда нужно:
  найти сообщение по тексту, найти чат по названию, найти сотрудника по имени. НЕ
  используй для: просмотра списка сотрудников (→ pachca-users), просмотра списка
  чатов (→ pachca-chats).
---

# pachca-search

Base URL: `https://api.pachca.com/api/shared/v1`
Авторизация: `Authorization: Bearer <ACCESS_TOKEN>`
Токен: бот (Автоматизации → Интеграции → API) или пользователь (Автоматизации → API).
Если токен неизвестен — спроси у пользователя перед выполнением запросов.

## Когда использовать

- поиск сообщений
- найти сообщение
- полнотекстовый поиск
- search
- найти по тексту

## Когда НЕ использовать

- получить профиль, мой профиль, установить статус → **pachca-profile**
- найти сотрудника, создать пользователя, список сотрудников → **pachca-users**
- создать канал, создать беседу, создать чат → **pachca-chats**
- отправить сообщение, ответить в тред, прикрепить файл → **pachca-messages**
- настроить бота, вебхук, webhook → **pachca-bots**
- показать форму, интерактивная форма, модальное окно → **pachca-forms**
- создать задачу, список задач, напоминание → **pachca-tasks**
- аудит, журнал событий, безопасность → **pachca-security**

## Пошаговые сценарии

### Найти сообщение по тексту

1. GET /search/messages?query=текст — полнотекстовый поиск
2. Пагинация: `limit` (до 200) и `cursor` (из `meta.paginate.next_page`)
3. Общее количество результатов — в `meta.total`

```bash
curl "https://api.pachca.com/api/shared/v1/search/messages?query=отчёт&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

> Поиск возвращает сообщения из всех доступных чатов. Фильтры: `chat_ids[]` (конкретные чаты), `user_ids[]` (авторы), `active` (true — активные чаты, false — архивированные), `created_from`/`created_to` (период). Поле `root_chat_id` в ответе показывает корневой чат для сообщений из тредов.

### Найти чат по названию

1. GET /search/chats?query=название — полнотекстовый поиск по чатам
2. Пагинация: `limit` (до 100) и `cursor`

```bash
curl "https://api.pachca.com/api/shared/v1/search/chats?query=Разработка&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

> Фильтры: `active` (true — активные, false — архивированные), `chat_subtype` (`discussion` или `thread`), `personal` (true — только личные), `created_from`/`created_to` (период). Результаты сортируются по релевантности.

### Найти сотрудника по имени

1. GET /search/users?query=имя — полнотекстовый поиск по сотрудникам
2. Пагинация: `limit` (до 200) и `cursor`
3. Сортировка: `sort=alphabetical` для алфавитного порядка, `sort=by_score` (по умолчанию) для релевантности

```bash
curl "https://api.pachca.com/api/shared/v1/search/users?query=Олег&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

> Фильтры: `company_roles[]` (`user`, `admin`, `multi_guest`, `guest`), `created_from`/`created_to` (период). Альтернатива GET /users?query= с более точным ранжированием.

## Обработка ошибок

| Код | Причина | Что делать |
|-----|---------|------------|
| 422 | Неверные параметры | Проверь обязательные поля, типы данных, допустимые значения enum |
| 429 | Rate limit | Подожди и повтори. Лимит: ~50 req/sec, сообщения ~4 req/sec |
| 403 | Нет доступа | Недостаточно скоупов (`insufficient_scope`), бот не в чате, или endpoint только для админов/владельцев |
| 404 | Не найдено | Неверный id. Проверь что сущность существует |
| 401 | Не авторизован | Проверь токен в заголовке Authorization |

## Доступные операции

### Поиск чатов

`GET /search/chats`

> скоуп: `search:chats`

### Поиск сообщений

`GET /search/messages`

> скоуп: `search:messages`

### Поиск сотрудников

`GET /search/users`

> скоуп: `search:users`

## Ограничения и gotchas

- `limit`: максимум — 100 (GET /search/chats), 200 (GET /search/messages), 200 (GET /search/users)
- Пагинация: cursor-based (limit + cursor), НЕ page-based

## Подробнее

см. [references/endpoints.md](references/endpoints.md)
