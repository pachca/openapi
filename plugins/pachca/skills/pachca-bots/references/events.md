# Receiving events: outgoing webhook and event history

How a bot learns what happens in the workspace, and how to build a handler that does not lose or double-process events. Full payload schemas live on [Events](https://dev.pachca.com/guides/webhook/events.md); this file is the procedure and the traps.

## 1. Configure the outgoing webhook

«Исходящий вебхук» tab of the bot card, or the webhook fields of `pachca_update_bot` (`pachca bots update`) / `pachca_create_bot` (`pachca bots create`); in the REST API they sit in the `webhook` object:

| Setting                       | API field                                                   | Notes                                                                                                                                                        |
| ----------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Webhook URL                   | `outgoing_url`                                              | Public `http`/`https`, the final address (redirects are not followed). An empty string pauses delivery and keeps the settings and the secret                 |
| Events                        | `events`                                                    | Full values from the table in section 2                                                                                                                      |
| New-message mode              | `trigger_on`: `all_messages` / `commands` (`unfurl`: below) | «Любые сообщения» / «Начинающиеся с команд». Default `commands` with an empty list = hears nothing                                                           |
| Commands                      | `commands`                                                  | Stored as one string, commands joined by a comma and a space, at most 255 characters with the separators counted. A comma inside a command splits it in two  |
| «Сохранять историю событий»   | `events_history_enabled`                                    | Works without a URL                                                                                                                                          |
| «Игнорировать свои сообщения» | `ignore_self_messages`                                      | Drops message and reaction events on the bot's own messages, whoever reacted. Reactions the bot puts on other messages still arrive, and so do button clicks |
| «Домены» (link unfurling)     | `unfurl_domains`                                            | Admin or owner only, see SKILL.md                                                                                                                            |

- Changing these with a personal token needs `bots:write` and edit access to the bot.
- The bot can set its own URL with its own token: `pachca_self_update_bot_webhook` (`pachca bots update-webhook`), scope `bot_self:webhook:write`, no admin involved. It fails for a bot with link unfurling.
- The Signing secret cannot be set, only read: «Исходящий вебхук» tab, or `webhook.secret_token` in an answer about one bot for a token with `bots:write` whose owner may manage the bot's tokens. That is bot info (`pachca_get_bot` with `view: "full"`, `pachca bots get`) and the answers of `pachca_create_bot`, `pachca_update_bot`, `pachca_recreate_bot_token` and `pachca_rotate_bot_client_secret`.
- «Удалить вебхук» (API: `outgoing_url: ""` together with `events: []` in one call, without `events_history_enabled: true`) stops delivery, resets events to `message_new`, mode to commands, the command list and «Игнорировать свои сообщения», turns off «Сохранять историю событий» (records already saved stay), and issues a **new** Signing secret. Re-enabled, it starts like a new one: restore the settings (note them from bot info before deleting) and update the secret in your handler.
- `trigger_on: unfurl` is a legacy link-unfurling mode the interface does not offer. Only an admin or the owner turns it on. Such a bot accepts no events except `message_link_shared`, so adding others fails until the mode is switched to `all_messages` or `commands`. It counts as a bot with link unfurling, so the admin-only rules in SKILL.md apply.

## 2. Know where each event comes from

| Event (checkbox)                                                                | `events` values                                                                                                                                          | Comes from                                                                         |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| «Новые сообщения»                                                               | `message_new`                                                                                                                                            | Chats the bot is in, and their threads                                             |
| «Редактирование и удаление сообщений»                                           | `message_update`, `message_delete`                                                                                                                       | Same                                                                               |
| «Добавление и удаление реакций»                                                 | `reaction_new`, `reaction_delete`                                                                                                                        | Same                                                                               |
| «Нажатие кнопок»                                                                | `button_click`                                                                                                                                           | Clicks on the bot's own messages in chats it is in; submissions of forms it opened |
| «Изменение состава участников чатов»                                            | `chat_member_add`, `chat_member_remove`                                                                                                                  | Chats the bot is in; for threads see below                                         |
| «Изменение участников пространства»                                             | `company_member_invite`, `company_member_confirm`, `company_member_suspend`, `company_member_activate`, `company_member_delete`, `company_member_update` | Whole workspace, no membership needed                                              |
| «Отправка ссылок в сообщении (unfurl)»                                          | `message_link_shared`                                                                                                                                    | All chats, only links to the bot's domains                                         |
| «Начало видеозвонка», «Завершение видеозвонка», «Готовность записи видеозвонка» | `video_call_started`, `video_call_finished`, `video_call_recording_ready`                                                                                | Chats the bot is in, and their threads                                             |

Events fire only while the webhook has a URL or history turned on.

A thread the bot was added to without its parent chat counts as a chat it is in. Exception: member events in a thread that has a parent chat. `chat_member_add` goes to the bots of the parent chat (a bot that is only in the thread does not get it), and `chat_member_remove` only to the bots that are members of the thread itself. In a standalone thread both go to the thread's own bots.

Message mode details:

- «Любые сообщения» includes threads and messages with no text (file only).
- «Начинающиеся с команд» matches the first word exactly, case-sensitive. A message with no text never matches. In this mode edits arrive only for messages starting with a command; deletions always arrive.
- There is no "mentions only" mode: take all messages and filter.

## 3. Write the handler

Order matters:

1. **Read the raw body.** Do not let a framework parse JSON first (e.g. Express `express.raw({ type: "application/json" })`, Flask `request.get_data()`).
2. **Verify the signature.** HMAC-SHA256 of the raw body with the Signing secret, hex digest, compared with the `Pachca-Signature` header. Mismatch → `401`.
3. **Check freshness.** Reject when `webhook_timestamp` (UNIX seconds) is more than 60 s away from now — replay protection.
4. **Optionally check the source IP** against the addresses on the [handler page](https://dev.pachca.com/guides/webhook/handler.md); allow all of them.
5. **Deduplicate** (section 5), then **answer `200` at once** and push the work to a background queue.
6. **Route** by `type` + `event`: `message` (`new`/`update`/`delete`, and `link_shared` for unfurl), `reaction`, `button` (`click`), `view` (`submit`), `chat_member`, `company_member`, `video_call`.

Exceptions to "answer at once": a form submission is answered **in the response** within 3 s (see [forms.md](forms.md)); after a button click that should open a form, open it first — `trigger_id` lives 3 s.

## 4. Delivery and retries

- Pachca waits 5 seconds for the response to a regular event. For a button click it waits up to 30 seconds, but the employee sees the outcome only within the first 3 seconds (the `trigger_id` lifetime): a non-`2xx` answer in that window shows them an error, unless the bot has already opened a form by this click. A later answer, a timeout or a failed connection shows nothing, so answer `2xx` at once and give feedback by editing the message or sending a new one. For a form submission it waits 3 seconds (see [forms.md](forms.md)).
- For regular events it retries only when it could not connect to your server: up to three more attempts with pauses.
- An error code or a timeout is **not** retried, whatever the code. Button clicks and form submissions are not re-sent at all: a missed click is gone from the webhook path, and the employee submits a form again themselves.
- Redirects are not followed for events and button clicks: a `3xx` is a final answer, like an error code. A form submission follows one redirect. Point `outgoing_url` at the address that answers `2xx` itself.
- Every event is written to the history before it is sent (if history is on), so what your server missed is there: read it with the bot's own token, `pachca_get_webhook_events` (`pachca bots list-events`), see section 7.
- A delivery retried after a failed connection is written to the history again, with a new history `id` and a new `webhook_timestamp`: while your server is unreachable, one event can appear there once per attempt. Button clicks and form submissions are stored once.

## 5. Idempotency

The same event can occasionally arrive twice. Keep a durable set of processed keys (an in-memory set is lost on restart).

The handler page's example key `type:event:id-or-message_id` is unsafe with a durable set: `view`, `chat_member`, `company_member` and `video_call` payloads carry neither `id` nor `message_id`, so every event of one kind gets the same key and all later ones are dropped. All edits of one message share a key too. Start the key with `type:event` and add per type:

- `message`: `id`, plus `changed_at` for `update`. For `link_shared`: `message_id` and the `links` URLs (an edit sends the links again, and so does an `update` without an edit from section 6, unless a link preview was added).
- `reaction`: `message_id`, `user_id`, `code`, `created_at`.
- `button`: `trigger_id` (new on every click).
- `view`: `submit_id`.
- `chat_member`: `chat_id`, `thread_id`, `user_ids`, `created_at`.
- `company_member`: `user_ids`, `created_at`.
- `video_call`: `video_room_id`, plus `recording_id` for `recording_ready`.

Use the same key for webhook and history events. History IDs do not deduplicate: a retried delivery gets one history record per attempt, and the webhook body carries no history `id`. Leave `webhook_timestamp` out of the key, it changes on every attempt.

## 6. Read the payload correctly

- Payloads are minimal. Fetch the full message with `pachca_get_message` (`pachca messages get`) by `id` / `message_id` for attachments, reactions, buttons, forwards.
- A file-only message has an empty `content`; the payload cannot tell you it has an attachment.
- `content` is Markdown that Pachca assembles from the message (quotes, lists may appear). See [Markdown](https://dev.pachca.com/guides/markdown.md).
- For `message`/`delete`, the message method still answers `200` but returns a cleared record (empty `content`, `deleted_at` set).
- `message`/`update` is not always an edit. It also comes, with the same `content`, when someone adds the message to their «Важное» or removes it (in the app or through the API), when the preview of an attached document or the transcription of a voice message is ready, and when a link preview is added or removed. Keep the last `changed_at` you handled per message, the one from `message`/`new` included: an `update` with that same `changed_at` is not an edit. When `changed_at` moved, still compare `content` with what you have before treating it as an edit.
- `entity_type` / `entity_id` tell where to answer (`user` = DM, `discussion` = conversation or channel, `thread`). `thread.message_id` and `thread.message_chat_id` point to the thread's parent; both are `null` for a standalone thread.
- `parent_message_id` is set when the message is a reply.
- The payload has no flag for a bot author: messages of other bots and incoming-webhook posts arrive like any other.
- `company_member` carries only `user_ids`. `chat_member` carries `chat_id`, `user_ids` and `thread_id` (`null` outside a thread; inside a thread `chat_id` is the thread's own chat). Their `created_at` has no fractions of a second, unlike other events.
- Deleting a message removes its reactions without `reaction`/`delete` events: only `message`/`delete` arrives, so a bot that counts reactions drops that message on it.
- Opening a DM with the bot produces neither a chat nor a member event. The first message is the first signal.

## 7. Polling instead of (or alongside) a webhook

Use it when the server cannot accept inbound HTTP (local development, strict firewall), or to recover missed events.

1. Turn on «Сохранять историю событий». In the UI the toggle appears only after the webhook URL is set; via API set `events_history_enabled: true` — no URL needed. Without it nothing new is saved. Records saved earlier stay, also after the setting is turned off or after «Удалить вебхук», and the method keeps returning them until you delete them (step 4).
2. Poll `pachca_get_webhook_events` (`pachca bots list-events`) with the bot's own token: a personal token has no history, and the MCP server does not list the tool for it. Events come newest first, with cursor pagination ([pagination](https://dev.pachca.com/api/pagination.md)).
3. Deduplicate by the payload key from section 5, not by the history record `id` alone, and keep that dedup on your side.
4. Delete processed records with `pachca_delete_webhook_event` (`pachca bots remove-event`). The history does not clear itself, and records left in it come again on every request.

SDK helpers (`pollWebhookEvents`, `pollWebhookPayloads` and their equivalents) wrap this. By default they start from events created **after** the worker starts (pass `createdAfter`, or `created_after` in Python, to read older history) and dedupe delivery IDs in memory, so the dedup does not survive a restart. Examples per language: [Polling](https://dev.pachca.com/guides/webhook/polling.md).

**Live stream.** A bot with no public URL that must react within seconds (a button click, a form) can get history records as they are written. With the bot's own token, `GET /webhooks/events/stream` returns a link (`url`, `expires_at`) to a Server-Sent Events stream. There is no MCP tool: a model cannot hold the connection, and the link opens with no token, so keep it as a secret. With «Сохранять историю событий» off, or when the stream is unavailable, the method answers `404` with an empty body. Each event comes as an unnamed `message` frame with a history record (`id`, `event_type`, `payload`, `created_at`); service frames are named SSE events (`confirm_subscription`, `disconnect`) and carry `type`.

- Open the link, wait for the subscription to be confirmed, then read the history (step 2). Do the same after every reconnect and every new link: events written before the subscription are only in the history.
- The link lives one to two hours. At `expires_at` the server sends `disconnect` (`{"type":"disconnect","reason":"remote","reconnect":false}`) and closes the stream, and `EventSource` does not reconnect by itself: request a new link and start over. A request within the same UTC hour returns the same link, and a request in the last hour before `expires_at` returns a new one valid an hour longer. Switch about five minutes before `expires_at`: open the new link, wait for the confirmation, read the history, then close the old stream.
- Delivery to the stream is not guaranteed: keep deleting processed records (step 4). The record `id` removes repeats between the stream and the history, and between the old and the new link. If the bot also has a webhook URL, a delivery retried after a failed connection reaches the stream again with a new `id`, sometimes before the webhook request itself: dedupe it by the payload key from section 5.

A bot with no webhook URL also reads button clicks and form submissions from the history; its form rules differ — see [forms.md](forms.md).
