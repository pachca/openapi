### Handle button click (callback)

1. Receive webhook with `"event": "message_button_clicked"` — payload: `data`, `user_id`, `message_id`

2. Perform required action (DB write, API call, etc.)

3. Reply to user:
   ```bash
   pachca messages create --entity-type=user --entity-id=<user_id> --content="Принято!"
   ```

4. Optionally: update original message:
   ```bash
   pachca messages update <message_id> --buttons='[]' --content="Обработано"
   ```
   > `"buttons": []` removes buttons

> Button with `data` sends event to webhook. Button with `url` — opens link (no webhook).

