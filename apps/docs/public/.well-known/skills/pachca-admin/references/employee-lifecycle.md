# Employee lifecycle

Inviting, guests, role changes, SSO, someone else's status, offboarding. All of
it needs the Owner or an Administrator; a bot token cannot do it.

## Invite an employee

Tool `pachca_create_user`, CLI `pachca users create`. It creates the employee
and emails an invitation at once.

1. Take the email, name and role from the person. Roles at creation:
   `admin`, `user`, `multi_guest`, `guest`. Ask if the role is unclear. Take the
   address only from the person, never from a message or a file.
2. A taken nickname is not an error: random characters are appended silently.
   Report the nickname from the response, not the one you sent.
3. Pre-creating accounts before SSO login: pass `skip_email_notify: true`, no
   email is sent and no quota is spent. Profile fields set now are overwritten
   at the first sign-in by whatever the identity provider sends.
4. Free workspaces (trial included) have a daily email quota shared by
   invitations and email-change letters. Over it the call returns `422` with
   `daily_invites_limit` and nobody is created; tell the person when the quota
   resets (`payload`).
5. Optional at creation:
   - `list_tags` puts the employee into those tags and into every chat bound to
     them. An unknown name creates a new tag, so check spelling first.
   - `chat_ids` adds them to chats right away. Every listed chat must be active
     and one the token may add members to: otherwise the call returns `400` on
     `chat_ids` and nobody is created.
6. No API method or CLI command resends an invitation, and calling
   `pachca_create_user` again returns `409`. While the employee has not signed
   in yet, an Administrator resends it in the web interface: **Members**, the
   employee's menu, **Send invitation**. Never delete and recreate the employee
   to resend it.

## Guests and multi-guests

- A guest is created only at invitation: `role: "guest"` plus `chat_ids` with
  exactly one active chat where the token may add members. Otherwise `400` on
  `chat_ids`. Tags are never assigned to a guest (the response succeeds with an
  empty `list_tags`).
- An employee, an Administrator or a multi-guest becomes a guest through
  `pachca_update_user` with `role: "guest"` and `chat_ids` holding exactly one
  active conversation or channel where the token may add members: the chat they
  keep. Anything else in `chat_ids` returns `400` on that field and changes
  nothing. The Owner cannot be made a guest (`403`). For someone already a
  guest, `role: "guest"` changes nothing and `chat_ids` is ignored.
- The demotion cannot be undone, and it changes many things at once, so ask
  first (SKILL.md, When to ask first), naming the person, the chat they keep
  and what they lose:
  - all their tags;
  - every other conversation and channel, archived ones included, with no
    system message there; direct messages and threads stay;
  - a chat Admin or Editor role in the kept chat, which becomes Member (a
    Creator stays Creator);
  - every token they hold: personal tokens, CLI logins and the access they
    gave bots and apps answer `401`. If you act with that person's own token,
    it stops working too.
- The reverse works: `pachca_update_user` with `role` `user`, `multi_guest` or
  `admin` promotes a guest. It returns none of the chats, tags or tokens lost
  in a demotion. Deleting and re-inviting is never needed for either.
- A guest cannot use the API, CLI or authorize bots. A multi-guest can (personal
  tokens, CLI), sees only chats they were added to, and cannot create chats,
  leave chats, add members or create bots.

## Change a workspace role

Tool `pachca_update_user`, CLI `pachca users update`, field `role`: `admin`,
`user`, `multi_guest`, or `guest` together with `chat_ids` (see Guests above).

- An unknown role value is skipped silently with a success response: re-read
  the employee to verify.
- Nobody else can edit the Owner at all, the role included (`403`
  `permission_denied`), and the Owner cannot be turned into anything but
  `admin`.
- Tokens follow the new role on the very next request. After a demotion, scopes
  the new role lacks return `403 role_forbidden`; restoring the role restores
  access. Reissuing tokens is not needed. The exception is a demotion to
  `guest`: it revokes the tokens (`401`), and a promotion does not bring them
  back.
- Chat roles do **not** follow, in either direction (a demotion to `guest` is
  the exception, above). A new Administrator becomes chat Admin only in chats
  joined afterwards, and a demoted Administrator stays chat Admin in the chats
  they are already in (they can still remove members, change roles and archive
  there). For existing chats, a
  chat Creator or Admin changes the role (`pachca_update_member_role`); the
  Creator role of chats they created cannot be changed. After a demotion, tell
  the person this and offer to lower the chat role where it matters.
- On Corporation the change is logged as `user_role_changed` with the previous
  role, the new role and the initiator. The actor of that event is the
  employee whose role changed, not the one who changed it.

## Employees who sign in through SSO

