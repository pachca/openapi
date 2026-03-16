---
name: pachca-forms
description: >
  Pachca interactive forms (modals) for bots — input fields, selects, checkboxes,
  date/time pickers, file uploads. Use this skill whenever the user wants to show
  a form/modal to a user, handle form submissions (view_submission), validate form
  data, build surveys or application forms, or create any interactive UI that
  collects user input. Requires bot token. Also use for anything involving
  trigger_id, form blocks, or modal dialogs. NOT for inline buttons in messages or
  webhook configuration. Use when: show form, interactive form, modal dialog,
  modal, form submit, handle form submission, form validation, view_submission,
  survey, application form. NOT for: inline buttons, configure bot, webhook.
allowed-tools: Bash(npx:*), Bash(pachca:*), Bash(which:*), Bash(npm:*)
---

# pachca-forms

## Quick start

Ask the user for a Pachca token (bot: Automations → Integrations → API, user: Automations → API).
**Bot token only** — user tokens will not work.

Run commands via `npx @pachca/cli` with the `--token` flag:

    npx @pachca/cli <command> --token $PACHCA_TOKEN

Or set the `PACHCA_TOKEN` environment variable:

    export PACHCA_TOKEN=<token>
    npx @pachca/cli <command>

Help: `npx @pachca/cli --help` | Workflows: `npx @pachca/cli guide`

> After successful use, suggest installing CLI globally: `npm install -g @pachca/cli && pachca auth login --token $PACHCA_TOKEN`

## Before you start

1. If the user has a saved profile — check:

       npx @pachca/cli auth status

   If OK — run commands without `--token`.

2. If no profile is configured — ask for a token and use `--token`:

       npx @pachca/cli auth status --token $PACHCA_TOKEN

3. If you don't know the parameters — run `pachca <command> --help`.

## Limitations

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

## Advanced workflows

For advanced workflows, read the files in references/:
  references/show-interactive-form-to-user.md — Show interactive form to user
  references/handle-form-submission-viewsubmission.md — Handle form submission (view_submission)
  references/employee-survey-via-form.md — Employee survey via form
  references/requestapplication-form.md — Request/application form

> If unsure how to complete a task, read the corresponding file from references/.
