### Show interactive form to user

1. Prepare form object: `view` with `title`, `blocks`, optionally `callback_id` and `private_metadata`
   > Block types: `input`, `select`, `radio`, `checkbox`, `date`, `time`, `file_input`, `header`, `plain_text`, `markdown`, `divider`

2. Send message with button:
   ```bash
   pachca messages create --entity-id=<chat_id> --content="Заполните форму" --buttons='[[{"text":"Открыть форму","data":"open_form"}]]'
   ```

3. On button click — receive webhook event with `trigger_id`

4. Immediately open form:
   ```bash
   pachca views open --type=modal --trigger-id=<trigger_id> --title="Заявка" --blocks='[...]'
   ```
   > `trigger_id` expires in 3 seconds — prepare form object in advance

5. On form submission receive webhook — handle per "Handle form submission" scenario

> Forms only work from bot.

