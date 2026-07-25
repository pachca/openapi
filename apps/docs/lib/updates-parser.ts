import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { formatDateRu } from './format-date';

export { formatDateRu };

export interface ParsedUpdate {
  date: string; // ISO format: YYYY-MM-DD
  displayDate: string; // Formatted date in Russian
  title: string;
  content: string; // Markdown content
}

export type ReleaseProduct = 'cli' | 'sdk' | 'generator' | 'n8n';

export interface ReleaseChange {
  type: '+' | '~' | '-';
  description: string;
}

export interface ParsedRelease {
  product: ReleaseProduct;
  version: string;
  date: string; // ISO format: YYYY-MM-DD
  displayDate: string;
  changes: ReleaseChange[];
}

export type TimelineEntry =
  | { kind: 'update'; data: ParsedUpdate }
  | { kind: 'release'; data: ParsedRelease };

export interface DateGroup {
  date: string;
  displayDate: string;
  entries: TimelineEntry[];
}

/**
 * Load and parse updates from per-date files content/updates/<date>.md.
 * Each file has YAML frontmatter (date, title) + markdown body.
 * Returned sorted by date descending.
 */
export function loadUpdates(): ParsedUpdate[] {
  const updatesDir = path.join(process.cwd(), 'content', 'updates');

  try {
    const files = fs.readdirSync(updatesDir).filter((f) => f.endsWith('.md'));
    const updates: ParsedUpdate[] = [];

    for (const file of files) {
      const fileContent = fs.readFileSync(path.join(updatesDir, file), 'utf-8');
      const { data, content } = matter(fileContent);
      // An unquoted `date: 2026-07-24` is parsed by js-yaml as a Date, and
      // String() would turn it into "Fri Jul 24 2026 03:00:00 GMT+0300 (…)" —
      // which then leaks into sorting, grouping keys and URL segments.
      const rawDate = data.date;
      const date =
        rawDate instanceof Date
          ? rawDate.toISOString().slice(0, 10)
          : String(rawDate || file.replace(/\.md$/, ''));
      const title = String(data.title || 'Обновление');

      updates.push({
        date,
        displayDate: formatDateRu(date),
        title,
        content: content.trim(),
      });
    }

    updates.sort((a, b) => b.date.localeCompare(a.date));
    return updates;
  } catch (error) {
    console.error('Error loading updates:', error);
    return [];
  }
}

/**
 * Load and parse product releases from data/releases.json
 */
export function loadReleases(): ParsedRelease[] {
  const releasesPath = path.join(process.cwd(), 'data', 'releases.json');

  try {
    const content = fs.readFileSync(releasesPath, 'utf-8');
    const raw = JSON.parse(content) as Array<{
      product: ReleaseProduct;
      version: string;
      date: string;
      changes: ReleaseChange[];
    }>;
    return raw.map((r) => ({
      ...r,
      displayDate: formatDateRu(r.date),
    }));
  } catch (error) {
    console.error('Error loading releases:', error);
    return [];
  }
}

/**
 * Load unified timeline: API updates + product releases, sorted by date descending
 */
export function loadTimeline(): TimelineEntry[] {
  const updates = loadUpdates();
  const releases = loadReleases();

  const entries: TimelineEntry[] = [
    ...updates.map((u) => ({ kind: 'update' as const, data: u })),
    ...releases.map((r) => ({ kind: 'release' as const, data: r })),
  ];

  entries.sort((a, b) => b.data.date.localeCompare(a.data.date));

  return entries;
}

/**
 * Group timeline entries by date
 */
export function groupTimelineByDate(entries: TimelineEntry[]): DateGroup[] {
  const groups: Map<string, TimelineEntry[]> = new Map();

  for (const entry of entries) {
    const date = entry.data.date;
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(entry);
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      displayDate: formatDateRu(date),
      entries: items,
    }));
}

/**
 * Check if update is "new" (within last 7 days)
 */
export function isNewUpdate(dateStr: string): boolean {
  // Both sides in UTC at day granularity. `new Date("2026-07-24")` is UTC
  // midnight while a plain `new Date()` carries the local wall clock, so
  // comparing them made the badge flip on and off around the boundary.
  const cutoff = new Date();
  cutoff.setUTCHours(0, 0, 0, 0);
  cutoff.setUTCDate(cutoff.getUTCDate() - 7);
  return new Date(`${dateStr}T00:00:00Z`) >= cutoff;
}
