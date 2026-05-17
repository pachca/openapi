# Docs authoring conventions & gotchas

Rules for editing `apps/docs` (MDX content + components) that aren't
obvious from the code and have bitten us before.

## New MDX component → register in THREE places

The site has two render paths: Next.js renders MDX with React, **and**
`scripts/generate-llms.ts` flattens MDX to Markdown for `/llms-full.txt`
and per-page `.md`. A component added for the site that the flattener
doesn't know about leaks as a raw `<Component>` tag into the AI-facing
Markdown.

When adding a component, register it in **all three**:

1. `apps/docs/components/mdx/mdx-components.tsx` — definition + add to
   `customMdxComponents`.
2. `apps/docs/components/api/markdown-content.tsx` — import + add to the
   `components` object passed to `MDXRemote` (missing this → runtime
   "component is not defined").
3. `apps/docs/lib/mdx-expander.ts` — a handler in `expandMdxComponents()`
   converting the JSX to plain Markdown (or unwrapping inner content for
   layout-only wrappers like `<CardRow>`/`<ParamsTable>`). Missing this →
   raw tags leak into `public/**/*.md` and `public/llms-full.txt`.

**Verify:** after `npx turbo build`,
`grep -n "ComponentName" apps/docs/public/llms-full.txt apps/docs/public/api/*.md`
must return nothing. Same rule for typography HTML entities (`&nbsp;`,
`&shy;`, …) — strip/replace them in the expander, don't let them reach the
AI-facing Markdown.

## MDX component imports — do NOT re-export

Do **not** `export { X } from '...'` in `mdx-components.tsx` — Turbopack
may fail to resolve it at runtime. Instead: `import` it in
`mdx-components.tsx` for `customMdxComponents`, and in
`markdown-content.tsx` import directly from the source file
(`@/components/mdx/steps`, etc.).

## Turbopack / dev server

- `turbo check` catches type errors but **not** Turbopack module
  resolution issues — always test at runtime (`bun turbo dev`) after
  adding/registering a component.
- After changing component registrations or adding TS/TSX files, restart
  the dev server (`pkill -f "next dev"`, `rm -rf apps/docs/.next`, then
  `bun turbo dev`) — Turbopack HMR often misses these.
- **Next.js: stay on 16.0.x (16.0.10).** 16.1.x breaks
  `next dev --turbopack` (`server-external-packages.json` renamed to
  `.jsonc`, Turbopack still expects `.json`). Build works; only dev
  crashes. Re-check before bumping.
- **Next 16 middleware lives in `apps/docs/proxy.ts`** (Next renamed
  `middleware.ts` → `proxy.ts`). Having both files present fails the build.

## Headings — no decorative symbols

In MDX headings (`##`, `###`) and `<Step title="...">` do **not** use:
em dash `—`, arrows `→ ← ⇒`, plus `+`, the latinism `vs`, and **inline
code / backticks** (`` `guest` ``, `` `chat_ids` ``). Headings feed the
sidebar TOC and these look like noise there; backticks in a heading are
**not** rendered as code — the raw backticks show. Name the entity in
words («гостевая роль», «чаты») and expand the identifier in the body
text under the heading. Parentheses `(...)` and hyphens in compound words
(`webhook-слот`) are fine.

Rewrite as a clean phrase:

| Bad | Good |
|-----|------|
| `### Execute Step — запуск одного узла` | `### Запуск одного узла через Execute Step` |
| `<Step title="Деактивировать → протестировать → активировать">` | `<Step title="Временная деактивация продакшен-workflow">` |
| `## Роль "guest" и "chat_ids" при создании` (backticks in heading) | `## Гостевая роль и чаты при создании сотрудника` |

Check before commit:
`grep -En '^#{2,3}.*( — | → | \+ |`)' apps/docs/content/**/*.mdx`

## Design system — minimum font size

`text-[11px]` is allowed **only** with `uppercase`/`capitalize` (small
labels). For normal-case text the minimum is `text-[12px]`. Don't "fix"
12px hints down to 11px — 11px normal text is too small.

## TypeSpec gotchas

- `@opExample` does **not** work with `HttpPart<T>` (multipart) — string
  values aren't assignable to `HttpPart<string>`. Handle multipart
  examples in the generators instead.
- `@encodedName("multipart/form-data", ...)` does **not** produce an
  OpenAPI `encoding` section — schema property names stay camelCase;
  wire-name mapping must be handled separately.
- `Schema.properties` is `Record<string, Schema> | undefined` — narrow
  before `Object.entries()`.
- Always recompile after editing `typespec.tsp`:
  `npx turbo build --filter=@pachca/spec --force` — otherwise
  `openapi.yaml` stays stale and docs won't reflect the change.
- **`@doc` of model fields: short, plain, no markdown bold.** The params
  table renders the field description as text — inline `` `code` ``
  becomes a chip, but `**bold**` shows as literal `**`. Keep it to one or
  two short sentences, self-contained, with no cross-ref like «см.
  описание метода». Don't invent qualifiers — use the exact terms already
  in the docs (incident: wrote «чаты компании» / «company chats» where
  docs never call chats that). Put detailed rules / error lists /
  edge-cases in the **operation** `@doc("""...""")` (rendered as full
  markdown above the table; multi-paragraph is fine there). Reference
  length: `User.skip_email_notify` (2 short sentences).
- **`@doc` terminal period — by sentence count.** Established convention
  (≈863 single-line `@doc`: ≈825 without a period, ≈38 with one): a
  **single phrase / one sentence** (a field label like
  `@doc("Тип файла")`) ends **without** a terminal period; a
  **multi-sentence** description (two or more sentences) ends **with** a
  terminal period on every sentence, including the last (real examples:
  the `User.email` / `User.phone_number` docs). Same principle as
  changelog punctuation — [updates-format §3](./updates-format.md). When
  splitting a semicolon into two sentences the result is multi-sentence,
  so make sure the last sentence also ends with a period.
- **EN overlay symmetry for operation descriptions.**
  `$.paths[...].<method>.update.description` in
  `packages/spec/overlay.en.yaml` is a **full replacement** of the
  description. If you add a paragraph to a RU operation `@doc` but not to
  its overlay target, the English version silently loses the paragraph
  (`overlay:apply` does not fail — no Cyrillic remains). When editing a RU
  operation description, always update its EN overlay target in lockstep.

---

See also: [CONTRIBUTING](../CONTRIBUTING.md) ·
[updates format](./updates-format.md) · [API audit](./api-audit.md)
