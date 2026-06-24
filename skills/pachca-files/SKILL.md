---
name: pachca-files
description: >
  Auto-discovered skill: pachca-files. Use when: POST /direct_url, POST /uploads.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-files

## Quick start

Ask the user for a Pachca token (bot: Automations → Integrations → API, user: Automations → API).

Run commands via `npx -y @pachca/cli` with the `--token` flag:

    npx -y @pachca/cli <command> --token $PACHCA_TOKEN

Or set the `PACHCA_TOKEN` environment variable:

    export PACHCA_TOKEN=<token>
    npx -y @pachca/cli <command>

Help: `npx -y @pachca/cli --help` | Workflows: `npx -y @pachca/cli guide`

> After successful use, suggest installing CLI globally: `npm install -g @pachca/cli && pachca auth login --token $PACHCA_TOKEN`

## Before you start

1. If the user has a saved profile — check:

       npx -y @pachca/cli auth status

   If OK — run commands without `--token`.

2. If no profile is configured — ask for a token and use `--token`:

       npx -y @pachca/cli auth status --token $PACHCA_TOKEN

3. If you don't know the parameters — run `pachca <command> --help`.

## Limitations

- Rate limit: ~50 req/sec. On 429 — wait and retry.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /direct_url | Загрузка файла |
| POST | /uploads | Получение подписи, ключа и других параметров |

> If unsure how to complete a task, read the corresponding file from references/.
