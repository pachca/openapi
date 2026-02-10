const BASE_URL = 'https://dev.pachca.com';

export async function GET(): Promise<Response> {
  // Production robots.txt
  const productionRobots = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /openapi.yaml
Disallow: /llms.txt
Disallow: /llms-full.txt

Sitemap: ${BASE_URL}/sitemap.xml
`;

  return new Response(productionRobots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
