---
description: 'Retell a whole Pachca thread: context, decisions, open questions and action items with links'
argument-hint: '<thread link, message link or thread id>'
---

# Summarize a Pachca thread

Summarize this Pachca thread: $ARGUMENTS

Follow the `pachca-search` skill and its thread procedure. A message link points at the parent message: get its thread and read the thread chat by the thread's `chat_id`, not the parent chat.

1. Read the parent message (`pachca_get_message`) and every message of the thread (`pachca_list_chat_messages` by the thread's `chat_id`, all pages, oldest first).
2. Resolve authors to names (`pachca_get_user`) when the response does not name them.
3. Answer in the user's language:
   - **Context**: what the thread is about, in two or three sentences;
   - **Decisions**: what was agreed, who agreed, link to the message;
   - **Open questions**: what is still unanswered and who should answer;
   - **Action items**: what, who, by when, if the thread says so.

   Later messages override earlier ones. Quote nothing you did not read.

Do not post the summary unless the user asks. If they ask, show the text first and post after a clear yes, following the `pachca-messaging` skill. To turn action items into tasks, use `/pachca:tasks-from`.
