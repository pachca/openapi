# Pachca API

[![CI](https://github.com/pachca/openapi/actions/workflows/check.yml/badge.svg)](https://github.com/pachca/openapi/actions/workflows/check.yml)
[![npm](https://img.shields.io/npm/v/@pachca/sdk)](https://www.npmjs.com/package/@pachca/sdk)
[![npm](https://img.shields.io/npm/v/@pachca/cli)](https://www.npmjs.com/package/@pachca/cli)
[![npm](https://img.shields.io/npm/v/@pachca/generator)](https://www.npmjs.com/package/@pachca/generator)
[![npm](https://img.shields.io/npm/v/n8n-nodes-pachca)](https://www.npmjs.com/package/n8n-nodes-pachca)
[![PyPI](https://img.shields.io/pypi/v/pachca-sdk)](https://pypi.org/project/pachca-sdk/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Русская версия: [README.md](README.md)

Unified Developer Experience Platform for the [Pachca API](https://dev.pachca.com) — the REST API of Pachca, a corporate messenger. A single source (TypeSpec + workflows.ts + examples.ts) generates artifacts for every channel: web docs, CLI, SDKs, an n8n node, agent skills, and LLM context.

**Docs**: https://dev.pachca.com · **OpenAPI**: https://dev.pachca.com/openapi.yaml · **Authorization**: https://dev.pachca.com/api/authorization · **Changelog**: https://dev.pachca.com/updates · **Postman/Bruno**: https://dev.pachca.com/pachca.postman_collection.json

## CLI

```bash
# Zero-install (npx)
npx @pachca/cli messages create --entity-id=123 --content="Hello!" --token $PACHCA_TOKEN

# For regular use
npm install -g @pachca/cli
pachca auth login
pachca messages create --entity-id=123 --content="Hello!"
pachca guide "send a message"  # CLI guide

# Built-in API reference right in the terminal (for agents)
pachca api ls                          # list every endpoint
pachca api POST /messages --describe   # params, body, example
pachca api POST /messages -f message[content]="Hello"  # direct request
```

Every API method is available as a command: typed flags, validation, four output formats (table, JSON, YAML, CSV), cursor pagination, multiple auth profiles, and a non-interactive mode for CI and AI agents. The `pachca api` command sends direct requests to any method and ships a built-in API reference (`ls`, `--describe`, `--spec`, `--docs`) from the same OpenAPI spec — an agent never needs to open the docs website.

**Docs**: https://dev.pachca.com/guides/cli

## Agent Skills

AI agents use CLI-first skills with step-by-step workflows, zero-friction authorization, and automatic permission checks.

### Install (40+ agents)

```bash
npx skills add pachca/openapi
```

### Compatibility

| Agent | Path |
|-------|------|
| Claude Code | `CLAUDE.md` → `AGENTS.md` |
| Codex CLI | `AGENTS.md` |
| OpenCode | `skills/` |
| Cursor, Windsurf, Continue, 40+ more | Auto-detected |
| Manual install | `cp -r skills/pachca-* <path>` |

### Available skills

| Skill | Description |
|-------|-------------|
| `pachca-profile` | Profile, status, custom fields |
| `pachca-users` | Employees and tags (groups) |
| `pachca-chats` | Channels, conversations, members, export |
| `pachca-messages` | Messages, files, reactions, buttons |
| `pachca-bots` | Bots, webhooks, unfurling |
| `pachca-forms` | Interactive forms |
| `pachca-tasks` | Reminders (tasks) |
| `pachca-search` | Full-text search |
| `pachca-security` | Audit events, DLP |
| `pachca` | Router skill — routes to the right skill |

Skills are generated automatically from the OpenAPI spec on `bun turbo build`. Install only from the official repository — skills contain instructions only (no executable code).

## n8n

A community node for [n8n](https://n8n.io/) — 18 resources, 65+ operations, and a Pachca Trigger with automatic webhook registration.

```bash
# In n8n: Settings > Community Nodes > n8n-nodes-pachca
npm install n8n-nodes-pachca
```

Generated automatically from the OpenAPI spec, fully backward-compatible with v1.

**Docs**: [dev.pachca.com/guides/n8n](https://dev.pachca.com/guides/n8n/overview) · **[README](integrations/n8n/README.md)**

## SDK

| Language | Package | Registry |
|----------|---------|----------|
| [TypeScript](sdk/typescript/README.md) | `@pachca/sdk` | npm |
| [Python](sdk/python/generated/README.md) | `pachca-sdk` | PyPI |
| [Go](sdk/go/README.md) | `github.com/pachca/go-sdk` | Go modules |
| [Kotlin](sdk/kotlin/README.md) | `com.pachca:sdk` | JitPack |
| [Swift](sdk/swift/README.md) | `PachcaSDK` | SPM |
| [C#](sdk/csharp/generated/README.md) | `Pachca.Sdk` | NuGet |

Every SDK follows one pattern: `PachcaClient(token)` → `client.service.method(request)`.

**Conventions:**
- **Input**: path params and body fields (if ≤2) are spread into method arguments. Otherwise — a single request object.
- **Output**: if an API response contains a single `data` field, the SDK returns its contents directly.
- Service, method, and field names match the operationId and parameters from the OpenAPI spec.

**Example (TypeScript):**

```typescript
import { PachcaClient } from "@pachca/sdk";

const pachca = new PachcaClient("YOUR_TOKEN");
const users = await pachca.users.listUsers();
await pachca.reactions.addReaction(messageId, { code: "👍" }); // ≤2 fields → arguments
```

SDKs are generated from `openapi.yaml` and published automatically on push to `main`.

### Generator

Instead of a prebuilt SDK, you can generate a typed client straight into your own project:

```bash
npx @pachca/generator --output ./generated --lang typescript
npx @pachca/generator --output ./generated --lang typescript,python,go,kotlin,swift,csharp
```

| Option | Description |
|--------|-------------|
| `--spec <path\|url>` | Path or URL to an OpenAPI 3.0 YAML (default: `https://dev.pachca.com/openapi.yaml`) |
| `--output <dir>` | Output directory for the generated code |
| `--lang <langs>` | Comma-separated languages: `typescript`, `python`, `go`, `kotlin`, `swift`, `csharp` |
| `--examples` | Generate `examples.json` with call examples |

**Docs**: https://dev.pachca.com/guides/sdk/overview

## Testing

| Tool | How to use |
|------|------------|
| [Scalar](https://client.scalar.com/?url=https://dev.pachca.com/openapi.yaml) | Online client right in the browser — no install |
| [Postman Collection](https://dev.pachca.com/pachca.postman_collection.json) | Download and import into Postman |
| Bruno | Download the same file and import: File → Import → Postman Collection |

## AI integrations

| File | Contents |
|------|----------|
| [`/llms.txt`](https://dev.pachca.com/llms.txt) | Short index: every endpoint with links + a line map |
| [`/llms-full.txt`](https://dev.pachca.com/llms-full.txt) | Full docs: guides + endpoints with parameters |
| [`/llms-en.txt`](https://dev.pachca.com/llms-en.txt) | English version of the full docs (for Context7) |
| [`/skill.md`](https://dev.pachca.com/skill.md) | AI-agent skill: workflows, capabilities, links |
| [`/workflows.arazzo.yaml`](https://dev.pachca.com/workflows.arazzo.yaml) | Multi-step API workflows in Arazzo 1.0.1 |
| `/api/{section}/{action}.md` | A standalone .md for each endpoint and guide |
| `<any page>.md` | Markdown version of any page (or the `Accept: text/markdown` header) |
| `/.well-known/agent-skills/index.json` | Agent Skills discovery index (Cloudflare RFC) |

[Context7](https://context7.com/pachca/openapi) — AI-native document discovery. Through the CLI, the API reference is available without the website too: `pachca api ls`, `pachca api <METHOD> <path> --describe`.

All files are served with `Access-Control-Allow-Origin: *`, marked `X-Robots-Tag: noindex`, and cached through a CDN.

## Development

```bash
bun install

bun turbo dev            # Development with hot reload (localhost:3000)
bun turbo build          # Production build
bun turbo check          # All checks (lint + typecheck + knip + format)
bun turbo generate       # TypeSpec → openapi.yaml + SDK
```

## Contact

- [GitHub Issues](https://github.com/pachca/openapi/issues)
- support@pachca.com · team@pachca.com

---

Architecture and maintainer internals are documented in the Russian [README.md](README.md) and in [CONTRIBUTING.md](CONTRIBUTING.md).
