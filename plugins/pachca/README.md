# Pachca plugin

This plugin connects an AI agent to [Pachca](https://pachca.com), a team chat app. It has two parts:

- **The MCP server** `pachca` at `https://mcp.pachca.com/mcp`, with a tool for each Pachca API method; each tool's description carries that method's rules. Which tools an agent gets depends on the employee's role, the workspace plan and the kind of token.
- **Nine skills** on Pachca tasks that take several steps: connecting and choosing a token, writing and replying in threads, search, summaries and reviews of a thread, watching a thread and replying in it while the session is open, administration, bots, AI agents that live in Pachca, OAuth apps and API scripts. The agent reads a skill when a task matches it, and you can also call one directly, such as `/pachca:pachca-watch-thread` in Claude Code.

## Install

In Claude Code:

```bash
claude plugin marketplace add pachca/openapi --sparse .claude-plugin plugins
claude plugin install pachca@pachca
```

The same plugin installs in the Claude app, Codex, VS Code with GitHub Copilot and Cursor. The steps for each program are on the [Plugin](https://dev.pachca.com/guides/ai-agents/plugin) page (in Russian).

## Sign-in and data

Claude Code, the Claude app, VS Code, GitHub Copilot and Codex sign the employee in to Pachca in the browser; in Codex that is `codex mcp login pachca` after installing. Where nobody can sign in, such as CI, Codex connects with a personal token instead, as the page above describes. Cursor sends a personal token from the `PACHCA_TOKEN` environment variable: set it and restart Cursor. A workspace setting decides who may connect, see [Connecting to MCP](https://dev.pachca.com/guides/mcp/connect#kto-mozhet-podklyuchit).

The agent calls the Pachca MCP server as that employee and sees only what the employee can see in Pachca. The skills are instructions. The one script, the `pachca-watch-thread` watcher, only reads the thread through the Pachca CLI, and the MCP configs hold the server address and no secrets.
