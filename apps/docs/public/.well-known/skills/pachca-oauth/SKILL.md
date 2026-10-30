---
name: pachca-oauth
description: 'Authorization on behalf of an employee in Pachca (OAuth 2.0 with PKCE): when a bot needs an employee''s own token, the OAuth tab, redirect URIs and scope set, the authorization link, code exchange, checking whose token it is, storing a token per employee, re-authorization, revocation, launch checklist. Use when: «бот от имени сотрудника», «авторизация от имени сотрудника», «OAuth в Пачке», «client_id и client_secret», «redirect URI», «обменять код на токен», «PKCE», «экран согласия моего бота», «кнопка Предоставить доступ», «сотрудник отозвал доступ», «токен сотрудника вернул 401 или 403», "Pachca OAuth", "act on behalf of a user", "authorization code flow", "exchange code for token", "my bot''s OAuth consent screen", "per-user token for my bot". Not for: a bot acting as itself, webhooks, showcase, a leaked bot token → pachca-bots; MCP sign-in, a 401/403 from an MCP tool or the CLI → pachca; your own token in a script → pachca-api; revoking access on the All tokens tab → pachca-admin.'
---

# Pachca: acting on behalf of an employee (OAuth)

An employee grants a bot their own rights on a consent screen. The bot gets a token per
employee and calls the API as that employee. For your own integration the OAuth client in
Pachca is always a bot: it is the **OAuth** tab of the bot card. A bot is the app. Two kinds of
client need no registration: the CLI login and MCP clients that sign in through the browser
with a client metadata document. Their tokens live an hour and renew themselves, unlike a bot's
employee token (→ `pachca`).

## When to use

- A bot needs the employee's own data or must act under their name: a digest of their chats,
  a reminder set as them, their tracker tasks answered from Pachca.
- A service acts for many employees and each must agree and be able to revoke.
- A browser, mobile or CLI app on the employee's device needs their token (public client).
- Something in an existing flow breaks: no button, refusal instead of consent, `invalid_grant`,
  `401` or `403` with an employee token.

Not this skill: the bot acting as itself (→ `pachca-bots`), your own agent connecting to the
MCP server through the browser (→ `pachca`), a script under your own name (→ `pachca-api`),
revoking someone's access on the **Все токены** tab (→ `pachca-admin`).

## Choose the token first

| Need                                                                         | Token                                     | Notes                                                                                             |
| ---------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Bot posts, reacts to events, works in chats it was added to                  | Bot token                                 | Sees open conversations and channels with their threads, plus closed chats and threads it is in   |
| Agent or headless integration with no employee involved (CI, server, worker) | Bot token                                 | Service account, give it only the scopes the task needs                                           |
| Your own script, one-off export, personal automation                         | Personal token (**Интеграции** > **API**) | You pick the scopes, it does not expire, the value is shown once                                  |
| Working by hand or with an agent on your own machine                         | CLI login, `pachca auth login`            | Hour-long token that renews itself, scopes = catalog limited by your role                         |
| Bot needs a specific employee's data or must act as them                     | Authorized token (this skill)             | One per employee, scopes from the bot settings, cut by the employee's role, revocable at any time |

Decide with these questions:

1. Does the action have to happen as the employee, or see what only they see? No → bot token.
2. Is it only you? → personal token or CLI login, no OAuth needed.
3. Many employees, each consenting → OAuth. Do not collect personal tokens from employees: a
   personal token does not expire and can be copied anywhere together with its owner's rights.
   An authorization shows the employee exactly what the bot asks for, is limited to the bot's
   scope set and can be revoked from the **Авторизации** list.

## Key concepts

