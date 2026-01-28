import { parseOpenAPI } from './openapi/parser';
import { generateUrlFromOperation, generateTitle, groupEndpointsByTag } from './openapi/mapper';
import type { NavigationSection } from './openapi/types';
import { getOrderedGuidePages, sortTagsByOrder } from './guides-config';
import { loadUpdates, isNewUpdate } from './updates-parser';

export async function generateNavigation(): Promise<NavigationSection[]> {
  const api = await parseOpenAPI();
  
  const sections: NavigationSection[] = [];

  // Check if there are new updates (within last 14 days)
  const updates = loadUpdates();
  const hasNewUpdates = updates.some(update => isNewUpdate(update.date));

  // Add "Getting Started" section (dynamically collected from page.tsx files)
  const guidePages = getOrderedGuidePages();
  sections.push({
    title: 'Начало работы',
    items: guidePages.map(guide => ({
      title: guide.title,
      href: guide.path,
      // Add badge for updates page if there are new updates
      badge: guide.path === '/guides/updates' && hasNewUpdates ? 'new' : undefined,
    })),
  });

  // Group endpoints by tag
  const grouped = groupEndpointsByTag(api.endpoints);

  // Sort sections by OpenAPI tag order
  const sortedTags = sortTagsByOrder(Array.from(grouped.keys()));

  // Create sections from tags
  for (const tag of sortedTags) {
    const endpoints = grouped.get(tag)!;
    // Tags are already in Russian in OpenAPI
    const title = tag;

    sections.push({
      title,
      items: endpoints.map(endpoint => ({
        title: generateTitle(endpoint),
        href: generateUrlFromOperation(endpoint),
        method: endpoint.method,
      })),
    });
  }

  return sections;
}

export async function getAdjacentItems(currentHref: string) {
  const sections = await generateNavigation();
  const allItems = sections.flatMap(s => s.items);
  const currentIndex = allItems.findIndex(item => item.href === currentHref);

  return {
    prev: currentIndex > 0 ? allItems[currentIndex - 1] : null,
    next: currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null,
  };
}
