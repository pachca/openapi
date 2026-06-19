import type { ParsedRelease } from './updates-parser';

/**
 * Shared content helpers for the syndication feeds (RSS `/feed.xml` and
 * JSON Feed `/feed.json`). Both feeds render the same updates + releases, so the
 * markdown→HTML / summary logic lives here to avoid drift between formats.
 */

export const PRODUCT_TITLES: Record<ParsedRelease['product'], string> = {
  cli: 'CLI',
  sdk: 'SDK',
  generator: 'Generator',
  n8n: 'n8n Node',
};

export const CHANGE_TYPE_PREFIX: Record<string, string> = {
  '+': 'Добавлено: ',
  '~': 'Изменено: ',
  '-': 'Исправлено: ',
};

/**
 * Convert inline markdown (bold, code, links) to HTML.
 * Relative URLs and resolved endpoint links are made absolute against baseUrl.
 */
export function inlineMarkdownToHtml(text: string, baseUrl: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, (_match, linkText: string, url: string) => {
      // Resolved API links from resolveEndpointLinks: "GET:/api/profile/get" → absolute URL
      const methodPrefixMatch = url.match(/^(?:GET|POST|PUT|PATCH|DELETE):(.+)/);
      if (methodPrefixMatch) {
        return `<a href="${baseUrl}${methodPrefixMatch[1]}">${linkText}</a>`;
      }
      // Relative URLs → absolute
      const absoluteUrl = url.startsWith('/') ? `${baseUrl}${url}` : url;
      return `<a href="${absoluteUrl}">${linkText}</a>`;
    });
}

/**
 * Strip all markdown formatting from text, returning plain text.
 * Used for plain-text summaries (RSS <description>, JSON Feed content_text).
 */
export function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1');
}

/**
 * Extract first paragraph from markdown as plain text summary.
 */
export function extractSummary(markdown: string): string {
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
 * Convert markdown content to HTML for feed bodies (RSS <content:encoded>,
 * JSON Feed content_html). Handles paragraphs, bullet lists (with nesting),
 * bold, code, links.
 */
export function markdownToHtml(markdown: string, baseUrl: string): string {
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
      html.push(`<li>${inlineMarkdownToHtml(subListMatch[2], baseUrl)}</li>`);
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
      html.push(`<li>${inlineMarkdownToHtml(listMatch[1], baseUrl)}</li>`);
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
    html.push(`<p>${inlineMarkdownToHtml(line, baseUrl)}</p>`);
  }

  // Close any open lists
  if (inSubList) html.push('</ul>');
  if (inList) html.push('</ul>');

  return html.join('\n');
}

/**
 * Build the HTML body for a release (a bullet list of its changes), shared by
 * both feeds.
 */
export function releaseChangesHtml(release: ParsedRelease, baseUrl: string): string {
  const listHtml = release.changes
    .map(
      (c) =>
        `<li>${CHANGE_TYPE_PREFIX[c.type] || ''}${inlineMarkdownToHtml(c.description, baseUrl)}</li>`
    )
    .join('\n');
  return `<ul>\n${listHtml}\n</ul>`;
}

/**
 * Plain-text summary of a release (first two changes), shared by both feeds.
 */
export function releaseSummary(release: ParsedRelease): string {
  return release.changes
    .slice(0, 2)
    .map((c) => stripMarkdown(c.description))
    .join('; ');
}
