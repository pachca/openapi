# Connecting MCP clients without the plugin

Read this when the Pachca plugin is not installed in the client, or the client is not in the plugin table of
`SKILL.md`. Address `https://mcp.pachca.com/mcp`, transport Streamable HTTP. Every client with its exact
steps: [Connecting to MCP](https://dev.pachca.com/guides/mcp/connect.md).

- Check the client's list first (the check per client is below). If a Pachca server is already there, add no
  second one: ask the person to sign in again, restart the program, or remove the server and add it anew. Leave
  other MCP servers alone.
- A token-in-header client needs a personal token in `PACHCA_TOKEN` before the server is added. Never print it:
  check the variable with `[ -n "$PACHCA_TOKEN" ] && echo set || echo unset` (PowerShell:
  `if ($env:PACHCA_TOKEN) { 'set' } else { 'unset' }`, cmd.exe:
  `if defined PACHCA_TOKEN (echo set) else (echo unset)`), and do not open settings files
  that hold the token itself. Where the example has `<token>`, the person pastes the token into the file.
- A program sees only variables set before it started, and a server added from an open session shows up only
  after a restart: quit fully (Cmd+Q on macOS), and start a CLI from a new terminal window.

## Commands

Claude Code and Codex: the commands under **Without the plugin** in `SKILL.md`. Check first with
`claude mcp list` (a server at `https://mcp.pachca.com/mcp`) or `codex mcp list` (a server `pachca`).

```bash
# GitHub Copilot CLI: writes ~/.copilot/mcp-config.json, which VS Code reads too and asks to sign in on first use.
# Check: copilot mcp list. A server in the VS Code profile shows only in VS Code's MCP: List Servers: ask the
# person to look there. Sign in to Copilot CLI with /mcp auth pachca
# (browser sign-in needs Copilot CLI 1.0.83 or newer); added from an open Copilot CLI session: restart it
copilot mcp add --transport http pachca https://mcp.pachca.com/mcp

# Gemini CLI (check: gemini mcp list). Single quotes store the variable name, not the token; Windows cmd.exe:
# double quotes, ${PACHCA_TOKEN} stays as is. Servers start in trusted folders only: Trust folder or /permissions trust
gemini mcp add --scope user --transport http --header 'Authorization: Bearer ${PACHCA_TOKEN}' pachca https://mcp.pachca.com/mcp

# Qwen Code (check: qwen mcp list). Single quotes store the variable name in ~/.qwen/settings.json; cmd.exe: double quotes
qwen mcp add --scope user --transport http pachca https://mcp.pachca.com/mcp --header 'Authorization: Bearer ${PACHCA_TOKEN}'

# GigaCode CLI (check: ask the person to run /mcp in a GigaCode session). Stores the token itself in
# ~/.gigacode/settings.json
gigacode mcp add --scope user --transport http pachca https://mcp.pachca.com/mcp --header "Authorization: Bearer $PACHCA_TOKEN"

# Devin Desktop (formerly Windsurf) and Devin CLI (check: devin mcp list). Stores the token itself in
# ~/.config/devin/mcp_config.json (%APPDATA%\devin\mcp_config.json on Windows). Empty token: devin mcp remove -s user pachca
devin mcp add -s user -H "Authorization: Bearer $PACHCA_TOKEN" pachca https://mcp.pachca.com/mcp

# Cline CLI (check: cline config mcp; plain cline mcp opens a menu that needs a terminal). Stores the token
# itself in ~/.cline/data/settings/cline_mcp_settings.json, which the VS Code extension reads too. Run again, it
# replaces the server pachca
cline mcp add pachca https://mcp.pachca.com/mcp --transport http --header "Authorization: Bearer $PACHCA_TOKEN" --yes
```

A command with `"…$PACHCA_TOKEN"` in double quotes stores the token itself, so run it where the variable is set,
and in PowerShell write `$env:PACHCA_TOKEN` in place of `$PACHCA_TOKEN`, in cmd.exe `%PACHCA_TOKEN%`. Run without
the variable, it stores an empty token and the server answers `401`: remove the server and add it again where the
variable is set.

## Config files and app settings

- The Claude app, on the web or desktop: **Customize > Connectors > Add > Add custom connector**, browser
  sign-in only, OAuth client "Use Claude's published identity" (not "Register automatically"), then **Connect**.
  It then works on mobile and in Cowork too. The Free plan takes one such connector. If the dialog has **Request
  headers**, put no token there: the headers are shared by the whole Claude organization. On Team and Enterprise
  the Claude organization owner adds it in **Organization settings > Connectors**, members press **Connect**.
  No tools in a chat: in **Customize > Connectors** press **Connect** if it is not connected, else turn the
  connector on in the chat's tools menu. Never add a second connector at the same address.
- Claude Code signed in with that claude.ai account shows the same connector, cloud sessions included. In a
  cloud session install neither the server nor the skills by command: they are gone after the session. A cloud
  session loads neither the plugin nor the user's local CLI, so the plugin's skills and the thread watcher are
  not there. Pachca comes through the connector or through a server in the repository's committed `.mcp.json`,
  which takes the connector's place and needs its own sign-in. Never put an `Authorization` header in it:
  everyone who opens the project would get it instead of the browser sign-in. No tools in the current session:
  start a new one.
- Grok Bot: ask it in its chat to connect the MCP server `https://mcp.pachca.com/mcp`. It adds the server and
  shows a card in the chat. Sign in to Pachca from that card in the browser; no token is needed. The tools come
  from the next message. Sign-in not finished: **Reopen** on the card, or **Connect apps** in the sidebar, the
  Pachca server, **Authenticate**. Never add a second server. Pachca skills do not install in Grok Bot.
- VS Code: no sign-in window, or it broke off: **MCP: List Servers**, `pachca`, start it again. With a token
  instead (nobody to sign in): add `"headers": {"Authorization": "Bearer ${PACHCA_TOKEN}"}` to the server in
  `~/.copilot/mcp-config.json` (`${input:…}` and `${env:…}` do not work there), plus `"tools": ["*"]` if the
  server was written by hand. Never a server with that header in the project's `.mcp.json`.
- Codex without the `codex` command: **Settings > MCP servers** in the ChatGPT app, the gear menu > **MCP
  servers** in the extension. **Add server**, name `pachca`, **Streamable HTTP**, the address, save, then
  **Restart** (app) or **Restart extension**, then **Authenticate**.
- Cursor, in `~/.cursor/mcp.json` (all projects) or `.cursor/mcp.json` (one project) under `mcpServers`:
  `"pachca": {"url": "https://mcp.pachca.com/mcp", "headers": {"Authorization": "Bearer ${env:PACHCA_TOKEN}"}}`.
  If the MCP list has `plugin-pachca-pachca`, the plugin is connected (in Cursor, or taken from Claude Code):
  add nothing to `mcp.json` and remove a `pachca` server there. After setting the variable quit Cursor fully
  (Cmd+Q on macOS, **File > Exit** on Windows). If Cursor asks to sign in to the Pachca server, it does not see
  the variable. Cursor CLI reads the same file, check with `agent mcp list`.
  Cursor cloud agents do not see local variables: their server is set in the cloud agents settings.
- OpenCode (check: `opencode mcp list`), in `~/.config/opencode/opencode.json` or the project's `opencode.json`:
  `"mcp": {"pachca": {"type": "remote", "url": "https://mcp.pachca.com/mcp", "headers": {"Authorization": "Bearer {env:PACHCA_TOKEN}"}, "oauth": false}}`.
  An unset variable becomes an empty string and the server answers `401`.
- Kilo Code (check: `kilo mcp list`, in the extension **Settings > MCP**), in `~/.config/kilo/kilo.jsonc` or the
  project's `kilo.jsonc`: the same `"mcp"` entry as OpenCode. In the extension: **Settings > MCP > Add Server >
  Remote (HTTP)**. Quit VS Code fully after setting the variable.
- Qwen Code and GigaCode CLI settings files: the address goes in `httpUrl`. There `url` means the older SSE
  transport.
- SourceCraft Code Assistant (VS Code only): the chat's three-dot menu > **MCP-серверы** lists the servers,
  **Edit Global MCP** opens `mcp_settings.json`:
  `"pachca": {"type": "streamable-http", "url": "https://mcp.pachca.com/mcp", "headers": {"Authorization": "Bearer <token>"}}`.
  The project's `.codeassistant/mcp.json` goes into the repository, so no token there.
- Cline extension without the CLI: **MCP Servers > Configure > Configure MCP Servers**, the same entry with
  `"type": "streamableHttp"` and `"Bearer <token>"`. Without `type` Cline uses the old SSE transport.
- Devin Desktop without the `devin` command: write the server into `mcp_config.json` by hand, in Cascade
  **… > MCPs > Open MCP config file**. Devin Local also reads the project's `.mcp.json` and Claude Code's
  settings (off with `read_config_from.claude` in `~/.config/devin/config.json`). Cascade allows 100 tools on all
  servers together: cut the extra ones with `disabledTools`.
- DeepSeek Harness desktop app (macOS and Windows): no MCP settings in the UI and no browser sign-in, so it takes a
  personal token from `PACHCA_TOKEN`. Open `~/.dsh/profiles/desktop/cordis.patch.yml`
  (`%USERPROFILE%\.dsh\profiles\desktop\cordis.patch.yml` on Windows; it appears after the first launch) and
  replace its last line `[]` with this block, or add the block after existing entries that start with `-`. A
  block with `serverName: pachca` already there means the server is added. Appending after `[]` breaks the YAML
  and the app will not start: then delete that `[]` line or the block. Keep the `- insert:` line: without it the
  entry reads as an edit of a block that does not exist and is skipped with only a log warning. Without the
  variable, put `Authorization: Bearer <token>` in place of the `!!js` line. The window never shows connection
  errors. File edits apply live, a new `PACHCA_TOKEN` needs a full quit (Cmd+Q on macOS, quit from the tray menu
  on Windows) and reopening. Check in a new chat. Change nothing else: Pachca is an MCP server, not a model
  provider. Do not open Settings → Models, never put a Pachca or docs address into a Base URL, and leave the
  file's other entries as they are. If the models broke anyway: in Settings → Models delete the providers that
  were added, on the DeepSeek card press Edit, Restore defaults and Apply, then pick a DeepSeek model again in
  each chat.

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

Claude Code in CI or another run with nobody to sign in (over SSH `claude mcp login` is enough), stdio-only
clients through `mcp-remote`, Yandex AI Studio and GigaChat: copy the exact config from the
[connection page](https://dev.pachca.com/guides/mcp/connect.md).

## Skills without the plugin

`npx skills add https://dev.pachca.com -g -a <agent> -y` (Node.js 22.20 or newer), where `<agent>` is the
client's name, for example `opencode`, `devin`, `cline`, `kilo`, `qwen-code`, `gemini-cli`, `cursor`, `codex`,
`github-copilot` or `claude-code`. Always pass `-a` and `-y`: run by an agent without them, it installs into
every agent it finds. Skills are already there if the client has the `pachca-watch-thread` skill. Remove old
skills such as `pachca-chats` and `pachca-messages` in any case:
`npx skills remove pachca-chats pachca-forms pachca-messages pachca-profile pachca-security pachca-tasks pachca-users -g -y`.

Not in a program that has the Pachca plugin: each skill would be installed twice, and in VS Code and Copilot the
`npx skills` copy is used instead of the plugin's, so the skills stop updating with the plugin. You do not see a
plugin in another program, so before a `-g` install ask the person whether the Pachca plugin is in Claude Code,
Codex, Cursor or VS Code. With `-g` the command puts the skills for `codex`, `cursor`, `github-copilot`,
`opencode`, `cline`, `kilo`, `gemini-cli` and `universal` into `~/.agents/skills/`, read by Codex, Cursor and
VS Code, and for `claude-code` into `~/.claude/skills/`, read by Claude Code, Cursor and VS Code. Without `-g` the
same happens in the project folders `.agents/skills/` and `.claude/skills/`. With a single `-a`, `qwen-code` goes
only to `~/.qwen/skills/` and `devin` only to `~/.config/devin/skills/`: these two are safe next to the plugin
(Devin on macOS and Linux only; on Windows unpack into `%APPDATA%\devin\skills\`).

If one of these programs has the plugin, unpack the archives by hand into the other agent's own folder:
`~/.cursor/skills/` for Cursor, `~/.copilot/skills/` for VS Code and Copilot, `~/.config/opencode/skills/`,
`~/.gemini/skills/`, `~/.kilo/skills/`, `~/.cline/skills/`, `~/.dsh/skills/` for DeepSeek Harness. Codex and
Claude Code have none: install the plugin there instead. The Codex IDE extension takes no plugins, so with the
plugin in Cursor or VS Code install no skills into it. With the plugin in Claude Code, Cursor picks it up while
**Include Third-Party Plugins, Skills, and Other Configs** is on in **Settings > Agents > Third-Party Imports**:
install no skills in Cursor.

- SourceCraft Code Assistant has no agent name: `npx skills add https://dev.pachca.com -g -a universal -y`
  puts the skills into `~/.agents/skills/`, which it reads, for all projects; without `-g` into the current
  project only. It has no folder of its own, so with the plugin in Codex, Cursor or VS Code install none for it.
- DeepSeek Harness reads `~/.dsh/skills/` (`%USERPROFILE%\.dsh\skills\` on Windows) and `~/.agents/skills/` and
  picks up new skills without a restart. With no plugin in Codex, Cursor and VS Code use `-a universal` as
  above, otherwise unpack into `~/.dsh/skills/`.
- By hand: each skill is an archive such as
  `https://dev.pachca.com/.well-known/agent-skills/pachca.tar.gz`, with no top folder. Unpack each into a folder
  named after the skill, for example `~/.agents/skills/pachca/` (`%USERPROFILE%\.agents\skills\pachca\` on
  Windows), `~/.claude/skills/pachca/` for Claude Code, `~/.qwen/skills/pachca/` for Qwen Code. GigaCode CLI
  installs only this way, into `~/.gigacode/skills/<skill>/`.
- The Claude app without the plugin: turn on **Code execution and file creation** in **Settings > Capabilities**
  (on Team and Enterprise the organization owner does, and turns on **Skills**), then upload each skill's ZIP,
  such as `https://dev.pachca.com/skills/pachca.zip`, in **Customize > Skills > + > Create skill > Upload a
  skill**.

Details: [Installing the skills](https://dev.pachca.com/guides/ai-agents/skills.md), section «Установка скиллов».
