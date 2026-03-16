---
name: pachca
description: >
  Pachca — corporate messenger with REST API and CLI. Router: determines the right
  skill for any Pachca-related task. Use this skill whenever the user mentions
  Pachca, wants to interact with Pachca API, or needs help with any Pachca
  operation. This skill routes to the appropriate sub-skill. Do NOT make API calls
  directly — route to the correct skill.
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
| Pachca user profile, status management, custom fields, and token verification | `pachca-profile` |
| Pachca employee and tag (group) management | `pachca-users` |
| Pachca chat, channel, and conversation management | `pachca-chats` |
| Pachca messaging — send, edit, delete, and manage messages | `pachca-messages` |
| Pachca bot management, webhooks, and link unfurling | `pachca-bots` |
| Pachca interactive forms (modals) for bots — input fields, selects, checkboxes, date/time pickers, file uploads | `pachca-forms` |
| Pachca task and reminder management — create, list, update, complete, and delete tasks | `pachca-tasks` |
| Pachca full-text search across employees, chats, and messages | `pachca-search` |
| Pachca security audit log — track login events, user actions, message changes, and DLP violations | `pachca-security` |

## CLI commands

Full list: `pachca commands`
Advanced workflows: references/ in each skill
Help: `pachca <command> --help`
