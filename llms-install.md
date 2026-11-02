# Installing the Pachca MCP server in Cline

Pachca is a team chat app. Its MCP server is remote, at `https://mcp.pachca.com/mcp`, over Streamable HTTP: there is nothing to clone, build or run locally.

1. Ask the user for a Pachca personal token. They create it in Pachca on the **Интеграции > API** page (Integrations > API) with the **Создать токен** button (Create token) and pick the scopes the agent needs. For an agent that only searches and summarizes, the read and search scopes are enough. Do not print the token back.
2. Add the server. In Cline CLI:

   ```bash
   cline mcp add pachca https://mcp.pachca.com/mcp --transport http --header "Authorization: Bearer <token>" --yes
   ```

   In the VS Code extension open **MCP Servers > Configure > Configure MCP Servers** and add:

   ```json
   {
     "mcpServers": {
       "pachca": {
         "type": "streamableHttp",
         "url": "https://mcp.pachca.com/mcp",
         "headers": {
           "Authorization": "Bearer <token>"
         }
       }
     }
   }
   ```

   Keep `"type": "streamableHttp"`: without it Cline connects over the legacy SSE transport and fails.

3. Check: ask "Show my Pachca profile". The agent calls `pachca_get_my_card` and answers with the user's name and role.

If the API page says access is restricted («Доступ к API ограничен»), the workspace lets only admins create personal tokens. A workspace admin can allow it for all employees: https://dev.pachca.com/guides/mcp/connect#kto-mozhet-podklyuchit (in Russian).
