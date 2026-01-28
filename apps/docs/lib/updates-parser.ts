import fs from 'fs';
import path from 'path';

export interface ParsedUpdate {
  date: string; // ISO format: YYYY-MM-DD
  displayDate: string; // Formatted date in Russian
  title: string;
  content: string; // Markdown content
}

const MONTHS_RU: Record<string, string> = {
  '01': 'января',
  '02': 'февраля',
  '03': 'марта',
  '04': 'апреля',
  '05': 'мая',
  '06': 'июня',
  '07': 'июля',
  '08': 'августа',
  '09': 'сентября',
  '10': 'октября',
  '11': 'ноября',
  '12': 'декабря',
};

/**
 * Convert ISO date (YYYY-MM-DD) to Russian display format (DD месяца YYYY)
 */
function formatDateRu(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  const monthName = MONTHS_RU[month] || month;
  return `${day} ${monthName} ${year}`;
}

/**
 * Parse updates from markdown file with HTML comment markers:
 *
 * &lt;!-- update:YYYY-MM-DD --&gt;
 * ## Title
 * Content...
 */
export function parseUpdatesFromMdx(mdxContent: string): ParsedUpdate[] {
  const updates: ParsedUpdate[] = [];

  // Split by update markers (HTML comment format)
  const updatePattern = /<!--\s*update:(\d{4}-\d{2}-\d{2})\s*-->/g;
  const parts = mdxContent.split(updatePattern);

  // Parts will be: [intro, date1, content1, date2, content2, ...]
  // Skip intro (index 0), then process pairs of (date, content)
  for (let i = 1; i < parts.length; i += 2) {
    const date = parts[i];
    const rawContent = parts[i + 1];

    if (!date || !rawContent) continue;

    // Extract title from ## heading
    const titleMatch = rawContent.match(/^[\s\n]*##\s+(.+?)[\s\n]/);
    const title = titleMatch ? titleMatch[1].trim() : 'Обновление';

    // Get content after the title line
    const contentAfterTitle = rawContent.replace(/^[\s\n]*##\s+.+?\n/, '').trim();

    updates.push({
      date,
      displayDate: formatDateRu(date),
      title,
      content: contentAfterTitle,
    });
  }

  return updates;
}

/**
 * Load and parse updates from content/guides/updates.mdx
 */
export function loadUpdates(): ParsedUpdate[] {
  const updatesPath = path.join(process.cwd(), 'content', 'guides', 'updates.mdx');

  try {
    const content = fs.readFileSync(updatesPath, 'utf-8');
    return parseUpdatesFromMdx(content);
  } catch (error) {
    console.error('Error loading updates:', error);
    return [];
  }
}

/**
 * Check if update is "new" (within last 14 days)
 */
export function isNewUpdate(dateStr: string): boolean {
  const updateDate = new Date(dateStr);
  const now = new Date();
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(now.getDate() - 14);
  return updateDate >= twoWeeksAgo;
}
