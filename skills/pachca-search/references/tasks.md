# Tasks from a discussion

Tasks («напоминания» in the Russian docs) are created with
`pachca_create_task` (`pachca tasks create`), changed with
`pachca_update_task` (`pachca tasks update`), listed with
`pachca_list_tasks` (`pachca tasks list`).

## Creating: what each field really does

| Field           | Rule                                                                                                                                                             |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `kind`          | Required: `call`, `meeting`, `reminder`, `event`, `email`. Take `reminder` unless the item is clearly one of the others                                          |
| `content`       | The task text. Optional, but without it the text is only the kind's name, so always write it. Up to 40,000 bytes in UTF-8                                        |
| `due_at`        | ISO-8601. The offset is honoured; a time without an offset is UTC, so write the employee's offset. Seconds are dropped. Exactly `23:59:59` makes an all-day task |
| `all_day`       | A task for a day without a time. Use it whenever the discussion names a day but no hour («к среде», «в понедельник») instead of inventing an hour                |
| `performer_ids` | Assignees. Default: the token owner. A task for someone else needs their id                                                                                      |
| `chat_id`       | Binds the task to a conversation; its members then see the task too. You must be a member. Not allowed for a channel, a thread or an archived chat               |
| `priority`      | 1 (default), 2 (important), 3 (very important)                                                                                                                   |

Without `chat_id` the task is seen by its author and assignees only.
If a calendar is connected to the workspace or the profile, the task also
appears there as an event.

## Procedure for action items

1. Extract items: what, who, by when, source message link (see
   [digests.md](digests.md)).
2. Resolve each owner to an id: `pachca_search_users` by name. Two
   candidates you cannot tell apart: ask. Nobody named: ask, or leave the
   item for the user to assign. Do not default it to yourself silently.
3. Resolve each date in the employee's zone. A day with no hour: all-day.
4. Pick the binding: the parent conversation of the discussion if it is a
   conversation (not a channel) and you are in it, else none. A thread
   cannot hold a task.
5. Show the list when tasks go to other employees; create after the user
   agrees. Put the source message link into `content` so the assignee can
   find the context.
6. Create one task per item. Report what was created, and every item that
   failed with the reason.

## Errors that stop creation

- `404`: no user with an id from `performer_ids`.
- `403`: the caller cannot see that employee: another workspace, a
  suspended or deleted employee, or, for a guest, someone they share no
  chat with.

In both cases the task is not created at all: fix the list and retry that
item.

## After creation

- `pachca_update_task` overwrites only the fields you pass.
- Handing a task over is an edit: put the new assignee into `performer_ids`
  in place of the old one.
- Done: `status: "done"` keeps the task in the list with a check mark;
  `status: "undone"` reopens it. Prefer this over deleting.
- The chat binding cannot change. To move a task to another chat, delete it
  and create it again with the new `chat_id`.
- Only the author and the assignees can edit or delete. A member of the
  bound chat can read the task, not change it.
- `pachca_delete_task` is final: the task cannot be restored, disappears
  for the assignees, and its calendar event is removed too.

## Listing tasks

- Without `chat_ids`: your tasks only, from conversations and channels you
  are in, plus unbound tasks you created or that are assigned to you.
- With `chat_ids` (up to 100): every task of those chats, other employees'
  included. Ids of chats you cannot access are dropped without an error.
- Filters: `status` (`done`, `undone`), `performer_ids` (up to 100),
  `author_id`. No due-date filter: "what is due this week" means listing
  `undone` tasks and filtering `due_at` yourself.
- When `all_day` is true, report only the date of `due_at`, not a time.

## Read more

- <https://dev.pachca.com/api/tasks/create.md>
- <https://dev.pachca.com/api/tasks/update.md>
- <https://dev.pachca.com/api/tasks/list.md>
- <https://dev.pachca.com/api/tasks/get.md>
- <https://dev.pachca.com/api/tasks/delete.md>
