### Mention user by name

1. Determine search query — use last name (more unique). Names are not declined in API, use nominative case

2. Search among target chat members:
   ```bash
   pachca members list <chat_id>
   ```
   > Filter by name on client side

3. If writing to thread: also check parent chat members:
   ```bash
   pachca members list <parent_chat_id>
   ```

4. Not found — search entire company:
   ```bash
   pachca users list --query=<запрос>
   ```

5. One result → use `nickname`. Multiple → ask user to clarify

6. Insert `@nickname` into message text

> Searching among chat members is more precise — user is explicitly linked to context.

