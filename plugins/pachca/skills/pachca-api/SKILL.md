---
name: pachca-api
description: >-
  API Пачки из кода, скриптов и CI: токен и скоупы для скрипта или сервиса, курсорная пагинация, ошибки и повторы без дублей (401/403/422, 429, 5xx), файлы в коде, SDK и генератор, CLI в скриптах, массовые выгрузки, поиск метода. Когда: «напиши скрипт для API Пачки», «какой токен дать скрипту, сервису или CI», «мой код получает 401/403/422 от API», «упёрлись в 429», «поиск вернул 504 timeout, повторить?», «обойти все страницы», «скрипт, который выгружает всех сотрудников», «загрузка файла из кода», «SDK Пачки», «какой метод API»; "call the Pachca API from code", "token for a script or CI job", "401/403/422 in my code", "cursor pagination", "429 Retry-After", "upload a file from my code", "Pachca SDK", "pachca CLI in CI", "which endpoint". Not for: connecting an agent or MCP client, a 401/403 from an MCP tool → pachca; writing messages, a file to a chat now → pachca-messaging; bots, webhooks, events → pachca-bots; OAuth for employees → pachca-oauth; token policy, all-tokens tab, message export → pachca-admin.
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

Bulk work belongs in a shell or a script, not in a chain of tool calls: a full list, an export to a file, a walk over thousands of records, a large attachment. Through MCP every page passes through your context and you would copy the records into the file yourself. List records come cut to main fields unless `view` is `full`, an answer has a size cap, and a file over the cap comes back as its size only. With a terminal, run `pachca users list --all -o csv > users.csv` or `pachca files get <id> --save <path>` and read only the result. The CLI signs in separately from MCP: check `pachca auth status`, else `pachca auth login`. Without a terminal, say that a full export needs one, or page through and keep only what the answer needs. A walk sees only what the token sees: its own chats and the open conversations and channels. The Owner on the «Корпорация» plan can also list every conversation and channel of the workspace, closed ones included (not direct chats or threads), but not read them: messages of closed chats the token is not in come only through the message export, which also needs the Owner and that plan → pachca-admin.

## Find the method, never guess

Never invent a path, a field name or a body shape. Look it up and stop as soon as you have it:

1. **MCP tools**: one tool per API method (`pachca_...`); the tool description is the reference.
2. **CLI**, without loading docs into context:
   - `pachca api ls`: every endpoint as METHOD, PATH, SUMMARY, SCOPE (`--json` for machine-readable).
   - `pachca api <METHOD> <path> --describe`: parameters, body, scope and the equivalent typed command.
   - `--spec`: the OpenAPI fragment. `--docs`: the full markdown reference, same as the site.
   - Not installed: `npx -y @pachca/cli api ls`.
   - `pachca commands --available`: the commands whose scope the current token holds, plus those that need no scope. Plan, role and bot-token-only limits are not checked, so a listed command can still be refused.
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
- **Bot** sees all open conversations and channels of the workspace plus the closed channels, conversations and threads it is a member of, and its direct messages with employees.
- The token also decides which fields come back, and it does so silently. Other employees' `email` and `phone_number` come back `null` for a bot or employee token unless the workspace shows personal data, and always for a multi-guest. Owner and admin tokens always get them. Before a contacts export, read one other employee's record (your own always has them). If it is `null`, run the export on an admin's personal token rather than reporting the data as missing.

Personal token from the UI versus CLI browser login:

|          | UI token                           | `pachca auth login`                               |
| -------- | ---------------------------------- | ------------------------------------------------- |
| Scopes   | chosen at creation, editable later | whole catalogue cut by your role, frozen at login |
| Lifetime | never expires                      | one hour, refreshed automatically                 |
| Value    | shown once                         | never printed                                     |
| Fits     | scripts and exports on your behalf | work on this machine                              |

A UI token carries its owner's rights wherever it is copied. Treat it as a password.

A personal token works only while its owner's access does. Suspend the employee and every request on their tokens answers `403` with `errors[].code` `access_denied`. Restoring access brings the tokens back. A deleted employee's tokens never come back. Lower their role and the scopes the new role lacks answer `403` `role_forbidden`. A job that must keep running after one employee leaves or changes role runs on a bot token: it outlives whoever created it.

Scope rules that surprise:

