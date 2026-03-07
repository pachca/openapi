### Reply to user who messaged the bot

1. Webhook contains `entity_type` that determines context: `"user"` — DM to bot, `"thread"` — message in thread, `"discussion"` — message in channel or conversation

2. DM (`entity_type: "user"`): reply with direct message:
   ```bash
   pachca messages create --entity-type=user --entity-id=<user_id> --content="Ответ"
   ```

3. Thread (`entity_type: "thread"`): reply in the same thread:
   ```bash
   pachca messages create --entity-type=thread --entity-id=<entity_id> --parent-message-id=<id> --content="Ответ"
   ```
   > No nested threads — reply goes to the same thread

4. Conversation/channel (`entity_type: "discussion"`): inline reply or thread:
   ```bash
   pachca messages create --entity-id=<entity_id> --parent-message-id=<id> --content="Ответ"
   ```
   > `parent_message_id` visually links reply to the message

> If bot was called in a thread — main context is in thread parent message. Webhook has `thread.message_id` — get parent message: `pachca messages get <message_id>`.

