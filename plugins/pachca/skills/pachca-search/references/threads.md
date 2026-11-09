# Reading a whole thread

A thread in Pachca is an object and a separate chat at once. It hangs under
a message, or stands alone (created without a message). Threads are
cross-cutting: an employee or a bot can be added to a thread without being
in its parent chat, and then sees the thread and the parent message only,
nothing else of that chat.

## The four ids

| Field             | What it is                                                      | Use it for                                                |
| ----------------- | --------------------------------------------------------------- | --------------------------------------------------------- |
| `id`              | The thread itself                                               | `pachca_get_thread`; writing with `entity_type: "thread"` |
| `chat_id`         | The thread's own chat, where its messages live                  | `pachca_list_chat_messages`, `pachca_list_members`        |
| `message_id`      | The parent message (`null` for a standalone thread)             | `pachca_get_message` for the parent                       |
| `message_chat_id` | The chat of the parent message (`null` for a standalone thread) | Context: which chat the thread belongs to                 |

On a message:

- `thread: { id, chat_id }` is set when the message **has** a thread (it is
  a parent). It is `null` otherwise, and also on messages that sit inside a
  thread.
- A message **inside** a thread has `entity_type: "thread"`, `entity_id`
  equal to the thread `id`, and `chat_id` equal to the thread chat. Its
  `root_chat_id` is the parent chat; in a standalone thread there is no
  parent chat, and `root_chat_id` equals `chat_id`, as on any message
  outside a thread. Recognise a thread comment by `entity_type: "thread"`.

## Find the thread chat from what you were given

| You have                                       | Do                                                                                                                                                                                                                                                                               |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A web link with `thread_id`                    | That number is the thread `id`: `pachca_get_thread` gives `chat_id` and `message_id`                                                                                                                                                                                             |
| A web link with `thread_message_id`            | That number is the parent message: `pachca_get_message`, then its `thread.chat_id`                                                                                                                                                                                               |
| A web link with `message` or `sidebar_message` | That is a message id: `pachca_get_message`; if it has `thread`, read `thread.chat_id`; if its `entity_type` is `thread`, its own `chat_id` is the thread chat                                                                                                                    |
| A web link with a number in the path           | `chats/<id>` is the chat the link opens, not the thread: with `thread_message_id` it is the parent's chat. Take the thread from the parameters above; with both `thread_message_id` and `sidebar_message`, the first is the parent and the second a comment in its thread        |
| A search hit with `thread` set                 | It is a parent: read `thread.chat_id`                                                                                                                                                                                                                                            |
| A search hit with `entity_type: "thread"`      | It is a comment: read its `chat_id`; for the parent, `pachca_get_thread` by `entity_id`, then `pachca_get_message` by `message_id`                                                                                                                                               |
| An item of `pachca_list_threads`               | `chat_id` directly                                                                                                                                                                                                                                                               |
| A topic only ("the thread about the release")  | `pachca_search_messages` with the topic words, then one of the rows above. Nothing found: it may be a thread that search skips without `chat_ids` (standalone, under a direct chat, or under a chat you are not in); search again with the `chat_id`s from `pachca_list_threads` |

Do not call `pachca_create_thread` to read a thread: the id of an existing
thread is already in the parent message's `thread` field. That tool creates
a thread when there is none.

## Procedure

1. Resolve the thread chat id (table above). With the CLI:
   `pachca threads get <id>`, `pachca messages get <id>`.
2. Read the feed: `pachca_list_chat_messages` with `chat_id` = the thread
   chat. For chronological order pass `sort=id` together with `order=asc`
   on every call, cursor pages included, or read newest first and reverse. CLI:
   `pachca messages list --chat-id=<id> --order=asc --all` (the CLI always
   sends `sort`). Follow the cursor to the end.
3. Fetch the parent message with `pachca_get_message` by `message_id`: the
   feed holds the comments, the parent sits in the parent chat. A
   standalone thread has no parent.
4. Need more context? Read the parent chat (`message_chat_id`) only if
   you have access to it. Being in the thread alone gives the thread and
   the parent message, nothing else of that chat.
5. Answer what was asked: a retelling, an account of a problem or a list
   of remarks, as in the next section.

## A retelling, an account of a problem or a list of remarks

Given several threads, take each one separately, in the order given. For
a link to a message without a thread (`thread` is `null` and its
`entity_type` is not `thread`), say that the message has no thread and do
not create one.

Resolve each author once with `pachca_get_user` when the response does not
name them. A `404` means the author was deleted or is hidden from you:
refer to them by `user_id`, do not guess a name from the text, and keep
their messages in the answer.

