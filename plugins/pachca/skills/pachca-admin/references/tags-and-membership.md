# Tags and chat membership

## How tags work

A tag is a named group of employees ("Design", "On call") that lives in the
workspace, not in a chat. Bound to a discussion or channel, it keeps that
chat's members in sync: give an employee the tag and they join every chat of
the tag; take it away and they leave the chats it brought them into. Only
active discussions and channels take tags: archiving a chat unbinds all its
tags (the people they brought stay as ordinary members), and unarchiving does
not bring the tags back.

| Who                                                        | Can                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------ |
| Owner, Administrator, Employee, bot                        | Read tags and their members                            |
| Owner, Administrator                                       | Create, rename, delete tags; change an employee's tags |
| Participant of a closed chat, any employee in an open chat | Bind a tag to the chat                                 |
| Chat Creator or Admin                                      | Remove a tag from the chat                             |

Guests and multi-guests cannot bind tags (`403`). A multi-guest reads only the
tags of active discussions and channels they are in (other tags return `404`)
and cannot list a tag's members (`403`).

## Give an employee a tag

There is no "add to tag" call. Tags are the `list_tags` field of the employee
(`pachca_update_user`, CLI `pachca users update`): a list of tag **names** that
replaces the whole set. An empty list removes all tags. One employee per call.
A guest (role `guest`) cannot be tagged: the field is ignored and the call
still returns `200`, so check `list_tags` in the response. A multi-guest can be
tagged.

1. Read the employee (`pachca_get_user`) and take the current `list_tags`.
2. Check the new name exists: `pachca_list_tags` with `names` (up to 100 names
   per request). An unknown name silently creates a new tag.
3. Show the person the change: "adds Design, keeps Sales and Moscow".
4. Send the merged list. Dropping a tag pulls the employee out of the chats it
   brought them into, unless another of their tags keeps them there.

A bot can be tagged only if any employee may add it to chats and its "limit to
one chat" setting is off; otherwise the update returns `422` and changes
nothing. Conditions: [bot settings](https://dev.pachca.com/guides/bots/settings.md).

## Bind a tag to a chat

At creation pass `group_tag_ids` to the new chat; for an existing chat use
`pachca_add_tags_to_chat` (CLI `pachca members add-group-tags`). Binding takes
effect in the same request. At creation an id that is not a tag of the
workspace does not stop the request: the chat is created with the other tags,
and such ids come back in `meta.not_found_group_tag_ids` (an empty array when
every tag was bound). Report them. On an existing chat, if any tag id is not
found, `pachca_add_tags_to_chat` returns `404` and binds none. A tag already
bound is not bound twice, but its members are still loaded into the chat.
Current tags of a chat are in `group_tag_ids`.

Prefer a tag over adding a department member by member: the chat then follows
the team on its own.

## Remove someone who came in by a tag

Removing such a member one by one does not work: member removal returns `204`
and the member stays; leaving the chat returns `403`. Choose with the person:

- take the tag off the employee (`list_tags`): they leave the chats this tag
  brought them into, not only this one. Chats they created, chats another of
  their tags keeps them in and chats they were added to by hand keep them;
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
first. Removal runs in the background, so wait until the tag id is gone from
the chat's `group_tag_ids` (`pachca_get_chat`), then delete the tag. If you
delete it earlier, everyone stays in the chat as an ordinary member.

## Tag names

When a tag is created (`pachca_create_tag`) or renamed (`pachca_update_tag`),
the name must be up to 255 characters, unique in the workspace regardless of
case, without `@`, and not `here` or `all`. An empty name or one of only
spaces returns `400` with `blank`. Create and rename store the name exactly as
sent, so trim it first. A taken name returns `400` with `taken`
(`409` only for a simultaneous duplicate). Renaming keeps members and bindings.

Names sent in `list_tags` are trimmed at the edges, and repeats that differ
only in case count once. A new name there is checked only for `@`, so keep
`here`, `all` and over-long names out of `list_tags` yourself.

`users_count` counts active tag members, tagged bots included; the tag member
list also returns suspended employees, so it can be longer than `users_count`.
Bots in the list carry `bot: true`.

## Chat members

- **Add** (`pachca_add_members`, CLI `pachca members add`): to a discussion,
  channel or thread. Any employee can add to an open chat without being in it;
  in a closed chat any participant except guests and multi-guests. One unknown
  or inactive id makes the whole call fail and nobody is added; people already
  in the chat are skipped silently and keep their role. Bots follow their "who
  can add the bot" setting.
- **Chat role** (`pachca_update_member_role`, CLI `pachca members update`):
  `admin`, `editor` (channels only) or `member`. Needs chat Creator or Admin.
  Not for yourself, not for the Creator, and setting the same role again is an
  error (`already_assigned`), not a no-op.
- **Remove** (`pachca_remove_member`, CLI `pachca members remove`): chat Creator
  or Admin. The Creator cannot be removed.
- **Archived chat**: nobody manages members, the Creator included. Archiving
  removes guests (role `guest`; multi-guests stay) and unbinds tags;
  unarchiving restores neither.

## Take over a chat whose admins are gone

The Creator role cannot be transferred. Add the Owner or an Administrator who
is not in the chat yet: they join as chat Admin and can manage settings,
members, roles and archiving. Someone already in the chat is skipped silently
and keeps their current role, even the Owner, so confirm the result with the
member list filtered by `role=admin` (`pachca_list_members`). Any employee can
add them to an open chat; in a closed chat only a participant who is not a
guest or multi-guest can. A closed chat with no such active participant left
takes new people only through a tag already bound to it: giving the Owner or
an Administrator that tag brings them in as chat Admin.

## Workspace inventory

- Any employee: the chat list with `availability=public` returns all open
  discussions and channels; archived chats only with `archived=true`. Closed
  chats the token is not in never appear.
- Owner on Corporation: the workspace chat list (`pachca_list_company_chats`,
  CLI `pachca chats list-company`) returns all discussions and channels,
  closed ones included, active and archived (filter with `activity`). No direct
  chats, no threads. An Administrator gets `403`.
- Members of any chat: the Owner can list members of any chat on any plan,
  messages are not revealed. Administrators and bots only see members of chats
  they are in and of open chats.
- Bots: the bot list returns only bots you may edit, for every role. The Owner
  on Corporation gets all bots via the workspace bot list; for bots they cannot
  edit only the name and nickname are filled.
- Each workspace list call is written to the audit log (`company_chats_accessed`,
  `company_bots_accessed`). Both share a per-token rate limit much stricter
  than other methods ([limits](https://dev.pachca.com/api/limits.md)): spread a
  large walk over time.
- Contents of closed chats the token is not in come only through the message
  export (`pachca_request_export`, CLI `pachca chats request-export`, Owner on
  Corporation). Members read a closed chat's messages as usual
  (`pachca_list_chat_messages`).

## Read more

- <https://dev.pachca.com/guides/tags.md>
- <https://dev.pachca.com/guides/permissions.md>
- <https://dev.pachca.com/api/members/add.md>
- <https://dev.pachca.com/api/members/update.md>
- <https://dev.pachca.com/api/members/remove-group-tag.md>
- <https://dev.pachca.com/api/chats/list-company.md>
