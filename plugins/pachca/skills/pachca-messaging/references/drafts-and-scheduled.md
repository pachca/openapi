# Drafts and scheduled messages

Both are made by the same method (`pachca_create_draft`, `pachca drafts create`, `POST /drafts`). Without `schedule` it is a draft that waits in the chat's input box. With `schedule` it is a scheduled message that goes out by itself.

|                            | Draft                                                 | Scheduled message                                                                          |
| -------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Who sends                  | the employee, after reviewing                         | no one presses send: it goes out by itself at the set time, from the employee's account    |
| Where the employee sees it | the chat's input box and the «Черновики» section      | the «Отложенные» tab of the «Черновики» section, where it can be opened, edited or deleted |
| How many per chat          | one ordinary draft per chat, thread or direct message | up to 50 per employee, only their own count                                                |
| Fits                       | «подготовь ответ клиенту, я проверю»                  | «напомни команде в понедельник утром»                                                      |

Both work with any user token: a personal token, the MCP browser login or the CLI login. Bot tokens do not get the `drafts:read` and `drafts:write` scopes, have no draft tools in MCP, and get `403` from the API. A draft is private: neither the other party nor a workspace admin sees it.

## Make a draft

1. Resolve the target. For a thread, `entity_id` is the thread id, not the id of the message it hangs under. For a direct message, pass `entity_type: "user"` and the employee's user id: if there is no direct chat with them yet, it is created by itself.
2. Create the draft with `content` and/or files (it cannot be empty, at most 10 files). A file goes as content or by the key of your own upload: a draft refuses the key of a file someone else uploaded ([files.md](files.md)). Add `parent_message_id` to make it a reply. That message must be in the same chat. Mention people as `@nickname`: a draft keeps `<@user_id>` as typed, and the person is not mentioned when the employee sends it from the input box. A scheduled message turns `<@user_id>` into `@nickname` when it goes out.
3. On `409 already_exists`, the existing draft id is in `errors[].payload.draft_id`. Do not retry the create. Read that draft (`pachca_get_draft`), then update it (`pachca_update_draft`), merging your text with what is there if the user wants that.
4. Tell the employee the draft is ready and in which chat: Pachca sends no notification about it.

## Update a draft

- Only the fields you pass are overwritten: `content` alone keeps the attachments.
- `files` replaces the whole set. An empty array removes all attachments. To keep an attached file, pass its `id`, `key` and `name` with the values the draft returns, and only those fields: an item without `key` and `name`, or the whole file object with `url`, is rejected with `422`.
- `parent_message_id: null` removes the reply.
- There is no conflict check: the last write wins. If the employee may already have opened the draft, read it before rewriting.
- The chat of a draft cannot be changed. To move it, create a new draft in the other chat and delete the old one.
- Editing needs write access to the chat (`403` if it was lost). Deleting works even then.

Scheduled messages are not in the default list: pass `type: scheduled` (or `all`) to `pachca_list_drafts`.

## Send a draft when the user asks you to

There is no "send draft" method, by design: normally the employee presses send.

