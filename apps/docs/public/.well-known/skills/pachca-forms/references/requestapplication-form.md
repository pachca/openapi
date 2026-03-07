### Request/application form

1. Post message with "Create request" button:
   ```bash
   pachca messages create --entity-id=<chat_id> --content="Создать заявку" --buttons='[[{"text":"Создать заявку","data":"new_request"}]]'
   ```

2. On click open form with fields: subject, description, priority:
   ```bash
   pachca views open --type=modal --trigger-id=<trigger_id> --title="Заявка" --blocks='[...]'
   ```

3. On submit: create task or send notification to assignee:
   ```bash
   pachca tasks create --kind=reminder --content="Заявка: ..." --due-at=<дата>
   ```

4. Send confirmation to author:
   ```bash
   pachca messages create --entity-type=user --entity-id=<user_id> --content="Заявка принята"
   ```

5. Respond HTTP 200 — form will close

