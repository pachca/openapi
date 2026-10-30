---
name: catch-up
description: 'Собрать, что я пропустил в Пачке за период: упоминания, треды и чаты с новыми сообщениями, со ссылками. Когда: «что я пропустил», «что было, пока меня не было», «что нового со вчера», «что было за выходные», "what did I miss", "catch me up on Pachca". Not for: a digest of the chats you name → digest; one thread → thread-summary.'
argument-hint: '[period, e.g. "since yesterday" or "this week"]'
disable-model-invocation: true
---

# Catch up on Pachca

Catch the user up on Pachca for the period the user gave with the command.

Follow the `pachca-search` skill. If no period is given, take the time since the start of the previous working day in the user's time zone and say which window you took. The API gives neither an unread counter nor a list of unread messages, so "what I missed" is always a time window.

1. Get the user's id, first and last name, nickname and tags (`list_tags`) with `pachca_get_my_card`.
2. Find messages that mention the user in the window. A mention typed in the Pachca app shows in `content` as `@` followed by the user's first and last name from the profile, for example `@Anna Smirnova`. A mention sent through the API shows as `@nickname`. Run `pachca_search_messages` with `created_from` / `created_to` twice: once with the full name wrapped in quotes (an exact phrase), once with the nickname. Keep only hits whose `content` has `@First Last` or `@nickname` outside inline code and code blocks: the query also matches the name without `@`, other words that start with it and e-mail addresses, and a mention inside code notifies no one. Do the same for each tag in `list_tags`: a `@Tag` mention reaches every employee of the tag in that chat. Search `"@all"` and `"@here"` the same way: the query also matches the plain words "all" and "here", so keep only hits whose `content` has `@all` or `@here`. Read every page.
3. Find threads that moved in the window: `pachca_list_threads` with `last_message_at_after`, every page. For each, read the new messages in the thread chat by its `chat_id`, and pick out the mentions step 2 looks for there as well: that search skips standalone threads, threads under a direct chat and threads the user was added to without their parent chat, which is where a mention in a thread of a chat the user is not in puts them.
4. Find chats with new messages: `pachca_list_chats` with `last_message_at_after`, every page. Read only what is new in each: the feed has no date filter, so page `pachca_list_chat_messages` (newest first by default) until `created_at` is older than the window start, or call `pachca_search_messages` with these `chat_ids`, `created_from` / `created_to` and no query, every page. Search also returns the comments of those chats' threads: skip the ones you already read in step 3 (their `chat_id` is the thread's).
5. Answer in the user's language, most important first:
   - **Needs you**: direct questions to the user, requests, mentions waiting for an answer;
   - **Decided**: decisions and changes that affect the user;
   - **FYI**: the rest, one line per chat or thread.

   Give every item a link (`url` from the message) and the author's name.

Do not post anything to Pachca. If the user wants to reply, hand over to the `pachca-messaging` skill.
