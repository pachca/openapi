# Webhook event types

Outgoing webhooks send JSON to the specified URL when events occur.
Signature: `Pachca-Signature` (HMAC-SHA256 of the request body with the Signing secret).

## New messages

Sent when a new message appears in a chat or thread where the bot is a member.
Filtered by `trigger_on`: `all_messages` or `commands` (the first word must equal one of `commands`). A new bot is in `commands` mode with an empty list and gets no messages until you change it. There is no mentions-only mode: take all messages and check for `@bot_nickname` in `content`.

```json
{
  "event": "new",
  "type": "message",
  "webhook_timestamp": 1744618734,
  "chat_id": 918264,
  "content": "Message text",
  "user_id": 134412,
  "id": 56431,
  "created_at": "2025-04-14T08:18:54.000Z",
  "parent_message_id": null,
  "entity_type": "discussion",
  "entity_id": 918264,
  "thread": null,
  "url": "https://app.pachca.com/chats/124511?message=56431"
}
```

## Message edits and deletions

Same fields as a new message, `event` is `update` or `delete`. In `commands` mode an edit arrives only if the message starts with a command; deletions always arrive.

## Reaction add/remove

Sent when a reaction is added/removed in a chat where the bot is a member.
Fields: `event` (`new`/`delete`), `type` (reaction), `code` (emoji), `message_id`, `user_id`.

## Button clicks

Sent only to the bot that sent the message, when a Data button in it is clicked.
Contains `trigger_id` for opening forms via `POST /views/open` — valid for 3 seconds.

## Form submissions

`type` is `view`, `event` is `submit`. Sent to the bot that opened the form, if `button_click` is enabled; the bot does not need to be in the chat. Respond within 3 seconds: `200` closes the form, `400` with `errors` shows them under the fields.

## Links to the bot domains

`type` is `message`, `event` is `link_shared`. Sent from any chat in the workspace when a message has a link to one of `unfurl_domains`; requires the `message_link_shared` event. Answer with `POST /messages/{id}/link_previews`.

## Chat member changes

Sent when members are added/removed in chats where the bot is a member.

## Workspace member changes

Global event (does not require the bot to be in a chat). Events: invite, confirm, update, suspend, activate, delete.

## Video calls

Sent for video calls in chats where the bot is a member.
Field `event` distinguishes: `started`, `finished` (includes participants and duration), `recording_ready` (includes recording file `url`, `size`, `duration`).
Field `type` is always `video_call`. Common fields: `video_room_id`, `chat_id`, `owner_id`, `thread`.

## Security

1. Verify signature: `HMAC-SHA256(Signing secret, raw body)` === `Pachca-Signature`
2. Verify `webhook_timestamp` — must be within 1 minute
3. Verify sender IP: Pachca sends webhooks from `37.200.70.177`, `185.209.115.174` and `135.106.159.61`

```javascript
const signature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
if (signature !== request.headers['pachca-signature']) {
  throw "Invalid signature";
}
```
