### Показать интерактивную форму пользователю

1. Подготовь объект формы: `view` с `title`, `blocks`, опционально `callback_id` и `private_metadata`
   > Типы блоков: `input`, `select`, `radio`, `checkbox`, `date`, `time`, `file_input`, `header`, `plain_text`, `markdown`, `divider`

2. Отправь сообщение с кнопкой:
   ```bash
   pachca messages create --entity-id=<chat_id> --content="Заполните форму" --buttons='[[{"text":"Открыть форму","data":"open_form"}]]'
   ```

3. При нажатии кнопки — получи вебхук-событие с `trigger_id`

4. Немедленно открой форму:
   ```bash
   pachca views open --type=modal --trigger-id=<trigger_id> --title="Заявка" --blocks='[...]'
   ```
   > `trigger_id` живёт 3 секунды — формируй объект формы заранее

5. При отправке формы получи вебхук — обработай по сценарию «Обработать отправку формы»

> Формы работают только от бота.

