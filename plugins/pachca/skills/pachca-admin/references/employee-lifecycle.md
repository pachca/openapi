# Employee lifecycle

Inviting, guests, role changes, someone else's status, offboarding. All of it
needs the Owner or an Administrator; a bot token cannot do it.

## Invite an employee

Tool `pachca_create_user`, CLI `pachca users create`. It creates the employee
and emails an invitation.

1. Confirm the email, name and role with the person. Roles at creation:
   `admin`, `user`, `multi_guest`, `guest`. Ask if the role is unclear.
2. If the email already exists in the workspace, the call returns `409`.
3. A taken nickname is not an error: random characters are appended silently.
   Report the nickname from the response, not the one you sent.
4. Pre-creating accounts before SSO login: pass `skip_email_notify: true`, no
   email is sent.
5. Free workspaces (trial included) have a daily email quota shared by
   invitations and email-change letters. Over it the call returns `422` with
   `daily_invites_limit`, the remaining quota and reset time are in `payload`,
   and nobody is created. `skip_email_notify: true` does not spend the quota.
   The number is on the [limits page](https://dev.pachca.com/api/limits.md).
6. Optional at creation:
   - `list_tags` puts the employee into those tags and into every chat bound to
     them. An unknown name creates a new tag, so check spelling first.
   - `chat_ids` adds them to chats right away.
   - `custom_properties` take field ids from the custom fields list
     (`pachca_list_custom_fields`).
7. The avatar is set afterwards with a separate method.

## Guests and multi-guests

- A guest is created only at invitation: `role: "guest"` plus `chat_ids` with
  exactly one active chat where the token may add members. Otherwise `400` on
  `chat_ids`. Tags are never assigned to a guest (the response succeeds with an
  empty `list_tags`).
- The guest role cannot be set later: turning an employee into a guest returns
  `403`. Decide at invitation time.
- A guest cannot use the API, CLI or authorize bots. A multi-guest can (personal
  tokens, CLI), sees only chats they were added to, and cannot create chats,
  leave chats, add members or create bots.

## Change a workspace role

Tool `pachca_update_user`, CLI `pachca users update`, field `role`: `admin`,
`user` or `multi_guest`.

- Confirm first. An unknown role value is skipped silently with a success
  response: re-read the employee to verify.
- The Owner's role cannot be changed by anyone else, and the Owner cannot be
  turned into anything but `admin`.
- Tokens follow the new role on the very next request. After a demotion, scopes
  the new role lacks return `403 role_forbidden`; restoring the role restores
  access. Reissuing tokens is not needed.
- Chat roles do **not** follow. A new Administrator becomes chat Admin only in
  chats joined afterwards. For existing chats, a chat Creator or Admin changes
  the role (`pachca_update_member_role`).
- On Corporation the change is logged as `user_role_changed` with the previous
  role, the new role and the initiator.

## Set someone else's status (vacation, away)

Tool `pachca_update_user_status`, CLI `pachca users update-status`. Owner and
Administrator only; a bot cannot, even with the scope.

- `is_away` turns on "away" mode, `away_message` is what people see when they
  try to reach the employee.
- Only the fields you send are overwritten: extend a status by sending just
  `expires_at`.
- A deadline said in words goes to `expires_at`, not into the caption. It is
  computed in the time zone of the employee who gets the status.
- Emoji and caption are required only when there is no status yet. Exactly one
  emoji, no text around it; caption up to 50 characters.
- Removing (`pachca_delete_user_status`) also clears away mode; it returns
  `204` even if there was no status.
- Changing your own status is a different method available to everyone.

## Offboarding

Default to suspension; delete only when the person confirms the removal is
final.

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

Order of work:

1. Confirm: suspend or delete, and which employee (show name and email).
2. Find chats they created: `owner_id` in the chat list. A regular list shows
   only chats the token sees; the Owner on Corporation sees all discussions and
   channels, closed ones included, in the workspace chat list.
3. For each such chat, check another chat Admin remains (member list filtered
   by `role=admin`). If none, add the Owner or an Administrator: they join as
   chat Admin. In a closed chat only a participant can add them, and a closed
   chat with no active participants left cannot get anyone via the API.
4. If tasks where they are the only performer matter, reassign them before a
   deletion.
5. Suspend or delete (`pachca_update_user` with `suspended`, or
   `pachca_delete_user`). The Owner cannot be deleted (`403`). A repeated
   delete returns `404`.
6. Tokens: ask an Administrator to revoke the employee's access on the
   **All tokens** tab (Integrations > API). Suspended employees' tokens revive
   if access returns, so revoke them too. There is no tool for this tab.
7. Optional on Corporation: the Owner reviews their recent logins and token
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
