### Link unfurling

1. Create a special Unfurl bot and specify tracked domains

2. When a link appears, bot receives webhook `"event": "link_shared"` with `links` array

3. Extract data from your system by URL from `links`

4. Send preview data:
   ```bash
   pachca link-previews add <message_id> --link-previews='{"https://example.com":{"title":"Example","description":"Description"}}'
   ```

> Endpoint is bound to a specific message. Requires a special Unfurl bot with specified domains.

