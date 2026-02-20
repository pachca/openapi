# Pachca API — Agent Skills

Этот репозиторий содержит скиллы для AI-агентов для работы с [API Пачки](https://dev.pachca.com).

Base URL: `https://api.pachca.com/api/shared/v1`
Авторизация: `Authorization: Bearer <ACCESS_TOKEN>`

## Доступные скиллы

| Скилл | Описание | Путь |
|-------|---------|------|
| pachca-profile | Получение и обновление профиля текущего пользователя, управление статусом, кастомные поля сотрудников | [.agents/skills/pachca-profile/SKILL.md](.agents/skills/pachca-profile/SKILL.md) |
| pachca-users | Управление сотрудниками и тегами (группами) | [.agents/skills/pachca-users/SKILL.md](.agents/skills/pachca-users/SKILL.md) |
| pachca-chats | Управление каналами и беседами, участниками чатов | [.agents/skills/pachca-chats/SKILL.md](.agents/skills/pachca-chats/SKILL.md) |
| pachca-messages | Отправка сообщений в каналы, беседы и личные чаты Пачки | [.agents/skills/pachca-messages/SKILL.md](.agents/skills/pachca-messages/SKILL.md) |
| pachca-bots | Управление ботами, входящие/исходящие вебхуки, разворачивание ссылок (unfurling) | [.agents/skills/pachca-bots/SKILL.md](.agents/skills/pachca-bots/SKILL.md) |
| pachca-forms | Интерактивные формы с полями ввода и кнопками для ботов | [.agents/skills/pachca-forms/SKILL.md](.agents/skills/pachca-forms/SKILL.md) |
| pachca-tasks | Создание, получение, обновление и удаление задач (напоминаний) | [.agents/skills/pachca-tasks/SKILL.md](.agents/skills/pachca-tasks/SKILL.md) |
| pachca-security | Журнал аудита событий и DLP-система | [.agents/skills/pachca-security/SKILL.md](.agents/skills/pachca-security/SKILL.md) |

## Установка

```bash
npx skills add dev.pachca.com
```

Подробнее: [документация API](https://dev.pachca.com), [OpenAPI спецификация](https://dev.pachca.com/openapi.yaml)
