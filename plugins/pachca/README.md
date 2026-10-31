# Pachca plugin

This plugin connects an AI agent to [Pachca](https://pachca.com), a corporate messenger. It brings three things:

- **The MCP server** `pachca` at `https://mcp.pachca.com/mcp`, with a tool for each Pachca API method. Which tools an agent gets depends on the employee's role, the workspace plan and the kind of token.
- **Eight skills** on doing things right in Pachca: connecting and choosing a token, writing and replying in threads, search and summaries, administration, bots, AI agents that live in Pachca, OAuth apps and API scripts. The agent reads a skill when a task matches it.
- **Three commands** that only you start: `summarize-thread`, `watch-thread` and `post-changes`. In Claude Code they are `/pachca:summarize-thread`, `/pachca:watch-thread` and `/pachca:post-changes`.

## Install

In Claude Code:

```bash
claude plugin marketplace add pachca/openapi --sparse .claude-plugin plugins
claude plugin install pachca@pachca
```

The same plugin installs in the Claude app, Codex, VS Code with GitHub Copilot and Cursor. The steps for each program are on [Plugin and skills](https://dev.pachca.com/guides/mcp/plugin) (in Russian).

## Sign-in and data

Claude Code, the Claude app, VS Code, GitHub Copilot and Codex sign the employee in to Pachca in the browser; in Codex that is `codex mcp login pachca` after installing. Where nobody can sign in, such as CI, Codex connects with a personal token instead, as the page above describes. Cursor sends a personal token from the `PACHCA_TOKEN` environment variable: set it and restart Cursor. A workspace setting decides who may connect, see [Connecting to MCP](https://dev.pachca.com/guides/mcp/connect#kto-mozhet-podklyuchit).

The agent calls the Pachca MCP server as that employee and sees only what the employee can see in Pachca. The skills and commands are instructions. The one script, the `watch-thread` watcher, only reads the thread through the Pachca CLI, and the MCP configs hold the server address and no secrets.
