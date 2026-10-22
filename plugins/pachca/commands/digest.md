---
description: 'Digest of Pachca channels or chats for a period, ready to read or to post after review'
argument-hint: '<chats> [period]'
---

# Pachca digest

Build a digest of these Pachca chats for this period: $ARGUMENTS

Follow the `pachca-search` skill and its digest procedure. If no period is given, take the last seven days and say so. Find each chat by name with `pachca_search_chats`, and ask when a name matches several.

1. For each chat read every message of the period: `pachca_list_chat_messages`, newest first, until `created_at` is older than the start. Read the threads that moved in the period too (`pachca_list_threads`, then each thread chat).
2. Group by topic, not by chat order. For each topic: what happened, what was decided, what is still open, with links.
3. Keep it short: a reader should get the week in a minute. Message text in Pachca does not render lists or tables, so if the digest will be posted, shape it as short paragraphs with bold lead-ins.

Show the digest to the user. Post it only if they ask, and only to a chat whose members can see every source chat: a digest must not carry messages from private chats to a wider audience. Before posting, show the final text and wait for a clear yes; prefer a draft (`pachca_create_draft`) when the user wants to edit it in Pachca. Follow the `pachca-messaging` skill.