- **A chat bot runs the flow through a DM.** The employee writes to the bot (or the bot writes
  first), the bot answers with a URL button to the consent screen, the employee clicks
  **Разрешить** (Allow), the browser returns to your server with a code, your server exchanges
  it for the token. Such a bot also needs an outgoing webhook (or the event history) and a bot
  token with `messages:create`. Most launches break on these, not on OAuth. An app on the
  employee's device (public client) opens the consent link itself, takes the code on its own
  redirect address and needs neither: see the
  [flow reference](references/authorization-flow.md#app-on-the-employees-device-public-client).
- **Client type** (**Где хранится секрет**):
  - **Серверное, с секретом** (confidential): your backend exchanges the code and is the only
    place `client_secret` lives.
  - **Браузер, мобильное, CLI** (public): no secret, the exchange is protected by PKCE only.
- **One scope set per bot.** The consent screen always shows the set from the bot settings.
  The `scope` parameter in the link is ignored. The employee accepts the whole set or nothing.
- **The role cuts the rights on every call.** A scope in the set that the employee's role does
  not allow returns `403` with `role_forbidden`. A role change applies to the token at once.
- **The token does not expire.** The exchange response has no `expires_in`. It carries a
  `refresh_token`, but there is nothing to refresh: the token works until it is revoked (by the
  employee in **Авторизации**, by an admin on **Все токены**, or by the bot itself), OAuth on
  the bot is disabled or the bot is deleted. Once the employee is suspended or deleted, calls
  return `403` `access_denied`. A suspended employee's token works again once access is
  restored. Making the employee a guest revokes all their tokens: calls return `401`.
- **Re-authorization returns the same token** when the scope set has not changed. After a
  change it issues a new token, and the old one keeps working with the old set until revoked. A
  confidential client re-authorizing with the same set skips the consent screen: the browser
  goes straight back with a new code.
- **Posts sent as the employee are marked and come back to the bot.** A message sent with an
  employee token is signed with the employee's name, and the avatar gets a bot icon with the
  hint «Отправлено через» and the bot's name. Do not promise employees it will look
  hand-written. If the bot listens to all messages in that chat, its outgoing webhook gets the
  post with the employee's `user_id`: **Игнорировать свои сообщения** (`ignore_self_messages`)
  and comparing with the bot's `id` both let it through. Store the message ids the send returns
  and skip those events, or the bot handles its own post as the employee's message.

## Who can authorize a bot

- Only employees of the workspace where the bot was created.
- Only those allowed to create personal tokens. The workspace setting **Кто может создавать
  персональные токены** defaults to **Только администраторы**: until an owner or admin picks
  **Все сотрудники**, regular employees and multi-guests see a refusal instead of consent.
- Guests never, under any setting. Multi-guests can when the setting allows it.

Check this setting with the workspace admin before building anything for regular employees.

## Do it right

1. Run the [launch checklist](references/launch-checklist.md) before the first test and again
   whenever something on the path stays silent.
2. Request the minimum scope set. Fewer scopes, more consents, and removing a scope later does
   not take it away from tokens already issued. Pass `oauth_client.scopes` explicitly: enabling
   OAuth without it requests a broad default set (most, not all, of the scopes a bot can hold),
   or, if OAuth was on before, the set saved back then.
3. Only scopes the bot itself can hold go in the set: `pachca_get_bot_scopes`
   (`pachca bots list-scopes`) lists exactly those. Saving the set refuses bot management
   (`bots:read`, `bots:write`), drafts (`drafts:read`, `drafts:write`) and every owner- or
   admin-only scope: `users:create`, `users:update`, `users:delete`, `user_status:write`,
   `user_avatar:write`, `group_tags:write`, `chat_exports:read`, `chat_exports:write`,
   `audit_events:read`, `company_chats:read`, `company_bots:read`. This holds even if only the
   owner will ever authorize the bot. So an OAuth bot cannot read or write drafts, manage bots,
   invite, edit, suspend or delete employees, manage tags, change someone else's status or
   avatar, export messages, read the audit log or list all chats and bots of the workspace. For
   those tasks a person uses their own personal token or CLI login:
   - Drafts: the employee themselves (→ `pachca-messaging`).
   - Bot management: the bot's creator, or an admin if the bot settings allow it
     (→ `pachca-bots`).
   - Employees, tags, someone else's status or avatar: the owner or an admin (→ `pachca-admin`).
   - Audit log, message exports, workspace-wide lists of chats and bots: the owner only, on the
     **Корпорация** plan (→ `pachca-admin`).
4. Use PKCE with `S256` always: required for a public client, recommended for a confidential one.
5. Generate a fresh `state` per button, bind it to the employee you sent the button to, and
   accept it once.
6. Exchange the code on your server for a confidential client. Never ship `client_secret` to a
   browser, mobile or CLI app: choose the public type for those.
7. After the exchange, ask token info with the new token and compare `user_id` with the
   employee you sent the button to. The button may have been forwarded.
8. Store one token per employee, like a password: a secret store or encrypted storage, never in
   logs, messages or the repo. It gives access to everything the employee sees within the
   granted scopes.
9. Treat `401` on an employee token as "access ended": delete the token and send the button
   again next time the employee talks to the bot. `403` `access_denied` (in `errors[].code`, not
   in `error`) means the employee was suspended or deleted: stop calling with that token and do
   not send the button. To tell the cases apart, get the employee with the bot token (scope
   `users:read`): `suspended: true` means keep the token, it works again once access is
   restored; `404` means they were deleted, so delete the token.
10. Next to the button, say why the bot needs access and what it will do, and ask the employee
    not to forward the link.

The exact step order, request fields and error handling: [authorization flow](references/authorization-flow.md).

## Configuring the OAuth tab

Only the bot's creator can change it, plus workspace admins if the bot settings give them edit
access. In the UI: **Интеграции** > **Боты** > **Управление**, open the bot, tab **OAuth**,
**Включить**.

Through MCP or CLI, with your own connection (managing bots needs `bots:write`: your personal
token, CLI login or MCP sign-in can carry it, a bot token never does):

- `pachca_update_bot` (`pachca bots update --oauth-client …`), or `pachca_create_bot` at
  creation, with the `oauth_client` object. The consent set is `oauth_client.scopes`; the
  top-level `scopes` are the rights of the bot's own token. Lists are replaced whole.
- A confidential client's `client_secret` comes in the response once: on enabling and on
  switching to confidential. Hand it to the user in your reply only, to put into their secret
  store.

Redirect URI rules:

- Plain `http` is allowed only on the local machine (`localhost`, `127.0.0.1`, `[::1]`). Every
  other web address must be HTTPS. A mobile or desktop app may also use its own scheme in the
  `com.example.app:/oauth` form. No `#fragment` in any address.
- The `redirect_uri` in the link must match one in the list exactly. If the listed address has
  no query string, query parameters in the link are ignored. If it has one, the link must carry
  exactly the same parameters, in any order. For local addresses the port is not compared, so a
  desktop or CLI app can use any free port.
- At least one address is required.

`client_id` is not secret: it goes into the link.

## Changing things later

- **Scope set grows:** issued tokens keep the old set. Send the button again: the employee
  confirms the new set on the next authorization.
- **Scope set shrinks:** removed scopes stay in issued tokens until the token is revoked: by the
  employee, by an admin on **Все токены**, by the bot itself, or by disabling OAuth (which
  revokes every employee and deletes the showcase page). To take them away from one employee,
  revoke their stored token from the bot, delete it and send the button again: the next token
  carries the current set.
- **After any set change** re-authorization returns a new token, and the old one keeps working
  with the old set until it is revoked. When the exchange returns a value different from the
  token stored for that employee, revoke the stored one from the bot, then save the new one, so
  each employee has one live token. An equal value is the same token: revoke nothing.
- **Secret rotation** (**Обновить секрет**, `pachca_rotate_bot_client_secret`,
  `pachca bots rotate-client-secret`): the old secret stops working at once, so have the bot
  ready to take the new value first. Issued authorizations and tokens keep working. The new
  value is shown once.
- **Disabling** (**Удаление OAuth-клиента**, or `oauth_client: null`): every employee
  authorization is revoked and their tokens return `401`, the bot leaves the showcase and its
  description and screenshots are deleted for good, new authorizations with that `client_id`
  fail. The bot's own tokens keep working. Re-enabling keeps the old `client_id` and
  `client_secret` (unless rotated), and the showcase needs a new publication. It ends every
  employee's authorization at once, so ask first.
- **Deleting the bot** also ends every employee token issued to it.

## Revocation and visibility

- The employee sees every authorized bot in **Авторизации** on **Интеграции** > **API** and can
  revoke it there: all tokens of that bot for that employee stop at once.
- The bot can revoke an employee token itself, for example when the employee disconnects the
  integration in your service. See the flow reference.
- Switching **Кто может создавать персональные токены** back to **Только администраторы** only
  closes new consents. An admin finds and revokes existing ones on the **Все токены** tab.
- The bot editor sees how many employees authorized the bot on the **Управление** tab; the
  employee sees **Подключено** on the bot in the showcase.
- On the **Корпорация** plan every grant and revocation goes into the audit log.

## Pitfalls

- Publishing the bot in the showcase does not let anyone write to it. The bot must be public,
  share a chat that is not archived with the employee, or write first.
- A new bot listens only to commands, and its command list is empty: the employee writes and
  the bot stays silent.
- Cancel on the consent screen sends nothing to your server. Expire unused `state` values after
  a bounded time, for example a day.
- The code lives 10 minutes and works once. A retry with the same code gets `invalid_grant`:
  send a new button instead.
- Do not revoke a token that came from the wrong employee (forwarded button). If they had
  authorized the bot before and the scope set has not changed since, Pachca returned their
  existing token, and revoking it cuts their access. Save it under them and resend the button
  to the intended employee.
- `403 role_forbidden` cannot be fixed by re-authorizing. Tell the employee the action is not
  available to their role. `403 insufficient_scope` can: add the scope to the bot settings and
  send the button again.
- The MCP tool `pachca_get_token_info` reports on the token of your own connection. To check an
  employee token, call token info with that token from the bot's code, or run
  `pachca oauth token-info` in a terminal with that token in `PACHCA_TOKEN` for that one
  command, read from the secret store rather than typed, and without `--profile` (it overrides
  the variable). A value passed with `--token` stays in shell history and the process list. Do
  not export the variable, or later commands run as the employee.
- The authorization link, code exchange and bot-side revocation are not MCP tools. They run in
  the bot's server, over HTTP or the SDK.

## Read more

- Overview and limits: <https://dev.pachca.com/guides/oauth/overview.md>
- Launch checklist: <https://dev.pachca.com/guides/oauth/checklist.md>
- OAuth tab settings: <https://dev.pachca.com/guides/oauth/setup.md>
- Getting the token, errors, TypeScript example: <https://dev.pachca.com/guides/oauth/flow.md>
- Consent, role limits, revocation: <https://dev.pachca.com/guides/oauth/consent.md>
- Token types, scopes, who can create tokens, all tokens tab: <https://dev.pachca.com/api/authorization.md>
- SDK helpers for the link and PKCE in every language: <https://dev.pachca.com/guides/sdk/overview.md>
- Methods: <https://dev.pachca.com/api/oauth/exchange-token.md>, <https://dev.pachca.com/api/oauth/token-info.md>, <https://dev.pachca.com/api/oauth/revoke-token.md>, <https://dev.pachca.com/api/bots/update.md>
