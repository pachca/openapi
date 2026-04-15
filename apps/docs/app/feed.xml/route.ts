import { loadUpdates, loadReleases, type ParsedRelease } from '@/lib/updates-parser';
import { parseOpenAPI } from '@/lib/openapi/parser';
import { resolveEndpointLinks } from '@/lib/openapi/resolve-links';
import { toSlug } from '@/lib/utils/transliterate';

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

/**
 * Convert inline markdown (bold, code, links) to HTML.
 * Relative URLs are made absolute.
 */
function inlineMarkdownToHtml(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (_match, linkText: string, url: string) => {
      // Resolved API links from resolveEndpointLinks: "GET:/api/profile/get" → absolute URL
      const methodPrefixMatch = url.match(/^(?:GET|POST|PUT|PATCH|DELETE):(.+)/);
      if (methodPrefixMatch) {
        return `<a href="${BASE_URL}${methodPrefixMatch[1]}">${linkText}</a>`;
      }
      // Relative URLs → absolute
      const absoluteUrl = url.startsWith('/') ? `${BASE_URL}${url}` : url;
      return `<a href="${absoluteUrl}">${linkText}</a>`;
    });
}

/**
 * Strip all markdown formatting from text, returning plain text.
 * Used for <description> summary.
 */
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1');
}

/**
 * Extract first paragraph from markdown as plain text summary for <description>.
 */
function extractSummary(markdown: string): string {
  const lines = markdown.split('\n');
  const paragraphLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Stop at first empty line after collecting text, or at list/heading
    if (trimmed === '' && paragraphLines.length > 0) break;
    if (trimmed.startsWith('-') || trimmed.startsWith('#')) break;
    if (trimmed === '') continue;
    paragraphLines.push(trimmed);
  }

  if (paragraphLines.length === 0) {
    // Fallback: take first non-empty line
    const firstLine = lines.find((l) => l.trim() !== '');
    return firstLine ? stripMarkdown(firstLine.trim()) : '';
  }

  return stripMarkdown(paragraphLines.join(' '));
}

/**
 * Convert markdown content to HTML for RSS <content:encoded>.
 * Handles paragraphs, bullet lists (with nesting), bold, code, links.
 */
function markdownToHtml(markdown: string): string {
  const lines = markdown.split('\n');
  const html: string[] = [];
  let inList = false;
  let inSubList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Nested list item (2+ spaces indent)
    const subListMatch = line.match(/^(\s{2,})-\s+(.+)/);
    if (subListMatch) {
      if (!inSubList) {
        inSubList = true;
        html.push('<ul>');
      }
      html.push(`<li>${inlineMarkdownToHtml(subListMatch[2])}</li>`);
      continue;
    }

    // Close sub-list if we're no longer in one
    if (inSubList) {
      inSubList = false;
      html.push('</ul>');
    }

    // Top-level list item
    const listMatch = line.match(/^-\s+(.+)/);
    if (listMatch) {
      if (!inList) {
        inList = true;
        html.push('<ul>');
      }
      html.push(`<li>${inlineMarkdownToHtml(listMatch[1])}</li>`);
      continue;
    }

    // Close list if we're no longer in one
    if (inList) {
      inList = false;
      html.push('</ul>');
    }

    // Empty line — skip (paragraph separator)
    if (line.trim() === '') {
      continue;
    }

    // Regular text → paragraph
    html.push(`<p>${inlineMarkdownToHtml(line)}</p>`);
  }

  // Close any open lists
  if (inSubList) html.push('</ul>');
  if (inList) html.push('</ul>');

  return html.join('\n');
}

const PRODUCT_TITLES: Record<ParsedRelease['product'], string> = {
  cli: 'CLI',
  sdk: 'SDK',
  generator: 'Generator',
  n8n: 'n8n Node',
};

const CHANGE_TYPE_PREFIX: Record<string, string> = {
  '+': 'Добавлено: ',
  '~': 'Изменено: ',
  '-': 'Исправлено: ',
};

function releaseToRssItem(release: ParsedRelease, baseUrl: string): string {
  const title = `${PRODUCT_TITLES[release.product]} v${release.version}`;
  const link = `${baseUrl}/updates/${release.date}#releases-${release.date}`;
  const guid = `${baseUrl}/releases/${release.product}/${release.version}`;

  const summary = release.changes
    .slice(0, 2)
    .map((c) => stripMarkdown(c.description))
    .join('; ');

  const listHtml = release.changes
    .map(
      (c) => `<li>${CHANGE_TYPE_PREFIX[c.type] || ''}${inlineMarkdownToHtml(c.description)}</li>`
    )
    .join('\n');
  const contentHtml = `<ul>\n${listHtml}\n</ul>`;

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
    const contentHtml = markdownToHtml(resolvedContent);

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
