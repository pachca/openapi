# Receiving events: outgoing webhook and event history

How a bot learns what happens in the workspace, and how to build a handler that does not lose or double-process events. Full payload schemas live on [Events](https://dev.pachca.com/guides/webhook/events.md); this file is the procedure and the traps.

## 1. Configure the outgoing webhook

Outgoing webhook tab of the bot card, or the `webhook` object of `pachca_update_bot` (`pachca bots update`) / `pachca_create_bot`:

| Setting             | API field                                 | Notes                                                         |
| ------------------- | ----------------------------------------- | ------------------------------------------------------------- |
| Webhook URL         | `outgoing_url`                            | Public `http`/`https` only. Empty string disables the webhook |
| Events              | `events`                                  | Values from the table in section 2                            |
| New-message mode    | `trigger_on`: `all_messages` / `commands` | Default `commands` with an empty list = hears nothing         |
| Commands            | `commands`                                | Comma-joined, at most 255 characters in total                 |
| Save event history  | `events_history_enabled`                  | Works without a URL                                           |
| Ignore own messages | `ignore_self_messages`                    | Also drops reactions the bot itself set or removed            |
| Link domains        | `unfurl_domains`                          | Admin or owner only, see SKILL.md                             |

- Changing these with a personal token needs `bots:write` and edit access to the bot.
- The bot can set its own URL with its own token: `pachca_self_update_bot_webhook` (`pachca bots update-webhook`), scope `bot_self:webhook:write`, no admin involved. It fails for a bot with link unfurling.
- The Signing secret cannot be set, only read: Outgoing webhook tab, or `webhook.secret_token` in bot info (`pachca_get_bot`, `pachca bots get`) for a token with `bots:write` whose owner may manage the bot's tokens.
- "Delete webhook" stops delivery, resets history, message mode and "Ignore own messages", and issues a **new** Signing secret. Re-enabled, it starts like a new one. Update the secret in your handler.

## 2. Know where each event comes from

| Event (tab)                   | `events` values                                                                    | Comes from                                                           |
| ----------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| New messages                  | `message_new`                                                                      | Chats the bot is in, and their threads                               |
| Message edits and deletions   | `message_update`, `message_delete`                                                 | Same                                                                 |
| Reactions                     | `reaction_new`, `reaction_delete`                                                  | Same                                                                 |
| Button clicks                 | `button_click`                                                                     | Clicks on the bot's own messages, and submissions of forms it opened |
| Chat member changes           | `chat_member_add`, `chat_member_remove`                                            | Chats the bot is in, and their threads                               |
| Workspace member changes      | `company_member_invite`, `_confirm`, `_suspend`, `_activate`, `_delete`, `_update` | Whole workspace, no membership needed                                |
| Message link sharing (unfurl) | `message_link_shared`                                                              | All chats, only links to the bot's domains                           |
| Video calls                   | `video_call_started`, `video_call_finished`, `video_call_recording_ready`          | Chats the bot is in, and their threads                               |

A thread the bot was added to without its parent chat counts as a chat it is in.

Message mode details:

- "All messages" includes threads and messages with no text (file only).
- "Starting with commands" matches the first word exactly, case-sensitive. A message with no text never matches. In this mode edits arrive only for messages starting with a command; deletions always arrive.
- There is no "mentions only" mode: take all messages and filter.

## 3. Write the handler

Order matters:

1. **Read the raw body.** Do not let a framework parse JSON first (e.g. Express `express.raw({ type: "application/json" })`, Flask `request.get_data()`).
2. **Verify the signature.** HMAC-SHA256 of the raw body with the Signing secret, hex digest, compared with the `Pachca-Signature` header. Mismatch → `401`.
3. **Check freshness.** Reject when `webhook_timestamp` (UNIX seconds) is more than 60 s away from now — replay protection.
4. **Optionally check the source IP** against the addresses on the [handler page](https://dev.pachca.com/guides/webhook/handler.md); allow all of them.
5. **Deduplicate**, then **answer `200` at once** and push the work to a background queue.
6. **Route** by `type` + `event`: `message` (`new`/`update`/`delete`, and `link_shared` for unfurl), `reaction`, `button` (`click`), `view` (`submit`), `chat_member`, `company_member`, `video_call`.

Exceptions to "answer at once": a form submission is answered **in the response** within 3 s (see [forms.md](forms.md)); after a button click that should open a form, open it first — `trigger_id` lives 3 s.

## 4. Delivery and retries

- Pachca waits 5 seconds for the response.
- It retries only when it could not connect to your server: up to three more attempts with pauses.
- An error code or a timeout is **not** retried, whatever the code. That event is gone from the webhook path.
- Every event is written to the history before it is sent (if history is on). Turn history on and fetch what your server missed with `pachca_get_webhook_events` (`pachca bots list-events`).

## 5. Idempotency

The same event can occasionally arrive twice. Keep a durable set of processed keys (an in-memory set is lost on restart).

The handler page's example key is `type:event:id-or-message_id`. It collides for two reactions or two clicks on the same message by different employees; add `user_id` and `code` (reaction) or `data` (button) for those types. With the history, use the event's own identifier.

## 6. Read the payload correctly

- Payloads are minimal. Fetch the full message with `pachca_get_message` (`pachca messages get`) by `id` / `message_id` for attachments, reactions, buttons, forwards.
- A file-only message has an empty `content`; the payload cannot tell you it has an attachment.
- `content` is Markdown that Pachca assembles from the message (quotes, lists may appear). See [Markdown](https://dev.pachca.com/guides/markdown.md).
- For `message`/`delete`, the message method still answers `200` but returns a cleared record (empty `content`, `deleted_at` set).
- `entity_type` / `entity_id` tell where to answer (`user` = DM, `discussion` = conversation or channel, `thread`). `thread.message_id` and `thread.message_chat_id` point to the thread's parent; both are `null` for a standalone thread.
- `parent_message_id` is set when the message is a reply.
- `chat_member` and `company_member` carry only `user_ids` (and `thread_id` for threads); their `created_at` has no fractions of a second, unlike other events.
- `reaction` may come with `chat_id: null` if the message was already deleted.
- Opening a DM with the bot produces neither a chat nor a member event. The first message is the first signal.

## 7. Polling instead of (or alongside) a webhook

Use it when the server cannot accept inbound HTTP (local development, strict firewall), or to recover missed events.

1. Turn on "Save event history". In the UI the toggle appears only after the webhook URL is set; via API set `events_history_enabled: true` — no URL needed. Without it the history method returns an empty list.
2. Poll `pachca_get_webhook_events` (`pachca bots list-events`), cursor pagination ([pagination](https://dev.pachca.com/api/pagination.md)).
3. Process only new delivery IDs and keep the dedup on your side.
4. Clean up processed records with `pachca_delete_webhook_event` (`pachca bots remove-event`).

SDK helpers (`pollWebhookEvents`, `pollWebhookPayloads` and their equivalents) wrap this. They start from events created **after** the worker starts and dedupe delivery IDs in memory: events from before the start are not replayed, and the dedup does not survive a restart. Examples per language: [Polling](https://dev.pachca.com/guides/webhook/polling.md).

A bot with no webhook URL also reads button clicks and form submissions from the history; its form rules differ — see [forms.md](forms.md).
