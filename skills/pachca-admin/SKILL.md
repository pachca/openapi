---
name: pachca-admin
description: 'Администрирование пространства Пачки для владельца и администратора: сотрудники (пригласить, сменить роль, приостановить, удалить), теги и их состав, каналы и участники, роли и права, доступ к API и вкладка «Все токены», журнал аудита, экспорт сообщений, DLP и безопасный контур. Что требует роли владельца или администратора и тарифа «Корпорация», что подтверждать перед необратимым действием. Use when: «пригласи сотрудника», «уволь / деактивируй сотрудника», «сделай администратором», «добавь в тег», «кто в закрытом канале», «отзови токены», «журнал аудита», «выгрузи переписку», «правило DLP», «invite an employee», «offboard a user», «change role», «manage tags», «chat members», «revoke tokens», «audit log», «export messages», «DLP rule». Not for: writing and sending messages → pachca-messaging, finding people, chats or messages → pachca-search, building a bot → pachca-bots, an app acting for employees → pachca-oauth, tokens and limits in scripts → pachca-api.'
---

# Pachca workspace administration

Run a Pachca workspace for its Owner or an Administrator: people, tags, chat
membership, roles, API access, audit, export and data protection. Every action
here changes what other employees can see or do, so the main skill is knowing
who may do what, and what to confirm first.

## When to use

- Inviting, editing, suspending or deleting employees and guests; offboarding.
- Tags: creating, renaming, deleting, assigning to employees, binding to chats.
- Chat membership and chat roles; taking over a chat whose creator left.
- "Why does this token get 403", "why can't employees connect an agent".
- Who has API access; revoking tokens; the access settings.
- Audit log, message export, DLP rules, IP allowlist and encryption (Corporation).

Not here: sending messages (pachca-messaging), searching (pachca-search),
creating and configuring bots (pachca-bots), OAuth apps (pachca-oauth).

## First: who is acting, on which plan

The agent acts with the rights of the person behind the token. Scopes only
open methods; they never widen visibility. Check before planning:

1. Role: read the own profile (`pachca_get_my_card`, CLI `pachca profile get`).
   `role` is `admin`, `user`, `multi_guest` or `guest`.
2. Scopes: `pachca_get_token_info` (CLI `pachca oauth token-info`).
3. Plan: audit log, export, workspace inventory, DLP and data protection need
   the **Corporation** plan. If unsure, say so and ask.

| Role               | `role` value           | Admin powers                                                                                                                 |
| ------------------ | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Owner              | `admin`                | Everything an Administrator has, plus export, audit log, all chats and bots of the workspace, members of any chat. Only one. |
| Administrator      | `admin`                | Employees, tags, workspace settings                                                                                          |
| Employee           | `user`                 | None                                                                                                                         |
| Multi-guest, Guest | `multi_guest`, `guest` | None; a guest cannot use the API at all                                                                                      |

The Owner is **not** distinguishable by `role` (it is `admin`). Ask the person
whether they are the Owner instead of guessing. Do not probe owner-only methods
"to see": each call to the audit log or the workspace inventory is itself
written to the audit log.

Owner-only scopes (Corporation): `chat_exports:read`, `chat_exports:write`,
`audit_events:read`, `company_chats:read`, `company_bots:read`.
Owner and Administrator: `users:create`, `users:update`, `users:delete`,
`user_status:write`, `user_avatar:write`, `group_tags:write`. A bot token
cannot create, edit or delete employees.

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

When debugging a `403`, first check whether the token's owner is in the chat
and with which chat role, then the scopes. Read the error code:
`insufficient_scope` (missing scope), `role_forbidden` (scope present but the
role no longer allows it; a new token will not help), `access_denied` (the
token belongs to a guest or to a suspended or deleted employee), or a
Corporation-only method on another plan.

## Confirm before acting

Never run these on inference. State exactly who or what is affected and the
consequence, and wait for an explicit yes. One approval covers one action, not
a batch the person has not seen.

| Action                                               | What to tell the person                                                                                                                                                                            |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Delete an employee                                   | Irreversible. Leaves all group chats, loses all tags, tasks where they were the only performer are deleted. Coming back means a new invitation and a different employee. Offer suspension instead. |
| Suspend an employee                                  | Access stops at once; their tokens stop working but revive on restore.                                                                                                                             |
| Change workspace role                                | Takes effect on their tokens immediately; chat roles do not follow.                                                                                                                                |
| Set `list_tags`                                      | Replaces the whole set. Every dropped tag removes them from that tag's chats.                                                                                                                      |
| Remove a tag from a chat                             | Everyone held there only by that tag leaves the chat.                                                                                                                                              |
| Delete a tag                                         | Removed from all employees and chats; members stay in chats but are no longer kept in sync.                                                                                                        |
| Archive a chat                                       | All guests are removed and tags unbound; unarchiving restores neither.                                                                                                                             |
| Remove a member, change a chat role                  | Name the chat and the person.                                                                                                                                                                      |
| Request an export                                    | It contains closed chats regardless of membership. Confirm purpose and period.                                                                                                                     |
| Revoke a token or access                             | Whatever runs on it breaks immediately; a personal token cannot be restored.                                                                                                                       |
| Clear the IP allowlist, change or disable encryption | Can make files or old messages permanently unavailable. See the security reference.                                                                                                                |

## Do it right

**Employees.** Invitation, guests, suspension versus deletion and the
offboarding order are in [references/employee-lifecycle.md](references/employee-lifecycle.md).
Key rules:

- Prefer suspension (`suspended: true` in the employee update) to deletion
  unless the person explicitly wants a final removal.
- An edit applies all or nothing; an unknown role value is silently ignored.
  Re-read the employee after a role change.
- The Owner cannot be edited, deleted or have the avatar changed with someone
  else's token.
- Chats are never archived automatically when someone leaves.

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
Administrator: they join as chat Admin.

**API access.** Two workspace settings decide who may create access:
"who can create integrations" (bots and their tokens; default: administrators
and employees) and "who can create personal tokens" (default: administrators
only). The second one also blocks employees from CLI login and from granting
access to bots and MCP apps on the consent screen. So "employees cannot connect
the agent" is usually this setting.

Both settings close only **new** access. To cut existing access, an
Administrator revokes it on the **All tokens** tab (Integrations > API). Also
revoke tokens of suspended employees there: they revive if access is restored.
These settings and the tab live in the web interface; there is no MCP tool or
CLI command for them, so tell the person where to click.

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
- Audit log: <https://dev.pachca.com/guides/audit-events.md>
- Message export: <https://dev.pachca.com/guides/export.md>
- DLP: <https://dev.pachca.com/guides/dlp.md>
- IP allowlist and encryption: <https://dev.pachca.com/guides/data-protection.md>
- Employee methods: <https://dev.pachca.com/api/users/create.md>, <https://dev.pachca.com/api/users/update.md>, <https://dev.pachca.com/api/users/delete.md>
- Chat members: <https://dev.pachca.com/api/members/list.md>
- Limits: <https://dev.pachca.com/api/limits.md>
