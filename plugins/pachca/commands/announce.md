---
description: 'Draft an announcement for a Pachca chat in the right format and leave it as a draft or post it after review'
argument-hint: '<chat> <what to announce>'
---

# Pachca announcement

Prepare a Pachca announcement: $ARGUMENTS

Follow the `pachca-messaging` skill.

1. Find the chat with `pachca_search_chats`; ask if the name matches several or is missing.
2. Write the text in the user's language and voice. Pachca message text renders bold, italic, strikethrough, links, inline code and code blocks; lists, tables and quotes do not render, so use short paragraphs and bold lead-ins. Mention people as `@nickname` only when they must act; `@all` only if the user asked for it.
3. Show the text and the target chat to the user.
4. After a clear yes, by default put it into the user's input box as a draft (`pachca_create_draft`), so they send it themselves. Send it right away (`pachca_send_message`) only if the user asked to post. With a scheduled time, use a scheduled draft as the skill describes.

Never post without the user's explicit yes.
