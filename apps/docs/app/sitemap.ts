import type { MetadataRoute } from 'next';
import { parseOpenAPI } from '@/lib/openapi/parser';
import { generateUrlFromOperation } from '@/lib/openapi/mapper';
import { getOrderedGuidePages } from '@/lib/guides-config';
import { loadUpdates } from '@/lib/updates-parser';

const BASE_URL = 'https://dev.pachca.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const api = await parseOpenAPI();
  const guidePages = getOrderedGuidePages();

  const entries: MetadataRoute.Sitemap = [];

  // Homepage
  entries.push({
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 1,
  });

  // Guide pages
  for (const guide of guidePages) {
    if (guide.path === '/') continue;
    entries.push({
      url: `${BASE_URL}${guide.path}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  }

  // Per-update pages
  const updates = loadUpdates();
  for (const update of updates) {
    entries.push({
      url: `${BASE_URL}/guides/updates/${update.date}`,
      lastModified: new Date(update.date),
      changeFrequency: 'monthly',
      priority: 0.6,
    });
  }

  // API endpoint pages
  for (const endpoint of api.endpoints) {
    const url = generateUrlFromOperation(endpoint);
    entries.push({
      url: `${BASE_URL}${url}`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    });
  }

  return entries;
}
