# Contributing

This repo is the Pachca API platform: one TypeSpec description generates
the OpenAPI spec, the docs site, the CLI, the SDKs, the n8n node, and the
AI-agent artifacts. **TypeSpec is the single source of truth — almost
everything else is generated.** Read this before changing anything.

> Using the Pachca API (not contributing here)? See `skill.md`,
> `/llms.txt`, the plugin in `plugins/pachca/`, or <https://dev.pachca.com> —
> not this file.

## Layout

| Path | What |
|------|------|
| `packages/spec` | TypeSpec (`typespec.tsp`) → `openapi.yaml`; English overlay, examples |
| `packages/cli` | oclif CLI `@pachca/cli`, generated from OpenAPI |
| `packages/generator` | Multi-language SDK generator |
| `packages/openapi-parser` | Shared OpenAPI parser |
| `packages/mcp-manifest` | npm package `@pachca/mcp-manifest`: the MCP tool manifest and its JSON Schema, copied from `packages/spec` by the build |
| `apps/docs` | Next.js 16 docs site (dev.pachca.com): `content/` MDX, `lib/`, `scripts/` generators, `public/` generated artifacts |
| `n8n-nodes-pachca` / `integrations/n8n` | n8n community node |
| `plugins/pachca` | The Pachca plugin for Claude Code, the Claude app, Codex, VS Code and GitHub Copilot, and Cursor: hand-written skills, MCP configs and one manifest per host; checked, versioned and published by `apps/docs/scripts/skills/generate.ts` |

## Build & check

Toolchain: Turborepo + bun.

```bash
npx turbo build      # compiles TypeSpec + builds every package + regenerates all generated files
npx turbo check      # lint + typecheck + knip + format:check + test — CI runs this; MUST pass before commit
bun turbo dev        # docs dev server (http://localhost:3000)
```

Targeted regeneration:

| Regenerate | Command |
|------------|---------|
| OpenAPI only (after editing `typespec.tsp`) | `npx turbo build --filter=@pachca/spec --force` |
| MCP manifest and its npm copies | `npx turbo build --filter=@pachca/mcp-manifest` |
| llms / skill publishing and checks / postman / per-page md | `cd apps/docs && bun run generate-llms` |
| CLI commands | `cd packages/cli && bun run generate-cli` |
| Generator test snapshots | `cd packages/generator && npm run regen-snapshots` |
| Everything (before commit) | `npx turbo build` |

If the generator step fails with `Cannot find module @pachca/openapi-parser`:
`bun install` → `npx turbo run build --filter=@pachca/openapi-parser --force`
→ `npx turbo run build --filter=@pachca/generator --force` →
`npx turbo build --force`.

## Generation pipeline

```
typespec.tsp → openapi.yaml → (llms / cli / sdk / docs / n8n)
```

Edit **only** the source; never hand-edit generated output:

| Generated | Source of truth |
|-----------|-----------------|
| `packages/spec/openapi.yaml` | `packages/spec/typespec.tsp` |
| `packages/spec/mcp-manifest.json` | the spec + `packages/spec/mcp-core.ts`, `mcp-tools.ts`, `scripts/generate-mcp-manifest.ts` |
| `packages/mcp-manifest/mcp-manifest.json`, `mcp-manifest.schema.json` | copies of `packages/spec/mcp-manifest.json` and `mcp-manifest.schema.json` |
| `apps/docs/public/llms*.txt`, `public/**/*.md`, Postman collection | `apps/docs/scripts/generate-llms.ts` + `apps/docs/content/**` |
| `apps/docs/public/skill.md`, `public/.well-known/**`, `public/skills/*.zip`, the `version` in the plugin manifests and `apps/docs/scripts/skills/plugin-version.json` | `plugins/pachca/**` (hand-written) via `apps/docs/scripts/skills/generate.ts` |
| `packages/cli/src/commands/**` (except `auth/`, `config/`), `packages/cli/CHANGELOG.md` | `packages/cli/scripts/generate-cli.ts`; `src/data/changelog.json` |
| `AGENTS.md` | `apps/docs/scripts/skills/generate.ts` |
| n8n node files | n8n generator |

After a build, review the diff of regenerated files; a stale version
sitting in a generated file means regeneration didn't run — debug it,
don't hand-patch.

For `packages/generator` snapshot fixtures, use `npm run regen-snapshots`
(backed by top-level `scripts/regen-generator-snapshots.ts`) instead of
ad-hoc `bun -e` commands or the old `bin/` / `tests/` helpers.

## Agent skills and the plugin

