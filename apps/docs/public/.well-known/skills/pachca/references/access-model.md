# Pachca access model in depth

Read this when a refusal does not fit the table in `SKILL.md`, when you must explain to the user why an
action is unavailable, or when you choose or revoke access. Live pages:
[Authorization](https://dev.pachca.com/api/authorization.md) and
[Permissions and roles](https://dev.pachca.com/guides/permissions.md).

## Token kinds compared

|                    | Personal, created in the UI                     | CLI browser login                                      | MCP browser sign-in (consent screen)                                                  | Bot                                                  |
| ------------------ | ----------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Acts as            | the employee                                    | the employee                                           | the employee                                                                          | the bot                                              |
| Scopes             | chosen at creation, editable later              | whole catalog cut by the role at approval, then frozen | what the app asked for, usually the whole catalog; none can be unticked on the screen | set per token in the bot card                        |
| Lifetime           | until deleted                                   | 1 hour, refreshes itself                               | 1 hour, refreshes itself                                                              | until deleted                                        |
| Sees               | what the employee sees                          | the same                                               | the same                                                                              | open channels plus chats and threads it was added to |
| Where it is listed | **Персональные токены** on **Интеграции > API** | **Токены CLI**, one row per device                     | **Авторизации**                                                                       | the **API** tab of the bot card                      |

A consent-screen token is the same kind an OAuth app gets for an employee (→ `pachca-oauth`). Whatever the
scopes say, every call is also checked against the owner's current role.

## The owner is special, admins are not

Closed chats are member-only for every role. The owner, and only the owner, on the «Корпорация» plan gets:

- the list of all group chats and channels, closed ones included (no direct messages, no threads);
- the members of any chat, without its messages;
- an export of the whole workspace, closed and archived chats and threads included;
- the list of all bots; bots the owner cannot edit come with name and nickname only.

An admin gets none of this: those methods answer `403`. An admin or the owner who joins a chat becomes its
admin, which is the legitimate way to take over someone else's chat (→ `pachca-admin`).

## Multi-guest

Works with the API like an employee but sees only what the UI shows: the chats they were added to and their
members. Other employees answer `404`, their email and phone come back `null`. Can create personal tokens,
log in to the CLI and authorize bots. Cannot create or configure bots, create chats or leave them, add
members or tags to a chat, or list a tag's employees. The MCP server leaves those tools out for them.

## Role changes hit live tokens

| What happened to the employee | Their token                                                                  |
| ----------------------------- | ---------------------------------------------------------------------------- |
| Role lowered                  | keeps working within the new role; lost scopes answer `403` `role_forbidden` |
| Role restored                 | access comes back by itself                                                  |
| Access suspended              | stops working; works again if access is restored                             |
| Employee deleted              | stops working for good                                                       |

A suspended employee's tokens are not deleted. Revoke them on **Все токены** if they must not come back.

## Who may issue access

Two workspace settings, changed by the owner or an admin:

- **Кто может создавать интеграции** (bots and their tokens): default "Администраторы и сотрудники".
- **Кто может создавать персональные токены**: default "Только администраторы". It also closes CLI login and
  consent for bots and MCP apps.

Tightening a setting closes only new access. Everything issued before keeps working until it is revoked on
the **Все токены** tab.

## Revoking access

- MCP browser connections: **Авторизации** on **Интеграции > API**. **Отозвать доступ** cuts every
  connection of that app you granted; the next call gets `401`. Other employees' connections of the same app
  stay.
- CLI browser logins: **Токены CLI**, one row per device, or `pachca auth logout`, which kills the token on the
  server at once.
- Ready tokens, personal or bot: delete the token on **Интеграции > API** or in the bot card. `pachca auth
logout` only removes the profile from the machine; the token keeps working.
- Admins see and revoke every access in the workspace, including rows typed «Клиент MCP», on **Все токены**.

## Reading a 403 precisely

- Both scope and role refusals repeat their code in the `WWW-Authenticate` header; for
  `insufficient_scope` its `scope` parameter names the missing scope.
- In the CLI, `-o json` returns error type `PACHCA_SCOPE_ERROR` with a `scope` field. Then compare with
  `pachca auth status`: the scope is in the token's list → the role stopped allowing it, only an admin helps;
  it is not in the list → log in again (browser login) or issue a token with that scope (ready token).
- A plain `403` without those codes usually means chat membership or chat role. Check whether the token's
  owner is in the chat, and with which role, before blaming scopes or the plan.

## Personal data

`email` and `phone_number` of other employees: the owner and admins always see them; an employee sees them
only if the workspace allows showing personal data; a bot token follows that setting only. Everyone sees
their own.

## MCP server limits

- At most 20 tool calls per second per token; an extra call is refused with the time to wait.
- At most 100 requests per second per token, connecting and listing tools included; beyond that `429`.
- Every call is an API request, so all [API limits](https://dev.pachca.com/api/limits.md) apply too.
- A response holds up to 100,000 characters. List records are cut to their main fields; ask for the full
  record when you need it. A long list is cut at whole records: request a smaller page.

Files sent and received through MCP have their own limits: see the
[MCP server page](https://dev.pachca.com/guides/ai-agents/mcp.md) and `pachca-messaging`.
