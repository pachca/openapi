# Webhook event types

Outgoing webhooks send JSON to specified URL when events occur.
Signature: `Pachca-Signature` (HMAC-SHA256 of request body with Signing secret).

## New messages

Sent when a new message appears in a chat where the bot is a member.
Can filter by commands (message prefix).

```json
{
  "event": "new",
  "type": "message",
  "webhook_timestamp": 1744618734,
  "chat_id": 918264,
  "content": "Текст сообщения",
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

## Reaction add/remove

Sent when a reaction is added/removed in a chat where the bot is a member.
Fields: `event` (add/remove), `type` (reaction), `code` (emoji), `message_id`, `user_id`.

## Button clicks

Sent when a Data-button in bot message is clicked.
Contains `trigger_id` for opening forms via `POST /views/open`.

## Chat member changes

Sent when members are added/removed in chats where the bot is a member.

## Space member changes

Global event (does not require bot in chat). Events: invite, confirm, update, suspend, activate, delete.

## Security

1. Verify signature: `HMAC-SHA256(Signing secret, raw body)` === `Pachca-Signature`
2. Check `webhook_timestamp` — must be within 1 minute
3. Verify sender IP: `37.200.70.177`

```javascript
const signature = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
if (signature !== request.headers['pachca-signature']) {
  throw "Invalid signature";
}
```
