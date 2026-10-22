# Drafts and scheduled messages

Both are made by the same method (`pachca_create_draft`, `pachca drafts create`, `POST /drafts`). Without `schedule` it is a draft that waits in the chat's input box. With `schedule` it is a scheduled message that goes out by itself.

|                            | Draft                                                 | Scheduled message                                                   |
| -------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------- |
| Who sends                  | the employee, after reviewing                         | nobody: it goes out at the set time                                 |
| Where the employee sees it | the chat's input box and the «Черновики» section      | the «Отложенные» section, where it can be opened, edited or deleted |
| How many per chat          | one ordinary draft per chat, thread or direct message | up to 50                                                            |
| Fits                       | «подготовь ответ клиенту, я проверю»                  | «напомни команде в понедельник утром»                               |

Both need a **personal token**: bot tokens do not get the `drafts:read` and `drafts:write` scopes, have no draft tools in MCP, and get `403` from the API. A draft is private: neither the other party nor a workspace admin sees it.

## Make a draft

1. Resolve the target. For a thread, `entity_id` is the thread id, not the id of the message it hangs under. A direct message with an employee that does not exist yet is created by itself.
2. Create the draft with `content` and/or files (it cannot be empty, at most 10 files). Add `parent_message_id` to make it a reply. That message must be in the same chat.
3. On `409 already_exists`, the existing draft id is in `errors[].payload.draft_id`. Do not retry the create. Read that draft (`pachca_get_draft`), then update it (`pachca_update_draft`), merging your text with what is there if the user wants that.
4. Tell the employee the draft is ready and in which chat: Pachca sends no notification about it.

## Update a draft

- Only the fields you pass are overwritten: `content` alone keeps the attachments.
- `files` replaces the whole set. An empty array removes all attachments. To keep an attached file, pass it with its `id`.
- `parent_message_id: null` removes the reply.
- There is no conflict check: the last write wins. If the employee may already have opened the draft, read it before rewriting.
- The chat of a draft cannot be changed. To move it, create a new draft in the other chat and delete the old one.
- Editing needs write access to the chat (`403` if it was lost). Deleting works even then.

Your drafts are listed newest first by `pachca_list_drafts`. By default it returns only ordinary drafts. Pass `type: scheduled` for scheduled messages or `all` for both. `entity_type` and `entity_id` narrow it to one chat and must be passed together.

## Send a draft when the user asks you to

There is no "send draft" method, by design: normally the employee presses send.

1. Read the draft.
2. Send a normal message (`pachca_send_message`) to the same chat with the draft's `content` and `parent_message_id`, and each file's `key`, `name` and `file_type`.
3. Delete the draft (`pachca_delete_draft`). Otherwise the text stays in the chat's input box.

## Schedule a message

Add `schedule` to the create call (or to an update, which turns an ordinary draft into a scheduled message):

- `start_date`: the first send, ISO-8601. The time of day, the day of the month and the day of the week for the repetition are taken from it. **Write it with the user's UTC offset**: a time without an offset is treated as UTC.
- `repetition.interval`: `once`, `daily`, `weekly`, `monthly`, `every_2_months`, `every_3_months`, `every_4_months`, `every_6_months`, `yearly`.
- `repetition.days`: weekdays for `weekly`, `0` is Sunday, `6` is Saturday. Without it, the weekday of `start_date` is used.
- `repetition.nth_day`: for monthly intervals, which weekday of the month, `1`–`4`, or `5` for the last. Without it, the repetition follows the day of the month of `start_date`.
- `end_date`: optional. The repetition stops after it, otherwise it runs forever.

Examples (Moscow time, `+03:00`):

```json
{ "start_date": "2026-10-23T09:30:00+03:00", "repetition": { "interval": "once" } }
```

```json
{
  "start_date": "2026-11-02T10:00:00+03:00",
  "repetition": { "interval": "weekly", "days": [1, 3] }
}
```

```json
{
  "start_date": "2026-11-24T18:00:00+03:00",
  "repetition": { "interval": "monthly", "nth_day": 5 },
  "end_date": "2027-06-30T23:59:00+03:00"
}
```

The first sends once on Friday morning. The second sends every Monday and Wednesday at 10:00. The third sends on the last Tuesday of every month (24 November 2026 is a Tuesday) until the end of June 2027.

Rules:

- Confirm the text, the chat, the first send time with its time zone, and the repetition before creating it. Nobody reviews the message before it goes.
- In a workspace with advanced encryption, a scheduled message's text is limited to 27,000 bytes (40,000 otherwise).
- The schedule can be changed but not removed: `schedule: null` on a scheduled message returns `422 draft_type_change_forbidden`. To cancel the send, delete it (`pachca_delete_draft`). Deletion is final, and attachments go with it.

Source pages: <https://dev.pachca.com/guides/ai-agents/drafts.md>, <https://dev.pachca.com/api/drafts/create.md>, <https://dev.pachca.com/api/drafts/update.md>, <https://dev.pachca.com/api/drafts/list.md>
