# CLI in scripts, CI and agents

Sources of truth: <https://dev.pachca.com/guides/cli/authentication.md>, <https://dev.pachca.com/guides/cli/scripting.md>, <https://dev.pachca.com/guides/cli/output.md>, <https://dev.pachca.com/guides/cli/api-requests.md>. Every command has `--help`; this file is about using them safely in automation.

## Where the token comes from

Priority, highest first:

1. `--token <value>`: one call, nothing saved.
2. `--profile <name>`: a profile named on the command line wins over `PACHCA_TOKEN`.
3. `PACHCA_TOKEN`: the headless path for CI and agents.
4. `PACHCA_PROFILE`.
5. The active profile, set with `pachca auth switch`.

Choose by situation:

- **Employee at a terminal**: `pachca auth login` once (browser, one-hour token refreshed by itself). `--no-browser` prints the address and code on a machine without a display. Parallel CLI processes share one refresh.
- **CI, scripts, bots**: a ready token (personal from **Интеграции > API**, or a bot token from the bot card). Put it in the CI secret store and pass it as `PACHCA_TOKEN`. Never commit it.
- **Saving a ready token on a workstation**: pipe it so it stays out of shell history and the process list: `pbpaste | pachca auth login --token -` (or from a secret manager to stdin). Passing the value as an argument leaves a trace in both.
- **Personal and bot side by side**: separate profiles, for example `--profile bot-notify`; each profile has its own login.

Storage: the token goes to the OS key store. Where there is none (headless machine, container), the CLI writes it in plain text to the config file and says so at login; `PACHCA_SECRET_STORE=file` or `--insecure-storage` forces that. Anyone with access to that account then has API access. For CI prefer `PACHCA_TOKEN` over a saved profile. `PACHCA_HOME` isolates the config directory (CI, tests, agents).

A token kept in the OS key store is tied to that machine: copying the profile elsewhere does not carry the secret.

Ending access:

- `pachca auth logout` after a browser login always removes the profile, but ends the login on the server only while the saved one-hour token is still live and the server answers. Logout sends the saved token without refreshing it, and other commands refresh it only when it is about to expire: after an hour without the CLI it has surely expired, and use within the last hour does not prove it is still live. If that token has already expired, the server still answers `200` but revokes nothing: the login stays valid and its row stays in **Токены CLI**, yet the CLI reports success (`token_revoked: true` in JSON), because it counts any `2xx` as revoked. Offline or on a server error, JSON shows `token_revoked: false`. Either way, do not tell the user that access is closed on the strength of logout alone: to be sure, revoke the login with **Отозвать** in the **Токены CLI** list on **Интеграции > API**.
- A ready token keeps working after logout: it never expires. Delete it in Pachca when it is no longer needed.

## Diagnosing auth

- `pachca auth status`: login method, time left and saved scopes of a saved profile (`--profile`, `PACHCA_PROFILE` or the active one). It does not read `PACHCA_TOKEN` or `--token`. To check such a token, run `pachca oauth token-info -o json`: it returns the token's scopes and its owner (`user_id`) and needs no scope itself. Without `-o json` a terminal shows a table without the scopes. Start here on `PACHCA_SCOPE_ERROR` or `PACHCA_AUTH_ERROR`. A `403` typed `PACHCA_API_ERROR` is about access to the object (closed chat, chat rule, role), not the token. The exception is `validation_code` `access_denied`: the token's owner is a guest or an employee whose access is suspended or deleted, and no token or login fixes that.
- `pachca auth status --remote`: asks the server and updates the saved profile's scope list, which does not refresh by itself.
- A scope the token lacks comes back as `403` with type `PACHCA_SCOPE_ERROR`, the missing scope in field `scope` and hint `pachca auth status`. After a browser login, log in again only if the role allows that scope now or the scope appeared after the login: a browser login gets only what the role allowed when it was approved, so otherwise a new login lacks the scope too and only an admin changing the role helps. With a ready token, issue one with that scope. A scope the token has but the role does not allow comes back as type `PACHCA_AUTH_ERROR` with `message` `role_forbidden` and no scope named: a new login or token does not help, only someone with that role or an admin can. Only in an interactive terminal (no `-o json`, no pipe) does the CLI also explain a missing scope in words, and with `PACHCA_TOKEN` or `--token` it cannot tell which cause it is.
- `pachca doctor`: environment diagnostics (Node.js, network, config file, the saved active profile and its token, CLI version). It reads only the active profile from `pachca auth switch` and ignores `PACHCA_TOKEN`, `--token`, `--profile` and `PACHCA_PROFILE`, so in CI it reports a missing config and profile even when the token works. To check the token the CLI will actually use, run `pachca oauth token-info -o json`.

