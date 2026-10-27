---
name: digest
description: 'Digest of Pachca channels or chats for a period, ready to read or to post after review'
argument-hint: '<chats> [period]'
disable-model-invocation: true
---

# Pachca digest

Build a digest of the Pachca chats the user named with the command, for the period they gave.

Follow the `pachca-search` skill and its digest procedure. If no period is given, take the last seven days and say so. Find each chat by name with `pachca_search_chats`, and ask when a name matches several.

1. For each chat read every message of the period: `pachca_list_chat_messages`, newest first, until `created_at` is older than the start. Read the threads of these chats that moved in the period too: `pachca_list_threads` with `last_message_at_after` set to the start of the period, every page, keep only threads whose `message_chat_id` is one of the chats, and read each one by its own `chat_id`. That list skips threads of public chats you have not joined, unless you are a member of the thread itself. For such a chat, also take the threads from `thread.chat_id` of the messages you read, and say in the digest that its other threads under older messages may be missing.
2. Write it up as the digest procedure says: per chat, most important first, with the message link after each point. End with the window you used, what you covered and what you could not see.
3. Keep it short: a reader should get the week in a minute. Message text in Pachca does not render lists or tables, so if the digest will be posted, shape it as short paragraphs with bold lead-ins.

Show the digest to the user. Post it only if they ask, and only to a chat whose members can see every source chat: a digest must not carry messages from private chats to a wider audience. Before posting, show the final text and wait for a clear yes; prefer a draft (`pachca_create_draft`) when the user wants to edit it in Pachca. Follow the `pachca-messaging` skill.
