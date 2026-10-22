---
name: pachca
description: >
  Pachca — корпоративный мессенджер с REST API, CLI и MCP-сервером. Роутер:
  определяет нужный скилл для любой задачи, связанной с Pachca. Используй этот
  скилл, когда пользователь упоминает Pachca, хочет взаимодействовать с API Pachca
  или нуждается в помощи с любой операцией Pachca. Этот скилл маршрутизирует к
  нужному под-скиллу. НЕ делай API-вызовы напрямую — направь к нужному скиллу.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca

Pachca — corporate messenger with REST API, CLI and an MCP server.

## Quick start

```bash
npx -y @pachca/cli <command> --token <TOKEN>
```

## For regular use

```bash
npm install -g @pachca/cli && pachca auth login
```

## MCP server

An MCP client can connect to `https://mcp.pachca.com/mcp` instead: one tool per API method, same rights as the token. Clients that support OAuth Client ID Metadata Document (CIMD) sign in through the browser; others send a personal or bot token in `Authorization: Bearer <TOKEN>`. Guide: https://dev.pachca.com/guides/ai-agents/mcp-connect.md

## Routing

Identify the user task and activate the appropriate skill.

| Task | Skill |
|------|-------|
| Pachca — МОЙ профиль, МОЙ статус, кастомные поля | `pachca-profile` |
| Pachca — информация о текущем OAuth-токене: его скоупы (права доступа), даты создания и последнего использования, тип владельца (пользователь или бот) | `pachca-oauth` |
| Pachca — управление сотрудниками (участниками пространства) и тегами (группами) | `pachca-users` |
| Pachca — управление чатами, каналами и беседами | `pachca-chats` |
| Pachca — сообщения: отправка, редактирование, удаление | `pachca-messages` |
| Pachca — управление ботами и вебхуки | `pachca-bots` |
| Pachca — интерактивные формы и модальные окна для ботов | `pachca-forms` |
| Pachca — задачи и напоминания: создание, список, обновление, выполнение, удаление | `pachca-tasks` |
| Pachca — полнотекстовый поиск по сотрудникам, чатам и сообщениям | `pachca-search` |
| Pachca — журнал безопасности: отслеживание входов, действий пользователей, изменений сообщений и нарушений DLP | `pachca-security` |

## CLI commands

Full list: `pachca commands`
Help: `pachca <command> --help`