## Non-interactive mode

It turns on when stdin or stdout is not a TTY, when `PACHCA_PROMPT_DISABLED` or `CI` is set, or with `--no-input`: no prompts, and a missing required flag is an error. `pachca auth login` without `--token` fails here. The progress spinner follows the same conditions except `--no-input`: in a terminal it still shows with `--no-input`, unless `--quiet` or `--dry-run` is passed.

```bash
PACHCA_TOKEN="$PACHCA_SECRET" pachca messages create --entity-id 123 --content "Deploy finished" --no-input
```

## Output

- Default: a table when stdout is a terminal, JSON when it is not (pipes, CI runners). `defaults.output` in the CLI config replaces this default, so scripts that parse output always pass `-o json` (or `--json`). Other formats: `-o yaml|csv|table`.
- `--columns id,email`, `--no-header`, `--no-truncate` for tables. `--plain`: TSV, no header, `id` first, no colour, for `cut` and `awk`.
- Data goes to stdout; errors, warnings and progress to stderr.
- `--all` loads every page and prints one array, and stops at a page cap: see [pagination.md](pagination.md). Without `--all` a typed list command prints one page of `data` and no `meta`, so it never shows the next cursor. To page by hand, use `pachca api GET <path> --query limit=50 --query cursor=<next_page>`, whose output keeps `meta.paginate`.
- Text can come from stdin: `echo "Done" | pachca messages create --entity-id 123`.

## Flags

- Flags are kebab-case (`--entity-id`, `--parent-message-id`); the CLI converts them to the API's snake_case. Check the body with `--dry-run`, which shows the request without sending it.
- Booleans: `--flag` sets `true`, `--no-flag` sets `false`.
- Typed commands that send `DELETE` (`delete`, `remove`, `unpin`, `leave`, `delete-token` and the like) ask for confirmation in a terminal. In non-interactive mode they refuse without `--force` (`PACHCA_DESTRUCTIVE_OP_ERROR`, exit code `2`). Add `--force` only for a deletion the user asked for, never just to get past that error.
- Also useful: `--verbose` (show HTTP), `--timeout` (seconds, default 30), `--no-retry`, `-q` (exit code and errors only).

## Exit codes and error JSON

| Code | Meaning                                                                                                                                               |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `0`  | Success                                                                                                                                               |
| `1`  | API or runtime error, including `400`, `429`, `5xx` and a `403` with an `errors` array: access to the object, or `access_denied` (`PACHCA_API_ERROR`) |
| `2`  | Bad flags or arguments, a `422` from the API (`PACHCA_VALIDATION_ERROR`), a delete without `--force` in non-interactive mode                          |
| `3`  | Authentication: no token, `401`, or a `403` about the token's scope or role (`PACHCA_AUTH_ERROR`, `PACHCA_SCOPE_ERROR`)                               |
| `4`  | Not found (`404`)                                                                                                                                     |

With `-o json` or in a pipe, errors the CLI itself handles go to stderr as one line of JSON with `error`, `code` (HTTP status or `null`), `type`, and, depending on the error, `message`, `request_id`, `hint`, `field` (API field) with `validation_code`, `flag` (CLI flag, for example `--entity-id`), `scope`, `errors`. Each item of `errors` has `message`. An API error item adds `field` when the error names one, the validation code as `code` (a string such as `blank`, unlike the numeric top-level `code`) and sometimes `value`, while an item from the CLI's own check has `flag` instead. Errors from the flag parser itself (an unknown flag, a missing positional argument, a parser-required flag such as `--save` on `files get`, a value of the wrong type) are plain text and exit with `2`, like the JSON validation errors. A few runtime failures, such as an OS key store that cannot be read, are plain text with exit code `1`. So the exit code does not tell text from JSON: read fields from stderr only after `echo "$ERR" | jq -e . >/dev/null 2>&1` succeeds, and otherwise treat it as text.

