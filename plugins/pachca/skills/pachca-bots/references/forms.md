# Forms (views): open, validate, close

A form is a modal window with fields defined by the bot; the API calls it a view. The employee fills it in, the result goes to the bot's server. Field schemas: [Form blocks](https://dev.pachca.com/guides/forms/blocks.md); flow: [Form handling](https://dev.pachca.com/guides/forms/handling.md).

## Before you start

- A form opens **only** from a Data-button click in a message the bot sent. No button, no form.
- Send that message with the bot token, and turn on the "Button clicks" (`button_click`) event. The same event delivers form submissions; without it, neither clicks nor submissions reach the bot.
- The bot does not need to be in the chat to receive the submission: it goes to the bot that opened the form.
- Every step has a seconds-long window. It needs an automated handler (webhook server, or a fast history poller). An agent that reads events and composes calls in a conversation will miss it: ask the employee in a message instead.

## Lifecycle

1. Employee clicks a Data button → the bot receives a `button` / `click` event with `trigger_id`.
2. The bot opens the view: `pachca_open_form` (`pachca views open`) with `trigger_id` and the `view` object. `trigger_id` lives **3 seconds** — open the form first, log and do everything else afterwards.
3. Employee fills in the blocks and submits → the bot receives a `view` / `submit` event.
4. The bot answers within **3 seconds**: close the window, or show errors under fields.

## Build the view

- Pass `callback_id` (which form this is) and `private_metadata` (your context, e.g. a record id as a JSON string). Both come back in the submission; `null` if you did not set them.
- Up to 100 blocks in `view.blocks`.
- Display blocks: `header`, `plain_text`, `markdown`, `divider`. In `markdown` blocks lists and quotes are not recognized and show as plain text.
- Input blocks, each with a `name` that becomes the key in the submitted `data`:
  - `input` — text, optional `multiline`, `min_length` / `max_length` enforced for the employee.
  - `select` — dropdown; preselect with `selected` on one option.
  - `radio`, `checkbox` — preselect with `checked` (not `selected`).
  - `date` (`initial_date` as `YYYY-MM-DD`), `time` (`initial_time` as `HH:mm`).
  - `file_input` — `filetypes` only filters the file picker; check the received extension yourself. `max_files` up to 10.
- Use `required` and `hint` to guide the employee; validate the meaning of values on your side.

## Handle the submission

The payload carries everything; no extra request is needed:

- `data` — `name` → value. `checkbox` gives an array, `file_input` gives an array of `{name, size, url}`.
- `callback_id`, `private_metadata`, `user_id` (who submitted).
- `chat_id` — the chat of the button, fixed when the form was **opened**, not when submitted.
- `view_id`, `submit_id` — needed only for the history path below.

Answer in the HTTP response to the webhook:

- `200`, empty body → the window closes.
- `400` with `{"errors": {"<field name>": "<error text>"}}` → the texts show in red under those fields; the employee fixes and resubmits.
- No answer in 3 s → the employee sees a submission error, the values stay, and they retry. If you saved data before missing the window, the retry arrives again: make the save idempotent.

Files from `file_input`: download right away. The link works **2 hours**, the file is kept **one day** from submission and then deleted.

Verify the signature of the submission like any other event: [events.md](events.md).

## Bot without a webhook URL (history path)

Use this only when the bot has no outgoing webhook address at all; with an address, answer the webhook directly.

1. Event history must be on (`events_history_enabled`).
2. The click arrives in the history; `trigger_id`'s 3 seconds count from when the click was written to the history, not from the click itself. Poll often enough to open the form in time.
3. Take the `view_submit` event from the history: `pachca_get_webhook_events` (`pachca bots list-events`).
4. Answer with `pachca_answer_form` (`pachca views submit-response`) using `view_id` and `submit_id` from the payload, within **5 seconds** of the submission. Body without `errors` closes the window; with `errors` it shows them under the fields.
5. The answer is accepted once. A repeated call with the same pair, or a late one, gets `410` with code `submit_expired`.
