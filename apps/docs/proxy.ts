import { existsSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { prefersMarkdown } from './lib/accept-markdown';

// Page path → where its pre-generated markdown twin would be in /public, or
// null for a file path. Whether the twin exists is hasPublicFile's job. Every
// page of the site has a twin and no page path has a dot in its last segment,
// so any path without one gets a candidate: a path with no twin is a 404, and
// an agent asking for markdown gets it as markdown wherever the path is,
// /no-such-page included. A path with an extension is a file (images,
// BingSiteAuth.xml, .md handled before this) and is left alone; /internal/*
// and /.well-known/* are excluded by the matcher, and next.config redirects
// run before the proxy.
function markdownTwin(pathname: string): string | null {
  if (pathname === '/') return '/index.md';
  const trimmed = pathname.replace(/\/+$/, '');
  const lastSegment = trimmed.slice(trimmed.lastIndexOf('/') + 1);
  if (lastSegment.includes('.')) return null;
  return `${trimmed}.md`;
}

// Generated .md files live in public/. In `next dev` and in the standalone
// server (the Dockerfile copies public/ to apps/docs/public and server.js
// chdirs to apps/docs) the working directory is apps/docs. Next 16 runs the
// proxy in Node, so a stat per request is cheap and never goes stale.
const PUBLIC_DIR = path.join(process.cwd(), 'public');

function hasPublicFile(urlPath: string): boolean {
  let decoded: string;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return false;
  }
  const file = path.join(PUBLIC_DIR, decoded);
  // path.join resolves `..`: never look outside public/.
  return file.startsWith(PUBLIC_DIR + path.sep) && existsSync(file);
}

// A missing markdown page answers in markdown, not with the 50 KB HTML 404
// page under a text/markdown header, and is never cached: the page may
// appear with the next deploy.
const NOT_FOUND_MARKDOWN = `# Страница не найдена

Такой страницы в документации Пачки нет. Начните с указателя:

- [Указатель документации](https://dev.pachca.com/llms.txt)
- [Методы API](https://dev.pachca.com/api/llms.txt)
- [Руководства](https://dev.pachca.com/guides/llms.txt)
- [Обновления](https://dev.pachca.com/updates/llms.txt)
`;

function markdownNotFound(): NextResponse {
  return new NextResponse(NOT_FOUND_MARKDOWN, {
    status: 404,
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
      'Access-Control-Allow-Origin': '*',
      Vary: 'Accept, User-Agent',
    },
  });
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

  const readsBody = request.method === 'GET' || request.method === 'HEAD';

  // A direct .md request: the static file from public/ with the next.config
  // `*.md` headers, or a markdown 404. `/.md` is rewritten to /index.md in
  // next.config, after the proxy.
  if (pathname.endsWith('.md')) {
    const file = pathname === '/.md' ? '/index.md' : pathname;
    if (readsBody && !hasPublicFile(file)) return markdownNotFound();
    return NextResponse.next();
  }

  const candidate = markdownTwin(pathname);
  const twin = candidate && hasPublicFile(candidate) ? candidate : null;

  // Markdown content negotiation (2026 "agent-friendly pages" pattern): an
  // agent that prefers `text/markdown` over `text/html` gets the .md twin
  // at the same URL. Browsers send `text/html` with q=1 (or `*/*`) →
  // unaffected. See lib/accept-markdown.ts for q-value handling.
  // Also honored: known live-fetch agent UAs (ChatGPT-User, Claude-User,
  // Perplexity-User, etc.) get the MD twin automatically, since the vendor
  // documents these UAs as live-fetch (vs their indexing crawler counterparts
  // like ClaudeBot/GPTBot, which need full HTML for SEO).
  // Every page has a twin, so a path that would have one but does not is a
  // missing page: such an agent gets the markdown 404.
  if (readsBody && candidate) {
    const accept = request.headers.get('accept');
    const ua = request.headers.get('user-agent');
    if (prefersMarkdown(accept) || isLiveFetchAgent(ua)) {
      if (!twin) return markdownNotFound();
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
  // .md twin (only when it exists), the llms.txt / llms-full.txt index
  // (rel="llms-txt" + X-Llms-Txt), the skills index (rel="service-meta") and
  // the RFC 9727 API catalog (rel="api-catalog", linkset+json — same payload
  // as the well-known URI, advertised here so agents that only read headers
  // also see it).
  response.headers.set(
    'Link',
    [
      ...(twin ? [`<${twin}>; rel="alternate"; type="text/markdown"`] : []),
      '</llms.txt>; rel="llms-txt"; type="text/plain"',
      '</llms-full.txt>; rel="llms-full-txt"; type="text/plain"',
      '</.well-known/agent-skills/index.json>; rel="service-meta"; type="application/json"',
      '</.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json"',
    ].join(', ')
  );
  response.headers.set('X-Llms-Txt', '/llms.txt');
  // Next 16 replaces Vary on App Router pages with its own list, so this
  // reaches only other responses. `Vary: Accept` on HTML pages has to come
  // from the web server in front of the site.
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
    // All pages and .md files except static assets, the docs site's own route
    // handlers (under /internal/: search + OG image), .well-known discovery
    // files, feeds, and the skill ZIPs under /skills/. .well-known/* is
    // excluded so each file's Content-Type / Cache-Control from next.config
    // wins (no middleware override of headers on RFC 9727 api-catalog,
    // skills/agent-skills indexes etc.). .md files pass through so a missing
    // one gets the markdown 404.
    // `/internal/*` are the site's own machinery (NOT Pachca API docs), so they
    // stay out of /api/ — that keeps /api/ a clean documentation namespace and
    // removes the prefix-collision that used to drop /api/search/<method> doc
    // pages from middleware, the sitemap, and robots.
    '/((?!_next/|favicon|apple-touch-icon|llms|feed\\.xml|sitemap\\.xml|robots\\.txt|openapi\\.yaml|\\.well-known/|internal/|.*\\.(?:ico|svg|png|jpg|webp|txt|yaml|json|zip)).*)',
  ],
};