Types:

- `PACHCA_API_ERROR`: any API answer not covered below, such as a `400` input error, a `403` about access to the object, `404`, `409`, `429`, `5xx`.
- `PACHCA_VALIDATION_ERROR`: a `422` from the API, or the CLI's own check of a flag value (a missing required flag, a value over the length limit or outside the allowed list, invalid JSON in a flag).
- `PACHCA_AUTH_ERROR` (no token, `401`, `403` `role_forbidden`), `PACHCA_SCOPE_ERROR` (missing scope in `scope`), `PACHCA_AUTH_LOGIN_ERROR` (`pachca auth login` failed).
- `PACHCA_DESTRUCTIVE_OP_ERROR`: a delete without `--force` in non-interactive mode.
- `PACHCA_USAGE_ERROR` (wrong flag combination, unknown profile, an `update` command with no fields to change, a file that does not exist, invalid JSON in `--input` or `--data` of `pachca api`, `pachca auth login` without a token in non-interactive mode), `PACHCA_NETWORK_ERROR`, `PACHCA_TIMEOUT_ERROR`, `PACHCA_COMMAND_NOT_FOUND` (with `suggestions`), `PACHCA_NOT_FOUND_ERROR` (unknown endpoint in `pachca api --describe`).

Input errors come back as both `400` and `422`, so branch on `type` together with `code`, and keep `request_id` for support.

```bash
ERR=$(pachca users get 999 -o json 2>&1 >/dev/null)
if echo "$ERR" | jq -e . >/dev/null 2>&1; then
  case "$(echo "$ERR" | jq -r '"\(.type) \(.code)"')" in
    PACHCA_AUTH_ERROR*|PACHCA_SCOPE_ERROR*) echo "check token and scopes" ;;
    PACHCA_VALIDATION_ERROR*|PACHCA_USAGE_ERROR*|"PACHCA_API_ERROR 400") echo "fix the input" ;;
    PACHCA_DESTRUCTIVE_OP_ERROR*) echo "add --force only for a deletion the user asked for" ;;
    *) echo "$ERR" ;;
  esac
else
  echo "$ERR"   # plain text from the flag parser or a runtime failure
fi
```

## Raw requests with `pachca api`

Use typed commands first. `pachca api` is for a method without a convenient wrapper, or for debugging. `pachca api DELETE …` deletes at once: it never asks for confirmation and has no `--force` check, in a terminal or not. Run it only for a deletion the user asked for, never to get around a typed delete that was refused for a missing `--force`, and check it with `--dry-run` first.

- `pachca api GET /messages --query chat_id=123`
- `-F key=value` typed field (numbers and booleans converted, `@file` reads a file); `-f key=value` always a string. Nested keys: `-F 'message[entity_id]=123'` (quote it: zsh treats unquoted brackets as a glob).
- `--data '<json>'` inline body; `--input payload.json` or `--input -` from stdin.
- It prints the raw API response, `data` and `meta` included, so it is the way to read cursors from the CLI.
- Before a raw call, read the endpoint: `pachca api <METHOD> <path> --describe` (also `--spec`, `--docs`); list endpoints with `pachca api ls`.

## Files from the CLI

- `pachca upload <file>` gets the signature, uploads, and returns the `key` for `files[].key` (`-o json | jq -r '.key'`). The key ends in the uploaded file's name, and the `name` you send next to it must keep the same extension, or the send fails with `422` `wrong_params`. From stdin (`-`) the key ends in `stdin` with no extension, so the file can only be attached under a name without one. To keep the real name and type, save the data to a file with that extension first and upload the file.
- `pachca files get <id> --save <path>` downloads an attachment.
