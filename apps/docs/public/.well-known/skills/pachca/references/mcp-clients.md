# Connecting MCP clients without the plugin

Read this when the Pachca plugin is not installed in the client, or the client is not in the plugin table of
`SKILL.md`. Address `https://mcp.pachca.com/mcp`, transport Streamable HTTP. Every client with its exact
steps: [Connecting to MCP](https://dev.pachca.com/guides/mcp/connect.md).

## Commands

Claude Code and Codex: the commands under **Without the plugin** in `SKILL.md`.

```bash
# GitHub Copilot CLI: writes ~/.copilot/mcp-config.json, which VS Code reads too and asks to sign in on first use
# In Copilot CLI sign in with /mcp auth pachca (browser sign-in needs Copilot CLI 1.0.83 or newer)
copilot mcp add --transport http pachca https://mcp.pachca.com/mcp

# Gemini CLI: single quotes store the variable name, not the token. Servers start in trusted folders only
gemini mcp add --scope user --transport http --header 'Authorization: Bearer ${PACHCA_TOKEN}' pachca https://mcp.pachca.com/mcp

# Devin Desktop (formerly Windsurf) and Devin CLI. The token itself goes to ~/.config/devin/
devin mcp add -s user -H "Authorization: Bearer $PACHCA_TOKEN" pachca https://mcp.pachca.com/mcp

# Qwen Code; gigacode mcp add takes the same flags. Without --transport http the server is saved as stdio
qwen mcp add --transport http pachca https://mcp.pachca.com/mcp --header "Authorization: Bearer $PACHCA_TOKEN"
```

## Config files and app settings

- The Claude app, on the web or desktop: **Customize > Connectors > Add > Add custom connector**, browser
  sign-in only, OAuth client "Use Claude's published identity" (not "Register automatically"). It then works
  on mobile too. On Team and Enterprise the Claude organization owner adds it in **Organization settings >
  Connectors**, members press **Connect**. The same connector shows up in Claude Code signed in with that
  claude.ai account, cloud sessions included. A cloud session loads neither the plugin nor the user's local
  CLI, so the plugin's skills and the thread watcher are not there. Pachca comes through this connector or
  through a server in the repository's committed `.mcp.json`. Such a server takes the connector's place and
  needs its own sign-in. Never put an `Authorization` header in it: everyone who opens the project would get it
  instead of the browser sign-in.
- Grok Bot: ask it in its chat to connect the MCP server `https://mcp.pachca.com/mcp`. It adds the server and
  shows a card in the chat. Sign in to Pachca from that card in the browser; no token is needed.
- Cursor, in `~/.cursor/mcp.json` under `mcpServers`:
  `"pachca": {"url": "https://mcp.pachca.com/mcp", "headers": {"Authorization": "Bearer ${env:PACHCA_TOKEN}"}}`.
- OpenCode, in `~/.config/opencode/opencode.json`:
  `"mcp": {"pachca": {"type": "remote", "url": "https://mcp.pachca.com/mcp", "headers": {"Authorization": "Bearer {env:PACHCA_TOKEN}"}, "oauth": false}}`.
- Qwen Code and GigaCode CLI settings files: the address goes in `httpUrl`. There `url` means the older SSE
  transport.
- DeepSeek Harness desktop app (macOS and Windows): no MCP settings in the UI and no browser sign-in, so it takes a
  personal token from `PACHCA_TOKEN`. Open `~/.dsh/profiles/desktop/cordis.patch.yml`
  (`%USERPROFILE%\.dsh\profiles\desktop\cordis.patch.yml` on Windows; it appears after the first launch) and
  replace its last line `[]` with this block, or add the block after existing entries that start with `-`.
  Appending after `[]` breaks the YAML and the app will not start. Keep the `- insert:` line: without it the
  entry reads as an edit of a block that does not exist and is skipped with only a log warning. The window never
  shows connection errors. File edits apply live, a new `PACHCA_TOKEN` needs a full quit (Cmd+Q on macOS, quit
  from the tray menu on Windows) and reopening. Check in a new chat. Change nothing else: Pachca is an MCP
  server, not a model provider. Do not open Settings → Models, never put a Pachca or docs address into a Base
  URL, and leave the file's other entries as they are. If the models broke anyway: in Settings → Models delete
  the providers that were added, on the DeepSeek card press Edit, Restore defaults and Apply, then pick a
  DeepSeek model again in each chat.

  ```yaml
  - insert:
      - id: mcp-pachca
        name: '@deepseek-ai/dsh-mcp-client'
        config:
          serverName: pachca
          transport: streamable-http
          url: https://mcp.pachca.com/mcp
          headers:
            Authorization: !!js '`Bearer ${process.env.PACHCA_TOKEN}`'
  ```

Kilo Code, Cline, SourceCraft Code Assistant, Devin Desktop without the `devin` command, Claude Code in CI or
another run with nobody to sign in (over SSH `claude mcp login` is enough), stdio-only clients through
`mcp-remote`, Yandex AI Studio and GigaChat: copy the exact config from the
[connection page](https://dev.pachca.com/guides/mcp/connect.md).

## Skills without the plugin

`npx skills add https://dev.pachca.com -g -a <agent> -y` (Node.js 22.20 or newer), where `<agent>` is the
client's name, for example `opencode`, `devin`, `cline`, `kilo`, `qwen-code`, `gemini-cli`, `cursor`, `codex`,
`github-copilot` or `claude-code`. Always pass `-a` and `-y`: run by an agent without them, it installs into
every agent it finds. Not in a program that has the Pachca plugin: each skill would be installed twice, and in
VS Code and Copilot the `npx skills` copy is used instead of the plugin's, so the skills stop updating with the
plugin. With `-g` the skills also land in folders several programs read. Of the programs with the plugin,
`~/.agents/skills/` is read by Codex, Cursor and VS Code, `~/.claude/skills/` by Claude Code, Cursor and
VS Code. Without `-g` the same happens in the project folders `.agents/skills/` and `.claude/skills/`. If one
of these programs has the plugin, unpack the archives by hand into a folder only the other agent reads, for
example `~/.config/opencode/skills/` for OpenCode.

- SourceCraft Code Assistant has no agent name: `npx skills add https://dev.pachca.com -a universal -y`
  installs into the project. With `-g` the skills land in a folder it does not read: for all projects, unpack
  the archives into `~/.agents/skills/` by hand.
- By hand: each skill is an archive such as
  `https://dev.pachca.com/.well-known/agent-skills/pachca.tar.gz`, with no top folder. Unpack each into a
  folder named after the skill, for example `~/.agents/skills/pachca/`. GigaCode CLI installs only this way,
  into `~/.gigacode/skills/<skill>/`.
- The Claude app without the plugin: upload each skill's ZIP, such as
  `https://dev.pachca.com/skills/pachca.zip`, in **Customize > Skills > + > Create skill > Upload a skill**.

Details: [Installing the skills](https://dev.pachca.com/guides/ai-agents/skills.md), section «Установка скиллов».
