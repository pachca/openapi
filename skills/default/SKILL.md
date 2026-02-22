---
name: pachca-api
description: >
  REST API мессенджера Пачка. Управляет сообщениями, чатами, пользователями,
  ботами, задачами и безопасностью. Служит точкой входа для выбора нужного
  скилла.
---

# Пачка API

Base URL: `https://api.pachca.com/api/shared/v1`
Авторизация: `Authorization: Bearer <ACCESS_TOKEN>`
Токен: бот (Автоматизации → Интеграции → API) или пользователь (Автоматизации → API).

## Доступные скиллы

| Скилл | Когда использовать |
|-------|--------------------|
| [pachca-profile](../pachca-profile/SKILL.md) | получить профиль, обновить статус, мой профиль |
| [pachca-users](../pachca-users/SKILL.md) | найти сотрудника, создать пользователя, список сотрудников |
| [pachca-chats](../pachca-chats/SKILL.md) | создать канал, создать беседу, создать чат |
| [pachca-messages](../pachca-messages/SKILL.md) | отправить сообщение, ответить в тред, прикрепить файл |
| [pachca-bots](../pachca-bots/SKILL.md) | настроить бота, вебхук, webhook |
| [pachca-forms](../pachca-forms/SKILL.md) | показать форму, интерактивная форма, модальное окно |
| [pachca-tasks](../pachca-tasks/SKILL.md) | создать задачу, список задач, напоминание |
| [pachca-security](../pachca-security/SKILL.md) | аудит, журнал событий, безопасность |

## Быстрый старт

1. Получи токен: Автоматизации → Интеграции → API (бот) или Автоматизации → API (пользователь)
2. Определи задачу → выбери скилл из таблицы выше
3. Открой SKILL.md нужного скилла → следуй пошаговому сценарию

## Общие правила

- Пагинация: cursor-based (`limit` + `cursor`), НЕ page-based
- Rate limit: ~50 req/sec, сообщения ~4 req/sec
- Формат: JSON (`Content-Type: application/json`)
- Ошибки: 422 (параметры), 429 (rate limit), 403 (нет доступа), 404 (не найдено)
