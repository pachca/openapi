# Pachca API — Agent Skills

Этот репозиторий содержит скиллы для AI-агентов для работы с [API Пачки](https://dev.pachca.com).

Base URL: `https://api.pachca.com/api/shared/v1`
Авторизация: `Authorization: Bearer <ACCESS_TOKEN>`

## Доступные скиллы

| Скилл | Описание | Путь |
|-------|---------|------|
| pachca-profile | Получение и обновление профиля текущего пользователя, управление статусом, кастомные поля сотрудников | [skills/pachca-profile/SKILL.md](skills/pachca-profile/SKILL.md) |
| pachca-users | Управление сотрудниками и тегами (группами) | [skills/pachca-users/SKILL.md](skills/pachca-users/SKILL.md) |
| pachca-chats | Управление каналами и беседами, участниками чатов | [skills/pachca-chats/SKILL.md](skills/pachca-chats/SKILL.md) |
| pachca-messages | Отправка сообщений в каналы, беседы и личные чаты Пачки | [skills/pachca-messages/SKILL.md](skills/pachca-messages/SKILL.md) |
| pachca-bots | Управление ботами, входящие/исходящие вебхуки, разворачивание ссылок (unfurling) | [skills/pachca-bots/SKILL.md](skills/pachca-bots/SKILL.md) |
| pachca-forms | Интерактивные формы с полями ввода и кнопками для ботов | [skills/pachca-forms/SKILL.md](skills/pachca-forms/SKILL.md) |
| pachca-tasks | Создание, получение, обновление и удаление задач (напоминаний) | [skills/pachca-tasks/SKILL.md](skills/pachca-tasks/SKILL.md) |
| pachca-search | Полнотекстовый поиск по сотрудникам, чатам и сообщениям | [skills/pachca-search/SKILL.md](skills/pachca-search/SKILL.md) |
| pachca-security | Журнал аудита событий и DLP-система | [skills/pachca-security/SKILL.md](skills/pachca-security/SKILL.md) |

## Установка

```bash
npx skills add pachca/openapi
```

Подробнее: [документация API](https://dev.pachca.com), [OpenAPI спецификация](https://dev.pachca.com/openapi.yaml)
