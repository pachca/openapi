### Форма заявки/запроса

1. Размести сообщение с кнопкой «Создать заявку»:
   ```bash
   pachca messages create --entity-id=<chat_id> --content="Создать заявку" --buttons='[[{"text":"Создать заявку","data":"new_request"}]]'
   ```

2. При нажатии открой форму с полями: тема, описание, приоритет:
   ```bash
   pachca views open --type=modal --trigger-id=<trigger_id> --title="Заявка" --blocks='[...]'
   ```

3. При submit: создай задачу или отправь уведомление ответственному:
   ```bash
   pachca tasks create --kind=reminder --content="Заявка: ..." --due-at=<дата>
   ```

4. Отправь подтверждение автору:
   ```bash
   pachca messages create --entity-type=user --entity-id=<user_id> --content="Заявка принята"
   ```

5. Ответь HTTP 200 — форма закроется

