---
name: thread-summary
description: 'Пересказать тред Пачки целиком: контекст, решения, открытые вопросы и поручения, со ссылками. Когда: «перескажи тред», «о чём договорились в треде», «кратко по треду», "summarize this thread", "what was decided in the thread". Not for: turning action items into reminders → tasks-from; a digest of chats for a period → digest.'
argument-hint: '<thread link, message link or thread id>'
disable-model-invocation: true
---

# Summarize a Pachca thread

Summarize the Pachca thread the user gave with the command: a thread link, a message link or a thread id. If there is none, ask for it.

Follow the `pachca-search` skill and its thread procedure. A link can name the thread itself (`thread_id`), the message the thread hangs under (`thread_message_id`), or a single message (`sidebar_message` or `message`); that message can be the one the thread hangs under, a comment inside the thread or a message with no thread. For a thread id or a `thread_id` link, `pachca_get_thread` gives the thread's `chat_id` and `message_id`. Otherwise find the thread chat with the "Find the thread chat" table in the skill's `references/threads.md`. A message with `thread` is the parent itself: its `id` is the thread's `message_id`. A comment inside a thread has no `thread`: its own `chat_id` is the thread chat, and its `entity_id` is the thread id, so `pachca_get_thread` by `entity_id` gives the thread's `message_id`. If the message has no thread (`thread` is `null` and its `entity_type` is not `thread`), say so and do not create one. Read the thread chat by its `chat_id`, not the parent chat.

1. Read every message of the thread (`pachca_list_chat_messages` by the thread's `chat_id`, all pages, oldest first: pass `sort=id` together with `order=asc` on every call, cursor pages included, because `order` alone is ignored; or read newest first and reverse; check the order by `created_at`) and the parent message (`pachca_get_message` by the thread's `message_id`). A standalone thread has no parent: its `message_id` is `null`, so skip that call.
2. Resolve each author once (`pachca_get_user`) when the response does not name them. A `404` means the author was deleted or is hidden from you: refer to them by `user_id`, do not guess a name from the text, and keep their messages in the summary.
3. Answer in the user's language:
   - **Context**: what the thread is about, in two or three sentences;
   - **Decisions**: what was agreed, who agreed, link to the message;
   - **Open questions**: what is still unanswered and who should answer;
   - **Action items**: what, who, by when, if the thread says so.

   Later messages override earlier ones. Quote nothing you did not read.

Do not post the summary unless the user asks. If they ask, show the text first and post after a clear yes, following the `pachca-messaging` skill. To turn action items into reminders, use the `tasks-from` command (`/pachca:tasks-from` in Claude Code).
