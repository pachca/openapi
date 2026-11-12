# New workspace

«Подготовь Пачку к работе команды», «настрой новое пространство»: the Owner or
an Administrator has just created the workspace and wants it ready for the
team. This is a mass change, so it runs on one plan the person confirms.

## Recognise it

If `pachca_list_chats` returns only the chat with yourself, the workspace is
new. If there are already chats, tags or employees, build on them: list the
open chats with `pachca_list_chats` and `availability: public` (without it you
see only the chats you are in), the tags with `pachca_list_tags` and the
employees with `pachca_list_users`, and propose only what is missing.

## Propose the plan in one message

Offer the starter set the description of `pachca_list_chats` names, and write
out the first message of each chat in full: one text for the channel, one for
the informal chat and one for the team chats with the team's name in it. A
table, list or file of emails and teams the person gives you counts.

One «да» to this message covers the whole plan, these texts included. Anything
outside it, such as an extra chat, an Administrator nobody asked for or a
changed text, needs its own question.

## Order

The rules for each field are in the tool descriptions: names, `channel` and
`public`, `role`, `list_tags`, `custom_properties`. Names you choose go in the
language of the request, with no `#` in front, and an existing tag goes in
under its name as Pachca returns it.

1. **Tags.** One per team (`pachca_create_tag`).
2. **Chats.** `pachca_create_chat`: a channel for announcements, open chats for
   what every employee should see. Bind each team's tag to its chat
   (`pachca_add_tags_to_chat`). Everyone with the tag joins, including people
   who get the tag later, so tags fill the chats and no chat needs a members
   list. Employees find an open chat themselves under «Обзор» > «Открытые
   беседы и каналы».
3. **Invitations.** `pachca_create_user` with `email`, and `list_tags`,
   `chat_ids` for chats without a tag and `role` in the same call. The
   invitation goes to that address, and a nickname or a phone number invites
   nobody.
   - A free workspace, the trial included, sends a limited number of invitation
     emails a day, invitations from the web interface counted too
     ([limits](https://dev.pachca.com/api/limits.md)). When the limit runs out,
     ask before creating people without an email (`skip_email_notify: true`).
4. **First message.** In each chat post its text from the plan, then pin it
   (`pachca_pin_message`).
5. **Profile fields.** Fill `custom_properties` as the tool description says,
   and ask before rounding a fraction.
6. **Bots.** Offer an incoming webhook for notifications from another system.
   For a bot with buttons or forms, point to
   [n8n](https://dev.pachca.com/guides/n8n/overview.md).

Report what was created and what the invited people will get by email.

## Workspace settings and the invite link

- `pachca_get_company` shows the workspace name, plan, owner and settings.
  `pachca_update_company` (Owner or Administrator) renames the workspace and
  turns «Использовать сквозные треды» and showing personal data on or off.
- `pachca_get_invite_link` gives your own invite link, the one in «Участники» >
  «Добавить участника»: each Administrator has their own, valid for 14 days.
  With under an hour left, the call issues a new one and the old one stops
  working. Someone who joins by the link gets the role «Сотрудник» with no tags
  and no group chats: give them their tag afterwards with `pachca_update_user`.
- `pachca_reissue_invite_link` issues a new link and stops your old one at
  once, even one already sent: tell the person.

Of the workspace settings, the tools change only the name, showing personal
data and cross-chat threads. Only in the web interface, so tell the person
where and do not look for a tool: every other workspace setting, such as the
avatar and who may create tokens and integrations, and a new custom field (the
API fills only existing ones). Exporting personal chats is turned on by Pachca
support at the owner's request.
