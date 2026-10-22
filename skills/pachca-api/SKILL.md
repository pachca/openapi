---
name: pachca-api
description: >-
  Работа с API Пачки напрямую из кода, скриптов и CI: какой токен и скоупы взять, курсорная пагинация, лимиты и 429, разбор ошибок 401/403/422, загрузка и скачивание файлов, SDK и генератор клиента, CLI в скриптах, как найти нужный метод без угадывания. Используй, когда просят: «напиши скрипт для API Пачки», «какой токен нужен», «ошибка 403», «упёрлись в 429», «обойти все страницы», «выгрузить всех сотрудников», «загрузить файл через API», «pachca в CI», «SDK Пачки», «какой метод API»; «call the Pachca API», «Pachca token and scopes», «cursor pagination», «rate limit Retry-After», «upload a file via API», «Pachca SDK», «pachca CLI in CI», «which endpoint». Not for: connecting an agent → pachca; writing messages → pachca-messaging; bots, webhooks, events → pachca-bots; acting for an employee via OAuth → pachca-oauth; token policy and the all-tokens tab → pachca-admin.
---

# Pachca API, SDK and CLI in scripts

The judgment around calling the Pachca REST API from a script, a service, CI, an SDK or the `pachca` CLI. The per-method reference lives elsewhere: MCP tool descriptions, `pachca ... --help`, and the method `.md` pages. Do not restate it; look it up.

## When to use

