# Errors and retries

Sources of truth: <https://dev.pachca.com/api/errors.md>, <https://dev.pachca.com/api/limits.md>, <https://dev.pachca.com/api/authorization.md>. This file is the decision logic.

## Two error shapes

- **`ApiError`** (`400`, `402`, `403`, `404`, `409`, `410`, `422`, `429`, `503`, `504`): an `errors` array. Each item has `key` (the field, or `system`), `value`, `message`, `code`, `payload` (usually `null`).
- **`OAuthError`** (`401`, `403`): `error` (a code) and `error_description`.

Branch on the HTTP status (an SDK does not expose it: branch on the code alone) and on `errors[].code` or `error`, not on the human text in `message`.

## Which `403` is it

```text
403
├─ OAuthError, error = insufficient_scope
│    The token lacks the method's scope. The WWW-Authenticate header names it in scope="...".
│    Fix the token, see below. Retrying is useless.
├─ OAuthError, error = role_forbidden
│    The token has the scope, but the owner's role does not allow the action.
│    A new token or re-login will not help. Someone with the needed role does the action,
│    or an admin raises the role. Owner-only scopes (exports, the audit log, the lists of
│    all workspace chats and bots) need the Owner: no admin can grant that role.
├─ ApiError, code = access_denied
│    The token's owner cannot use the API at all: a guest, or a suspended or deleted employee.
│    Every method answers this way. A new token will not help. Tell the user.
│    A suspended employee's tokens work again once an admin returns their access.
│    A job that worked before: the employee lost access. Move it to a bot token.
└─ ApiError, other codes
     Not about scopes. Usually access to the object itself: the chat is closed, a chat rule
     forbids it, the role in the chat or workspace does not fit. Also `not_authorized` for a
     feature the workspace plan lacks or for `display_name` / `display_avatar_url` sent with a
     token that is not a bot token, and `confidential_download_denied` for a protected file
     requested from outside the secure perimeter. `not_authorized` does not say which case it
     is. Any method can answer this way. Check membership and role first, then plan and token kind.
```

Fixing `insufficient_scope` depends on the token:

- **Personal token from the UI**: add the scope with **Редактировать** in the token menu on **Интеграции > API**, or issue a new token. The dialog offers only scopes your role has: if the scope is not there, editing will not help. If **Кто может создавать персональные токены** is set to «Только администраторы» (the default), an employee's existing token keeps working, but the employee can neither edit it nor create a new one. The same setting also refuses a non-admin a new CLI login, a bot authorization and an MCP connection (`403` `admins_only_access_denied`), so the re-login, re-authorization and reconnect fixes below work for a non-admin only after an admin picks «Все сотрудники». Only an admin can change that setting → pachca-admin.
- **Bot token**: add the scope in the bot card, or with the edit-bot-token method (`pachca_update_bot_token` / `pachca bots update-token`). It replaces the token's scope list as a whole, so take the current `scopes` from `pachca_list_bot_tokens` (`pachca bots list-tokens`) and pass them together with the missing one. It needs a personal token of the bot's creator, or of an admin when the bot's settings let admins edit it. Confirm with the user first, since it changes a live integration. What a bot may be granted: `pachca_get_bot_scopes` (`pachca bots list-scopes`).
- **CLI browser login**: scopes were frozen at login from your role (`pachca auth status` lists them). Log in again only if the role has since been widened or the scope appeared in Pachca after the login: otherwise the new login lacks it too. A listed scope that is still refused answers `role_forbidden`, see the tree above.
- **Token a bot got by authorization**: its scopes come from the bot's settings and are cut by the employee's role. The bot's developer adds the scope there, then the employee authorizes again → pachca-oauth.
- **Token an AI app got by connecting to the MCP server through the browser**: it carries the scopes the app asked for, usually the whole catalogue. A scope that appeared in Pachca later arrives only with the next connection, so reconnect → pachca.

Some scopes cannot be given to some token kinds at all. `bot_self:*` is bot only. A bot token, and a token a bot gets by authorization, hold only the bot catalogue (`pachca_get_bot_scopes`): that rules out `bots:*`, `drafts:*`, employee management, tag edits, other employees' status and avatar, and the Owner-only scopes. A `403` with these means "wrong kind of token", not "missing checkbox": no bot setting can add them. Unfurl and forms are bot methods, although a personal token can hold their scopes: unfurl answers any token other than a bot subscribed to unfurl with `422` `wrong_params`, and a form opens only with a `trigger_id` from a bot's button click event, delivered by webhook or read from the event history (otherwise `410` `trigger_not_found`).

## Other codes worth handling

