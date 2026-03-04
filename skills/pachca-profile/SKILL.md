---
name: pachca-profile
description: >
  Получение профиля текущего пользователя, управление своим статусом, кастомные
  поля сотрудников, проверка токена. Используй когда нужно: получить свой профиль,
  установить/сбросить статус, узнать дополнительные поля, проверить скоупы токена.
  НЕ используй для: управления другими сотрудниками (→ pachca-users).
allowed-tools: Bash(curl *)
---

# pachca-profile

Base URL: `https://api.pachca.com/api/shared/v1`
Авторизация: `Authorization: Bearer <ACCESS_TOKEN>`
Токен: бот (Автоматизации → Интеграции → API) или пользователь (Автоматизации → API).
Если токен неизвестен — спроси у пользователя перед выполнением запросов.

## Когда НЕ использовать

- найти сотрудника, создать пользователя, список сотрудников → **pachca-users**

## Пошаговые сценарии

### Получить свой профиль

1. GET /profile — возвращает полную информацию о текущем пользователе

```bash
curl "https://api.pachca.com/api/shared/v1/profile" \
  -H "Authorization: Bearer $TOKEN"
# Ответ: {"data":{"id":186,"first_name":"Иван","last_name":"Петров","email":"ivan@example.com","nickname":"ivanp","department":"Разработка","title":"Разработчик","role":"admin",...}}
```

> Возвращает `id`, `first_name`, `last_name`, `nickname`, `email`, `phone_number`, `department`, `title`, `role`, `suspended`, `invite_status`, `list_tags`, `custom_properties`, `user_status`, `bot`, `sso`, `created_at`, `last_activity_at`, `time_zone`, `image_url`.

### Проверить свой токен

1. GET /oauth/token/info — возвращает информацию о текущем токене: скоупы, дату создания, срок жизни

```bash
curl "https://api.pachca.com/api/shared/v1/oauth/token/info" \
  -H "Authorization: Bearer $TOKEN"
# Ответ: {"data":{"id":123,"token":"abcd1234...ef56","name":"Мой токен","user_id":186,"scopes":["messages:create","chats:read"],"expires_in":7776000,...}}
```

> Полезно для диагностики: какие скоупы доступны токену, когда он истекает. Токен маскируется — видны первые 8 и последние 4 символа.

### Установить статус

1. PUT /profile/status с `emoji` и `title`. Чтобы включить режим «Нет на месте» — добавь `is_away: true`. Чтобы задать сообщение о недоступности — добавь `away_message: "текст"` (макс 1024 символа). Чтобы статус автоматически сбросился — добавь `expires_at` (ISO-8601, UTC+0)

```bash
curl -X PUT "https://api.pachca.com/api/shared/v1/profile/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":{"emoji":"🏖️","title":"В отпуске до 10 марта","is_away":true,"away_message":"Я в отпуске. По срочным вопросам — @ivanov","expires_at":"2025-03-10T23:59:59.000Z"}}'
```

### Сбросить статус

1. DELETE /profile/status

```bash
curl -X DELETE "https://api.pachca.com/api/shared/v1/profile/status" \
  -H "Authorization: Bearer $TOKEN"
```

### Получить кастомные поля профиля

1. GET /custom_properties?entity_type=User — список дополнительных полей для сотрудников (`id`, `name`, `data_type`)
2. GET /profile — в ответе поле `custom_properties` содержит значения для текущего пользователя

> Параметр `entity_type=User` фильтрует поля по типу сущности. Кастомные поля настраиваются администратором пространства. Значения хранятся в массиве `custom_properties` объекта `user`.

## Ограничения и gotchas

- Rate limit: ~50 req/sec. При 429 — подожди и повтори.
- `status.away_message`: максимум 1024 символов
- Пагинация: cursor-based (limit + cursor)

## Эндпоинты

| Метод | Путь | Скоуп |
|-------|------|-------|
| GET | /custom_properties | custom_properties:read |
| GET | /oauth/token/info | — |
| GET | /profile | profile:read |
| GET | /profile/status | profile_status:read |
| PUT | /profile/status | profile_status:write |
| DELETE | /profile/status | profile_status:write |

## Подробнее

см. [references/endpoints.md](references/endpoints.md)
