import type { MetadataRoute } from 'next';
import { statSync } from 'node:fs';
import { join } from 'node:path';
import { parseOpenAPI } from '@/lib/openapi/parser';
import { generateUrlFromOperation } from '@/lib/openapi/mapper';
import { getOrderedPages } from '@/lib/ordered-pages';
import { loadUpdates } from '@/lib/updates-parser';

const BASE_URL = 'https://dev.pachca.com';
const CONTENT_DIR = join(process.cwd(), 'content');

function getFileMtime(filePath: string): Date {
  try {
    return statSync(filePath).mtime;
  } catch {
    return new Date();
  }
}

function guidePathToFile(pagePath: string): string {
  if (pagePath === '/') return join(CONTENT_DIR, 'home.mdx');
  if (pagePath === '/updates') return join(CONTENT_DIR, 'updates.mdx');
  if (pagePath.startsWith('/api/')) return join(CONTENT_DIR, `${pagePath.slice(1)}.mdx`);
  if (pagePath.startsWith('/guides/')) return join(CONTENT_DIR, `${pagePath.slice(1)}.mdx`);
  return join(CONTENT_DIR, `${pagePath.slice(1)}.mdx`);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const api = await parseOpenAPI();
  const guidePages = getOrderedPages();
  const specMtime = getFileMtime(join(process.cwd(), 'openapi.yaml'));

  const entries: MetadataRoute.Sitemap = [];

  // Homepage
  entries.push({
    url: BASE_URL,
    lastModified: getFileMtime(guidePathToFile('/')),
  });

  // Guide pages
  for (const guide of guidePages) {
    if (guide.path === '/') continue;
    entries.push({
      url: `${BASE_URL}${guide.path}`,
      lastModified: getFileMtime(guidePathToFile(guide.path)),
    });
  }

  // Per-update pages
  const updates = loadUpdates();
  for (const update of updates) {
    entries.push({
      url: `${BASE_URL}/updates/${update.date}`,
      lastModified: new Date(update.date),
    });
  }

  // API endpoint pages
  for (const endpoint of api.endpoints) {
    const url = generateUrlFromOperation(endpoint);
    if (url.startsWith('/api/search')) continue;
    entries.push({
      url: `${BASE_URL}${url}`,
      lastModified: specMtime,
    });
  }

  return entries;
}
