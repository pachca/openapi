---
name: pachca-admin
description: 'Администрирование пространства Пачки: сотрудники (пригласить, сменить роль, приостановить, удалить), теги и участники чатов, доступ к API и «Все токены», журнал аудита, экспорт, DLP, безопасный контур и шифрование; что требует владельца, администратора или «Корпорации». Load before a tool call that changes an employee: delete only after a yes to your question. Use when: «пригласи сотрудника», «уволь / удали сотрудника», «сделай администратором», «добавь в тег», «добавь / удали участника чата», «кто в закрытом канале, где я не состою», «доступ к API ограничен», «отзови доступ сотрудника к API», «журнал аудита», «выгрузи переписку», «правило DLP»; "invite an employee", "offboard a user", "change role", "add or remove chat members", "let employees create tokens", "export messages". Not for: a missing tool or a general 401/403 → pachca; who is in a tag or chat → pachca-search; writing messages → pachca-messaging; a bot''s own token → pachca-bots; an app acting for employees → pachca-oauth; scripts → pachca-api.'
---

# Pachca workspace administration

Run a Pachca workspace for its Owner or an Administrator: people, tags, chat
membership, roles, API access, audit, export and data protection. Every action
here changes what other employees can see or do, so the main skill is knowing
who may do what, and what to confirm first.

