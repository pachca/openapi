/**
 * C1 — Self-documenting `pachca api`.
 *
 * Pure helpers over the build-time generated `src/data/endpoints.json`
 * (emitted by scripts/generate-cli.ts from the OpenAPI spec).
 *
 * The heavy lifting (parsing, $ref resolution, markdown, examples, curl)
 * is done at build time by reused apps/docs generators; at runtime the CLI
 * only reads JSON — no YAML parser in the bundle.
 */

export interface EndpointIndexEntry {
  method: string;
  path: string;
  summary: string;
  scope: string | null;
  plan: string | null;
  auth: boolean;
  paginated: boolean;
  /** Equivalent typed command, e.g. "pachca messages create". */
  command: string;
  /** Human documentation URL. */
  docLink: string;
  /** Compact reference: params, body, scope, doc link, equivalent command. */
  describe: string;
  /** Resolved OpenAPI fragment (params/body/responses/requirements). */
  spec: unknown;
  /** Full markdown reference (same content as public/api/*.md). */
  docs: string;
}

export type IntrospectMode = 'spec' | 'docs' | 'describe';

/** Row shape for `pachca api ls` (table/json). */
export interface EndpointListRow {
  method: string;
  path: string;
  summary: string;
  scope: string;
}

export function buildListRows(entries: EndpointIndexEntry[]): EndpointListRow[] {
  return entries.map((e) => ({
    method: e.method,
    path: e.path,
    summary: e.summary,
    scope: e.scope ?? '',
  }));
}

/**
 * Detect a self-documenting mode from raw argv (before this.parse()).
 * `pachca api` already requires the method positionally, so
 * `pachca api POST /messages --describe` is unambiguous by construction
 * (no `-X` needed, unlike Notion's `ntn api`).
 */
export function detectIntrospectMode(argv: string[]): IntrospectMode | null {
  if (argv.includes('--describe')) return 'describe';
  if (argv.includes('--spec')) return 'spec';
  if (argv.includes('--docs')) return 'docs';
  return null;
}

/**
 * Leading run of positional tokens (method, path) — stops at the first flag,
 * so flag values (e.g. `-o json`) are never mistaken for the path.
 * `pachca api` always takes method and path before any flag.
 */
export function positionals(argv: string[]): string[] {
  const out: string[] = [];
  for (const a of argv) {
    if (a.startsWith('-')) break;
    out.push(a);
  }
  return out;
}

export function findEndpoint(
  entries: EndpointIndexEntry[],
  method: string,
  path: string,
): EndpointIndexEntry | undefined {
  const m = method.toUpperCase();
  const p = path.replace(/\/+$/, '') || '/';
  return entries.find((e) => e.method === m && (e.path === path || e.path.replace(/\/+$/, '') === p));
}

/** Render the selected introspection output for a found endpoint. */
export function renderIntrospect(entry: EndpointIndexEntry, mode: IntrospectMode): string {
  if (mode === 'spec') return JSON.stringify(entry.spec, null, 2);
  if (mode === 'docs') return entry.docs;
  return entry.describe;
}