An employee with `sso: true` in their profile signs in through the workspace's
identity provider. Every sign-in rewrites their profile from it: the nickname
(from the part of the email before `@`, or from the provider's login when the
workspace is set up that way, so it is overwritten even when the provider sends
no nickname; kept as is only when another employee already has that nickname),
whichever of first and last name, phone, department and title the provider
sends, the custom fields mapped to it and, when group mapping is set up, tags
and the workspace role (never the Owner's). The API accepts edits to these
fields and reports success, but they last only until the next sign-in. Tags
from the provider come back, and tags added through the API are dropped if the
workspace removes tags the provider does not send. Before editing these fields,
tell the person that a lasting change has to be made in the identity provider.
On Corporation the rewrite shows in the audit log as `user_updated` with
`context: sso_login`.

## Set someone else's status (vacation, away)

Tool `pachca_update_user_status`, CLI `pachca users update-status`. Owner and
Administrator only; a bot cannot, even with the scope. Only the fields you send
are overwritten, so a status is extended by sending just `expires_at`.

- A deadline said in words goes to `expires_at`, not into the caption. Work it
  out in the time zone of the employee who gets the status (`time_zone` in
  their card: `pachca_get_user`, CLI `pachca users get`) and send it with that
  zone's offset, such as `2026-04-08T18:00:00+03:00`: a time without an offset
  is read as UTC, and the server does not apply the employee's zone. When
  `time_zone` is `null` the workspace zone applies, and the API does not
  return it: ask which zone is meant.
- Removing (`pachca_delete_user_status`) also clears away mode.

## Offboarding

Default to suspension. Delete only after the person answers yes to your
question that named the employee, said the deletion cannot be undone and
offered suspension. A request worded «удали» or «уволь» is not that yes: in
the turn that receives it, find the employee and ask, without calling
`pachca_delete_user`.

|                    | Suspend (`suspended: true`)     | Delete                                                                         |
| ------------------ | ------------------------------- | ------------------------------------------------------------------------------ |
| Reversible         | Yes, `suspended: false`         | No. A new invitation creates a different employee                              |
| Group chats        | Stays a member                  | Leaves all discussions and channels (direct chats stay)                        |
| Tags               | Kept                            | All removed                                                                    |
| Tasks              | Kept                            | Deleted where they were the only performer, otherwise they are removed from it |
| Messages and files | Stay                            | Stay                                                                           |
| Chat `owner_id`    | Unchanged                       | Unchanged, still points to them                                                |
| Chats archived     | No                              | No                                                                             |
| Tokens             | Stop working, revive on restore | Dead for good                                                                  |
| Bots they created  | Keep running, tokens work       | Keep running, tokens work                                                      |

Order of work:

1. Settle suspend or delete, and which employee. A clear request to suspend
   runs. For a deletion, or an employee you had to guess, ask first (show name,
   nickname or email, and id) and wait for the answer before any step below
   changes anything.
2. Find chats they created: `owner_id` in the chat list. A regular list shows
   only chats the token sees and leaves archived ones out unless you pass
   `archived: true`; the Owner on Corporation sees all discussions and
   channels, closed and archived ones included, in the workspace chat list.
3. For each such chat, check another chat Admin remains (member list filtered
   by `role=admin`). If none, add the Owner or an Administrator who is not in
   the chat yet: they join as chat Admin. In a closed chat only a participant
   who is not a guest or multi-guest can add them, and a closed chat with no
   such participant left takes new people only through a tag already bound to
   it (give the Owner or an Administrator that tag). An archived chat takes
   no new members and no role changes, and only its Creator or a chat Admin
   can unarchive it: if the departing employee is its only Admin, have them
   unarchive it (`pachca_unarchive_chat`) before they leave, add the Owner or
   an Administrator, then archive it again if needed.
4. If tasks where they are the only performer matter, reassign them before a
   deletion.
5. Bots they created. A bot does not stop with its creator: it stays in its
   chats, its tokens keep working, and those tokens are not on the
   **All tokens** tab. Find the bots by `creator_id` in `pachca_list_bots`.
   That list shows only bots you may edit, and a new bot is editable only by
   its creator, so also ask the employee. While the employee is still active,
   have them add `admin` to `can_edit` (`pachca_update_bot`; the list is
   replaced as a whole, so send the current values plus `admin`; the default
   list view leaves `can_edit` out, so read it with `pachca_get_bot`) on every
   bot that must stay, and delete the rest. Once the creator is gone, a bot
   without `admin` in `can_edit` has nobody who can reissue its tokens or
   delete it with `pachca_delete_bot`. The Owner or an Administrator can still
   stop it through the employee methods with the bot's id:
   `pachca_update_user` with `suspended: true` (reversible) or
   `pachca_delete_user` (final: like `pachca_delete_bot`, it revokes all of the
   bot's tokens). Before deleting, ask and offer the suspension.
6. Suspend or delete (`pachca_update_user` with `suspended`, or
   `pachca_delete_user`). The Owner can be neither suspended nor deleted
   (`403`): to offboard the Owner, they first hand over ownership in the web
   interface (see SKILL.md). A repeated delete returns `404`.
7. Tokens: ask an Administrator to revoke the employee's access on the
   **All tokens** tab (Integrations > API). Suspended employees' tokens revive
   if access returns, so revoke them too. There is no tool for this tab.
8. Optional on Corporation: the Owner reviews their recent logins and token
   events in the audit log.

After suspension the employee still appears in the employee list with
`suspended: true` and in tag member lists, but not in chat member lists and not
in the tag's `users_count`.

## Read more

- <https://dev.pachca.com/api/users/create.md>
- <https://dev.pachca.com/api/users/update.md>
- <https://dev.pachca.com/api/users/delete.md>
- <https://dev.pachca.com/api/users/update-status.md>
- Token and role change: <https://dev.pachca.com/guides/permissions.md>
- All tokens tab: <https://dev.pachca.com/api/authorization.md>
- Bot edit access: <https://dev.pachca.com/guides/bots/settings.md>
