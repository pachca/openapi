# Tags and chat membership

## How tags work

A tag is a named group of employees ("Design", "On call") that lives in the
workspace, not in a chat. Bound to a discussion or channel, it keeps that
chat's members in sync: give an employee the tag and they join every chat of
the tag; take it away and they leave those chats. Only active discussions and
channels take tags; an archived chat's tags do not change.

| Who                                                        | Can                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------ |
| Owner, Administrator, Employee, bot                        | Read tags and their members                            |
| Owner, Administrator                                       | Create, rename, delete tags; change an employee's tags |
| Participant of a closed chat, any employee in an open chat | Bind a tag to the chat                                 |
| Chat Creator or Admin                                      | Remove a tag from the chat                             |

Guests and multi-guests cannot bind tags (`403`). A multi-guest cannot list a
tag's members.

## Give an employee a tag

There is no "add to tag" call. Tags are the `list_tags` field of the employee
(`pachca_update_user`, CLI `pachca users update`): a list of tag **names** that
replaces the whole set. An empty list removes all tags. One employee per call.

1. Read the employee (`pachca_get_user`) and take the current `list_tags`.
2. Check the new name exists: `pachca_list_tags` with `names` (up to 100 names
   per request). An unknown name silently creates a new tag.
3. Show the person the change: "adds Design, keeps Sales and Moscow".
4. Send the merged list. Dropping a tag pulls the employee out of its chats.

A bot can be tagged only if any employee may add it to chats and its "limit to
one chat" setting is off; otherwise the update returns `422` and changes
nothing. Conditions: [bot settings](https://dev.pachca.com/guides/bots/settings.md).

## Bind a tag to a chat

At creation pass `group_tag_ids` to the new chat; for an existing chat use
`pachca_add_tags_to_chat` (CLI `pachca members add-group-tags`). Binding takes
effect in the same request. If any tag id is not found, the call returns `404`
and binds none. A tag already bound is not bound twice, but its members are
still loaded into the chat. Current tags of a chat are in `group_tag_ids`.

Prefer a tag over adding a department member by member: the chat then follows
the team on its own.

## Remove someone who came in by a tag

Removing such a member one by one does not work: member removal returns `204`
and the member stays; leaving the chat returns `403`. Choose with the person:

- take the tag off the employee (`list_tags`): they leave **all** chats of that
  tag;
- remove the tag from the chat (`pachca_remove_tag_from_chat`, CLI
  `pachca members remove-group-tag`): **everyone** held there only by this tag
  leaves. The chat Creator, people brought by another tag of the chat and
  people added by hand stay.

If two tags hold the employee in the chat, removing one is not enough.
Removing a tag from a chat runs in the background: the call returns `204` at
once and members change a moment later. Re-check with the member list.

## Remove a tag from a chat versus delete the tag

| Operation                        | Effect on chat members                                                                                                     |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Remove tag from chat             | Everyone held only by this tag leaves that chat                                                                            |
| Delete tag (`pachca_delete_tag`) | The tag disappears from all employees and chats; everyone stays in the chats as an ordinary member, no longer kept in sync |

To clear a team out of a chat and then drop the tag, remove it from the chat
first, then delete it.

## Tag names

Up to 255 characters, unique in the workspace regardless of case, no `@`, and
not `here` or `all`. Edges are trimmed. A taken name returns `400` with `taken`
(`409` only for a simultaneous duplicate). Renaming keeps members and bindings.

`users_count` counts active employees only; the tag member list also returns
suspended employees and tagged bots. The two numbers can differ.

## Chat members

- **Add** (`pachca_add_members`, CLI `pachca members add`): to a discussion,
  channel or thread. Any employee can add to an open chat without being in it;
  in a closed chat any participant except guests and multi-guests. One unknown
  or inactive id makes the whole call fail with `404` and nobody is added;
  people already in the chat are skipped silently. Bots follow their "who can
  add the bot" setting.
- **Chat role** (`pachca_update_member_role`, CLI `pachca members update`):
  `admin`, `editor` (channels only) or `member`. Needs chat Creator or Admin.
  Not for yourself, not for the Creator, and setting the same role again is a
  `400` error (`already_assigned`), not a no-op.
- **Remove** (`pachca_remove_member`, CLI `pachca members remove`): chat Creator
  or Admin. The Creator cannot be removed. In a closed discussion the removed
  member loses the chat but stays in threads they were in.
- **Archived chat**: nobody manages members, the Creator included. Archiving
  removes all guests and unbinds tags; unarchiving restores neither.

## Take over a chat whose admins are gone

The Creator role cannot be transferred. Add the Owner or an Administrator to
the chat: they join as chat Admin and can manage settings, members, roles and
archiving. Any employee can add them to an open chat; in a closed chat only a
participant (not a guest) can. A closed chat with no active participants left
cannot get anyone via the API.

## Workspace inventory

- Any employee: the chat list with `availability=public` returns all open
  discussions and channels; archived chats only with `archived=true`. Closed
  chats the token is not in never appear.
- Owner on Corporation: the workspace chat list (`pachca_list_company_chats`,
  CLI `pachca chats list-company`) returns all discussions and channels,
  closed ones included, active and archived (filter with `activity`). No direct
  chats, no threads. An Administrator gets `403`.
- Members of any chat: the Owner can list members of any chat, messages are not
  revealed. Administrators and bots only see members of chats they are in and of
  open chats.
- Bots: the bot list returns only bots you may edit, for every role. The Owner
  on Corporation gets all bots via the workspace bot list; for bots they cannot
  edit only the name and nickname are filled.
- Each workspace list call is written to the audit log (`company_chats_accessed`,
  `company_bots_accessed`). Both share a strict rate limit of about 30 requests
  per minute per token.
- Contents of closed chats come only through the message export.

## Read more

- <https://dev.pachca.com/guides/tags.md>
- <https://dev.pachca.com/guides/permissions.md>
- <https://dev.pachca.com/api/members/add.md>
- <https://dev.pachca.com/api/members/update.md>
- <https://dev.pachca.com/api/members/remove-group-tag.md>
- <https://dev.pachca.com/api/chats/list-company.md>
