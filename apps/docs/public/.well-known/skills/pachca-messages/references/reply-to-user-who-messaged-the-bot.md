### Ответить пользователю, который написал боту

1. Вебхук содержит `entity_type` — он однозначно определяет контекст: `"user"` — личное сообщение боту, `"thread"` — сообщение в треде, `"discussion"` — сообщение в канале или беседе

2. DM (`entity_type: "user"`): ответь личным сообщением:
   ```bash
   pachca messages create --entity-type=user --entity-id=<user_id> --content="Ответ"
   ```

3. Тред (`entity_type: "thread"`): ответь в тот же тред:
   ```bash
   pachca messages create --entity-type=thread --entity-id=<entity_id> --parent-message-id=<id> --content="Ответ"
   ```
   > Вложенных тредов нет — ответ идёт в тот же тред

4. Беседа/канал (`entity_type: "discussion"`): inline-ответ или тред:
   ```bash
   pachca messages create --entity-id=<entity_id> --parent-message-id=<id> --content="Ответ"
   ```
   > `parent_message_id` визуально привязывает ответ к сообщению

> Если бота вызвали в треде — основной контекст в родительском сообщении треда. В вебхуке есть `thread.message_id` — получи родительское сообщение: `pachca messages get <message_id>`.

