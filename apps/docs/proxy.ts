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

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const twin = markdownTwin(pathname);

  // Markdown content negotiation (Cloudflare/Vercel "agent-friendly pages"
  // pattern, 2026): an agent that explicitly asks for `text/markdown` and
  // NOT `text/html` (i.e. not a browser/SEO crawler) gets the .md twin at
  // the same URL. Browsers/crawlers always send text/html → unaffected.
  if (request.method === 'GET' && twin) {
    const accept = request.headers.get('accept') ?? '';
    if (accept.includes('text/markdown') && !accept.includes('text/html')) {
      const url = request.nextUrl.clone();
      url.pathname = twin;
      const rewrite = NextResponse.rewrite(url);
      rewrite.headers.set('Vary', 'Accept');
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
