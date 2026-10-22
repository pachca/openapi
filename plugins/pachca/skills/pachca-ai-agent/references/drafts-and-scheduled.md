# Drafts and scheduled messages from an agent

Source: [Draft instead of sending](https://dev.pachca.com/guides/ai-agents/drafts.md).

A sent message has already been read: if the agent wrote to the wrong chat, in
the wrong tone or to the wrong employee, deleting it does not help — the
notification went out. A draft removes the irreversibility: the text appears in
the input box of the chat, and the employee decides to edit, send or erase it.

## Choose: send, draft or schedule

| The employee says                                | Do                |
| ------------------------------------------------ | ----------------- |
| "Answer in the thread"                           | Send as the bot   |
| "Prepare a reply to the client, I will check it" | Draft             |
| "Remind the team on Monday morning"              | Scheduled message |

A scheduled message goes out by itself and the employee does not see it before
sending, so nobody will review it: the text must be final. Do not use a
schedule where the employee expects to check the text.

## Token: the employee's, never the bot's

Bots cannot use drafts: the `drafts:read` and `drafts:write` scopes are not
issued to bot tokens, and the methods answer `403` to a bot token. The agent
acts with the personal token of the employee it writes for, so the draft
appears where the employee would see their own. A CLI sign-in gives such a
token ([CLI authentication](https://dev.pachca.com/guides/cli/authentication.md));
a bot-hosted agent gets the employee's rights through authorization →
`pachca-oauth`.

This is the point of the design: a draft is private — neither the other side
nor the workspace admin sees it — and the employee who sends it is responsible
for it.

## Procedure

1. **Look first.** List the employee's drafts (`pachca_list_drafts`,
   `pachca drafts list`) so as not to pile up drafts.
2. **Create** with `entity_type` (`discussion`, `thread` or `user`),
   `entity_id` and `content` (`pachca_create_draft`, `pachca drafts create`).
   To make it a reply to a message, add `parent_message_id` — the message must
   be in the same chat.
3. **On `409`** a draft already exists in that chat: its id comes in
   `errors[].payload.draft_id`. Do not retry the create — it will fail the same
   way. Read the existing draft (`pachca_get_draft`, `pachca drafts get`) and
   update it (`pachca_update_draft`, `pachca drafts update`).
4. **Update carefully.** The draft is overwritten by the fields you pass:
   `content` replaces the text and keeps attachments, an empty `files` removes
   the attachments. There is no check that the employee changed it meanwhile —
   the last write wins. Read it before rewriting if the employee may have opened it.
5. **Tell the employee.** A draft creates no notification: Pachca does not say
   it appeared. The side that put it there says which chat it is in.

There is no "send draft" method. Sending is an ordinary new message, after which
the draft is deleted (`pachca_delete_draft`, `pachca drafts delete`). The
interface does the same when the employee presses «Отправить сейчас». For an
agent this is the design: the employee presses the button.

## Scheduled message

The same create method with the `schedule` field:

- `start_date` — the first sending; the time of day, day of month and weekday of
  the repeat come from it;
- `repetition` — the rule: `interval` `once` for a single sending, or `daily`,
  `weekly`, `monthly` and rarer up to `yearly`. Weekly takes a `days` list where
  `0` is Sunday. Monthly can use `nth_day` from 1 to 4, and 5 means the last —
  "every last Tuesday of the month";
- `end_date` — optional; stops the repeat after that date, without it the repeat
  never ends.

The employee sees such messages in the «Отложенные» (scheduled) section and can
open, edit or delete them. A scheduled message cannot be turned back into a
draft, and removing the schedule by an update answers `422`: cancel it only by
deleting.

## Limits

- One ordinary draft per chat, thread or DM.
- Up to 50 scheduled messages per chat.
- Up to 10 attachments in a draft.
- An empty draft is not allowed: it needs text or attachments.
