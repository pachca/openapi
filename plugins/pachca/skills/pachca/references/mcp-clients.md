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
  CLI, so the plugin's commands are not there: Pachca comes through this connector or through a server in the
  repository's committed `.mcp.json`.
- Cursor, in `~/.cursor/mcp.json` under `mcpServers`:
  `"pachca": {"url": "https://mcp.pachca.com/mcp", "headers": {"Authorization": "Bearer ${env:PACHCA_TOKEN}"}}`.
- OpenCode, in `~/.config/opencode/opencode.json`:
  `"mcp": {"pachca": {"type": "remote", "url": "https://mcp.pachca.com/mcp", "headers": {"Authorization": "Bearer {env:PACHCA_TOKEN}"}, "oauth": false}}`.
- Qwen Code and GigaCode CLI settings files: the address goes in `httpUrl`. There `url` means the older SSE
  transport.

Kilo Code, Cline, SourceCraft Code Assistant, Devin Desktop without the `devin` command, Claude Code in CI or
another run with nobody to sign in (over SSH `claude mcp login` is enough), stdio-only clients through
`mcp-remote`, Yandex AI Studio and GigaChat: copy the exact config from the
[connection page](https://dev.pachca.com/guides/mcp/connect.md).

## Skills without the plugin

`npx skills add https://dev.pachca.com -g -a <agent> -y` (Node.js 22.20 or newer), where `<agent>` is the
client's name, for example `opencode`, `devin`, `cline`, `kilo`, `qwen-code`, `gemini-cli`, `cursor`, `codex`,
`github-copilot` or `claude-code`. Always pass `-a` and `-y`: run by an agent without them, it installs into
every agent it finds. Not in a program that has the Pachca plugin: each skill would load twice. With `-g` the
skills also land in folders several programs read: `~/.agents/skills/` is read by Codex, Cursor and VS Code,
`~/.claude/skills/` by Claude Code, Cursor, VS Code and OpenCode. Without `-g` the same happens in the project
folders `.agents/skills/` and `.claude/skills/`. If one of these programs has the plugin, unpack the archives by
hand into a folder only the other agent reads, for example `~/.config/opencode/skills/` for OpenCode.

- SourceCraft Code Assistant has no agent name: `npx skills add https://dev.pachca.com -a universal -y`
  installs into the project. With `-g` the skills land in a folder it does not read: for all projects, unpack
  the archives into `~/.agents/skills/` by hand.
- By hand: each skill is an archive such as
  `https://dev.pachca.com/.well-known/agent-skills/pachca.tar.gz`, with no top folder. Unpack each into a
  folder named after the skill, for example `~/.agents/skills/pachca/`. GigaCode CLI installs only this way,
  into `~/.gigacode/skills/<skill>/`.
- The Claude app without the plugin: upload each skill's ZIP, such as
  `https://dev.pachca.com/skills/pachca.zip`, in **Customize > Skills > + > Create skill > Upload a skill**.

Details: [Pachca plugin for agent apps](https://dev.pachca.com/guides/mcp/plugin.md).
