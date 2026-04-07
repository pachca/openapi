import { parseOpenAPI } from './openapi/parser';
import { generateUrlFromOperation, generateTitle, groupEndpointsByTag } from './openapi/mapper';
import type { NavigationSection, NavigationItem } from './openapi/types';
import { GUIDE_SECTIONS, API_GUIDE_PAGES, SIDEBAR_FOOTER, type TabId } from './tabs-config';
import { getGuideData } from './content-loader';
import { sortTagsByOrder } from './guides-config';
import { loadUpdates, isNewUpdate } from './updates-parser';
import { TAG_TRANSLATIONS } from './tag-translations';

export { TAG_TRANSLATIONS };

const METHOD_ORDER: Record<string, number> = { POST: 0, GET: 1, PUT: 2, PATCH: 3, DELETE: 4 };

/**
 * Footer section shared across all sidebar tabs (updates + status).
 */
function generateFooterSection(): NavigationSection {
  const hasNewUpdates = loadUpdates().some((u) => isNewUpdate(u.date));
  const items: NavigationItem[] = SIDEBAR_FOOTER.map((page) => {
    const item: NavigationItem = { title: page.title, href: page.path };
    if (page.external) item.external = true;
    if (page.path === '/updates' && hasNewUpdates) item.badge = 'new';
    return item;
  });
  return { title: '', items };
}

/**
 * Generate navigation for a specific tab.
 */
export async function generateNavigation(tab?: TabId): Promise<NavigationSection[]> {
  if (tab === 'guide') {
    return generateGuideNavigation();
  }
  if (tab === 'api') {
    return generateApiNavigation();
  }

  // Default: return combined navigation for backward compatibility
  return generateFullNavigation();
}

/**
 * Developer Guide tab sidebar.
 * Sections are always-visible headers. Items can be direct links or groups with children.
 */
function generateGuideNavigation(): NavigationSection[] {
  const sections: NavigationSection[] = [];

  for (const section of GUIDE_SECTIONS) {
    const items: NavigationItem[] = [];

    for (const page of section.items) {
      if (page.children) {
        // Group with children — collapsible in sidebar
        const children: NavigationItem[] = page.children.map((child) => {
          const data = getGuideData(child.path.replace('/guides/', ''));
          return {
            title: data?.frontmatter.title || child.title,
            href: child.path,
          };
        });
        items.push({
          title: page.title,
          href: page.path,
          children,
        });
      } else {
        const data = getGuideData(page.path.replace('/guides/', ''));
        items.push({
          title: data?.frontmatter.title || page.title,
          href: page.path,
        });
      }
    }

    sections.push({ title: section.title, items });
  }

  sections.push(generateFooterSection());
  return sections;
}

/**
 * API Reference tab sidebar.
 * Two sections: "Using the API" (flat pages) and "Методы API" (groups by tag).
 */
async function generateApiNavigation(): Promise<NavigationSection[]> {
  const api = await parseOpenAPI();
  const sections: NavigationSection[] = [];

  // "Using the API" section — MDX guide pages (flat)
  const apiGuideItems: NavigationItem[] = API_GUIDE_PAGES.map((page) => {
    const data = getGuideData(`api/${page.path.replace('/api/', '')}`);
    return {
      title: data?.frontmatter.title || page.title,
      href: page.path,
    };
  });

  sections.push({
    title: 'Основы API',
    items: apiGuideItems,
  });

  // "Методы API" section — each tag becomes a collapsible group
  const grouped = groupEndpointsByTag(api.endpoints);
  const sortedTags = sortTagsByOrder(Array.from(grouped.keys()));

  const methodGroups: NavigationItem[] = [];

  for (const tag of sortedTags) {
    const endpoints = grouped.get(tag)!;
    endpoints.sort((a, b) => (METHOD_ORDER[a.method] ?? 99) - (METHOD_ORDER[b.method] ?? 99));
    const translation = TAG_TRANSLATIONS[tag];
    const title = translation || tag;

    const children: NavigationItem[] = endpoints.map((endpoint) => ({
      title: generateTitle(endpoint),
      href: generateUrlFromOperation(endpoint),
      method: endpoint.method,
      apiPath: endpoint.path,
    }));

    methodGroups.push({
      title,
      href: children[0]?.href || '',
      originalTitle: translation ? tag : undefined,
      children,
    });
  }

  sections.push({
    title: 'Методы API',
    items: methodGroups,
  });

  sections.push(generateFooterSection());
  return sections;
}

/**
 * Full navigation (for backward compatibility, search, sitemap, etc.)
 */
async function generateFullNavigation(): Promise<NavigationSection[]> {
  const guideNav = generateGuideNavigation();
  const apiNav = await generateApiNavigation();
  return [...guideNav, ...apiNav];
}

/**
 * Flatten all navigable items (including children) for prev/next.
 */
function flattenItems(sections: NavigationSection[]): NavigationItem[] {
  const result: NavigationItem[] = [];
  for (const section of sections) {
    for (const item of section.items) {
      if (item.children) {
        for (const child of item.children) {
          result.push({ ...child, sectionTitle: child.sectionTitle || item.title });
        }
      } else {
        result.push({ ...item, sectionTitle: item.sectionTitle || section.title });
      }
    }
  }
  return result;
}

/**
 * Get previous/next items for page navigation.
 */
export async function getAdjacentItems(currentHref: string) {
  // Determine tab from URL
  let tab: TabId | undefined;
  if (currentHref.startsWith('/guides')) tab = 'guide';
  else if (currentHref.startsWith('/api')) tab = 'api';

  const sections = await generateNavigation(tab);
  const allItems = flattenItems(sections);
  const currentIndex = allItems.findIndex((item) => item.href === currentHref);

  return {
    prev: currentIndex > 0 ? allItems[currentIndex - 1] : null,
    next: currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null,
  };
}
