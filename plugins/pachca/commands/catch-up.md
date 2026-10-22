---
description: 'What I missed in Pachca: mentions, moved threads and busy chats for a period, with links'
argument-hint: '[period, e.g. "since yesterday" or "this week"]'
---

# Catch up on Pachca

Catch the user up on Pachca for this period: $ARGUMENTS

Follow the `pachca-search` skill. If no period is given, take the time since the start of the previous working day in the user's time zone and say which window you took. Pachca has no unread counter, so "what I missed" is always a time window.

1. Get the user's id and nickname with `pachca_get_my_card`.
2. Find messages that mention the user in the window: `pachca_search_messages` with the nickname as the query and `created_from` / `created_to`. Read every page.
3. Find threads that moved in the window: `pachca_list_threads` with `last_message_at_after`. For each, read the new messages in the thread chat by its `chat_id`.
4. Find chats with new messages: `pachca_list_chats` with `last_message_at_after`. Read only what is new in each.
5. Answer in the user's language, most important first:
   - **Needs you**: direct questions to the user, requests, mentions waiting for an answer;
   - **Decided**: decisions and changes that affect the user;
   - **FYI**: the rest, one line per chat or thread.

   Give every item a link (`url` from the message) and the author's name.

Do not post anything to Pachca. If the user wants to reply, hand over to the `pachca-messaging` skill.
