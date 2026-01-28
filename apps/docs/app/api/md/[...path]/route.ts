import { NextResponse } from 'next/server';
import { getEndpointByUrl, parseOpenAPI } from '@/lib/openapi/parser';
import {
  generateEndpointMarkdown,
  generateStaticPageMarkdownAsync,
} from '@/lib/markdown-generator';
import { getOrderedGuidePages } from '@/lib/guides-config';

export const dynamic = 'force-static';

export async function generateStaticParams() {
  const api = await parseOpenAPI();
  const { generateUrlFromOperation } = await import('@/lib/openapi/mapper');

  // Generate params for all API endpoints
  const endpointParams = api.endpoints.map((endpoint) => {
    const url = generateUrlFromOperation(endpoint);
    // Remove leading slash and split into path segments
    const path = url.slice(1).split('/');
    return { path };
  });

  // Add static pages from guides config
  const guidePages = getOrderedGuidePages();
  const staticPages = guidePages.map((guide) => {
    if (guide.path === '/') {
      return { path: ['index'] };
    }
    // Remove leading slash and split into path segments
    const path = guide.path.slice(1).split('/');
    return { path };
  });

  return [...staticPages, ...endpointParams];
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const pathSegments = resolvedParams.path;

  // Handle index (home page)
  if (pathSegments.length === 1 && pathSegments[0] === 'index') {
    const markdown = await generateStaticPageMarkdownAsync('/');
    if (markdown) {
      return new NextResponse(markdown, {
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
        },
      });
    }
  }

  // Build the path
  const pagePath = '/' + pathSegments.join('/');

  // Try static page first (async)
  const staticMarkdown = await generateStaticPageMarkdownAsync(pagePath);
  if (staticMarkdown) {
    return new NextResponse(staticMarkdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
      },
    });
  }

  // Try API endpoint
  const endpoint = await getEndpointByUrl(pagePath);
  if (endpoint) {
    const api = await parseOpenAPI();
    const baseUrl = api.servers[0]?.url;
    const markdown = generateEndpointMarkdown(endpoint, baseUrl);
    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
      },
    });
  }

  // Not found
  return new NextResponse('Page not found', { status: 404 });
}