**A retelling** has four parts, in the user's language:

- **Context**: what the thread is about, in two or three sentences;
- **Decisions**: what was agreed, who agreed, the message link;
- **Open questions**: what is still unanswered and who should answer;
- **Action items**: what, who, by when, if the thread says so.

Later messages override earlier ones, and what counts as a decision is in
[digests.md](digests.md). Quote nothing you did not read. With a window,
read the whole thread for context but retell only what is new in it. «С
моего последнего сообщения» starts at the user's own last message in the
thread (its `user_id` is yours). «С прошлого раза» in the same session
starts after the newest message your previous retelling of this thread
covered. With a question («ответили ли мне»), end with a direct answer
to it.

**A problem.** When the thread reports a problem (a bug, a failure, a
customer's complaint) or the question is «в чём проблема», answer in
plain words instead of the four parts: what is broken, where and for whom
it shows, since when, how to reproduce it, what was tried and found (open
screenshots and logs with `pachca_download_file`), who is on it and what
was decided, and what is still unknown, with links to the messages. The
cause usually lies in code, logs or systems outside Pachca: when this
session has them, offer to look there next, otherwise say what to check.

**Remarks.** When the question is about feedback («что нужно поправить»,
«какие замечания», «разбери отзывы»), answer with a numbered list rather
than a retelling, so the user can pick by number. For each remark: what is
wrong and where (a screen, a page, a method), who said it, how it should
be, the message link and its attachments. Look at screenshots and files
with `pachca_download_file`; a video you cannot view is named as not
viewed. A later message that withdraws or settles a remark closes it.
When this session has the code or the task the thread is about, check
each remark against the code and its history (`git log`) and mark it
done, to fix or a separate task, saying what you checked; a remark you
could not check is marked so. «Убедись, что всё поправили» is this list
with every remark checked. End by asking which remarks to take.

Taking them is the user's next request: change the code as they ask,
create tasks in an outside tracker only when they name it, through its own
tools (Pachca reminders follow the reminders part of SKILL.md; when they
say «задачи» and name no place, ask which), and reply in the thread only
when they ask, on the message the remark came
from (`parent_message_id`), following pachca-messaging. When the work is
done, offer one reply in the thread item by item: what was fixed, where to
check it (a build, a page, a link), what was put off and why; show the
text and post after a yes.

Do not post the answer unless the user asks. If they ask, show the text
first and post after a clear yes (pachca-messaging). Action items become
reminders only when the user asks for that: see the reminders part of
SKILL.md. Watching a thread and replying as new messages come is the
`pachca-watch-thread` skill.

## Facts that change the answer

- A thread has no title, no text of its own and no message counter. What it
  is about is only in its messages.
- `pachca_list_threads` returns threads where you are in the thread or in
  its parent chat, sorted by last message, newest first. It skips threads of
  public chats you have not joined. `pachca_get_thread` by `id` reaches
  further: a thread missing from the list may still open.
- `pachca_list_threads` filters by `last_message_at_after` /
  `last_message_at_before`; a thread's `updated_at` moves with each new
  message. Use these for "which threads moved today".
- Nested threads do not exist: a message inside a thread cannot have its
  own thread.
- Deleted messages are absent from the feed. `pachca_get_message` still
  returns a deleted message, with empty `content` and `deleted_at` set.
- Thread members: `pachca_list_members` with the thread's `chat_id` passed
  as `id` (the thread's list is separate from the parent chat's).
- Who has read a message: `pachca_list_message_readers`
  (`pachca read-member list-readers`). For a thread message it counts the
  thread's members. The caller and the author are never in the list, and
  only ids come back.
- With a bot token, `pachca_list_threads` shows a thread only if the bot was
  added to the thread or to its parent chat.

## When you then post into the thread

Posting is pachca-messaging. One trap that starts here: an `@nickname` or a
tag mentioned in a thread comment adds those people to the thread. With the
workspace setting «Использовать сквозные треды» on (the default; the API
does not show it), that reaches employees outside the parent chat, and
`skip_invite_mentions: true` keeps every mentioned person out, members of
the parent chat included. With it off, only members of the parent chat are
added and the flag does not stop it. A guest's mention adds only people who
share a chat with the guest. In a digest, @-mention only the people who
should join and name the rest without `@`.

## Read more

- <https://dev.pachca.com/guides/threads.md>
- <https://dev.pachca.com/api/threads/get.md>
- <https://dev.pachca.com/api/threads/list.md>
- <https://dev.pachca.com/api/messages/list.md>
- <https://dev.pachca.com/api/messages/get.md>
