# Forms (views): open, validate, close

A form is a modal window with fields defined by the bot; the API calls it a view. The employee fills it in, the result goes to the bot's server. Field schemas: [Form blocks](https://dev.pachca.com/guides/forms/blocks.md); flow: [Form handling](https://dev.pachca.com/guides/forms/handling.md).

## Before you start

- A form opens **only** from a Data-button click in a message the bot sent. No button, no form.
- Send that message with the bot token, and turn on the «Нажатие кнопок» (`button_click`) event. The same event delivers form submissions; without it, neither clicks nor submissions reach the bot.
- The bot does not need to be in the chat to receive the submission: it goes to the bot that opened the form.
- Every step has a seconds-long window. It needs an automated handler (webhook server, the live stream of the event history, or a fast history poller; [events.md](events.md), section 7). An agent that reads events and composes calls in a conversation will miss it: ask the employee in a message instead.

## Lifecycle

1. Employee clicks a Data button → the bot receives a `button` / `click` event with `trigger_id`.
2. The bot opens the view: `pachca_open_form` with `type: "modal"`, `trigger_id` and the `view` object (`title`, `blocks`). CLI: `pachca views open --type modal --trigger-id … --title … --blocks '<JSON array>'`. `trigger_id` lives **3 seconds** — open the form first, log and do everything else afterwards.
3. Employee fills in the blocks and submits → the bot receives a `view` / `submit` event.
4. The bot answers within **3 seconds** (5 on the history path below): close the window, or show errors under fields.

## Build the view

The block types and their fields are in the `pachca_open_form` input schema and on [Form blocks](https://dev.pachca.com/guides/forms/blocks.md). What the schema does not tell you:

- Pass `callback_id` (which form this is) and `private_metadata` (your context, e.g. a record id as a JSON string) next to `view`. Both come back in the submission; `null` if you did not set them.
- In `markdown` blocks lists and quotes are not recognized and show as plain text.
- Preselect with `selected` on a `select` option, but with `checked` in `radio` and `checkbox`.
- `file_input` `filetypes` only filters the file picker; check the received extension yourself.
- `required`, `min_length` and `max_length` are checked by the Pachca app before sending, not by the server: re-check presence and length on your side together with the meaning of values, and answer with `errors` if they fail. Use `hint` to guide the employee.
- An unfilled field comes as `null` (`input`, `select`, `radio`, `date`) or an empty array (`checkbox`, `file_input`); an empty `time` may be absent from `data`.

## Handle the submission

The payload carries everything; no extra request is needed:

- `data` — `name` → value. `checkbox` gives an array, `file_input` gives an array of `{name, size, url}`.
- `callback_id`, `private_metadata`, `user_id` (who submitted).
- `chat_id` — the chat of the button, fixed when the form was **opened**, not when submitted.
- `view_id` — the opened form, the same across retries; `submit_id` — this submission attempt. The history path below needs both.

Answer in the HTTP response to the webhook:

- `200`, empty body → the window closes.
- `400` with `{"errors": {"<field name>": "<error text>"}}` → the texts show in red under those fields; the employee fixes and resubmits.
- No answer in 3 s → the employee sees a submission error, the values stay, and they retry. The retry is a new submission with a new `submit_id` and the same `view_id`, and the values may have changed. If you saved data before missing the window, key the save on `view_id` (or on your own record id in `private_metadata`) and overwrite, so the retry updates the record instead of creating a second one.

Files from `file_input`: download right away. The link works **2 hours**, the file is kept **one day** from submission and then deleted.

Verify the signature of the submission like any other event: [events.md](events.md).

## Bot without a webhook URL (history path)

Use this only when the bot has no outgoing webhook address at all; with an address, answer the webhook directly.

1. Event history must be on (`events_history_enabled`).
2. The click arrives in the history; `trigger_id`'s 3 seconds count from when the click was written to the history, not from the click itself. Poll often enough to open the form in time.
3. Take the `view_submit` event from the history with the bot token: `pachca_get_webhook_events` (`pachca bots list-events`).
4. Answer with `pachca_answer_form` (`pachca views submit-response`) by `view_id` and `submit_id` within **5 seconds** of the submission. One answer per pair: a repeat or a late call gets `410` `submit_expired`.