- **Bot token only**: link unfurling, opening a form and answering its submission, reading and deleting the bot's event history, a bot changing its own webhook URL or reissuing its own token, and `display_name` / `display_avatar_url` on a message. Another token gets `403` for those two fields and for the bot's own webhook and token methods. The other methods fail with a different code (`404`, `410`, `422`), so check the token kind first.
- **Personal token only**: `bots:read`, `bots:write`, `drafts:read`, `drafts:write`. A bot token gets `403`.
- Some methods also need a plan (export, audit log). The plan is shown next to the scope in the method header.
- Grant only the scopes the job needs.

If the user cannot get a token at all: by default only admins create personal tokens, and then employees and multi-guests also cannot log in to the CLI or authorize bots and MCP apps. Once an admin allows it, a multi-guest works with tokens like an employee but cannot create bots or their tokens. Guests cannot create any token under any setting. Changing that is an admin task → pachca-admin.

Before a long job, check what the current token can do: `pachca_get_token_info` / `pachca oauth token-info -o json` returns its scopes (the CLI's terminal table leaves them out). In the CLI, `pachca auth status` shows login method, time left and scopes of a saved profile (it does not read `PACHCA_TOKEN`); `--remote` re-reads them from the server.

## Request and response conventions

- HTTPS only. `Authorization: Bearer <token>` on every request, with two exceptions: the file upload to `direct_url` (no auth at all), and the OAuth token exchange and revocation, where the app proves itself with its client credentials (→ pachca-oauth). POST, PUT and PATCH send `Content-Type: application/json; charset=utf-8`, except avatar uploads (`multipart/form-data`, a JSON body gets `422`; let the HTTP client set the header with its boundary) and the OAuth token methods (`application/x-www-form-urlencoded`). Check the method.
- Call the API from a server, a script or the CLI, not from JavaScript in a web page. The API answers cross-origin requests only from Pachca's own web app, so a `fetch` from your site fails with a CORS error. Do not work around it with `no-cors` (the response stays unreadable) or a public CORS proxy (the token passes through a third party). A token in front-end code is readable by every visitor. A web page sends its requests through your own backend, which holds the token.
- Entity methods usually wrap the body in a root key named after the entity (`{"message": {...}}`), but not all of them. Check the method.
- Most methods return one object in `data` and a list as a `data` array plus `meta`, but not all. `POST /uploads` returns the upload fields at the top level (read `direct_url`, not `data.direct_url`), an added reaction comes without `data`, and the custom-field list has no `meta`. Check the method's response schema. Deletes and actions with nothing to return (adding members, pinning, archiving) answer `204` with no body.
- Field names are `snake_case` and empty values are `null`. Ids of employees, chats, messages and other entities are integers, but some ids are strings: an audit-log event's `id`, `actor_id` and `entity_id`, a bot event history record's `id`, the form identifiers (`trigger_id`, `view_id`, `submit_id`) and OAuth `client_id`. Take an id's type from the method's schema and do not cast it to a number.
- Times come back in UTC. A time sent without an offset is read as UTC, not as the employee's time zone: convert "at three o'clock" to UTC or send it with an offset.

## Pagination in one screen

Cursor-based everywhere, in groups with different `meta`:

| Group                           | `meta`                                                                       | End of data                     |
| ------------------------------- | ---------------------------------------------------------------------------- | ------------------------------- |
| List methods                    | `paginate`: `next_page`, `prev_page`, `has_next`, `has_prev`, always present | `has_next: false`               |
| Search (users, chats, messages) | `total` and `paginate.next_page` only                                        | empty `data` (never on `total`) |
| Employee list with `query`      | `paginate`: `next_page`, `has_next` only                                     | `has_next: false`               |

- Always pass `limit` explicitly; the maximum differs by method.
- Page with `limit` and `cursor` only. `page`, `per` and `offset` are not documented parameters, so do not send them. The chat list ignores `page` and returns the first page on every request, so a loop over page numbers repeats the same chats and never reaches an empty page.
- In list methods a page can be shorter than `limit` mid-list, or empty with more to come. Stop on the flag, not on the length.
- The cursor is opaque: never parse or build it. Between runs keep only a polling anchor such as the audit log's `prev_page`, never a half-finished walk's `next_page`.
- SDK `*All()` methods and CLI `--all` walk every page for you. CLI `--all` stops at a page cap with only a warning on stderr. Without `--all` a typed CLI list command prints only `data`, so the next cursor comes only from `pachca api GET <path> --query ...`.

Polling for new records (`prev_page` in newest-first lists, the last `next_page` in oldest-first ones), batch order, dedup and the `--all` cap: [references/pagination.md](references/pagination.md).

## Limits, errors and retries in one screen

- Limits are counted per kind of operation, mostly per token. Sending messages has the most rules: counted per recipient (`entity_id`), with a cap across all recipients, and a daily cap per sender per chat. Workspace inventory (all chats, all bots of the workspace) and the bot event history have their own per-token caps, far below the general one. Numbers are approximate and change: read <https://dev.pachca.com/api/limits.md>, do not hard-code them.
- On `429` wait at least `Retry-After`. A `Retry-After` longer than a minute means a retry will not help (daily chat cap or overload block): stop and hand the error back with that time.
- Retry a `5xx` on `GET`, `PUT` and `DELETE` (except a `504` `timeout`, below) with exponential backoff and jitter, at most 3 times. A `5xx`, timeout or network error on a `POST` (a send, a create) may already be applied: look for the message or object first and send again only if it is missing.
- Do not retry `400`, `401`, `403`, `404`, `422`: fix the request or the token. The few codes that clear on their own are in the reference.
- `504` with code `timeout` from search or the employee list with `query`: the query is too heavy. Do not just repeat it, with or without backoff: the same request will likely time out again. Narrow it first: for message search, fewer chats (`chat_ids`), a shorter period (`created_from`, `created_to`) or an author (`user_ids`); for chat and employee search, a more specific `query` or the method's filters; for the employee list, a more specific `query`.
- The CLI, the n8n node and the SDKs retry on their own: do not wrap a second retry loop around what they already repeat. SDKs retry `429` and `5xx` on every method, sends included. The n8n node retries `429`, and a `5xx` on `GET`, `PUT` and `DELETE`. The CLI retries `429`, and a `503` or a network error on `GET` and `PUT`, nothing else. Neither the CLI nor the n8n node resends a `POST` after a `5xx`. A CLI `GET` or `PUT` that failed with `500`, `502`, `504` or a timeout, and a CLI `DELETE` that failed with a `5xx`, a timeout or a network error, are left to your script: repeat them under the rules above.

The error shapes, which `403` is which, and the full retry policy: [references/errors-and-retries.md](references/errors-and-retries.md).

## Files

Upload takes three steps, and step 1 is repeated for every file:

1. Get upload parameters: `pachca_get_upload_params` / `pachca files uploads`.
2. POST `multipart/form-data` to the returned `direct_url` with every returned field as is (except `direct_url` itself) and the file as the **last** field. No `Authorization`: `direct_url` is the storage, not Pachca. Success is `204`.
3. In `key`, replace `${filename}` with the real file name and change nothing else. Pass `key`, `name`, `file_type`, `size` in `files` of a new or edited message or draft. A `voice` file also needs `duration_ms` and `waveform`, or the request is rejected (→ pachca-messaging).

In the CLI, `pachca upload <file>` does steps 1 and 2 and returns the `key`.

- The extension in `name` must match the one in `key`, or you get `422` `wrong_params`. The base name may differ.
- `403` at step 2: the form does not match what was signed (a field changed, left out or added, the file not last) or the signature expired. Request new parameters and send them exactly as returned. `400`: the request went as JSON instead of multipart.

Download:

- A message attachment's `url` is a direct link that needs no auth, valid up to 7 days from issue and often less. Download right away; on `403` fetch the message again for a fresh link.
- With encryption or the secure perimeter on, `url` points to the Download file method instead: it needs `Authorization` and `files:read`. The link itself tells you which case it is.
- A protected file sent from the secure perimeter is served only to requests from a perimeter address. That is the address of your server, not of the employee whose token you use. Otherwise: `403` `confidential_download_denied`.
- Download a file by its attachment `id`: `pachca_download_file` / `pachca files get <id> --save <path>`.

Deleting a message, or removing an attachment by edit, erases the file from storage at once, with no trash (a file stays only while another message, such as a forward, still references it). Confirm before doing either.

## SDK and generated clients

- Ready SDKs: TypeScript `@pachca/sdk`, Python `pachca-sdk`, Go, Kotlin, Swift, C#. Each has a typed method per API method, auto-pagination (`*All()`, `*_all()` in Python, `*AllAsync()` in C#), retry on `429` and `5xx`, typed `ApiError` and `OAuthError`, and field names in each language's convention (camelCase in TypeScript, Kotlin and Swift, PascalCase in Go and C#, snake_case kept in Python). The token is passed once, when the client is created.
- Prefer the SDK to hand-written HTTP where the language has one: pagination and `429` handling are already right.
- After a `5xx` the SDK replays every method, creates included, so one send can post a message more than once. When a duplicate would hurt, read the chat's latest messages after a send that failed or was slow. Never wrap your own retry around an SDK create.
- SDK errors carry no HTTP status and no `Retry-After`. Branch on the codes instead: `errors[].code` of `ApiError` (`rate_limit`, `already_exists`, `invalid`, …) and `error` of `OAuthError` (`invalid_token`, `insufficient_scope`, `role_forbidden`).
- A `rate_limit` that reaches your code means the SDK has already given up: the wait is over a minute (daily per-chat cap or overload block), or its retries are spent. Do not catch and retry. Stop that job and resume it later without probing: every attempt during a daily-cap pause lengthens it.
- Python, Kotlin and C# clients need closing (`await client.close()`, `client.close()`, `client.Dispose()`).
- Own client: `npx -y @pachca/generator --output ./generated --lang <langs>` builds it from the live spec. Commit the result and rerun generation in CI as an API compatibility check.
- Authorization link and PKCE helpers are in the SDK too → pachca-oauth.

## CLI in scripts and CI

- Headless: pass the token in `PACHCA_TOKEN` from the CI or agent secret store. Do not save it to a profile and never commit it. An explicit `--profile` wins over `PACHCA_TOKEN`. `pachca auth login` without `--token` fails in non-interactive mode: a browser login needs an employee at the screen.
- Non-interactive mode turns on by itself when stdin or stdout is not a TTY, when `CI` or `PACHCA_PROMPT_DISABLED` is set, or with `--no-input`. Missing required flags are then an error, not a prompt.
- Without a terminal the output is JSON unless `defaults.output` in the CLI config says otherwise, so scripts pass `-o json`. Data goes to stdout, errors and progress to stderr.
- Preview a request with `--dry-run`. Typed commands that send `DELETE` ask for confirmation in a terminal and refuse without `--force` in non-interactive mode. Add `--force` only for a deletion the user asked for. `pachca api DELETE ...` has no such guard.
- Exit codes: `0` ok, `1` API or runtime error (including a `403` with an `errors` array, such as a closed chat or a chat rule), `2` bad flags or an API `422`, `3` token or scope (`401`, or a `403` with `insufficient_scope` / `role_forbidden`), `4` not found. To tell a token problem from an access refusal, branch on `type` in the error JSON, not on the HTTP code. A `PACHCA_API_ERROR` with `validation_code` `access_denied` means the token's owner lost access, not the object.

Token sources, auth diagnostics, output modes, error JSON and raw `pachca api` requests: [references/cli-scripting.md](references/cli-scripting.md).

## Do it right

- Look up the method, its scope and its body before the first call.
- Pick the narrowest token: a bot token for unattended jobs, only the scopes needed.
- Keep secrets out of URLs, logs and echoed command lines. Pass them through the environment or stdin.
- Walk lists to the group's end condition, with an explicit `limit`.
- Space out sends to one chat. For bulk sends, plan around the per-chat daily cap before starting.
- Treat `Retry-After` as a minimum. Add jitter upward only.
- A create that timed out or answered `5xx` may have gone through. Before re-sending, read the chat's latest messages instead of retrying blind.
- Confirm destructive or mass actions with the user first: deletes, bulk sends, deactivating employees.

## Pitfalls

- `401` is the token itself (missing, unknown, expired, revoked), not a permission.
- `403` `role_forbidden`: neither a new token nor a re-login helps. Someone with the needed role does the action, or an admin changes the role; Owner-only scopes need the Owner.
- `403` with an `errors` array (`ApiError`) is not about scopes. With code `access_denied` it is the token's owner: a guest, or an employee whose access is suspended or deleted, and a new token will not help. Any other code is not about scopes either. Usually it is the object: a closed chat, a chat rule, a role in the chat or workspace. It can also be a feature the workspace plan lacks (`not_authorized`, which does not say which case it is: check membership before blaming the plan), `display_name` / `display_avatar_url` sent with a token that is not a bot token, or a protected file requested from outside the secure perimeter (`confidential_download_denied`).
- Search has no `prev_page`: search results cannot be polled by cursor.
- `limit` outside the allowed range is clamped silently; a non-integer gives `400` `invalid`.
- A duplicate gives `409` `already_exists` with the field in `errors[].key`; a taken tag name gives `400` `taken`.
- `402`: the workspace is suspended because the plan's message limit is used up. Nothing to retry.
- Incoming webhooks answer `429` with a plain-text body, not JSON.
- Free workspaces have a daily cap on invitation and email-change letters: `422` `daily_invites_limit`, and the request is not applied.
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
