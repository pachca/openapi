### Handle incoming webhook event

1. Receive POST request on your Webhook URL

2. Verify signature (Signing secret) for security

3. Check `webhook_timestamp` — must be within 1 minute

4. Parse JSON: event type, data

5. For full info request message — especially for attachments (`files[]`):
   ```bash
   pachca messages get <message_id>
   ```
   > Webhook does NOT contain files — `files` is absent

> Webhook contains minimal data — files (`files`) are absent.