1. Read the draft.
2. Send a normal message to the same chat (the draft's `entity_type` and `entity_id`) with the draft's `content` and `parent_message_id`, and each file's `key`, `name` and `file_type`. For a voice file, also pass `duration_ms` and `waveform` (from `voice_content`), or the send fails with `422`. Nothing is copied from the draft for you: whatever you leave out is lost once the draft is deleted.
3. In MCP, put the draft's `id` as `draft_id` on that same `pachca_send_message` call. The server deletes the draft once the message is out and keeps it if the send fails, so do not call `pachca_delete_draft` afterwards. If the answer says `draft_id` was not applied, the message is out but the draft is still there: delete it with `pachca_delete_draft`.
4. The CLI and the API have no such field: once `pachca messages create` (`POST /messages`) succeeds, delete the draft (`pachca drafts delete <id> --force`, `DELETE /drafts/{id}`), or its text stays in the chat's input box. The send the user asked for covers this deletion, so `--force` belongs here: without it the CLI refuses the delete in non-interactive mode.

## Schedule a message

Add `schedule` to the create call (or to an update, which turns an ordinary draft into a scheduled message):

- `start_date`: where the schedule starts, ISO-8601. The time of day, the day of the month and the day of the week for the repetition are taken from its clock time as written. Which zone to write it in:
  - `once`: the user's UTC offset. It is the send moment itself and must be in the future, otherwise `422` with code `next_send_at_invalid`.
  - Any repeating interval: **convert the user's local time to UTC and write it with `Z`**. The repetition runs on UTC clock time, so `10:00+03:00` with `weekly` sends at 10:00 UTC (13:00 Moscow time), the first send included. If the conversion moves the time to another date, take `days` from the UTC date too: for `weekly` that is exact. A monthly interval keeps the UTC day of the month or the UTC weekday, and that does not always follow the user's calendar. «The 1st at 01:00 Moscow time» becomes 22:00 UTC on the last day of the month before the start, the 28th to the 31st, and the schedule keeps that day: in longer months it goes out a day or more early, in months without that day not at all. With `nth_day`, «the last Friday at 01:00 Moscow time» becomes the last Thursday at 22:00 UTC: December 2026 ends on a Thursday, so it goes out on 1 January instead of 25 December. In these cases tell the user, and suggest a time that stays on the same date in UTC. In a time zone with daylight saving time, the local time of the repeats shifts by an hour when the clocks change.
  - A time without an offset is treated as UTC.
- With a repetition the first send is the first matching moment on or after `start_date` (after now, if `start_date` has passed), so `days` or `nth_day` that do not match `start_date` push it later. Tell the user the first send from `next_send_at` in the response (always UTC), and compare it with the time they asked for.
- `repetition.interval`: `once`, `daily`, `weekly`, `monthly`, `every_2_months`, `every_3_months`, `every_4_months`, `every_6_months`, `yearly`.
- `repetition.days`: weekdays for `weekly`, `0` is Sunday, `6` is Saturday. Without it, the weekday of `start_date` is used.
- `repetition.nth_day`: for monthly intervals, which occurrence of `start_date`'s weekday in the month: `1`–`4`, or `5` for the last. The weekday itself always comes from `start_date`. Without it, the repetition follows the day of the month of `start_date`.
- `end_date`: optional. The repetition stops after it, otherwise it runs forever. It is compared as a moment, so it can keep the user's offset.

Examples for a user on Moscow time (UTC+3). The one-off send keeps the `+03:00` offset. In the repeating ones, `start_date` is converted to UTC and written with `Z` (10:00 Moscow time is `07:00:00Z`):

```json
{ "start_date": "2026-11-06T09:30:00+03:00", "repetition": { "interval": "once" } }
```

```json
{
  "start_date": "2026-11-02T07:00:00Z",
  "repetition": { "interval": "weekly", "days": [1, 3] }
}
```

```json
{
  "start_date": "2026-11-24T15:00:00Z",
  "repetition": { "interval": "monthly", "nth_day": 5 },
  "end_date": "2027-06-30T23:59:00+03:00"
}
```

The first sends once on Friday 6 November at 09:30 Moscow time. The second sends every Monday and Wednesday at 10:00 Moscow time (07:00 UTC). The third sends at 18:00 Moscow time (15:00 UTC) on the last Tuesday of every month (24 November 2026 is a Tuesday) until the end of June 2027.

Rules:

- Confirm the text, the chat, the first send time in the user's time zone, and the repetition before creating it. Nobody reviews the message before it goes.
- The schedule can be changed but not removed: `schedule: null` on a scheduled message returns `422 draft_type_change_forbidden`. To cancel the send, delete it (`pachca_delete_draft`). Deletion is final, and attachments go with it.

Source pages: <https://dev.pachca.com/guides/ai-agents/drafts.md>, <https://dev.pachca.com/api/drafts/create.md>, <https://dev.pachca.com/api/drafts/update.md>, <https://dev.pachca.com/api/drafts/list.md>
