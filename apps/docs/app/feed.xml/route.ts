import { loadUpdates } from '@/lib/updates-parser';

const BASE_URL = 'https://dev.pachca.com';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET(): Promise<Response> {
  const baseUrl = BASE_URL;

  const updates = loadUpdates();

  const lastBuildDate = updates.length > 0 ? new Date(updates[0].date).toUTCString() : new Date().toUTCString();

  const items = updates.map((update) => {
    const slug = update.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
    const link = `${baseUrl}/guides/updates#${slug}`;

    return `    <item>
      <title>${escapeXml(update.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(update.date).toUTCString()}</pubDate>
      <description>${escapeXml(update.content.slice(0, 500))}</description>
    </item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Пачка API — Обновления</title>
    <link>${baseUrl}/guides/updates</link>
    <description>История изменений и новые возможности API Пачки</description>
    <language>ru</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
${items.join('\n')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
