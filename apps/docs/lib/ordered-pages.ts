/**
 * Server-only utility to get all ordered pages.
 * Separated from tabs-config.ts because it uses content-loader (which requires 'fs').
 * tabs-config.ts must remain client-safe (imported by 'use client' components).
 */

import {
  GUIDE_SECTIONS,
  CLI_SECTIONS,
  SDK_SECTIONS,
  N8N_SECTIONS,
  API_GUIDE_PAGES,
} from './tabs-config';
import type { SidebarPageItem, SidebarSection } from './tabs-config';
import { getGuideData } from './content-loader';

/**
 * Get all ordered guide pages (for generators/sitemap).
 * Returns pages from all guide sections + API guide pages + home + updates.
 */
export interface OrderedPage {
  path: string;
  title: string;
  description: string;
  /** Parent section/group title (e.g. "SDK" for child page "Обзор") */
  sectionTitle?: string;
}

export function getOrderedPages(): OrderedPage[] {
  const pages: OrderedPage[] = [];

  // Home page
  const homeData = getGuideData('home');
  if (homeData) {
    pages.push({
      path: '/',
      title: homeData.frontmatter.title || 'Обзор',
      description: homeData.frontmatter.description || '',
    });
  }

  // All sidebar sections that live under /guides. CLI/SDK/n8n pages get a
  // tab-level prefix ("CLI: Обзор" etc.) so titles read unambiguously in
  // llms.txt, browser tabs, and search results.
  const guideSidebars: { sections: SidebarSection[]; tabPrefix?: string }[] = [
    { sections: GUIDE_SECTIONS },
    { sections: CLI_SECTIONS, tabPrefix: 'CLI' },
    { sections: SDK_SECTIONS, tabPrefix: 'SDK' },
    { sections: N8N_SECTIONS, tabPrefix: 'n8n' },
  ];

  for (const { sections, tabPrefix } of guideSidebars) {
    for (const section of sections) {
      for (const item of section.items) {
        // Skip pseudo-item pointing at "/" (already added above as homeData)
        if (item.path === '/') continue;

        if (item.children) {
          for (const child of item.children) {
            addPage(pages, child, '/guides/', item.title);
          }
        } else {
          addPage(pages, item, '/guides/', tabPrefix);
        }
      }
    }
  }

  // Updates landing page
  const updatesData = getGuideData('updates');
  if (updatesData) {
    pages.push({
      path: '/updates',
      title: updatesData.frontmatter.title || 'Последние обновления',
      description: updatesData.frontmatter.description || '',
    });
  }

  // API guide pages
  for (const item of API_GUIDE_PAGES) {
    const data = getGuideData(`api/${item.path.replace('/api/', '')}`);
    if (data) {
      pages.push({
        path: item.path,
        title: data.frontmatter.title || item.title,
        description: data.frontmatter.description || '',
        sectionTitle: 'Основы API',
      });
    } else {
      // Dynamic pages without MDX (e.g. /api/models)
      pages.push({
        path: item.path,
        title: item.title,
        description: '',
        sectionTitle: 'Основы API',
      });
    }
  }

  return pages;
}

function addPage(
  pages: OrderedPage[],
  item: SidebarPageItem,
  prefix: string,
  sectionTitle?: string
) {
  const data = getGuideData(item.path.replace(prefix, ''));
  if (data) {
    pages.push({
      path: item.path,
      title: data.frontmatter.title || item.title,
      description: data.frontmatter.description || '',
      sectionTitle,
    });
  }
}