`plugins/pachca` is the Pachca plugin. Claude Code and the Claude app read
`.claude-plugin/plugin.json` and `.mcp.json`. Codex reads its own
`.codex-plugin/plugin.json` and `.mcp.json`. VS Code and GitHub Copilot read the
root `plugin.json` in the Copilot format, with skills from `skills/` and the
server from `.mcp.json`. Cursor reads `.cursor-plugin/plugin.json`, whose MCP
server sends the token from `PACHCA_TOKEN`. The marketplaces at the repository
root (`.claude-plugin/`, `.cursor-plugin/`, `.agents/plugins/`) all point at
`./plugins/pachca`.

The root `plugin.json` must not declare the Agent Plugins `$schema`. Codex reads
such a root manifest before its own and then caps the plugin's MCP tools at
64 KB of tool specs (`codex-rs/core/src/mcp_tool_exposure.rs`): only the first
28 or so Pachca tools by name would reach the agent, without
`pachca_send_message`. The build fails on that.

Everything in the plugin is written by hand except the `version` of its four
manifests. Once the plugin files (all but `evals/`) differ from the ones in
`main`, the docs build sets it one patch above the version in `main`, so a
release gets the next version however many commits of the branch change the
plugin, and rebuilding or reverting does not move it. The build keeps the
content hash and version in `apps/docs/scripts/skills/plugin-version.json`. Do
not edit either. Run `npx turbo build` and commit the manifests and that file
with your change; if the version did not change, rerun with `--force`. A changed
plugin also needs a release entry with product `plugin` and that version in
`apps/docs/data/releases.json`: `scripts/check-changelog-sync.mjs` fails
without it.

Skills live in `skills/<name>/`. Knowledge skills are named `pachca` or
`pachca-<topic>`, keep only `name` and `description` in the frontmatter, and the
agent picks them by description. The build publishes them on dev.pachca.com: the
discovery index, `/skill.md` and `/skills/<name>.zip` for uploads. Commands are
skills with any other name, `argument-hint` and `disable-model-invocation: true`,
plus `agents/openai.yaml` with `policy.allow_implicit_invocation: false` for
Codex. They run only when the user calls them (`/pachca:summarize-thread` in Claude Code)
and are not published. A command says in words what the user gives with it,
without `$ARGUMENTS`, which only some programs fill in. The build fails on a
broken link, a missing MCP tool, CLI command or skill, an internal id, or
manifests out of step; see `apps/docs/scripts/skills/generate.ts`.

Evals live in `plugins/pachca/evals` and run with `claude plugin eval`
(Claude Code 2.1.269+). Each run calls the model with your own account:

```bash
cd plugins/pachca
# Routing: the right skill fires for a request, no sibling does
claude plugin eval . --tag routing --ablation none --model claude-sonnet-5-5 -j 6
# Knowledge: answers with the plugin and without it; the delta is what skills add
claude plugin eval . --tag knowledge --model claude-sonnet-5-5 -j 6
# Actions through the MCP server, answered by mocks
claude plugin eval . --tag action --ablation none --model claude-sonnet-5-5
```

`--tag pachca-messaging` (any skill name) narrows a run to one skill. Run the
cases of a skill after changing it, and add a case when a skill learns a rule.
A case is a folder with `case.yaml`; actions keep MCP mocks next to it in
`mocks/pachca/<tool>.md`, and the build writes the tool schemas they need
into `evals/mocks/pachca/_tools.json` from the MCP manifest. Results go to
`evals/results/` (gitignored).

## Workflow

1. Edit source.
2. `npx turbo build`
3. `npx turbo check` — fix until green.
4. Review generated-file diffs (especially `packages/cli/CHANGELOG.md`,
   `apps/docs/public/*`).
5. Branch from `origin/main` (`git fetch origin main` first — local
   `main` may be stale). Open a PR. **Never push to `main`**, even for
   small fixes.

## Deep-dive docs

| Topic | Doc |
|-------|-----|
| API audit & sync with backend (the full canonical process) | [docs/api-audit.md](docs/api-audit.md) |
| `updates.mdx` / `releases.json` / changelog format | [docs/updates-format.md](docs/updates-format.md) |
| MDX/component conventions, Turbopack & TypeSpec gotchas, design system | [docs/docs-conventions.md](docs/docs-conventions.md) |
| Publishing packages (CLI, n8n, generator, SDK, MCP manifest) and versions | [docs/releases.md](docs/releases.md) |

Agent-facing repo entry point: `AGENTS.md` (generated). Claude project
instructions: `CLAUDE.md`.
