### Export chat history

1. Request export:
   ```bash
   pachca common request-export --start-at=<YYYY-MM-DD> --end-at=<YYYY-MM-DD> --webhook-url=<URL>
   ```
   > `start_at`, `end_at` (YYYY-MM-DD), `webhook_url` required — request is async

2. Wait for webhook: JSON with `"type": "export"`, `"event": "ready"` and `export_id`

3. Download export file:
   ```bash
   pachca common get-exports <export_id>
   ```
   > Server returns 302, HTTP client downloads file automatically

> `webhook_url` required — POST does not return id in response. Export available only to Owner on "Corporation" plan. Max period: 45 days (366 when specific chats are specified).

