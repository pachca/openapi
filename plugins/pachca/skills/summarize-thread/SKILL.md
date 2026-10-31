---
name: summarize-thread
description: 'Пересказать тред Пачки целиком: контекст, решения, открытые вопросы и поручения, со ссылками. Когда: «перескажи тред», «о чём договорились в треде», «кратко по треду», «что поправить по треду», «разбери замечания в треде», "summarize this thread", "what was decided in the thread", "what feedback is in the thread". Not for: turning action items into reminders, or a digest of chats for a period → pachca-search.'
argument-hint: '<thread links, message links or thread ids> [since when] [what to look for]'
disable-model-invocation: true
---

# Summarize a Pachca thread

Summarize the Pachca threads the user gave with the command: one or more thread links, message links or thread ids. If there is none, ask for it. With several, summarize each thread separately, in the order given. The user may add a window («с понедельника», «с моего последнего сообщения») and a question to answer («ответили ли мне», «что нужно поправить»).

Follow the `pachca-search` skill and its thread procedure. A link can name the thread itself (`thread_id`), the message the thread hangs under (`thread_message_id`), or a single message (`sidebar_message` or `message`); that message can be the one the thread hangs under, a comment inside the thread or a message with no thread. For a thread id or a `thread_id` link, `pachca_get_thread` gives the thread's `chat_id` and `message_id`. Otherwise find the thread chat with the "Find the thread chat" table in the skill's `references/threads.md`. A message with `thread` is the parent itself: its `id` is the thread's `message_id`. A comment inside a thread has no `thread`: its own `chat_id` is the thread chat, and its `entity_id` is the thread id, so `pachca_get_thread` by `entity_id` gives the thread's `message_id`. If the message has no thread (`thread` is `null` and its `entity_type` is not `thread`), say so and do not create one. Read the thread chat by its `chat_id`, not the parent chat.

1. Read every message of the thread (`pachca_list_chat_messages` by the thread's `chat_id`, all pages, oldest first: pass `sort=id` together with `order=asc` on every call, cursor pages included, because `order` alone is ignored; or read newest first and reverse; check the order by `created_at`) and the parent message (`pachca_get_message` by the thread's `message_id`). A standalone thread has no parent: its `message_id` is `null`, so skip that call.
2. Resolve each author once (`pachca_get_user`) when the response does not name them. A `404` means the author was deleted or is hidden from you: refer to them by `user_id`, do not guess a name from the text, and keep their messages in the summary.
3. Answer in the user's language:
   - **Context**: what the thread is about, in two or three sentences;
   - **Decisions**: what was agreed, who agreed, link to the message;
   - **Open questions**: what is still unanswered and who should answer;
   - **Action items**: what, who, by when, if the thread says so.

   Later messages override earlier ones. Quote nothing you did not read.

   With a window, read the whole thread for context but summarize only what is new in it. «Since my last message» starts at the user's own last message in the thread (its `user_id` is yours). With a question, end with a direct answer to it.

4. Remarks. When the question is about feedback («что нужно поправить», «какие замечания», «разбери отзывы»), the answer is a list rather than a retelling. For each remark: what is wrong, who said it, how it should be, the message link and its attachments; look at screenshots and files with `pachca_download_file`. When this session has the code or the task the thread is about, check each remark against it and mark it done, to fix or a separate task, saying what you checked; a remark you could not check is marked so. End by asking which remarks to take.

   Taking them is the user's next request, not part of this command: change the code as they ask, create tasks only in the tracker they name and through its own tools, and reply in the thread only when they ask, on the message the remark came from (`parent_message_id`), following the `pachca-messaging` skill.

Do not post the summary unless the user asks. If they ask, show the text first and post after a clear yes, following the `pachca-messaging` skill. To turn action items into reminders, the user asks for that, and you follow the reminders part of the `pachca-search` skill.
