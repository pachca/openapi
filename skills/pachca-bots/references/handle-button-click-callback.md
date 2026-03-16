### Обработать нажатие кнопки (callback)

1. Получи вебхук с `"event": "message_button_clicked"` — в payload: `data`, `user_id`, `message_id`

2. Выполни нужное действие (запись в БД, запрос к API и т.д.)

3. Ответь пользователю:
   ```bash
   pachca messages create --entity-type=user --entity-id=<user_id> --content="Принято!"
   ```

4. Опционально: обнови исходное сообщение:
   ```bash
   pachca messages update <message_id> --buttons='[]' --content="Обработано"
   ```
   > `"buttons": []` убирает кнопки

> Кнопка с `data` отправляет событие на вебхук. Кнопка с `url` — открывает ссылку (вебхука не будет).

