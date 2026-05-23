import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Path → its pre-generated markdown twin in /public, or null if none exists.
function markdownTwin(pathname: string): string | null {
  if (pathname === '/') return '/index.md';
  if (pathname === '/updates') return '/updates.md';
  if (pathname.startsWith('/updates/')) {
    if (pathname.endsWith('.md')) return null;
    return `${pathname.replace(/\/+$/, '')}.md`;
  }
  if (pathname.startsWith('/guides/') || pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/search') || pathname.startsWith('/api/og')) return null;
    if (pathname.endsWith('.md')) return null;
    return `${pathname.replace(/\/+$/, '')}.md`;
  }
  return null;
}

// Parse a single Accept header entry's q-value, defaulting to 1.0 per RFC 9110.
function parseQ(params: string[]): number {
  for (const p of params) {
    const m = /^q=([0-9.]+)$/i.exec(p.trim());
    if (m) {
      const q = parseFloat(m[1]);
      return Number.isFinite(q) ? Math.max(0, Math.min(1, q)) : 1;
    }
  }
  return 1;
}

// Decide whether a client prefers `text/markdown` over `text/html` per
// RFC 9110 §12.5.1. The previous `includes('text/markdown') &&
// !includes('text/html')` heuristic was over-strict: a polite agent sending
// `Accept: text/markdown, text/html;q=0.5` (clearly prefers MD with HTML as
// fallback) was being routed to HTML. This handles q-values, wildcards
// (`text/*`, `*/*` count toward the HTML side since browsers send them),
// and an empty/missing header (treated as ambiguous → HTML).
function prefersMarkdown(accept: string): boolean {
  if (!accept) return false;
  let mdQ = 0;
  let htmlQ = 0;
  for (const raw of accept.split(',')) {
    const [rawType, ...params] = raw.trim().split(';');
    const type = rawType?.trim().toLowerCase();
    if (!type) continue;
    const q = parseQ(params);
    if (type === 'text/markdown') mdQ = Math.max(mdQ, q);
    else if (type === 'text/html') htmlQ = Math.max(htmlQ, q);
    else if (type === 'text/*' || type === '*/*') htmlQ = Math.max(htmlQ, q);
  }
  return mdQ > 0 && mdQ > htmlQ;
}

// Query-param fallback for clients that can't easily set Accept: the agent
// just builds the URL. Matches Vercel docs (`?ai=1`) / Mintlify (`?show-md=1`)
// shape. Accepted spellings: `?format=md`, `?format=markdown`. Other values
// of `format=` are ignored (no error) so it composes with future formats.
function requestedMarkdownByQuery(url: URL): boolean {
  const format = url.searchParams.get('format')?.toLowerCase();
  return format === 'md' || format === 'markdown';
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const twin = markdownTwin(pathname);

  // Markdown content negotiation (Cloudflare/Vercel "agent-friendly pages"
  // pattern, 2026): an agent that prefers `text/markdown` over `text/html`
  // gets the .md twin at the same URL. Browsers send `text/html` with q=1
  // (or `*/*`) → unaffected. See `prefersMarkdown` for q-value handling.
  // Also honored: explicit `?format=md` / `?format=markdown` query param for
  // shell/script agents that can't easily set the Accept header.
  if (request.method === 'GET' && twin) {
    const accept = request.headers.get('accept') ?? '';
    if (prefersMarkdown(accept) || requestedMarkdownByQuery(request.nextUrl)) {
      const url = request.nextUrl.clone();
      url.pathname = twin;
      const rewrite = NextResponse.rewrite(url);
      rewrite.headers.set('Vary', 'Accept');
      // RFC 9110 §8.7: when the response is a representation of a different
      // resource than the request URI (here: the .md twin), Content-Location
      // names the canonical URI of that representation so agents can cache
      // the result under the twin URL.
      rewrite.headers.set('Content-Location', twin);
      // The next.config `*.md` header rule matches the request path, not
      // this rewrite's destination, so the negotiated markdown response
      // would otherwise ship without noindex. Keep the .md twin out of the
      // search index here too (matches the Mintlify default).
      rewrite.headers.set('X-Robots-Tag', 'noindex');
      return rewrite;
    }
  }

  const response = NextResponse.next();
  // Advertise agent-facing resources via the HTTP Link header so an agent
  // that fetches any page (e.g. arriving from a web search and reading only
  // the response headers) discovers the documentation index without
  // inspecting the body. Mirrors the Mintlify/Stripe default: the per-page
  // .md twin, the llms.txt / llms-full.txt index (rel="llms-txt" +
  // X-Llms-Txt), and the skills index (rel="service-meta").
  const mdUrl = pathname === '/' ? '/index.md' : `${pathname}.md`;
  response.headers.set(
    'Link',
    [
      `<${mdUrl}>; rel="alternate"; type="text/markdown"`,
      '</llms.txt>; rel="llms-txt"; type="text/plain"',
      '</llms-full.txt>; rel="llms-full-txt"; type="text/plain"',
      '</.well-known/skills/index.json>; rel="service-meta"; type="application/json"',
    ].join(', ')
  );
  response.headers.set('X-Llms-Txt', '/llms.txt');
  response.headers.set('Vary', 'Accept');
  // Default Vercel CDN caching for SSG pages is `s-maxage=31536000` (1 year),
  // which afdocs flags as «aggressive» and which delays content updates
  // reaching agents until the next deploy. Match agent artefacts: short CDN
  // cache + must-revalidate against the ETag Next.js already sets.
  response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate, s-maxage=3600');
  return response;
}

export const config = {
  matcher: [
    // All pages except static files, the api route handlers, and .md/feeds.
    '/((?!_next/|favicon|apple-touch-icon|llms|feed\\.xml|sitemap\\.xml|robots\\.txt|openapi\\.yaml|api/(?:search|og)|.*\\.(?:ico|svg|png|jpg|webp|md|yaml|json)).*)',
  ],
};
