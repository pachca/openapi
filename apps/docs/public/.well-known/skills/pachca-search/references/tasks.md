# Tasks from a discussion

Tasks («напоминания» in the Russian docs) are created with
`pachca_create_task` (`pachca tasks create`), changed with
`pachca_update_task` (`pachca tasks update`), listed with
`pachca_list_tasks` (`pachca tasks list`).

## Creating: what each field really does

| Field           | Rule                                                                                                                                                                                                                                                                                                                                                              |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`          | Required: `call`, `meeting`, `reminder`, `event`, `email`. Take `reminder` unless the item is clearly one of the others                                                                                                                                                                                                                                           |
| `content`       | The task text. Optional, but without it the text is only the kind's name, so always write it. Up to 40,000 bytes in UTF-8                                                                                                                                                                                                                                         |
| `due_at`        | ISO-8601. The offset is honoured; a time without an offset is UTC, so write the employee's offset. Seconds are dropped. Exactly `23:59:59` makes an all-day task                                                                                                                                                                                                  |
| `all_day`       | A task for a day without a time, set at creation only (an edit ignores it). Use it whenever the discussion names a day but no hour («к среде», «в понедельник») instead of inventing an hour, and set `due_at` to `23:59:59` of that day in the employee's offset: the web app reads only `due_at`, so any other time still shows there even with `all_day: true` |
| `performer_ids` | Assignees. Default: the token owner. A task for someone else needs their id                                                                                                                                                                                                                                                                                       |
| `chat_id`       | Binds the task to a conversation or a direct chat (your chat with yourself included); its members then see the task too, and in an open conversation any employee of the workspace can read it. You must be a member. Not allowed for a channel, a thread or an archived chat                                                                                     |
| `priority`      | 1 (default), 2 (important), 3 (very important)                                                                                                                                                                                                                                                                                                                    |

Without `chat_id` the task is seen by its author and assignees only.
If a calendar is connected to the workspace, or to the profile of the token
owner who creates the task, a task with `due_at` also appears there as an
event, with the assignees as attendees. At creation an assignee's own
connected calendar plays no part. A workspace calendar's event follows
every edit. A profile calendar's event is recreated in the calendar
connected to the profile of whoever edits: after an assignee with one edits
the task, the event appears in their calendar and the author's copy stays
as it was. An edit by someone with no calendar on their profile leaves that
event unchanged.

## Procedure for action items

1. Extract items: what, who, by when, source message link (see
   [digests.md](digests.md)).
2. Resolve each owner to an id: `pachca_search_users` by name. Two
   candidates you cannot tell apart: ask. Nobody named: ask, or leave the
   item for the user to assign. Do not default it to yourself silently.
3. Resolve each date in the employee's zone. A day with no hour:
   `all_day: true` and `due_at` at `23:59:59` of that day in that zone.
4. Pick the binding: the parent chat of the discussion if it is a
   conversation or a direct chat (not a channel) and you are in it, else
   none. A thread cannot hold a task. In an open conversation the bound
   task is readable by every employee of the workspace: leave a private
   item unbound.
5. Show the list when tasks go to other employees; create after the user
   agrees. Put the source message link into `content` so the assignee can
   find the context.
6. Create one task per item. Report what was created, and every item that
   failed with the reason.

## Errors that stop creation

- `404`: no user with an id from `performer_ids`, or no chat with that
  `chat_id` in the workspace.
- `403` for an assignee: the caller cannot see that employee: another
  workspace, a suspended or deleted employee, or, for a guest, someone they
  share no chat with.
- `403` for `chat_id`: a channel, a thread, an archived chat, or a chat you
  are not a member of. The error's `payload.record.type` says which was
  refused (`user` or `chat`).
- `400`: a field fails validation, for example a `due_at` that cannot be
  parsed, an unknown `kind` or `content` over the limit.

In every case the task is not created at all. Fix what the error names and
retry that item: correct the assignee list, or create the task without
`chat_id` (or with another chat).

## After creation

- `pachca_update_task` overwrites only the fields you pass, except
  `all_day`: an edit ignores it, and `all_day: false` (`--no-all-day`) does
  not clear it either. To make an existing task all-day, pass `due_at` at
  `23:59:59` of that day in the employee's offset. A task created with
  `all_day: true` stays all-day for good: after its `due_at` gets an hour,
  the API still returns `all_day: true`, the MCP server shows only its day,
  and the reminder does not come at that hour. To give such a task an hour,
  recreate it as described for the chat binding below, after the user
  agrees. A task that became all-day only through `23:59:59` follows its
  `due_at`.
- Handing a task over is an edit: `performer_ids` replaces the whole list
  of assignees. Read the current list with `pachca_get_task`, then pass
  everyone who stays plus the new assignee, without the old one.
- Done: `status: "done"` keeps the task in the list with a check mark;
  `status: "undone"` reopens it. Prefer this over deleting.
- The chat binding cannot change. Moving a task to another chat means
  deleting it for good and creating a new one with the new `chat_id`, so
  ask the user first. Read it with `pachca_get_task` before deleting and
  pass its fields to the new task again, `custom_properties` included. The
  new task gets a new id, you become its author, and the assignees are
  notified again. A done task comes back undone: set `status: "done"`
  afterwards.
- The author and the assignees can edit or delete the task, and so can
  whoever last marked it done. Any other member of the bound chat can read
  the task, not change it (`403`).
- `pachca_delete_task` is final: the task cannot be restored and disappears
  for the assignees. Delete only after the user confirms which task, and
  prefer `status: "done"`. A connected calendar's event is removed when the
  author deletes the task; when an assignee deletes it, the event can stay
  in the author's calendar.

## Listing tasks

- "My tasks" («мои напоминания») means `performer_ids` set to your own id:
  take it from `pachca_get_my_card` (`pachca profile get`) or the "you:"
  part of the MCP footer. "Tasks I set" means `author_id` set to your id.
- Without filters the list holds every task of every active chat you are a
  member of, other employees' tasks included, plus unbound tasks you
  created or are assigned to. Never present it as the user's own tasks.
  Tasks of archived chats appear only when their chat is in `chat_ids`.
- With `chat_ids` (up to 100): every task of those chats, other employees'
  included. Ids of chats you cannot access are dropped without an error.
- Filters: `status` (`done`, `undone`), `performer_ids` (up to 100),
  `author_id`. There is no text search and no due-date filter, and the list
  comes oldest first (by `id`), not by `due_at`. "The task about the
  contract": read every page and match `content` yourself. "What is due
  this week" or "what is overdue": read every `undone` page (`--all` in the
  CLI), then filter and sort by `due_at` yourself.
- When `all_day` is true, report only the day, not a time. `due_at` comes
  back in UTC and its date can be a day off: take the date of `due_at` in
  the employee's zone. The MCP server already shows such a field as that
  day, for example `2026-10-23 (all day)`.

## Read more

- <https://dev.pachca.com/api/tasks/create.md>
- <https://dev.pachca.com/api/tasks/update.md>
- <https://dev.pachca.com/api/tasks/list.md>
- <https://dev.pachca.com/api/tasks/get.md>
- <https://dev.pachca.com/api/tasks/delete.md>
