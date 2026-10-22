# AGENTS.md

Guidance for AI coding agents working in this repository. (Using the Pachca
API instead of contributing here? See `skill.md`, `/llms.txt`, or the
`skills/` directory — not this file.)

## What this repo is

Monorepo (Turborepo + bun) for the Pachca API platform. TypeSpec is the
single source of truth; everything else is generated from it.

| Path | What |
|------|------|
| `packages/spec` | TypeSpec (`typespec.tsp`) → `openapi.yaml`; English overlay → `openapi.en.yaml`; MCP tool manifest (`mcp-manifest.json`), examples |
| `packages/cli` | oclif CLI `@pachca/cli`, generated from OpenAPI |
| `packages/generator` | Multi-language SDK generator |
| `packages/openapi-parser` | Shared OpenAPI parser |
| `packages/mcp-manifest` | npm package `@pachca/mcp-manifest`: the MCP tool manifest and its JSON Schema, copied from `packages/spec` by the build |
| `apps/docs` | Next.js 16 docs site (dev.pachca.com): `content/` MDX, `lib/`, `scripts/` generators, `public/` generated artifacts |
| `integrations/n8n` | n8n community node |

## Build & check

```bash
npx turbo build      # compiles TypeSpec + builds all packages + regenerates generated files
npx turbo check      # lint + typecheck + knip + format:check + test — MUST pass before commit (CI runs this)
bun turbo dev        # docs dev server (Next.js 16)
```

Standard loop: edit source → `npx turbo build` → `npx turbo check` →
review generated diffs → commit. Branch from `origin/main`; open a PR
(never push to `main`).

## Do NOT hand-edit generated files — edit the generator

| Generated | Source of truth |
|-----------|-----------------|
| `packages/spec/openapi.yaml` | `packages/spec/typespec.tsp` (then `npx turbo build --filter=@pachca/spec --force`) |
| `packages/spec/openapi.en.yaml` | `packages/spec/overlay.en.yaml` + `scripts/apply-overlay.ts` (a changed Russian text also needs `bun run overlay:fingerprints` in `packages/spec`) |
| `packages/spec/mcp-manifest.json` | the spec + `packages/spec/mcp-core.ts`, `mcp-tools.ts`, `scripts/generate-mcp-manifest.ts` (then `bun run generate-mcp` in `packages/spec`) |
| `packages/mcp-manifest/mcp-manifest.json`, `mcp-manifest.schema.json` | copies of `packages/spec/mcp-manifest.json` and `mcp-manifest.schema.json` (`npx turbo build --filter=@pachca/mcp-manifest`); a changed manifest needs a new version on top of `packages/mcp-manifest/CHANGELOG.md` and in its `package.json` (the package is not in `releases.json`) |
| `apps/docs/public/llms*.txt`, `public/**/*.md`, Postman collection | `apps/docs/scripts/generate-llms.ts` |
| `apps/docs/public/skill.md`, `public/.well-known/**`, root `skill.json` | the hand-written skills in `skills/<name>/`, published and checked by `apps/docs/scripts/skills/generate.ts` (links, MCP tool and CLI command names, size) |
| `packages/cli/src/commands/**` (except `auth`/`config`), `packages/cli/CHANGELOG.md` | `packages/cli/scripts/generate-cli.ts`; `src/data/changelog.json` |
| n8n node files | `integrations/n8n/scripts/generate-n8n.ts` |
| `AGENTS.md` (this file) | `apps/docs/scripts/skills/generate.ts` (`generateAgentsMd()`) |

CI enforces this: `scripts/check-generated-sync.mjs` runs `bun turbo build`
and fails the PR if any generated path drifts from its source.
`scripts/check-changelog-sync.mjs` separately enforces that every code
change to a published package ships with a release entry (and vice versa).

## Repo-specific gotchas

- A new MDX component must be registered in **three** places: `apps/docs/components/mdx/mdx-components.tsx`, `apps/docs/components/api/markdown-content.tsx`, and a handler in `apps/docs/lib/mdx-expander.ts` (else raw tags leak into generated `.md`/`llms-full.txt`).
- Next.js middleware lives in `apps/docs/proxy.ts` (Next 16 renamed `middleware.ts` → `proxy.ts`; both present fails the build).
- After changing `typespec.tsp`, always `npx turbo build --filter=@pachca/spec --force` — otherwise `openapi.yaml` stays stale.
- Snapshot regeneration for `packages/generator` is a bulk snapshot rewrite. Use `cd packages/generator && npm run regen-snapshots` (backed by top-level `scripts/regen-generator-snapshots.ts`) instead of ad-hoc `bun -e` one-offs or the old `bin/` / `tests/` helpers.
- Restart the docs dev server after changing component registrations or new TS/TSX files (Turbopack HMR misses them).
- Hand-written files must stay out of a turbo task's `outputs` globs. On a cache **hit** turbo restores every declared output over the working tree, silently reverting hand edits — the package script alone keeps them, so it looks intermittent. `generate-n8n` declares `nodes/**/*.ts`, so `nodes/Pachca/GenericFunctions.ts` and `nodes/Pachca/V1/**` are excluded by negation in `turbo.json`; keep new hand-written node files excluded too.

## Deep-dive docs (read before the relevant task)

- `CONTRIBUTING.md` — full layout, generation pipeline, build/check, workflow.
- `docs/api-audit.md` — **canonical** API-audit & backend-sync process (run on "проверь API"): scope, what to check, version/changelog bumps, backend sync checkpoint.
- `docs/updates-format.md` — rules for the per-date entry files in `apps/docs/content/updates/<date>.md` and the package release entries in `apps/docs/data/releases.json` (breaking the parser rules breaks the updates page).
- `docs/docs-conventions.md` — MDX 3-place registration, Turbopack/TypeSpec gotchas, headings & design-system rules.
- `docs/releases.md` — **canonical** package publishing & versioning: how CLI/n8n/generator/SDK/MCP manifest reach the registries, the `check-changelog-sync` build gate and `check-release` publish gate, version rules (CalVer/semver, exact next step), and how to cut a release.
