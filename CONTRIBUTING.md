# Contributing

This repo is the Pachca API platform: one TypeSpec description generates
the OpenAPI spec, the docs site, the CLI, the SDKs, the n8n node, and the
AI-agent artifacts. **TypeSpec is the single source of truth — almost
everything else is generated.** Read this before changing anything.

> Using the Pachca API (not contributing here)? See `skill.md`,
> `/llms.txt`, the `skills/` directory, or <https://dev.pachca.com> —
> not this file.

## Layout

| Path | What |
|------|------|
| `packages/spec` | TypeSpec (`typespec.tsp`) → `openapi.yaml`; English overlay, `workflows.ts`, examples |
| `packages/cli` | oclif CLI `@pachca/cli`, generated from OpenAPI |
| `packages/generator` | Multi-language SDK generator |
| `packages/openapi-parser` | Shared OpenAPI parser |
| `apps/docs` | Next.js 16 docs site (dev.pachca.com): `content/` MDX, `lib/`, `scripts/` generators, `public/` generated artifacts |
| `n8n-nodes-pachca` / `integrations/n8n` | n8n community node |
| `skills/` | Agent Skills (generated) |

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
| llms / skills / postman / per-page md | `cd apps/docs && bun run generate-llms` |
| CLI commands | `cd packages/cli && bun run generate-cli` |
| Generator test snapshots | `cd packages/generator && npm run regen-snapshots` |
| Everything (before commit) | `npx turbo build` |

If the generator step fails with `Cannot find module @pachca/openapi-parser`:
`bun install` → `npx turbo run build --filter=@pachca/openapi-parser --force`
→ `npx turbo run build --filter=@pachca/generator --force` →
`npx turbo build --force`.

## Generation pipeline

```
typespec.tsp → openapi.yaml → (llms / skills / cli / sdk / docs / n8n)
```

Edit **only** the source; never hand-edit generated output:

| Generated | Source of truth |
|-----------|-----------------|
| `packages/spec/openapi.yaml` | `packages/spec/typespec.tsp` |
| `apps/docs/public/llms*.txt`, `public/**/*.md`, `public/skill.md`, `public/.well-known/**`, `public/workflows.arazzo.yaml`, Postman collection | `apps/docs/scripts/generate-llms.ts` + `scripts/skills/` + `apps/docs/content/**` |
| `packages/cli/src/commands/**` (except `auth/`, `config/`), `packages/cli/CHANGELOG.md` | `packages/cli/scripts/generate-cli.ts`; `src/data/changelog.json` |
| `skills/**`, `AGENTS.md` | `apps/docs/scripts/skills/generate.ts` |
| n8n node files | n8n generator |

After a build, review the diff of regenerated files; a stale version
sitting in a generated file means regeneration didn't run — debug it,
don't hand-patch.

For `packages/generator` snapshot fixtures, use `npm run regen-snapshots`
(backed by top-level `scripts/regen-generator-snapshots.ts`) instead of
ad-hoc `bun -e` commands or the old `bin/` / `tests/` helpers.

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

Agent-facing repo entry point: `AGENTS.md` (generated). Claude project
instructions: `CLAUDE.md`.
