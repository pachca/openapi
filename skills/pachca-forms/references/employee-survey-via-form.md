### Employee survey via form

1. Send message with "Take survey" button:
   ```bash
   pachca messages create --entity-id=<chat_id> --content="Пройди опрос" --buttons='[[{"text":"Пройти опрос","data":"survey_start"}]]'
   ```

2. On button click receive webhook with `trigger_id`

3. Open form with survey fields:
   ```bash
   pachca views open --type=modal --trigger-id=<trigger_id> --title="Опрос" --blocks='[...]'
   ```

4. On submit webhook process answers

5. Save to database or send summary message to channel

6. Respond HTTP 200 — form will close

> Each user must click button themselves — each has their own `trigger_id`.