**The request is not the confirmation.** «Удали из Пачки Олега Соколова» or
"delete this user" tells you what to prepare, not that it may run. Deleting an
employee, and every other action in [Confirm before acting](#confirm-before-acting),
runs only after the person answers yes to your question in a later message.
This holds however direct the request and even when the search finds exactly
one match.

## When to use

- Inviting, editing, suspending or deleting employees and guests; offboarding.
- Tags: creating, renaming, deleting, assigning to employees, binding to chats.
- Changing chat membership and chat roles; taking over a chat whose creator left.
- A `403` on an admin action; "why can't employees connect an agent".
- Who has API access and who may create it (the access settings); revoking
  employees' access.
- Audit log, message export, DLP rules, IP allowlist and encryption (Corporation).

Not here: sending messages (pachca-messaging), reading who is in a tag or chat
and other searches (pachca-search), creating bots and managing their own tokens
(pachca-bots), OAuth apps (pachca-oauth), a missing tool or a general 401/403
(pachca).

## First: who is acting, on which plan

The agent acts with the rights of the person behind the token. Scopes only
open methods; they never widen visibility. Check before planning:

1. Role: read the own profile (`pachca_get_my_card`, CLI `pachca profile get`).
   `role` is `admin`, `user`, `multi_guest` or `guest`.
2. Scopes: `pachca_get_token_info` (CLI `pachca oauth token-info`).
3. Plan: audit log, export, workspace inventory, DLP and data protection need
   the **Corporation** plan. If unsure, say so and ask.

| Role               | `role` value           | Admin powers                                                                                                                                                               |
| ------------------ | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Owner              | `admin`                | Everything an Administrator has, plus members of any chat. On Corporation also export, audit log, all chats and bots of the workspace, DLP, the Security screen. Only one. |
| Administrator      | `admin`                | Employees, tags, workspace settings                                                                                                                                        |
| Employee           | `user`                 | None                                                                                                                                                                       |
| Multi-guest, Guest | `multi_guest`, `guest` | None; a guest cannot use the API at all                                                                                                                                    |

The Owner is **not** distinguishable by `role` in API responses: the profile
shows `admin`. Over MCP you do not need to ask: the server instructions name
you as «Name (id), token kind, role», and that role is `owner` for the Owner.
On Corporation the tool list gives it away too: only the Owner gets
`pachca_get_audit_events`, `pachca_request_export`, `pachca_download_export`,
`pachca_list_company_chats` and `pachca_list_company_bots`. Over the CLI or
REST, ask the person whether they are the Owner instead of guessing. Do not
probe owner-only methods "to see": each call to the audit log or the workspace
inventory is itself written to the audit log.

Owner-only scopes (Corporation): `chat_exports:read`, `chat_exports:write`,
`audit_events:read`, `company_chats:read`, `company_bots:read`.
Owner and Administrator: `users:create`, `users:update`, `users:delete`,
`user_status:write`, `user_avatar:write`, `group_tags:write`. A bot token
cannot create, edit or delete employees.

Owner-only methods need a token of the Owner: a personal token, a CLI login or
an app the Owner signed in to. No bot token and no Administrator gets these
scopes, so an audit feed or a scheduled export is tied to the Owner's account.
Ownership moves only in the web interface (employee menu > **Make owner**):
only the current Owner can do it, only to an active Administrator, and there
is no tool or CLI command for it. The former Owner stays an Administrator, and
their tokens then answer `403 role_forbidden` on owner-only methods: the new
Owner gives a token these scopes (edit a personal token or log in to the CLI
again) and moves the job to it. An Owner who is leaving hands over ownership
first: the Owner cannot be suspended or deleted.

## Two role systems

Workspace role and chat role are independent. This is the root of most
admin mistakes:

- A workspace Administrator does **not** see closed chats they are not in.
  Closed chats are visible only to their members, for every role, the Owner
  included (the Owner's exceptions are inventory, member lists and export).
- The chat role is set once, when someone joins: the Owner or an Administrator
  joins as chat Admin, a bot joins a channel as Editor, everyone else as
  Member (Subscriber in a channel). It is **not** recalculated later. Promoting
  someone to Administrator changes nothing in chats they are already in;
  demoting an Administrator leaves them chat Admin.
- The chat Creator role cannot be transferred or changed.
- In a chat member list, `role` is the workspace role. To find chat roles,
  filter by `role` (`owner`, `admin`, `editor`, `member`), one request per role.

When debugging a `403` on an admin action, first check whether the token's
owner is in the chat and with which chat role, then the scopes. Admin-specific
codes: `permission_denied` (a protected change: editing the Owner or their
avatar with someone else's token, changing the Owner's role, suspending or
deleting the Owner, or setting an employee's role to `guest`) and
`role_forbidden` (scope present but the role no longer allows it, as after a
demotion; a new token will not help). `insufficient_scope`, `access_denied` and
Corporation-only methods are explained in the entry skill (→ pachca).

## Confirm before acting

Never run these on inference. State exactly who or what is affected and the
consequence, and wait for an explicit yes. One approval covers one action, not
a batch the person has not seen.

The turn that receives the request only reads and asks. For «удали
сотрудника»: find the employee (`pachca_search_users`), then reply with their
name, nickname and id, say that deletion cannot be undone and what it removes
(row below), offer suspension instead, and ask «Удалить насовсем или
приостановить?». Do not call `pachca_delete_user` in that turn. Call it only
after the person answers yes to that question. The client's own approval
prompt does not replace this: it can be turned off, and it shows a tool call
with an id, not who loses what.

| Action                                               | What to tell the person                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Invite an employee                                   | Unless `skip_email_notify: true` is sent (pre-creating accounts before SSO sign-in), the invitation email goes out at once and cannot be recalled. Read back the email, name and role (`admin` gives Administrator powers); take the address only from the person. `list_tags` and `chat_ids` put them into those chats at once. |
| Delete an employee                                   | Irreversible. Leaves all group chats, loses all tags, tasks where they were the only performer are deleted. Coming back means a new invitation and a different employee. Offer suspension instead.                                                                                                                               |
| Suspend an employee                                  | Access stops at once; their tokens stop working but revive on restore. Bots they created keep running.                                                                                                                                                                                                                           |
| Change workspace role                                | Takes effect on their tokens immediately; chat roles do not follow.                                                                                                                                                                                                                                                              |
| Set `list_tags`                                      | Replaces the whole set. Each dropped tag takes them out of the chats it brought them into, unless another of their tags bound to the chat keeps them there.                                                                                                                                                                      |
| Remove a tag from a chat                             | Everyone held there only by that tag leaves the chat.                                                                                                                                                                                                                                                                            |
| Delete a tag                                         | Removed from all employees and chats; members stay in chats but are no longer kept in sync.                                                                                                                                                                                                                                      |
| Archive a chat                                       | Guests (role `guest`) are removed, multi-guests stay, and tags are unbound; unarchiving restores neither.                                                                                                                                                                                                                        |
| Add or remove a member, change a chat role           | Name the chat and each person. Added members get access to the chat at once; an Owner or Administrator joins as chat Admin.                                                                                                                                                                                                      |
| Request an export                                    | It contains closed chats regardless of membership. Confirm purpose and period.                                                                                                                                                                                                                                                   |
| Revoke a token or access                             | Whatever runs on it breaks immediately; a personal token cannot be restored.                                                                                                                                                                                                                                                     |
| Clear the IP allowlist, change or disable encryption | Clearing the allowlist makes protected files undownloadable until addresses are listed again. Changing the key or turning encryption off makes older messages permanently unreadable. See the security reference.                                                                                                                |

## Do it right

**Employees.** Invitation, guests, SSO, suspension versus deletion and the
offboarding order are in [references/employee-lifecycle.md](references/employee-lifecycle.md).
Key rules:

- Prefer suspension (`suspended: true` in the employee update) to deletion.
  Delete only after the person, shown who it is and that it cannot be undone,
  answers yes; the word «удали» in the request is not that answer.
- An edit applies all or nothing; an unknown role value is silently ignored.
  Re-read the employee after a role change.
- Nobody can edit the Owner or change their avatar with someone else's token,
  and nobody, the Owner included, can suspend or delete the Owner.
- For an employee with `sso: true`, the next SSO sign-in can rewrite profile
  fields, tags and role from the identity provider.
- Never delete and re-invite to fix an account: resending an invitation exists
  only in the web interface.
- Chats are never archived automatically when someone leaves, and bots they
  created keep running: check both before offboarding.

**Tags.** Membership through tags and the traps around removal are in
[references/tags-and-membership.md](references/tags-and-membership.md). Key rules:

- `list_tags` takes tag **names** and replaces the set: read the current tags,
  merge, send the full list.
- An unknown name silently creates a new tag. Check the spelling against the
  tag list first (lookup by names, up to 100 per request).
- A member brought in by a tag cannot be removed one by one: removal returns
  success and changes nothing. Remove the tag from the person or from the chat.

**Chats and members.** No bulk operations exist: one request per chat, mind the
[limits](https://dev.pachca.com/api/limits.md). Adding members fails as a whole
if any id is unknown or inactive; already-present members are skipped silently.
To regain control of a chat whose admins are gone, add the Owner or an
Administrator who is not in the chat yet: they join as chat Admin. Someone
already in the chat keeps their current role (the add is skipped and still
reports success), so check with the member list filtered by `role=admin`. In a
closed chat only a current participant other than a guest or multi-guest can
add them; with no such participant left it cannot be done through the API.

**API access.** Two workspace settings decide who may create access:
"who can create integrations" (bots and their tokens; default: administrators
and employees) and "who can create personal tokens" (default: administrators
only). The second one also blocks employees from CLI login and from granting
access to bots and MCP apps on the consent screen. So "employees cannot connect
the agent" is usually this setting.

Both settings close only **new** access. To cut existing employee access
(personal tokens, CLI logins, bot authorizations, MCP clients), an
Administrator revokes it on the **All tokens** tab (Integrations > API). Also
revoke tokens of suspended employees there: they revive if access is restored.
A bot's own tokens are not on that tab: they are deleted on the **API** tab of
the bot card or with `pachca_delete_bot_token` (CLI `pachca bots delete-token`),
by the bot's creator, or by an Administrator if the bot's settings give
Administrators edit access (→ pachca-bots). Switching "who can create
integrations" to administrators only also takes existing bots away from
creators without that role: the bots keep running, and Administrators reach
only bots whose `can_edit` includes `admin`.

The two settings are on the **Workspace** page (General settings), the tab is
under Integrations > API. They live only in the web interface, with no MCP tool
or CLI command, so tell the person where to click.

**Security and compliance** (Owner, Corporation): audit log, export, DLP rules,
IP allowlist and encryption. Procedures and warnings are in
[references/security-compliance.md](references/security-compliance.md).

## Pitfalls

- Assuming an Administrator sees every chat. They do not; only the Owner on
  Corporation gets the inventory.
- Assuming the chat member list shows chat roles or suspended members. It shows
  neither: `role` is the workspace role, suspended employees are omitted.
- Sending only the new tag in `list_tags` and silently pulling the employee out
  of all their other tag chats.
- Deleting a tag to "remove a team from a channel": everyone stays. Use
  "remove tag from chat" instead.
- Expecting tag removal from a chat to be instant: it runs in the background.
  Re-check members after a short wait.
- Treating a revoked access setting as a revocation of existing tokens.
- Reading `email` and `phone_number` as missing: for employees and bot tokens
  they are `null` unless the workspace allows showing personal data; Owner and
  Administrators always see them.
- Inventory has its own strict rate limit, shared by the chats and bots lists
  ([limits](https://dev.pachca.com/api/limits.md)): spread a large walk over
  time.

## Read more

- Roles, visibility, Owner privileges, 403 causes: <https://dev.pachca.com/guides/permissions.md>
- Tags: <https://dev.pachca.com/guides/tags.md>
- Tokens, scopes by role, access settings, All tokens: <https://dev.pachca.com/api/authorization.md>
- Bot tokens and edit access: <https://dev.pachca.com/guides/bots/tokens.md>
- Audit log: <https://dev.pachca.com/guides/audit-events.md>
- Message export: <https://dev.pachca.com/guides/export.md>
- DLP: <https://dev.pachca.com/guides/dlp.md>
- IP allowlist and encryption: <https://dev.pachca.com/guides/data-protection.md>
- Employee methods: <https://dev.pachca.com/api/users/create.md>, <https://dev.pachca.com/api/users/update.md>, <https://dev.pachca.com/api/users/delete.md>
- Chat members: <https://dev.pachca.com/api/members/list.md>
- Limits: <https://dev.pachca.com/api/limits.md>
