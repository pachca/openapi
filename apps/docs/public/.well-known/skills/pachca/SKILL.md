---
name: pachca
description: >
  Pachca — корпоративный мессенджер с REST API и CLI. Роутер: определяет нужный
  скилл для любой задачи, связанной с Pachca. Используй этот скилл, когда
  пользователь упоминает Pachca, хочет взаимодействовать с API Pachca или
  нуждается в помощи с любой операцией Pachca. Этот скилл маршрутизирует к нужному
  под-скиллу. НЕ делай API-вызовы напрямую — направь к нужному скиллу.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca

Pachca — corporate messenger with REST API and CLI.

## Quick start

```bash
npx @pachca/cli <command> --token <TOKEN>
```

## For regular use

```bash
npm install -g @pachca/cli && pachca auth login
```

## Routing

Identify the user task and activate the appropriate skill.

| Task | Skill |
|------|-------|
| Pachca — МОЙ профиль, МОЙ статус, МОЙ токен, кастомные поля | `pachca-profile` |
| Pachca — управление сотрудниками (участниками пространства) и тегами (группами) | `pachca-users` |
| Pachca — управление чатами, каналами и беседами | `pachca-chats` |
| Pachca — сообщения: отправка, редактирование, удаление | `pachca-messages` |
| Pachca — управление ботами, вебхуки и превью ссылок | `pachca-bots` |
| Pachca — интерактивные формы и модальные окна для ботов | `pachca-forms` |
| Pachca — задачи и напоминания: создание, список, обновление, выполнение, удаление | `pachca-tasks` |
| Pachca — полнотекстовый поиск по сотрудникам, чатам и сообщениям | `pachca-search` |
| Pachca — журнал безопасности: отслеживание входов, действий пользователей, изменений сообщений и нарушений DLP | `pachca-security` |

## CLI commands

Full list: `pachca commands`
Advanced workflows: references/ in each skill
Help: `pachca <command> --help`
