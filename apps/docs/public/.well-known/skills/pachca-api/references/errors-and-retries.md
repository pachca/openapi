# Errors and retries

Sources of truth: <https://dev.pachca.com/api/errors.md>, <https://dev.pachca.com/api/limits.md>, <https://dev.pachca.com/api/authorization.md>. This file is the decision logic.

## Two error shapes

- **`ApiError`** (`400`, `402`, `403`, `404`, `409`, `410`, `422`, `429`, `503`, `504`): an `errors` array. Each item has `key` (the field, or `system`), `value`, `message`, `code`, `payload` (usually `null`).
- **`OAuthError`** (`401`, `403`): `error` (a code) and `error_description`.

Branch on the HTTP status and on `errors[].code` or `error`, not on the human text in `message`.

## Which `403` is it

```text
403
├─ OAuthError, error = insufficient_scope
│    The token lacks the method's scope. The WWW-Authenticate header names it in scope="...".
│    Fix the token, see below. Retrying is useless.
├─ OAuthError, error = role_forbidden
│    The token has the scope, but the owner's role does not allow the action.
│    A new token or re-login will not help. Only a workspace admin can.
└─ ApiError (errors array)
     Access to the object itself: the chat is closed, a chat rule forbids it, the role does not fit.
     Any method can answer this way. Check membership and role, not scopes.
```

Fixing `insufficient_scope` depends on the token:

- **Personal token from the UI**: edit its scopes in the token menu on **Интеграции > API**, or issue a new one.
- **Bot token**: edit that token's scopes in the bot card or with the edit-bot-token method (`pachca_update_bot_token` / `pachca bots update-token`). What a bot may be granted: the bot scope catalogue.
- **CLI browser login**: scopes were frozen at login from your role. If the role has since been widened, log in again. If the scope is in `pachca auth status` but still refused, the role changed: admin only.
- **Token by authorization**: its scopes come from the bot's settings and are cut by the employee's role → pachca-oauth.

Some scopes cannot be given to some token kinds at all (`bots:*` and `drafts:*` are personal only; unfurl, forms and bot self-management are bot only). A `403` there means "wrong kind of token", not "missing checkbox".

## Other codes worth handling

| Status, code                  | Meaning                                                                                 | Do                                                                                                             |
| ----------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `401`                         | Token missing, unknown, expired or revoked                                              | Replace the token. In the CLI, a revoked login answers `401` with a hint to log in again                       |
| `400` / `422`, `errors[].key` | Validation: required, invalid, too long, not allowed                                    | Fix the field named in `key`. Do not retry                                                                     |
| `409` `already_exists`        | The object exists (employee with this email, pin on this message, draft in this chat)   | Use the existing one. For a draft, `payload.draft_id` is the draft to update                                   |
| `400` `taken`                 | Tag name already taken                                                                  | Choose another name or reuse the tag                                                                           |
| `402`                         | Workspace suspended, plan message limit used up                                         | Stop and tell the user                                                                                         |
| `404` `export_file_not_found` | Export not ready yet                                                                    | Wait and try later                                                                                             |
| `410`                         | Resource gone, for example an expired event id                                          | Do not retry                                                                                                   |
| `422` `daily_invites_limit`   | Free workspace hit the daily invite-email cap; `payload` has `remaining` and `reset_at` | Not applied. Wait until `reset_at`, or create the employee with `skip_email_notify: true`, which uses no quota |
| `504` `timeout`               | Search or employee list with `query` did not finish in time                             | Narrow the query. The same request will likely time out again                                                  |

`ApiError.code` values are listed in full on the errors page.

## Retry policy

| Status                                                 | Action       | Delay                                                |
| ------------------------------------------------------ | ------------ | ---------------------------------------------------- |
| `429`                                                  | Retry        | At least `Retry-After`, jitter upward only           |
| `500`, `502`, `503`, `504` (except a search `timeout`) | Retry        | Exponential backoff with jitter, about 1 s, 2 s, 4 s |
| `400`, `401`, `403`, `404`, `422`                      | Do not retry | Fix the request or the token                         |

- At most 3 retries per request. Jitter is a random multiplier of 0.5–1.5.
- `Retry-After` is a minimum, already rounded up. Never wait less.
- **Long pauses are not retried.** `Retry-After` over a minute comes only from the daily per-chat message cap and the overload block. Return the error with `Retry-After` to the caller and resume later.
- SDKs, the CLI and the n8n node retry on their own. In the CLI `--no-retry` turns that off.

## `429` in detail

- The body is a normal `ApiError` with code `rate_limit`, for both the per-second limits and the daily cap. Incoming webhooks are the exception: plain text.
- **Daily cap per chat.** Counted per sender and chat over a rolling 24 hours. Thread messages count toward the parent chat. Only created messages use the quota. When hit, sending to that chat pauses for an hour, and **every attempt during the pause doubles it** (1, 2, 4, 8, 16, up to 24 hours). A send that passes after the pause resets the scale. Do not probe.
- **Overload block.** An app that keeps sending above the limits after `429` can have message sending from that token blocked for about an hour, while other methods keep working. The threshold is far above normal work. If your service cannot keep up, pause requests instead of retrying faster.
- **MCP**: every tool call is an API request, so these limits apply, plus the MCP server's own limits: <https://dev.pachca.com/guides/ai-agents/mcp.md>.

## Not idempotent by default

A create whose response was lost (network error, timeout) may have succeeded. Before repeating a send or a create, check whether it already exists: read the chat's latest messages, or search for the object.
