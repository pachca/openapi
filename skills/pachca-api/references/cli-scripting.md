# CLI in scripts, CI and agents

Sources of truth: <https://dev.pachca.com/guides/cli/authentication.md>, <https://dev.pachca.com/guides/cli/scripting.md>, <https://dev.pachca.com/guides/cli/output.md>, <https://dev.pachca.com/guides/cli/api-requests.md>. Every command has `--help`; this file is about using them safely in automation.

## Where the token comes from

Priority, highest first:

1. `--token <value>`: one call, nothing saved.
2. `PACHCA_TOKEN`: the headless path for CI and agents.
3. `--profile <name>` or `PACHCA_PROFILE`.
4. The active profile, set with `pachca auth switch`.

Choose by situation:

- **Employee at a terminal**: `pachca auth login` once (browser, one-hour token refreshed by itself). `--no-browser` prints the address and code on a machine without a display. Parallel CLI processes share one refresh.
- **CI, scripts, bots**: a ready token (personal from **Интеграции > API**, or a bot token from the bot card). Put it in the CI secret store and pass it as `PACHCA_TOKEN`. Never commit it.
- **Saving a ready token on a workstation**: pipe it so it stays out of shell history and the process list: `pbpaste | pachca auth login --token -` (or from a secret manager to stdin). Passing the value as an argument leaves a trace in both.
- **Personal and bot side by side**: separate profiles, for example `--profile bot-notify`; each profile has its own login.

Storage: the token goes to the OS key store. Where there is none (headless machine, container), the CLI writes it in plain text to the config file and says so at login; `PACHCA_SECRET_STORE=file` or `--insecure-storage` forces that. Anyone with access to that account then has API access. For CI prefer `PACHCA_TOKEN` over a saved profile. `PACHCA_HOME` isolates the config directory (CI, tests, agents).

A token kept in the OS key store is tied to that machine: copying the profile elsewhere does not carry the secret.

Ending access:

- `pachca auth logout` after a browser login revokes the token on the server at once.
- A ready token keeps working after logout: it never expires. Delete it in Pachca when it is no longer needed.

## Diagnosing auth

- `pachca auth status`: login method, time left, saved scopes. Start here when commands begin to answer `403`.
- `pachca auth status --remote`: asks the server and updates the saved scope list, which does not refresh by itself.
- A refused scope prints which scope is missing and whether the token lacks it (re-login or reissue) or the role no longer gives it (admin only). In JSON: type `PACHCA_SCOPE_ERROR` with field `scope`.
- `pachca doctor`: environment diagnostics (Node.js, network, token, config).

## Non-interactive mode

It turns on when stdin or stdout is not a TTY, when `PACHCA_PROMPT_DISABLED` or `CI` is set, or with `--no-input`: no prompts, no spinner, and a missing required flag is an error. `pachca auth login` without `--token` fails here.

```bash
PACHCA_TOKEN="$PACHCA_SECRET" pachca messages create --entity-id 123 --content "Deploy finished" --no-input
```

## Output

- Terminal default is a table; pipes and CI get JSON. Force with `-o json|yaml|csv|table`.
- `--columns id,email`, `--no-header`, `--no-truncate` for tables. `--plain`: TSV, no header, `id` first, no colour, for `cut` and `awk`.
- Data goes to stdout; errors, warnings and progress to stderr.
- `--all` loads every page and prints one array; `--limit` and `--cursor` page by hand.
- Text can come from stdin: `echo "Done" | pachca messages create --entity-id 123`.

## Flags

- Flags are kebab-case (`--entity-id`, `--parent-message-id`); the CLI converts them to the API's snake_case. Check the body with `--dry-run`, which shows the request without sending it.
- Booleans: `--flag` sets `true`, `--no-flag` sets `false`.
- Delete commands ask for confirmation in a terminal; `--force` skips it. Only for deletions the user asked for.
- Also useful: `--verbose` (show HTTP), `--timeout` (seconds, default 30), `--no-retry`, `-q` (exit code and errors only).

## Exit codes and error JSON

| Code | Meaning                        |
| ---- | ------------------------------ |
| `0`  | Success                        |
| `1`  | API or runtime error           |
| `2`  | Bad flags or arguments         |
| `3`  | Authentication (`401` / `403`) |
| `4`  | Not found (`404`)              |

With `-o json` or in a pipe, errors go to stderr as JSON with `error`, `code` (HTTP status or `null`), `type`, and optionally `request_id`, `hint`, `field`, `errors`. Types: `PACHCA_API_ERROR`, `PACHCA_AUTH_ERROR`, `PACHCA_VALIDATION_ERROR`, `PACHCA_SCOPE_ERROR`, `PACHCA_NETWORK_ERROR`, `PACHCA_TIMEOUT_ERROR`, `PACHCA_USAGE_ERROR`. Branch on `type`, keep `request_id` for support.

```bash
ERR=$(pachca users get 999 -o json 2>&1 >/dev/null)
case "$(echo "$ERR" | jq -r '.type')" in
  PACHCA_AUTH_ERROR|PACHCA_SCOPE_ERROR) echo "check token and scopes" ;;
  PACHCA_VALIDATION_ERROR) echo "fix the input" ;;
  *) echo "$ERR" ;;
esac
```

## Raw requests with `pachca api`

Use typed commands first. `pachca api` is for a method without a convenient wrapper, or for debugging.

- `pachca api GET /messages --query chat_id=123`
- `-F key=value` typed field (numbers and booleans converted, `@file` reads a file); `-f key=value` always a string. Nested keys: `-F message[entity_id]=123`.
- `--data '<json>'` inline body; `--input payload.json` or `--input -` from stdin.
- It prints the raw API response, `data` wrapper included.
- Before a raw call, read the endpoint: `pachca api <METHOD> <path> --describe` (also `--spec`, `--docs`); list endpoints with `pachca api ls`.

## Files from the CLI

- `pachca upload <file>` (or `-` for stdin) gets the signature, uploads, and returns the `key` to put in `files` (`-o json | jq -r '.key'`).
- `pachca files get <id> --save <path>` downloads an attachment.
