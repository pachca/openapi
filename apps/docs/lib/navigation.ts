import { parseOpenAPI } from './openapi/parser';
import { generateUrlFromOperation, generateTitle, groupEndpointsByTag } from './openapi/mapper';
import type { NavigationSection, NavigationItem } from './openapi/types';
import {
  GUIDE_SECTIONS,
  CLI_SECTIONS,
  SDK_SECTIONS,
  N8N_SECTIONS,
  API_GUIDE_PAGES,
  getActiveTab,
  type SidebarSection,
  type TabId,
} from './tabs-config';
import { getGuideData } from './content-loader';
import { sortTagsByOrder } from './guides-config';
import { loadUpdates } from './updates-parser';
import { groupBySeason, type SeasonGroup } from './seasons';
import { groupTimelineByDate } from './updates-parser';
import { formatDayMonthRu } from './format-date';
import { TAG_TRANSLATIONS } from './tag-translations';

export { TAG_TRANSLATIONS };

const METHOD_ORDER: Record<string, number> = { POST: 0, GET: 1, PUT: 2, PATCH: 3, DELETE: 4 };

/**
 * Generate navigation for a specific tab.
 */
export async function generateNavigation(tab?: TabId): Promise<NavigationSection[]> {
  if (tab === 'guides') return generateGuidesNavigation();
  if (tab === 'cli') return generateSectionNavigation(CLI_SECTIONS);
  if (tab === 'sdk') return generateSectionNavigation(SDK_SECTIONS);
  if (tab === 'n8n') return generateSectionNavigation(N8N_SECTIONS);
  if (tab === 'updates') return generateUpdatesNavigation();
  if (tab === 'api') return generateApiNavigation();

  // Default: return combined navigation for backward compatibility
  return generateFullNavigation();
}

/**
 * Map a SidebarSection list (from tabs-config) to NavigationSection list,
 * pulling fresh titles from MDX frontmatter when available.
 */
function generateSectionNavigation(sections: SidebarSection[]): NavigationSection[] {
  return sections.map((section) => {
    const items: NavigationItem[] = [];

    for (const page of section.items) {
      // "/" → home page, no MDX under /guides/ prefix
      if (page.path === '/') {
        const data = getGuideData('home');
        items.push({ title: data?.frontmatter.title || page.title, href: page.path });
        continue;
      }

      if (page.children) {
        const children: NavigationItem[] = page.children.map((child) => {
          const data = getGuideData(child.path.replace('/guides/', ''));
          return {
            title: data?.frontmatter.title || child.title,
            href: child.path,
          };
        });
        items.push({ title: page.title, href: page.path, children });
      } else {
        const data = getGuideData(page.path.replace('/guides/', ''));
        items.push({ title: data?.frontmatter.title || page.title, href: page.path });
      }
    }

    return { title: section.title, items };
  });
}

/**
 * Developer Guides tab sidebar (no CLI/SDK/n8n — those are own tabs).
 */
function generateGuidesNavigation(): NavigationSection[] {
  return generateSectionNavigation(GUIDE_SECTIONS);
}

/**
 * Updates tab sidebar — "Обзор" + per-year section per season groups.
 * Each season is a collapsible group with date children.
 */
function generateUpdatesNavigation(): NavigationSection[] {
  const updates = loadUpdates();

  const dateGroups = groupTimelineByDate(
    updates.map((u) => ({ kind: 'update' as const, data: u }))
  );
  const seasonGroups: SeasonGroup[] = groupBySeason(dateGroups);

  const sections: NavigationSection[] = [];

  // "Обзор" — landing (badge "new" lives on the header tab, not duplicated here)
  sections.push({
    title: 'Обзор',
    items: [{ title: 'Последние обновления', href: '/updates' }],
  });

  // Group seasons by year. Winter is bucketed under its end year
  // (Jan–Feb fall there and make up the bulk of the season).
  const byYear = new Map<string, SeasonGroup[]>();
  for (const sg of seasonGroups) {
    const startYear = Number(sg.season.sortKey.slice(0, 4));
    const year = String(sg.season.kind === 'winter' ? startYear + 1 : startYear);
    const bucket = byYear.get(year) ?? [];
    bucket.push(sg);
    byYear.set(year, bucket);
  }
  const years = Array.from(byYear.keys()).sort((a, b) => b.localeCompare(a));

  for (const year of years) {
    const yearSeasons = byYear.get(year) ?? [];
    const items: NavigationItem[] = yearSeasons.map((sg) => ({
      title: `${sg.season.emoji} ${sg.season.label}`,
      href: `/updates/season/${sg.season.slug}`,
    }));

    const dateChildren: NavigationItem[] = yearSeasons.flatMap((sg) =>
      sg.dates.map((dg) => {
        const firstUpdate = dg.entries.find((e) => e.kind === 'update');
        const dateLabel = formatDayMonthRu(dg.date);
        return {
          title: firstUpdate ? `${dateLabel} – ${firstUpdate.data.title}` : dateLabel,
          href: `/updates/${dg.date}`,
        };
      })
    );
    if (dateChildren.length > 0) {
      items.push({
        title: `Все обновления ${year}`,
        href: dateChildren[0].href,
        children: dateChildren,
      });
    }

    sections.push({ title: year, items });
  }

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

  return sections;
}

/**
 * Full navigation (for backward compatibility, search, sitemap, etc.)
 */
async function generateFullNavigation(): Promise<NavigationSection[]> {
  const guideNav = generateGuidesNavigation();
  const cliNav = generateSectionNavigation(CLI_SECTIONS);
  const sdkNav = generateSectionNavigation(SDK_SECTIONS);
  const n8nNav = generateSectionNavigation(N8N_SECTIONS);
  const updatesNav = generateUpdatesNavigation();
  const apiNav = await generateApiNavigation();
  return [...guideNav, ...cliNav, ...sdkNav, ...n8nNav, ...updatesNav, ...apiNav];
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
 * Resolves tab via getActiveTab so nested prefixes (/guides/cli) work correctly.
 */
export async function getAdjacentItems(currentHref: string) {
  const tab = getActiveTab(currentHref) ?? undefined;
  const sections = await generateNavigation(tab);
  const allItems = flattenItems(sections);
  const currentIndex = allItems.findIndex((item) => item.href === currentHref);

  return {
    prev: currentIndex > 0 ? allItems[currentIndex - 1] : null,
    next: currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null,
  };
}
