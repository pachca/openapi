const BASE_URL = 'https://dev.pachca.com';

export async function GET(): Promise<Response> {
  // Production robots.txt
  const productionRobots = `User-agent: *
Allow: /
Disallow: /api/search
Disallow: /api/og

Sitemap: ${BASE_URL}/sitemap.xml

Content-Signal: ai-train=yes, search=yes, ai-input=yes
`;

  return new Response(productionRobots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=0, must-revalidate, s-maxage=86400',
    },
  });
}
