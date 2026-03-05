---
name: pachca-security
description: >
  Журнал аудита событий безопасности. Используй когда нужно: получить журнал
  аудита, просмотреть события безопасности, мониторинг входов, экспорт логов. НЕ
  используй для: обычных API-запросов (→ другие скиллы). Требует тариф
  «Корпорация».
allowed-tools: Bash(curl *)
---

# pachca-security

Base URL: `https://api.pachca.com/api/shared/v1`
Авторизация: `Authorization: Bearer <ACCESS_TOKEN>`
Токен: бот (Автоматизации → Интеграции → API) или пользователь (Автоматизации → API).
Если токен неизвестен — спроси у пользователя перед выполнением запросов.

## Пошаговые сценарии

### Получить журнал аудита событий

**Требуется:** тариф **Корпорация** · скоуп `audit_events:read`

1. GET /audit_events с обязательными `start_time` и `end_time` (ISO-8601, UTC+0). Опциональные фильтры: `event_key`, `actor_id`, `actor_type`, `entity_id`, `entity_type`

```bash
curl "https://api.pachca.com/api/shared/v1/audit_events?start_time=2025-03-01T00:00:00Z&end_time=2025-03-02T00:00:00Z&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

> Доступно только владельцу пространства. `start_time` (включительно) и `end_time` (исключительно) — обязательные параметры.

### Мониторинг подозрительных входов

**Требуется:** тариф **Корпорация** · скоуп `audit_events:read` · скоуп `messages:create`

1. GET /audit_events с `event_key=user_2fa_fail` (или `user_login`) за нужный период — пагинируй с `cursor` до получения всех записей
2. Если найдены аномалии (много неудачных 2FA с одного аккаунта) — отправь уведомление администратору через POST /messages

```bash
curl "https://api.pachca.com/api/shared/v1/audit_events?start_time=2025-03-01T00:00:00Z&end_time=2025-03-02T00:00:00Z&event_key=user_2fa_fail&limit=50" \
  -H "Authorization: Bearer $TOKEN"
```

### Экспорт логов за период

**Требуется:** тариф **Корпорация** · скоуп `audit_events:read`

1. GET /audit_events с `start_time` и `end_time` (ISO-8601, UTC+0) — пагинируй с `cursor` до получения всех записей (`limit` до 50)
2. Собери все события в массив → сохрани в файл или отправь во внешнюю систему (SIEM, таблицы)

## Доступные event_key

| Категория | Ключи |
|-----------|-------|
| Авторизация | `user_login`, `user_logout`, `user_2fa_fail`, `user_2fa_success` |
| Сотрудники | `user_created`, `user_deleted`, `user_role_changed`, `user_updated` |
| Теги | `tag_created`, `tag_deleted`, `user_added_to_tag`, `user_removed_from_tag` |
| Чаты | `chat_created`, `chat_renamed`, `chat_permission_changed` |
| Участники чатов | `user_chat_join`, `user_chat_leave`, `tag_added_to_chat`, `tag_removed_from_chat` |
| Сообщения | `message_created`, `message_updated`, `message_deleted` |
| Реакции и треды | `reaction_created`, `reaction_deleted`, `thread_created` |
| Токены | `access_token_created`, `access_token_updated`, `access_token_destroy` |
| Шифрование | `kms_encrypt`, `kms_decrypt` |
| Безопасность | `audit_events_accessed`, `dlp_violation_detected` |
| Поиск (API) | `search_users_api`, `search_chats_api`, `search_messages_api` |

## Ограничения и gotchas

- Rate limit: ~50 req/sec. При 429 — подожди и повтори.
- `limit`: максимум 50
- Пагинация: cursor-based (limit + cursor)
- `start_time` и `end_time` — обязательные параметры (ISO-8601, UTC+0)

## Эндпоинты

| Метод | Путь | Скоуп |
|-------|------|-------|
| GET | /audit_events | audit_events:read · тариф: Корпорация |

## Подробнее

см. [references/endpoints.md](references/endpoints.md)
