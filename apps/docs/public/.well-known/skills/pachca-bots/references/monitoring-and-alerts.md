### Monitoring and alerts

1. External system detects event (error, deploy, metric threshold)

2. Makes POST request to bot or directly calls Pachca API

3. Send alert with buttons to channel:
   ```bash
   pachca messages create --entity-id=<alert_chat_id> --content="Алерт: ..." --buttons='[[{"text":"Взять в работу","data":"take"},{"text":"Игнорировать","data":"ignore"}]]'
   ```

4. On button click — handle callback and update alert status

