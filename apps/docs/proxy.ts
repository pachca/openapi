import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Path → its pre-generated markdown twin in /public, or null if none exists.
function markdownTwin(pathname: string): string | null {
  if (pathname === '/') return '/index.md';
  if (pathname === '/updates') return '/updates.md';
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
      return rewrite;
    }
  }

  const response = NextResponse.next();
  // Advertise the markdown version of the page (HTTP Link header, in
  // addition to the per-page <link rel="alternate"> metadata tag).
  const mdUrl = pathname === '/' ? '/.md' : `${pathname}.md`;
  response.headers.set('Link', `<${mdUrl}>; rel="alternate"; type="text/markdown"`);
  response.headers.set('Vary', 'Accept');
  return response;
}

export const config = {
  matcher: [
    // All pages except static files, the api route handlers, and .md/feeds.
    '/((?!_next/|favicon|apple-touch-icon|llms|feed\\.xml|sitemap\\.xml|robots\\.txt|openapi\\.yaml|api/(?:search|og)|.*\\.(?:ico|svg|png|jpg|webp|md|yaml|json)).*)',
  ],
};
