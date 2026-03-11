# Design System — Pachca Developer Portal

## Direction

**Precise & technical.** The interface feels like an extension of the developer's editor — not a marketing site about an API. Code-first hierarchy, monospace where it matters, dense information, quiet structure.

**Who:** Developers integrating with Pachca's API. They're in their editor, terminal open, switching between docs and code. They scan, they don't browse.

**What they do:** Find the right endpoint, understand the contract, copy working code, get back to building.

**Feel:** Like a well-organized codebase. Everything has a reason. Nothing decorates. The interface earns trust through precision, not personality. Warm and calm — not cold and clinical.

---

## Color Architecture

**Color space:** OKLCH throughout (perceptually uniform, consistent across light/dark).

### Foundations

**Warm stone palette.** Text uses hue 70 (warm brown-stone), surfaces use hue 80 (sand/cream). This creates a warm, approachable feel like Claude docs — not the cold blue-violet of typical developer tools.

**Chroma:** Text 0.007–0.015, surfaces 0.003–0.012 (subtle warmth, not yellow).

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--background` | `oklch(98.5% 0.007 80)` | `oklch(15% 0.01 70)` | Canvas base |
| `--background-secondary` | `oklch(96% 0.01 80)` | `oklch(18% 0.012 70)` | Sidebar, section fills, card headers |
| `--background-tertiary` | `oklch(93% 0.012 80)` | `oklch(23% 0.012 70)` | Hover states, active fills |
| `--background-elevated` | `oklch(99.5% 0.003 80)` | `oklch(20% 0.012 70)` | Cards, panels, code blocks |
| `--background-border` | `oklch(91% 0.012 80)` | `oklch(27.5% 0.012 70)` | All borders |

**Dark mode elevation order:** base (15%) → secondary (18%) → elevated (20%) → tertiary/hover (23%) → border (27.5%). Higher = lighter = more prominent.

### Text Hierarchy

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--text-primary` | `oklch(20% 0.01 70)` | `oklch(93% 0.007 70)` | Headings, body, primary labels |
| `--text-secondary` | `oklch(46% 0.015 70)` | `oklch(70% 0.012 70)` | Descriptions, secondary labels |
| `--text-tertiary` | `oklch(62% 0.012 70)` | `oklch(55% 0.012 70)` | Metadata, timestamps, placeholders |

### Brand & Accent

| Token            | Light                | Dark                 | Role                           |
|------------------|----------------------|----------------------|--------------------------------|
| `--primary`      | `oklch(48% 0.17 50)` | `oklch(72% 0.15 50)` | Primary actions, active states |
| `--primary-dark` | `oklch(42% 0.17 50)` | `oklch(78% 0.13 50)` | Hover/pressed on primary       |

**White text on primary:** 4.82:1 — AA compliant.

### HTTP Method Colors

Protocol-native — these are functional, not decorative:

| Method | Color | Usage |
|--------|-------|-------|
| GET | `oklch(60.2% 0.193 263)` | Blue — read operations |
| POST | `oklch(63.8% 0.142 143.5)` | Green — create operations |
| PUT | `oklch(55.4% 0.116 77)` | Amber — replace operations |
| DELETE | `oklch(63.9% 0.179 28)` | Red — destructive operations |
| PATCH | `oklch(52.4% 0.211 329)` | Magenta — partial update operations |

### Semantic Colors

| Token | Value | Role |
|-------|-------|------|
| `--accent-yellow` | `oklch(55% 0.14 55)` | Warnings |
| `--accent-green` | `oklch(50% 0.14 143.5)` | Success states |
| `--accent-red` | `oklch(55% 0.17 28)` | Errors, destructive |

### Callout System

Four variants (info, warning, tip, danger), each with:
- Background: 10% opacity tint
- Border: 20% opacity tint
- Header background: 12% opacity tint
- Text: full saturation accent

### Glass Tokens

Glassmorphism layer for all interactive surfaces: header, cards, panels, code blocks, dropdowns, search, switchers. Semi-transparent with backdrop blur.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--glass` | `oklch(0% 0 0 / 3%)` | `oklch(100% 0 0 / 3%)` | Card/panel backgrounds, inline code, inputs |
| `--glass-border` | `oklch(0% 0 0 / 7%)` | `oklch(100% 0 0 / 6%)` | Borders on glass surfaces |
| `--glass-hover` | `oklch(0% 0 0 / 5%)` | `oklch(100% 0 0 / 6%)` | Hover state on glass |
| `--glass-heavy` | `oklch(100% 0 0 / 82%)` | `oklch(100% 0 0 / 8%)` | Dropdown/dialog backgrounds |
| `--glass-heavy-border` | `oklch(0% 0 0 / 14%)` | `oklch(100% 0 0 / 8%)` | Borders on heavy glass |
| `--glass-divider` | `oklch(0% 0 0 / 7%)` | `oklch(100% 0 0 / 4%)` | Section dividers |
| `--glass-active` | `oklch(0% 0 0 / 10%)` | `oklch(100% 0 0 / 12%)` | Active state (switcher tabs) |

Light mode glass-heavy is white frosted (`82% white`), not dark tint — conceptually a frosted pane over content.

---

## Depth Strategy

**Borders only for opaque surfaces.** Glass surfaces use backdrop-blur for depth. Shadows reserved only for floating layers (dropdowns, tooltips, dialogs).

- Cards/panels: `bg-glass backdrop-blur-md border border-glass-border` — glassmorphism
- Floating layers (dropdowns, dialogs): `bg-glass-heavy backdrop-blur-xl border border-glass-heavy-border shadow-xl`
- Hierarchy through background color steps: `background` → `background-secondary` → `background-elevated`
- Sidebar: same background as canvas, separated by border (not color)
- No decorative backgrounds or hero sections — clean canvas

---

## Spacing

**Base unit: 4px** (Tailwind default).

| Context | Values | Tailwind |
|---------|--------|----------|
| Micro (icon gaps) | 2px, 4px | `gap-0.5`, `gap-1` |
| Component (within buttons, badges) | 4px, 6px, 8px | `gap-1`, `px-1.5`, `gap-2` |
| Section (card padding, groups) | 12px, 16px | `p-3`, `p-4` |
| Major (between sections) | 24px, 32px, 48px | `gap-6`, `gap-8`, `mt-12` |

---

## Border Radius

Sharp-leaning — technical, not playful:

| Element | Radius | Tailwind |
|---------|--------|----------|
| Badges, pills | 999px | `rounded-full` |
| Buttons, inputs, dropdown items | 6px | `rounded-md` |
| Cards, panels, code blocks | 12px | `rounded-xl` |

---

## Typography

**System fonts only** — no custom web fonts. Fast, native, familiar to developers.

| Role | Family | Size | Weight | Tracking |
|------|--------|------|--------|----------|
| H1 | System sans | 32px | Bold (700) | Tight |
| H2 | System sans | 22px | Bold (700) | Tight |
| H3 | System sans | 17px | Bold (700) | Tight |
| Body | System sans | 15px | Normal (400) | Normal |
| Labels | System sans | 13px | Medium (500) | Normal |
| Small labels | System sans | 10-11px | Bold (700) | Widest, uppercase |
| Inline code | System mono | 13px | Normal (400) | Normal |
| Code blocks | System mono | 13px | Normal (400) | Normal |

**Sans stack:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif`
**Mono stack:** `'SFMono-Regular', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace`

