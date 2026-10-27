# Pachca access model in depth

Read this when a refusal does not fit the table in `SKILL.md`, when you must explain to the user why an
action is unavailable, or when you choose or revoke access. Live pages:
[Authorization](https://dev.pachca.com/api/authorization.md) and
[Permissions and roles](https://dev.pachca.com/guides/permissions.md).

## Token kinds compared

|                    | Personal, created in the UI                     | CLI browser login                                      | MCP browser sign-in (consent screen)                                                  | Bot                                                                   |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Acts as            | the employee                                    | the employee                                           | the employee                                                                          | the bot                                                               |
| Scopes             | chosen at creation, editable later              | whole catalog cut by the role at approval, then frozen | what the app asked for, usually the whole catalog; none can be unticked on the screen | set per token in the bot card                                         |
| Lifetime           | until deleted                                   | 1 hour, refreshes itself                               | 1 hour, refreshes itself                                                              | until deleted                                                         |
| Sees               | what the employee sees                          | the same                                               | the same                                                                              | open group chats and channels, plus chats and threads it was added to |
| Where it is listed | **Персональные токены** on **Интеграции > API** | **Токены CLI**, one row per device                     | **Авторизации**                                                                       | the **API** tab of the bot card                                       |

The MCP consent screen and a bot's OAuth consent screen look alike but issue different tokens. The MCP token
lives an hour, refreshes itself and can carry the whole catalog, drafts and bot management included. A bot's
token for an employee does not expire and holds only scopes a bot may have (→ `pachca-oauth`). Whatever the
scopes say, every call is also checked against the owner's current role.

## The owner is special, admins are not

Closed chats are member-only for every role. The owner, and only the owner, lists the members of any chat,
without its messages, on every plan. On the «Корпорация» plan the owner also gets:

- the list of all group chats and channels, closed ones included (no direct messages, no threads);
- an export of messages from open, closed and archived chats with their threads, regardless of membership;
  direct messages come with author and time but no text, and their threads are not included;
- the list of all bots; bots the owner cannot edit come with name and nickname only.

An admin gets none of this: those methods answer `403`. An admin or the owner who joins a chat becomes its
admin, which is the legitimate way to take over someone else's chat (→ `pachca-admin`).

## Multi-guest

Works with the API like an employee but sees only what the UI shows: the chats they were added to and their
members. Employees who share no active chat with them answer `404` (threads and archived chats do not count).
In the cards they can see, other employees' `email` and `phone_number` come back `null` and `list_tags` comes
back empty. Can create personal tokens, log in to the CLI and authorize bots. Cannot create or configure bots,
create chats or leave them, add members or tags to a chat, or list a tag's employees. The MCP server leaves
those tools out for them.

## Role changes hit live tokens

| What happened to the employee | Their token                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------- |
| Role lowered                  | keeps working within the new role; lost scopes answer `403` `role_forbidden` |
| Role restored                 | access comes back by itself                                                  |
| Made a guest                  | revoked for good (`401`); a promotion does not bring it back                 |
| Access suspended              | stops working; works again if access is restored                             |
| Employee deleted              | stops working for good                                                       |

A suspended employee's tokens are not deleted. Revoke them on **Все токены** if they must not come back.

## Who may issue access

Two workspace settings, changed by the owner or an admin (→ `pachca-admin`):

- **Кто может создавать интеграции** (bots and their tokens): default "Администраторы и сотрудники".
- **Кто может создавать персональные токены**: default "Только администраторы". It also closes CLI login and
  consent for bots and MCP apps.

Tightening a setting stops new issuing. Access issued before keeps working: bots and their tokens, personal
tokens, CLI logins and consent grants. With «Только администраторы» in **Кто может создавать интеграции**, a
creator without the admin role also loses access to the card of their bot, while the bot and its tokens keep
working. With «Только администраторы» in **Кто может создавать персональные токены**, employees can still
delete their personal tokens but can no longer edit them. To cut old access, revoke it as below.

## Revoking access

- MCP browser connections: **Авторизации** on **Интеграции > API**. **Отозвать доступ** cuts every
  connection of that app you granted; the next call gets `401`. Other employees' connections of the same app
  stay.
- CLI browser logins: **Токены CLI**, one row per device. `pachca auth logout` removes the profile and
  closes the login on the server, renewing an expired token first. `token_revoked: true` in JSON means the
  login is closed, also when it had been closed earlier. `false` means the CLI could not confirm it (offline,
  a server error): the row stays in **Токены CLI**, so revoke it there.
- Ready tokens, personal or bot: delete the token on **Интеграции > API** or on the **API** tab of the bot
  card. `pachca auth logout` only removes the profile from the machine; the token keeps working.
- Admins see and revoke employees' personal tokens, CLI logins, and authorizations of bots and MCP apps (rows
  typed «Клиент MCP») on **Все токены**, suspended employees included. A bot's own tokens are not listed
  there: the bot's creator or an admin deletes them on the **API** tab of the bot card, an admin only while
  **Администраторы** is ticked under **Кто может редактировать настройки бота** on that card (off by default).

## Reading a 403 precisely

- In the CLI with `-o json`, `insufficient_scope` comes back as type `PACHCA_SCOPE_ERROR` with a `scope`
  field: the token does not carry that scope. Add it to a ready token (**Персональные токены** on
  **Интеграции > API**, or the **API** tab of the bot card). For a browser login, CLI or MCP, sign in again: it
  helps when the catalog or, for the CLI, your role has grown since. A plain reconnect keeps the old scopes.
- `role_forbidden` comes back as type `PACHCA_AUTH_ERROR` with `message` `role_forbidden`: the token carries
  the scope but the current role forbids the action, so only an admin helps.
- `pachca auth status` shows the scopes saved at login for the profile and ignores `PACHCA_TOKEN` and
  `--token`. To see what the token really carries, run `pachca auth status --remote` for a profile, or
  `pachca oauth token-info -o json` for any token.
- `access_denied` comes back in the regular error format (in the CLI, type `PACHCA_API_ERROR` with
  `validation_code` `access_denied`). The token belongs to a guest, or to a suspended or deleted employee.
  Neither scopes nor a new sign-in help: use another account, or an admin restores the suspended employee's
  access.
- A plain `403` without any of these codes usually means chat membership or chat role. Check whether the
  token's owner is in the chat, and with which role, before blaming scopes or the plan.

## Personal data

`email` and `phone_number` of other employees: the owner and admins always see them; an employee sees them
only if the workspace allows showing personal data; a bot token follows that setting only. Everyone sees
their own.

## MCP server limits

- Tool calls and requests to the server are limited separately, per token. A tool call over its limit is
  refused with the time to wait. Requests, connecting and listing tools included, get `429` beyond theirs.
  The numbers change, so read them on the [MCP server page](https://dev.pachca.com/guides/ai-agents/mcp.md).
- Every call is an API request, so all [API limits](https://dev.pachca.com/api/limits.md) apply too.
- A response holds up to 100,000 characters. List records are cut to their main fields; ask for the full
  record when you need it. A long list is cut at whole records: request a smaller page.

Files sent and received through MCP have their own limits: see the
[MCP server page](https://dev.pachca.com/guides/ai-agents/mcp.md) and `pachca-messaging`.
