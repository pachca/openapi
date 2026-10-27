---
name: announce
description: 'Draft an announcement for a Pachca chat in the right format and leave it as a draft or post it after review'
argument-hint: '<chat> <what to announce>'
disable-model-invocation: true
---

# Pachca announcement

Prepare the Pachca announcement the user described with the command: the chat and what to announce. If either is missing, ask for it.

Follow the `pachca-messaging` skill.

1. Find the chat with `pachca_search_chats`, passing `active: true` so archived chats, where nobody can write, drop out; ask if the name matches several or is missing. Search also returns public chats the user has not joined: there, and in a channel where they are only a subscriber, both a draft and a message answer `403`. On `403`, tell the user which chat it is and why; do not add them to the chat or pick another chat without asking.
2. Write the text in the user's language and voice. Pachca message text renders bold, italic, strikethrough, links, inline code and code blocks; lists, tables and quotes do not render, so use short paragraphs and bold lead-ins. Mention people only when they must act. In a draft, write `@nickname` (the `nickname` field of the employee's profile): a draft keeps `<@user_id>` as typed, so the person would not be mentioned when the user sends it. A message you send or schedule also accepts `<@user_id>`, which becomes `@nickname`. Use `@all` or `@here` only if the user asked for it. In a thread a mention adds the person to that thread, so ask first.
3. Show the user the text and the target chat. For a scheduled message, also show the first send time with its UTC offset and the repetition: once, or how often and until when (without an end date it repeats indefinitely). It goes out by itself, and nobody reviews it then.
4. After a clear yes, by default put it into the user's input box as a draft (`pachca_create_draft`), so they send it themselves. Send it right away (`pachca_send_message`) only if the user asked to post. With a scheduled time, use a scheduled draft as the skill describes.

Never post without the user's explicit yes.
