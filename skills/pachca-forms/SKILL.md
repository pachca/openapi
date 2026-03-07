---
name: pachca-forms
description: >
  Interactive forms with input fields and buttons for bots. Use when: show form,
  handle form submit, validate fields, create modal, employee survey.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-forms

## Quick start

Ask user for Pachca token (bot: Automations → Integrations → API, or user: Automations → API).
**Bot only** — user token will not work.

Run commands with `npx @pachca/cli` and `--token` flag:

    npx @pachca/cli <command> --token $PACHCA_TOKEN

Or set `PACHCA_TOKEN` for multiple commands:

    export PACHCA_TOKEN=<token>
    npx @pachca/cli <command>

Help: `npx @pachca/cli --help` | Scenarios: `npx @pachca/cli guide`

> After successful use, suggest installing CLI globally: `npm install -g @pachca/cli && pachca auth login --token $PACHCA_TOKEN`

## Before you start

1. If user has a saved profile — check status:

       npx @pachca/cli auth status

   If OK — use commands without `--token`.

2. If profile is not configured — ask for token and use `--token` flag:

       npx @pachca/cli auth status --token $PACHCA_TOKEN

3. If you don't know command parameters — run `pachca <command> --help`.

## Constraints and gotchas

- Rate limit: ~50 req/sec. On 429 — wait and retry.
- 410: trigger_id expired or not found. trigger_id is valid for 3 seconds. Get a new one via button click (webhook)
- `type`: allowed values — `modal` (Модальное окно)
- `private_metadata`: max 3000 characters
- `callback_id`: max 255 characters
- `view.title`: max 24 characters
- `view.close_text`: max 24 characters
- `view.submit_text`: max 24 characters

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /views/open | Открытие представления |

## Complex scenarios

For complex scenarios read files from references/:
  references/show-interactive-form-to-user.md — Show interactive form to user
  references/handle-form-submission-viewsubmission.md — Handle form submission (view_submission)
  references/employee-survey-via-form.md — Employee survey via form
  references/requestapplication-form.md — Request/application form

> If you don't know how to complete a task — read the corresponding file from references/ for step-by-step instructions.
