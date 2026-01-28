import { headers } from 'next/headers';

export async function GET(): Promise<Response> {
  const headersList = await headers();
  const host = headersList.get('host') || '';

  // Block all crawlers on Vercel preview domain
  if (host.includes('vercel.app')) {
    const blockedRobots = `User-agent: *
Disallow: /
`;
    return new Response(blockedRobots, {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  // Production robots.txt
  const productionRobots = `User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://${host}/sitemap.xml
`;

  return new Response(productionRobots, {
    headers: { 'Content-Type': 'text/plain' },
  });
}
