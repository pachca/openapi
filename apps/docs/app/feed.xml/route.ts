import { loadUpdates, loadReleases, type ParsedRelease } from '@/lib/updates-parser';
import { parseOpenAPI } from '@/lib/openapi/parser';
import { resolveEndpointLinks } from '@/lib/openapi/resolve-links';
import { toSlug } from '@/lib/utils/transliterate';
import {
  PRODUCT_TITLES,
  extractSummary,
  markdownToHtml,
  releaseChangesHtml,
  releaseSummary,
} from '@/lib/feed-content';

const BASE_URL = 'https://dev.pachca.com';
const MAX_ITEMS = 20;

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function releaseToRssItem(release: ParsedRelease, baseUrl: string): string {
  const title = `${PRODUCT_TITLES[release.product]} v${release.version}`;
  const link = `${baseUrl}/updates/${release.date}#releases-${release.date}`;
  const guid = `${baseUrl}/releases/${release.product}/${release.version}`;

  const summary = releaseSummary(release);
  const contentHtml = releaseChangesHtml(release, baseUrl);

  return `    <item>
      <title>${escapeXml(title)}</title>
      <link>${link}</link>
      <guid isPermaLink="false">${guid}</guid>
      <pubDate>${new Date(release.date).toUTCString()}</pubDate>
      <category>${escapeXml(PRODUCT_TITLES[release.product])}</category>
      <description>${escapeXml(summary)}</description>
      <content:encoded><![CDATA[${contentHtml}]]></content:encoded>
    </item>`;
}

export async function GET(): Promise<Response> {
  const baseUrl = BASE_URL;

  const updates = loadUpdates();
  const releases = loadReleases();
  const api = await parseOpenAPI();

  // Build update items
  const updateItems = updates.map((update) => {
    const slug = toSlug(update.title);
    const link = `${baseUrl}/updates/${update.date}#${slug}`;

    const resolvedContent = resolveEndpointLinks(update.content, api.endpoints);
    const summary = extractSummary(resolvedContent);
    const contentHtml = markdownToHtml(resolvedContent, baseUrl);

    return {
      date: update.date,
      xml: `    <item>
      <title>${escapeXml(update.title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${new Date(update.date).toUTCString()}</pubDate>
      <description>${escapeXml(summary)}</description>
      <content:encoded><![CDATA[${contentHtml}]]></content:encoded>
    </item>`,
    };
  });

  // Build release items
  const releaseItems = releases.map((release) => ({
    date: release.date,
    xml: releaseToRssItem(release, baseUrl),
  }));

  // Merge and sort by date descending, limit to MAX_ITEMS
  const allItems = [...updateItems, ...releaseItems]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_ITEMS);

  const items = allItems.map((i) => i.xml);

  const lastBuildDate =
    allItems.length > 0 ? new Date(allItems[0].date).toUTCString() : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Пачка API — Обновления</title>
    <link>${baseUrl}/updates</link>
    <description>История изменений и новые возможности API Пачки</description>
    <language>ru</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${baseUrl}/web-app-manifest-192x192.png</url>
      <title>Пачка API — Обновления</title>
      <link>${baseUrl}/updates</link>
    </image>
${items.join('\n')}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate, s-maxage=86400',
    },
  });
}
