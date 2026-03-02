---
name: pachca-security
description: >
  Журнал аудита событий и DLP-система. Используй когда нужно: получить журнал
  аудита, просмотреть события безопасности, настроить DLP. НЕ используй для:
  обычных API-запросов (→ другие скиллы). Требует тариф «Корпорация».
allowed-tools: Bash(curl *)
---

# pachca-security

Base URL: `https://api.pachca.com/api/shared/v1`
Авторизация: `Authorization: Bearer <ACCESS_TOKEN>`
Токен: бот (Автоматизации → Интеграции → API) или пользователь (Автоматизации → API).
Если токен неизвестен — спроси у пользователя перед выполнением запросов.

## Пошаговые сценарии

### Получить журнал аудита событий

1. GET /audit_events с фильтрами (`event_key`, период, пагинация)
2. Доступные типы событий: входы, изменения прав, действия с чатами и т.д.

```bash
curl "https://api.pachca.com/api/shared/v1/audit_events?created_at[from]=$DATE_FROM&created_at[to]=$DATE_TO&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

> Доступно только владельцу пространства.

### Мониторинг подозрительных входов

1. GET /audit_events с фильтром `"event_key": "user_2fa_fail"` (или `"user_signed_in"`) за нужный период
2. Пагинируй с `cursor` до получения всех записей
3. Если найдены аномалии (много неудачных 2FA с одного аккаунта) — отправь уведомление администратору через POST /messages

> Фильтрация по `event_key` — строковое совпадение. Доступные ключи — в документации Аудит событий.

### Экспорт логов за период

1. GET /audit_events с параметрами `created_at[from]` и `created_at[to]` (ISO 8601)
2. Пагинируй с `cursor` до получения всех записей (`limit` до 50)
3. Собери все события в массив → сохрани в файл или отправь во внешнюю систему (SIEM, таблицы)

## Ограничения и gotchas

- Rate limit: ~50 req/sec, сообщения ~4 req/sec. При 429 — подожди и повтори.
- `limit`: максимум 50
- Пагинация: cursor-based (limit + cursor), НЕ page-based

## Эндпоинты

| Метод | Путь | Скоуп |
|-------|------|-------|
| GET | /audit_events | audit_events:read · тариф: Корпорация |

## Подробнее

см. [references/endpoints.md](references/endpoints.md)
