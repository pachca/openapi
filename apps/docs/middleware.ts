import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Add Link header pointing to markdown version of the page
  const mdUrl = pathname === '/' ? '/.md' : `${pathname}.md`;
  response.headers.set('Link', `<${mdUrl}>; rel="alternate"; type="text/markdown"`);

  return response;
}

export const config = {
  matcher: [
    // Match all pages except static files, API routes, and .md rewrites
    '/((?!api/|_next/|favicon|apple-touch-icon|llms|feed\\.xml|sitemap\\.xml|robots\\.txt|openapi\\.yaml|.*\\.(?:ico|svg|png|jpg|webp|md)).*)',
  ],
};
