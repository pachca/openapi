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

// Live-fetch agent UAs — bots that fetch a page in real-time in response to a
// user's prompt and feed it into model context. These benefit from the MD
// twin (≈10× fewer tokens, no HTML/Tailwind/SVG noise). UAs are documented
// in each vendor's bot directory (OpenAI, Anthropic, Perplexity, Cohere).
//
// Deliberately EXCLUDED — these crawl for training/index ranking and need the
// full HTML for SEO/schema.org signals:
//   ClaudeBot, GPTBot, OAI-SearchBot, PerplexityBot, Google-Extended,
//   Googlebot, Bingbot, YandexBot, Amazonbot.
const LIVE_FETCH_AGENT_UA = /\b(?:ChatGPT-User|Claude-User|Perplexity-User|cohere-ai)\b/i;

function isLiveFetchAgent(ua: string | null): boolean {
  return !!ua && LIVE_FETCH_AGENT_UA.test(ua);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Albato guide moved to the public help center. Preserve SEO weight with a 301.
  if (pathname === '/guides/albato' || pathname === '/guides/albato.md') {
    return NextResponse.redirect('https://pachca.com/help-center/integrations/albato', 301);
  }

  const twin = markdownTwin(pathname);

  // Markdown content negotiation (2026 "agent-friendly pages" pattern): an
  // agent that prefers `text/markdown` over `text/html` gets the .md twin
  // at the same URL. Browsers send `text/html` with q=1 (or `*/*`) →
  // unaffected. See `prefersMarkdown` for q-value handling.
  // Also honored: known live-fetch agent UAs (ChatGPT-User, Claude-User,
  // Perplexity-User, etc.) get the MD twin automatically, since the vendor
  // documents these UAs as live-fetch (vs their indexing crawler counterparts
  // like ClaudeBot/GPTBot, which need full HTML for SEO).
  if (request.method === 'GET' && twin) {
    const accept = request.headers.get('accept') ?? '';
    const ua = request.headers.get('user-agent');
    if (prefersMarkdown(accept) || isLiveFetchAgent(ua)) {
      const url = request.nextUrl.clone();
      url.pathname = twin;
      const rewrite = NextResponse.rewrite(url);
      rewrite.headers.set('Vary', 'Accept, User-Agent');
      // RFC 9110 §8.7: when the response is a representation of a different
      // resource than the request URI (here: the .md twin), Content-Location
      // names the canonical URI of that representation so agents can cache
      // the result under the twin URL.
      rewrite.headers.set('Content-Location', twin);
      // The next.config `*.md` header rule matches the request path, not
      // this rewrite's destination, so the negotiated markdown response
      // would otherwise ship without these. Mirror the .md twin headers:
      // keep it out of the index, allow cross-origin reads (browser agents),
      // and mark it as a real markdown representation.
      rewrite.headers.set('X-Robots-Tag', 'noindex');
      rewrite.headers.set('Access-Control-Allow-Origin', '*');
      rewrite.headers.set('X-Content-Source', 'markdown');
      return rewrite;
    }
  }

  const response = NextResponse.next();
  // Advertise agent-facing resources via the HTTP Link header so an agent
  // that fetches any page (e.g. arriving from a web search and reading only
  // the response headers) discovers the documentation index without
  // inspecting the body. Mirrors the Mintlify/Stripe default: the per-page
  // .md twin, the llms.txt / llms-full.txt index (rel="llms-txt" +
  // X-Llms-Txt), the skills index (rel="service-meta") and the RFC 9727
  // API catalog (rel="api-catalog", linkset+json — same payload as the
  // well-known URI, advertised here so agents that only read headers also
  // see it).
  const mdUrl = pathname === '/' ? '/index.md' : `${pathname}.md`;
  response.headers.set(
    'Link',
    [
      `<${mdUrl}>; rel="alternate"; type="text/markdown"`,
      '</llms.txt>; rel="llms-txt"; type="text/plain"',
      '</llms-full.txt>; rel="llms-full-txt"; type="text/plain"',
      '</.well-known/skills/index.json>; rel="service-meta"; type="application/json"',
      '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
      '</.well-known/agent-card.json>; rel="agent-card"; type="application/json"',
    ].join(', ')
  );
  response.headers.set('X-Llms-Txt', '/llms.txt');
  response.headers.set('Vary', 'Accept');
  // CDN-fronted SSG pages often default to a year-long `s-maxage`, which
  // afdocs flags as «aggressive» and which delays content updates reaching
  // agents until the next deploy. Match agent artefacts: short CDN cache +
  // must-revalidate against the ETag Next.js already sets.
  response.headers.set('Cache-Control', 'public, max-age=0, must-revalidate, s-maxage=3600');
  return response;
}

export const config = {
  matcher: [
    // All pages except static files, the api route handlers, .well-known
    // discovery files, and .md/feeds. .well-known/* is excluded so each
    // file's Content-Type / Cache-Control from next.config wins (no
    // middleware override of headers on RFC 9727 api-catalog,
    // skills/agent-skills indexes etc.).
    // `api/(?:search|og)$` is anchored so ONLY the route handlers themselves
    // are skipped — the search method doc pages (/api/search/<method>) still
    // go through middleware and get the agent cache header (else they fall
    // back to the CDN's year-long SSG cache; afdocs cache-header-hygiene).
    '/((?!_next/|favicon|apple-touch-icon|llms|feed\\.xml|sitemap\\.xml|robots\\.txt|openapi\\.yaml|\\.well-known/|api/(?:search|og)$|.*\\.(?:ico|svg|png|jpg|webp|md|yaml|json)).*)',
  ],
};