| Status, code                     | Meaning                                                                                                                                                            | Do                                                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `401`                            | Token missing, unknown, expired or revoked                                                                                                                         | Replace the token. In the CLI, a revoked login answers `401` with a hint to log in again                                                                         |
| `400` / `422`, `errors[].key`    | Validation: required, invalid, too long, not allowed. `key: system` means no single field                                                                          | Fix the field named in `key`, or the request body. Do not retry                                                                                                  |
| `400` `unhandled`                | Server fault or a value the server could not parse. `key` is `system`, `message` is always generic                                                                 | Check the types and formats you sent. If they are right, do not retry in a loop: stop and tell the user                                                          |
| `409` `already_exists`           | The object exists (employee with this email, pin on this message, draft in this chat)                                                                              | Use the existing one. For a draft, `payload.draft_id` is the draft to update                                                                                     |
| `400` `taken`                    | Tag name already taken                                                                                                                                             | Choose another name or reuse the tag                                                                                                                             |
| `402`                            | Workspace suspended, plan message limit used up                                                                                                                    | Stop and tell the user                                                                                                                                           |
| `404` `export_file_not_found`    | Export not ready yet                                                                                                                                               | Wait and try later                                                                                                                                               |
| `410`                            | A form's `trigger_id` or `submit_id` expired or was already used                                                                                                   | Do not retry → pachca-bots                                                                                                                                       |
| `422` `daily_invites_limit`      | Free workspace hit the daily cap on invitation and email-change letters (new employee, or email change in edit employee); `payload` has `remaining` and `reset_at` | Not applied. Wait until `reset_at`. Only when creating an employee: `skip_email_notify: true` uses no quota but sends no invitation email, so ask the user first |
| `422` `rate_limit` on an export  | The workspace ordered an export too recently                                                                                                                       | Order again after the pause named on the export method page → pachca-admin                                                                                       |
| `422` `bot_changed_concurrently` | The bot's settings changed while the edit was running                                                                                                              | Repeat the request once                                                                                                                                          |
| `504` `timeout`                  | Search or employee list with `query` did not finish in time                                                                                                        | Narrow the query. The same request will likely time out again                                                                                                    |

`ApiError.code` values are listed in full on the errors page.

## Retry policy

| Status                                                                          | Action                                   | Delay                                                      |
| ------------------------------------------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------- |
| `429`                                                                           | Retry                                    | At least `Retry-After`, jitter upward only                 |
| `500`, `502`, `503`, `504` on `GET`, `PUT`, `DELETE` (except a `504` `timeout`) | Retry                                    | Exponential backoff with jitter, about 1 s, 2 s, 4 s       |
| `5xx`, a timeout or a network error on a `POST` (send, create)                  | Do not retry blind, except a form answer | It may already be applied: see "Not idempotent by default" |
| `400`, `401`, `403`, `404`, `422`                                               | Do not retry, except the codes below     | Fix the request or the token                               |

- At most 3 retries per request. Jitter goes upward only, for `5xx` backoff and on top of `Retry-After` alike: the examples on the limits page multiply the delay by 1–1.25.
- `Retry-After` is a minimum, already rounded up. Never wait less.
- **Long pauses are not retried.** `Retry-After` over a minute comes only from the daily per-chat message cap and the overload block. Return the error with `Retry-After` to the caller and resume later.
- A repeated `DELETE` that answers `404` most likely went through on the first attempt. Treat it as done.
- Codes that clear on their own (table above): `404` `export_file_not_found` and `422` `daily_invites_limit` mean wait, `422` `rate_limit` on an export means order again after the pause, `422` `bot_changed_concurrently` means repeat once, `503` `service_unavailable` on a form answer means repeat at once (see "Not idempotent by default").
- The CLI retries `429`, and on `GET` and `PUT` a `503` or a network error. The n8n node retries `429`, and a `5xx` on `GET`, `PUT` and `DELETE`. Neither resends a `POST` after a `5xx`. SDK clients retry `429` and `5xx` on every method, sends included. In the CLI `--no-retry` turns retries off.

## `429` in detail

- The body is a normal `ApiError` with code `rate_limit`, for both the per-second limits and the daily cap. Incoming webhooks are the exception: plain text.
- **Daily cap per chat.** Counted per sender and chat over a rolling 24 hours. Thread messages count toward the parent chat. Only created messages use the quota. When hit, sending to that chat pauses, and **every attempt while the quota is still used up lengthens the pause**, up to a day. The scale is on <https://dev.pachca.com/api/limits.md>, and `Retry-After` always carries the real wait. A send that passes after the pause resets the scale. Do not probe.
- **Overload block.** An app that keeps sending above the limits after `429` can have message sending from that token blocked for a while (the remaining time comes in `Retry-After`), while other methods keep working. The threshold is far above normal work. If your service cannot keep up, pause requests instead of retrying faster.
- **MCP**: every tool call is an API request, so these limits apply, plus the MCP server's own limits: <https://dev.pachca.com/guides/ai-agents/mcp.md>.

## Not idempotent by default

A `POST` that answered `5xx`, timed out or lost its response may already be applied: the error does not tell whether the write was saved. Before sending or creating again, look first: read the chat's latest messages, or find the object by search or list, and repeat only if it is not there. After an SDK error on a create, do the same check, because the SDK may already have resent it. Creates guarded by a unique value (employee email, pin, draft, tag name) answer `409` or `400` `taken` on a repeat instead of duplicating.

A form answer (`pachca_answer_form`, `pachca views submit-response`) is the exception: it is accepted once, so a repeat cannot duplicate it. After its `503` `service_unavailable` (the answer was not saved and the code asks for a repeat), another `5xx`, a timeout or a lost response, repeat it at once inside the 5-second window. A `410` `submit_expired` on the repeat means the first call was accepted or the window has closed. Either way, stop.
