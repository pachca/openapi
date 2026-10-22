---
description: 'Turn a Pachca discussion into tasks: action items with assignees and due dates, created after review'
argument-hint: '<thread or message link>'
---

# Tasks from a Pachca discussion

Turn this Pachca discussion into tasks: $ARGUMENTS

Follow the `pachca-search` skill: its thread procedure to read the discussion and its tasks reference to create tasks.

1. Read the whole thread, oldest first, including the parent message.
2. Pull out the action items: what to do, who does it, by when. Take the assignee and the date from the discussion; leave them empty when the discussion does not say, do not guess. Resolve names to ids with `pachca_search_users`.
3. Show the list to the user as a table: task, assignee, due date, link to the message it came from.
4. After a clear yes, create each task with `pachca_create_task`: the text in `content`, assignees in `performer_ids` (without them the task lands on the user), the due date with the user's time zone offset.
5. Report what was created, with links.

Do not create tasks for other employees without the user's yes on the list.