- Writing or fixing code that calls `https://api.pachca.com/api/shared/v1` directly, through an SDK, or through `pachca` in a shell script or CI job.
- A call fails (`401`, `403`, `409`, `422`, `429`, `5xx`) and you must decide: fix the request, fix the token, or wait.
- Walking a whole list (all employees, all chats, a chat's history) or polling for new records.
- Uploading a file from disk or downloading an attachment in code.
- Choosing a token and scopes for a new script or integration.
- You do not know which method does the job.

With MCP tools connected, a one-off action is just a tool call. The rules below still hold underneath: every tool call is an API request under the same token, scopes and limits.

## Find the method, never guess

Never invent a path, a field name or a body shape. Look it up and stop as soon as you have it:

1. **MCP tools**: one tool per API method (`pachca_...`); the tool description is the reference.
2. **CLI**, without loading docs into context:
   - `pachca api ls`: every endpoint as METHOD, PATH, SUMMARY, SCOPE (`--json` for machine-readable).
   - `pachca api <METHOD> <path> --describe`: parameters, body, scope and the equivalent typed command.
   - `--spec`: the OpenAPI fragment. `--docs`: the full markdown reference, same as the site.
   - Not installed: `npx -y @pachca/cli api ls`.
   - `pachca commands --available`: only the commands the current token can run.
3. **Docs index**: <https://dev.pachca.com/llms.txt> lists every page and method, links already point to `.md`. <https://dev.pachca.com/api/llms.txt> is the API-only slice. Any docs page comes as Markdown with `.md` appended to its URL.
4. **The method page** (for example <https://dev.pachca.com/api/messages/create.md>): method and path, required scope and plan in the header, body schema, every response.

Before writing a raw request, confirm three things: the required scope, whether the body is wrapped in a root key, and which pagination group a list method belongs to.

## Choose the token

The token decides whose name the request runs under and which data it can reach. Scopes only open methods; they never widen what the owner can see.

| Situation                                         | Token                                              |
| ------------------------------------------------- | -------------------------------------------------- |
| By hand or with an agent on your own machine      | Personal, via `pachca auth login` (browser)        |
| Script, utility or one-off export on your behalf  | Personal token from **Интеграции > API**           |
| CI, server, cloud worker with no employee present | Bot token                                          |
| Chat bot, notifications, webhook handling, forms  | Bot token → pachca-bots                            |
| A bot that needs one employee's own data          | Token by authorization → pachca-oauth              |
| An AI app connected to the MCP server             | By authorization via browser, or personal → pachca |

- **Personal** sees exactly what its owner sees: same role in the workspace, role in each chat, membership.
- **Bot** sees all open channels of the workspace plus the closed channels, group chats and threads it is a member of.

Personal token from the UI versus CLI browser login:

|          | UI token                           | `pachca auth login`                               |
| -------- | ---------------------------------- | ------------------------------------------------- |
| Scopes   | chosen at creation, editable later | whole catalogue cut by your role, frozen at login |
| Lifetime | never expires                      | one hour, refreshed automatically                 |
| Value    | shown once                         | never printed                                     |
| Fits     | automation, CI                     | work on this machine                              |

A UI token carries its owner's rights wherever it is copied. Treat it as a password.

Scope rules that surprise:

- **Bot token only**: link unfurling, opening a form view, a bot changing its own webhook URL, deleting a bot history event, and `display_name` / `display_avatar_url` on a message (other tokens get `403`).
- **Personal token only**: `bots:read`, `bots:write`, `drafts:read`, `drafts:write`. A bot token gets `403`.
- Some methods also need a plan (export, audit log). The plan is shown next to the scope in the method header.
- Grant only the scopes the job needs.

If the user cannot get a token at all: by default only admins create personal tokens, and then employees also cannot log in to the CLI or authorize bots and MCP apps. Guests cannot create any token. Changing that is an admin task → pachca-admin.

Before a long job, check what the current token can do: `pachca_get_token_info` / `pachca oauth token-info` returns its scopes. In the CLI, `pachca auth status` shows login method, time left and scopes; `--remote` re-reads them from the server.

## Request and response conventions

- HTTPS only. `Authorization: Bearer <token>` on every request except the file upload to `direct_url`. POST, PUT and PATCH send `Content-Type: application/json; charset=utf-8`.
- Entity methods usually wrap the body in a root key named after the entity (`{"message": {...}}`), but not all of them. Check the method.
- One object comes in `data`. A list comes as a `data` array plus `meta`. Deletes may return `204` with no body.
- Field names are `snake_case`, ids are integers, empty values are `null`.
- Times come back in UTC. A time sent without an offset is read as UTC, not as the employee's time zone: convert "at three o'clock" to UTC or send it with an offset.

## Pagination in one screen

Cursor-based everywhere, in two groups with different `meta`:

| Group                           | `meta`                                                                       | End of data                           |
| ------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------- |
| List methods                    | `paginate`: `next_page`, `prev_page`, `has_next`, `has_prev`, always present | `has_next: false`                     |
| Search (users, chats, messages) | `total` and `paginate.next_page` only                                        | count equals `total`, or empty `data` |
| Employee list with `query`      | `paginate`: `next_page`, `has_next` only                                     | `has_next: false`                     |

- Always pass `limit` explicitly; the maximum differs by method.
- In list methods a page can be shorter than `limit` mid-list, or empty with more to come. Stop on the flag, not on the length.
- The cursor is opaque: never parse it, build it, or keep it between sessions.
- SDK `*All()` methods and CLI `--all` walk every page for you.

Polling for new records, batch order and dedup: [references/pagination.md](references/pagination.md).

## Limits, errors and retries in one screen

- Limits are counted per token and per kind of operation. Sending messages is the tightest: counted per recipient (`entity_id`), with a cap across all recipients, and a daily cap per sender per chat. Numbers are approximate and change: read <https://dev.pachca.com/api/limits.md>, do not hard-code them.
- On `429` wait at least `Retry-After`. A `Retry-After` longer than a minute means a retry will not help (daily chat cap or overload block): stop and hand the error back with that time.
- Retry `5xx` with exponential backoff and jitter, at most 3 times. Do not retry `400`, `401`, `403`, `404`, `422`: fix the request or the token.
- `504` with code `timeout` from search or the employee list with `query`: narrow the query. The same request will likely time out again.
- SDKs, the CLI and the n8n node already retry. Do not wrap a second retry loop around them.

The two error shapes, which `403` is which, and the full retry policy: [references/errors-and-retries.md](references/errors-and-retries.md).

## Files

Upload takes three steps, and step 1 is repeated for every file:

1. Get upload parameters: `pachca_get_upload_params` / `pachca files uploads`.
2. POST `multipart/form-data` to the returned `direct_url` with every returned field as is (except `direct_url` itself) and the file as the **last** field. No `Authorization`: `direct_url` is the storage, not Pachca. Success is `204`.
3. In `key`, replace `${filename}` with the real file name and change nothing else. Pass `key`, `name`, `file_type`, `size` in `files` of a new or edited message or draft.

In the CLI, `pachca upload <file>` does steps 1 and 2 and returns the `key`.

- The extension in `name` must match the one in `key`, or you get `422` `wrong_params`. The base name may differ.
- `403` at step 2: the signature expired, request new parameters. `400`: the request went as JSON instead of multipart.

Download:

- A message attachment's `url` is a direct link that needs no auth, valid up to 7 days from issue and often less. Download right away; on `403` fetch the message again for a fresh link.
- With encryption or the secure perimeter on, `url` points to the Download file method instead: it needs `Authorization` and `files:read`. The link itself tells you which case it is.
- A protected file sent from the secure perimeter is served only to requests from a perimeter address. That is the address of your server, not of the employee whose token you use. Otherwise: `403` `confidential_download_denied`.
- Download file by code: `pachca_download_file` / `pachca files get <id> --save <path>`.

Deleting a message, or removing an attachment by edit, erases the file from storage at once, with no trash (a file stays only while another message, such as a forward, still references it). Confirm before doing either.

## SDK and generated clients

- Ready SDKs: TypeScript `@pachca/sdk`, Python `pachca-sdk`, Go, Kotlin, Swift, C#. Each has a typed method per API method, `*All()` pagination, retry on `429` and `5xx`, typed `ApiError` and `OAuthError`, and snake_case to camelCase conversion. The token is passed once, when the client is created.
- Prefer the SDK to hand-written HTTP where the language has one: pagination and retries are already right.
- Python, Kotlin and C# clients need closing (`await client.close()`, `client.close()`, `client.Dispose()`).
- Own client: `npx -y @pachca/generator --output ./generated --lang <langs>` builds it from the live spec. Commit the result and rerun generation in CI as an API compatibility check.
- Authorization link and PKCE helpers are in the SDK too → pachca-oauth.

## CLI in scripts and CI

- Headless: pass the token in `PACHCA_TOKEN` from the CI or agent secret store. Do not save it to a profile and never commit it. `pachca auth login` without `--token` fails in non-interactive mode: a browser login needs an employee at the screen.
- Non-interactive mode turns on by itself when stdin or stdout is not a TTY, when `CI` or `PACHCA_PROMPT_DISABLED` is set, or with `--no-input`. Missing required flags are then an error, not a prompt.
- In a pipe the output is JSON; data goes to stdout, errors and progress to stderr.
- Preview a request with `--dry-run`. Delete commands ask for confirmation in a terminal; `--force` skips it. Use it only for a deletion the user asked for.
- Exit codes: `0` ok, `1` API or runtime, `2` bad flags, `3` auth (`401`/`403`), `4` not found.

Token sources, output modes, error JSON and raw `pachca api` requests: [references/cli-scripting.md](references/cli-scripting.md).

## Do it right

- Look up the method, its scope and its body before the first call.
- Pick the narrowest token: a bot token for unattended jobs, only the scopes needed.
- Keep secrets out of URLs, logs and echoed command lines. Pass them through the environment or stdin.
- Walk lists to the group's end condition, with an explicit `limit`.
- Space out sends to one chat. For bulk sends, plan around the per-chat daily cap before starting.
- Treat `Retry-After` as a minimum. Add jitter upward only.
- A timed-out create may have gone through. Before re-sending, read the chat's latest messages instead of retrying blind.
- Confirm destructive or mass actions with the user first: deletes, bulk sends, deactivating employees.

## Pitfalls

- `401` is the token itself (missing, unknown, expired, revoked), not a permission.
- `403` `role_forbidden`: neither a new token nor a re-login helps; only an admin can.
- `403` with an `errors` array (`ApiError`) is about the object (closed chat, chat rule, role), not about scopes.
- Search has no `prev_page`: search results cannot be polled by cursor.
- `limit` outside the allowed range is clamped silently; a non-integer gives `400` `invalid`.
- A duplicate gives `409` `already_exists` with the field in `errors[].key`; a taken tag name gives `400` `taken`.
- `402`: the workspace is suspended because the plan's message limit is used up. Nothing to retry.
- Incoming webhooks answer `429` with a plain-text body, not JSON.
- Free workspaces have a daily invite-email cap: `422` `daily_invites_limit`, and the request is not applied.
- The browser client Scalar sends your token through its proxy. Use Postman or Bruno to keep it local.
- CLI flags are kebab-case (`--entity-id`), the API is snake_case (`entity_id`).

## Read more

- Index for agents: <https://dev.pachca.com/llms.txt>
- Overview and SDK install lines: <https://dev.pachca.com/api/overview.md>
- Tokens, scopes, who may create tokens: <https://dev.pachca.com/api/authorization.md>
- Visibility by role: <https://dev.pachca.com/guides/permissions.md>
- Requests and responses: <https://dev.pachca.com/api/requests-responses.md>
- Pagination: <https://dev.pachca.com/api/pagination.md>
- Errors: <https://dev.pachca.com/api/errors.md>
- Limits and retries: <https://dev.pachca.com/api/limits.md>
- File upload and download: <https://dev.pachca.com/api/file-uploads.md>
- SDK and generator: <https://dev.pachca.com/guides/sdk/overview.md>
- CLI: <https://dev.pachca.com/guides/cli/authentication.md>, <https://dev.pachca.com/guides/cli/scripting.md>, <https://dev.pachca.com/guides/cli/output.md>, <https://dev.pachca.com/guides/cli/api-requests.md>
- MCP server limits: <https://dev.pachca.com/guides/ai-agents/mcp.md>