**Line heights:**
- Headings: 1.15–1.35 (tight)
- Body: 1.6 (comfortable reading)
- Code: 1.5

---

## Component Patterns

### Method Badge

```
px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider
bg-method-{METHOD}/10 text-method-{METHOD}
```

### BoxedPanel (code blocks, examples)

- Container: `bg-glass backdrop-blur-md rounded-xl border border-glass-border overflow-hidden`
- Header: `h-[40px] flex items-center justify-between px-3 pl-4 border-b border-glass-border`
- Content: `px-6 py-2 overflow-x-auto custom-scrollbar`

### Card

- Default: `flex flex-col gap-2.5 px-4 py-3 rounded-xl border border-glass-border bg-glass backdrop-blur-md`
- Interactive: add `hover:bg-glass-hover transition-all duration-200`
- Icon: `h-5 w-5 text-text-primary`

### LimitCard

- Container: `border border-glass-border rounded-xl overflow-hidden bg-glass backdrop-blur-md`
- Header: `h-[40px] px-3 bg-glass border-b border-glass-border`
- Sections: `px-4 py-4` with `border-b` dividers

### Dropdown (Radix-UI)

- Container: `min-w-[140px] bg-glass-heavy backdrop-blur-xl border border-glass-heavy-border rounded-xl p-1.5 shadow-xl`
- Item: `px-2.5 py-1.5 text-[13px] font-medium rounded-md`
- Active item: `bg-primary/15 text-primary`
- Inactive hover: `hover:bg-glass-hover`

### Links (in prose)

- Color: `text-text-primary`
- Weight: `font-semibold`
- Underline: `decoration-text-primary/50 underline-offset-4 decoration-1`
- Hover: `decoration-text-primary` (full opacity)

### Lists

- Unordered: custom dot markers (`w-1 h-1 rounded-full bg-text-tertiary/60`)
- Ordered: monospace counter, positioned at `-left-8`
- Item spacing: `mb-1.5`

---

## Animation

- **Standard transition:** `transition-colors duration-200` (0.2s)
- **Accordion:** height-based, 0.2s ease-out
- **Tooltip:** scale + translateY, 0.2s ease-out in / 0.15s ease-in out
- **Dropdown:** scale-only, 0.15s in / 0.1s out
- **No spring/bounce** — professional, restrained

---

## Layout Constants

| Token | Value | Usage |
|-------|-------|-------|
| `--boxed-header-height` | 40px | Panel/card headers |
| `--mobile-header-height` | 56px | Fixed mobile header |
| Sidebar width | 280px | Desktop sidebar (`lg:pl-[280px]`) |

---

## Dark Mode

- Toggle: `html.dark` class (manual) or `prefers-color-scheme: dark` (system fallback)
- Depth: borders more important than shadows (shadows less visible on dark)
- Elevated surfaces: slightly lighter than base (not darker)
- Semantic colors: slightly adjusted for dark backgrounds
- Same component structure, inverted value scale

---

## Rules

1. **No decorative color.** Every color communicates: status, hierarchy, interaction, or identity.
2. **No shadows on surfaces.** Glass + blur defines depth for panels. Shadows only for floating layers (dropdowns, dialogs).
3. **OKLCH only.** No hex, no rgb. Perceptually uniform, consistent across themes.
4. **4px grid.** All spacing values are multiples of 4px.
5. **System fonts.** No custom font loading. Native performance.
6. **One accent.** Primary orange (Pachca brand) for actions. Method colors for HTTP. Semantic colors for status. Nothing else.
7. **Transitions: 0.2s.** Consistent timing across all interactive states.
8. **Code-first hierarchy.** Monospace for anything the developer copies. Sans for everything they read.
9. **Warm stone neutrals.** Text hue 70, surfaces hue 80. No cold blue-violet tones.
10. **Clean canvas.** No decorative backgrounds, hero sections, or gradient noise. Content first.
