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
import { getGuideData, type RelatedLink, type RelatedItem } from './content-loader';
import { sortTagsByOrder } from './guides-config';
import { loadUpdates } from './updates-parser';
import { groupBySeason, type SeasonGroup } from './seasons';
import { groupTimelineByDate } from './updates-parser';
import { formatDayMonthRu } from './format-date';
import { TAG_TRANSLATIONS } from './tag-translations';

export { TAG_TRANSLATIONS };

const METHOD_ORDER: Record<string, number> = { POST: 0, GET: 1, PUT: 2, PATCH: 3, DELETE: 4 };

/**
 * Order endpoints within a tag group: first by HTTP method (POST→GET→PUT…), then by
 * path depth so a collection-root operation (the "create", e.g. POST /bots) leads the
 * group ahead of nested or self paths (POST /bot/recreate_token, POST /bots/{id}/…).
 * Without the depth tie-break, alphabetical path order put "/bot/…" before "/bots",
 * pushing "Новый…" below the self-token endpoint. Stable sort keeps spec order within
 * the same (method, depth). Shared by the sidebar, group redirects and generated .md
 * so all three list endpoints identically.
 */
export function compareEndpointsForNav(
  a: { method: string; path: string },
  b: { method: string; path: string }
): number {
  const byMethod = (METHOD_ORDER[a.method] ?? 99) - (METHOD_ORDER[b.method] ?? 99);
  if (byMethod !== 0) return byMethod;
  const depth = (p: string) => p.split('/').filter(Boolean).length;
  return depth(a.path) - depth(b.path);
}

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
    endpoints.sort(compareEndpointsForNav);
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
 *
 * When the adjacent page sits in the same section as the current page, its
 * `sectionTitle` is dropped so the pager shows just the page title ("Обзор")
 * instead of a redundant "Боты: Обзор" — you already know you're in that
 * section. Cross-section neighbours keep the prefix for context.
 */
/**
 * For an `/api/{segment}` group root (a tag slug, not a specific method),
 * return the href of the group's first method, or null if the segment isn't a
 * known group. Sorting mirrors the sidebar (METHOD_ORDER), so the redirect
 * target matches the first item shown under that group — keeping `/api/bots`
 * etc. from 404ing when hit directly.
 */
export async function getApiGroupFirstHref(segment: string): Promise<string | null> {
  const api = await parseOpenAPI();
  const prefix = `/api/${segment}/`;
  const matches = api.endpoints
    .map((endpoint) => ({ endpoint, href: generateUrlFromOperation(endpoint) }))
    .filter((item) => item.href.startsWith(prefix));
  if (matches.length === 0) return null;
  matches.sort((a, b) => compareEndpointsForNav(a.endpoint, b.endpoint));
  return matches[0].href;
}

export async function getAdjacentItems(currentHref: string) {
  const tab = getActiveTab(currentHref) ?? undefined;
  const sections = await generateNavigation(tab);
  const allItems = flattenItems(sections);
  const currentIndex = allItems.findIndex((item) => item.href === currentHref);
  const currentSection = currentIndex >= 0 ? allItems[currentIndex].sectionTitle : undefined;

  const dropSameSection = (item: NavigationItem | null) =>
    item && item.sectionTitle && item.sectionTitle === currentSection
      ? { ...item, sectionTitle: undefined }
      : item;

  return {
    prev: dropSameSection(currentIndex > 0 ? allItems[currentIndex - 1] : null),
    next: dropSameSection(currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null),
  };
}

/**
 * Resolve a page's `related:` frontmatter into render-ready items.
 *
 * Bare-path entries get their title from the navigation (single source of
 * truth — never goes stale). When the linked page is a child of a *different*
 * collapsible group than the current page, the title is shown composite
 * ("Группа: Страница", like the prev/next pager) so generic labels such as
 * "Создание и настройка" or "Обзор" aren't ambiguous out of context. The
 * prefix is the parent group ("Боты", "AI агенты", "Исходящие вебхуки"…) —
 * NOT the top-level sidebar bucket ("Инструменты", "Боты и автоматизации"),
 * which is just an organisational heading, not a page parent. Standalone pages
 * (Треды, Пагинация…) already have self-explanatory titles, so they stay plain.
 *
 * Object entries with an explicit `title` are used verbatim (no prefix — the
 * author already chose the label), which covers anchor links
 * (`/guides/x#section`) and pages outside the sidebar. Anchors are stripped
 * only for the lookup; the href keeps them. Entries that can't be resolved are
 * dropped so we never render a link with a missing label.
 */
export async function resolveRelatedItems(
  related: RelatedLink[] | undefined,
  currentHref?: string
): Promise<RelatedItem[]> {
  if (!related || related.length === 0) return [];

  const sections = await generateFullNavigation();
  // Map each href to its title and its parent GROUP title — only set when the
  // page is a child of a collapsible group, never for top-level bucket items.
  const navByHref = new Map<string, { title: string; groupTitle?: string }>();
  for (const section of sections) {
    for (const item of section.items) {
      if (item.children) {
        for (const child of item.children) {
          if (!navByHref.has(child.href)) {
            navByHref.set(child.href, { title: child.title, groupTitle: item.title });
          }
        }
      } else if (!navByHref.has(item.href)) {
        navByHref.set(item.href, { title: item.title });
      }
    }
  }

  const currentGroup = currentHref ? navByHref.get(currentHref)?.groupTitle : undefined;

  const result: RelatedItem[] = [];
  for (const entry of related) {
    const href = typeof entry === 'string' ? entry : entry.path;
    const explicitTitle = typeof entry === 'string' ? undefined : entry.title;
    const base = href.split('#')[0];

    if (explicitTitle) {
      result.push({ title: explicitTitle, href });
      continue;
    }

    const nav = navByHref.get(base);
    if (!nav) {
      console.warn(`[related] could not resolve title for "${href}" — skipping`);
      continue;
    }

    // Prefix with the parent group when the link points into a different group,
    // so a bare "Обзор"/"Создание и настройка" reads unambiguously.
    const title =
      nav.groupTitle && nav.groupTitle !== currentGroup
        ? `${nav.groupTitle}: ${nav.title}`
        : nav.title;
    result.push({ title, href });
  }
  return result;
}
