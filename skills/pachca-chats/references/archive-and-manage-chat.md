### Архивация и управление чатом

1. Архивировать чат:
   ```bash
   pachca chats archive <ID>
   ```

2. Разархивировать чат:
   ```bash
   pachca chats unarchive <ID>
   ```

3. Изменить роль участника:
   ```bash
   pachca members update <chat_id> <user_id> --role=admin
   ```
   > `role`: `"admin"` | `"member"` | `"editor"` (только каналы). Роль создателя изменить нельзя.

4. Удалить участника:
   ```bash
   pachca members remove <chat_id> <user_id> --force
   ```

5. Покинуть чат:
   ```bash
   pachca members leave <chat_id> --force
   ```

