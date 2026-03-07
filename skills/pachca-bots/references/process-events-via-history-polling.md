### Process events via history (polling)

1. In bot settings enable "Save event history". Webhook URL is optional.

2. Get accumulated events:
   ```bash
   pachca bots list-events --all
   ```

3. Process each event (same format as real-time webhook)

4. Delete processed event:
   ```bash
   pachca bots remove-event <event_id> --force
   ```
   > Delete to avoid reprocessing

> Polling — alternative to real-time webhook if bot has no public URL.

