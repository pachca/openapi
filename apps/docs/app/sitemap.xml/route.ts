import { parseOpenAPI } from '@/lib/openapi/parser';
import { generateUrlFromOperation } from '@/lib/openapi/mapper';
import { getOrderedGuidePages } from '@/lib/guides-config';

const BASE_URL = 'https://dev.pachca.com';

export async function GET(): Promise<Response> {
  const baseUrl = BASE_URL;
  const api = await parseOpenAPI();
  const guidePages = getOrderedGuidePages();

  const lastmod = new Date().toISOString().split('T')[0];
  const urls: { loc: string; priority: string; changefreq: string }[] = [];

  // Homepage
  urls.push({ loc: baseUrl, priority: '1.0', changefreq: 'weekly' });

  // Guide pages
  for (const guide of guidePages) {
    if (guide.path === '/') continue;
    urls.push({ loc: `${baseUrl}${guide.path}`, priority: '0.8', changefreq: 'weekly' });
  }

  // API endpoint pages
  for (const endpoint of api.endpoints) {
    const url = generateUrlFromOperation(endpoint);
    urls.push({ loc: `${baseUrl}${url}`, priority: '0.7', changefreq: 'monthly' });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=0, must-revalidate, s-maxage=86400',
    },
  });
}
