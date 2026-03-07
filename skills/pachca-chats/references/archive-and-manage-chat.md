### Archive and manage chat

1. Archive chat:
   ```bash
   pachca chats archive <ID>
   ```

2. Unarchive chat:
   ```bash
   pachca chats unarchive <ID>
   ```

3. Change member role:
   ```bash
   pachca members update <chat_id> <user_id> --role=admin
   ```
   > `role`: `"admin"` | `"member"` | `"editor"` (channels only). Creator role cannot be changed.

4. Remove member:
   ```bash
   pachca members remove <chat_id> <user_id> --force
   ```

5. Leave chat:
   ```bash
   pachca members leave <chat_id> --force
   ```

