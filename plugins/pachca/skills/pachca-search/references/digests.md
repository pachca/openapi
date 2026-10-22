# Digests and decisions

Two jobs: "what happened in these chats over this period" and "what did we
decide in this discussion". Both fail the same ways: a wrong window, page
one taken for everything, threads forgotten, names guessed.

## Digest of channels and threads for a period

1. **Fix the window** in the employee's zone, with the offset written out:
   "today" for an employee in Moscow is `2026-10-22T00:00:00+03:00` to
   `2026-10-22T23:59:59+03:00`. A time without an offset is UTC. Say in
   the answer which window you used.
2. **Find what moved.**
   - Chats: `pachca_list_chats` with `last_message_at_after` (and
     `sort=last_message_at`) (`pachca chats list
--last-message-at-after=…`). By default it lists the chats you are a
     member of; it never lists threads.
   - Threads: `pachca_list_threads` with `last_message_at_after`
     (`pachca threads list --last-message-at-after=…`).
   - A named set of channels: get their ids with `pachca_search_chats`.
3. **Pull the messages of the window.** Two ways:
   - Search without a query: `pachca_search_messages` with `created_from`,
     `created_to` and optionally `chat_ids`. One call spans every chat you
     are in, thread messages included. It does not reach public channels
     you have not joined. On `504 timeout`, split by chats or by period.
   - The feed: `pachca_list_chat_messages` per chat, newest first, paging
     until `created_at` is older than the window start. The feed has no
     date filter. This also works for a public channel you have not
     joined.
4. **Read the threads that moved** by their own `chat_id`; fetch the parent
   message when the comments make no sense without it. See
   [threads.md](threads.md).
5. **Write it up** per chat, most important first:
   - decisions and changes of plan;
   - questions addressed to the reader, and mentions of them;
   - open questions nobody answered;
   - what is due soon.
     Skip greetings and chit-chat. Put the message link (`url`) after each
     point. End with what you covered ("12 chats, 340 messages, 9 threads")
     and what you could not see (public channels you are not in are outside
     search; Pachca does not expose what the reader has already read).

Before posting a digest anywhere, check its audience: content from private
chats or DMs must not go to a channel whose members cannot see those chats.
Posting itself is pachca-messaging.

## Decisions, open questions and action items from one discussion

Read the whole thing first (all pages, chronological, plus the parent
message of a thread). Then:

- **Decision**: stated and accepted (a confirmation, or the person in charge
  saying so). A proposal nobody confirmed is a proposal: list it as open.
- **Later beats earlier**: a decision reversed further down is reported in
  its final form, with the reversal noted if it matters.
- **Author**: `user_id`; for a forwarded message, `forwarding.author_id` is
  the real author; a bot message may carry `display_name`. Resolve ids with
  `pachca_get_user`, never guess a name from the text.
- **Replies**: `parent_message_id` tells which message an answer belongs
  to. Use it to pair questions with answers.
- **Voice**: the text is in `voice_content.transcript`; `null` means not
  transcribed yet or unavailable. Say a voice message was skipped rather
  than invent its content.
- **Files**: only `files[].name` is in the message. Do not summarize a file
  you have not opened (downloading is pachca-messaging).
- **Action item**: what, who, by when. If the discussion names no owner or
  no date, leave the field empty and say so: do not assign one.

A shape that works:

```text
Decisions
- Release moves to 30 October (Vera Sokolova) — <url>
Open questions
- Who updates the pricing page? — <url>
Action items
- Prepare the migration plan — Gleb Orlov — by 27 October — <url>
```

## From action items to tasks

Creating tasks is covered in [tasks.md](tasks.md). Show the extracted
items first when they go to other employees; create them after the user
agrees, then report what was created: task, assignee, due date.

## Read more

- <https://dev.pachca.com/guides/threads.md>
- <https://dev.pachca.com/api/search/list-messages.md>
- <https://dev.pachca.com/api/messages/list.md>
- <https://dev.pachca.com/api/threads/list.md>
- <https://dev.pachca.com/api/chats/list.md>
- <https://dev.pachca.com/api/pagination.md>
