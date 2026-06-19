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

/**
 * JSON Feed item (spec subset we emit). See https://www.jsonfeed.org/version/1.1/
 */
interface JsonFeedItem {
  id: string;
  url: string;
  title: string;
  summary?: string;
  content_html: string;
  date_published: string;
  tags?: string[];
}

/** ISO date (YYYY-MM-DD) → RFC 3339 timestamp required by JSON Feed. */
function toRfc3339(date: string): string {
  return new Date(date).toISOString();
}

function releaseToJsonItem(release: ParsedRelease, baseUrl: string): JsonFeedItem {
  return {
    id: `${baseUrl}/releases/${release.product}/${release.version}`,
    url: `${baseUrl}/updates/${release.date}#releases-${release.date}`,
    title: `${PRODUCT_TITLES[release.product]} v${release.version}`,
    summary: releaseSummary(release),
    content_html: releaseChangesHtml(release, baseUrl),
    date_published: toRfc3339(release.date),
    tags: [PRODUCT_TITLES[release.product]],
  };
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

    return {
      date: update.date,
      item: {
        id: link,
        url: link,
        title: update.title,
        summary: extractSummary(resolvedContent),
        content_html: markdownToHtml(resolvedContent, baseUrl),
        date_published: toRfc3339(update.date),
      } satisfies JsonFeedItem,
    };
  });

  // Build release items
  const releaseItems = releases.map((release) => ({
    date: release.date,
    item: releaseToJsonItem(release, baseUrl),
  }));

  // Merge and sort by date descending, limit to MAX_ITEMS
  const items = [...updateItems, ...releaseItems]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, MAX_ITEMS)
    .map((i) => i.item);

  const feed = {
    version: 'https://jsonfeed.org/version/1.1',
    title: 'Пачка API — Обновления',
    home_page_url: `${baseUrl}/updates`,
    feed_url: `${baseUrl}/feed.json`,
    description: 'История изменений и новые возможности API Пачки',
    language: 'ru',
    icon: `${baseUrl}/web-app-manifest-192x192.png`,
    favicon: `${baseUrl}/favicon.ico`,
    authors: [{ name: 'Пачка', url: baseUrl }],
    items,
  };

  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      'Content-Type': 'application/feed+json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate, s-maxage=86400',
    },
  });
}
