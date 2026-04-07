/**
 * Server-only utility to get all ordered pages.
 * Separated from tabs-config.ts because it uses content-loader (which requires 'fs').
 * tabs-config.ts must remain client-safe (imported by 'use client' components).
 */

import { GUIDE_SECTIONS, API_GUIDE_PAGES, SIDEBAR_FOOTER } from './tabs-config';
import type { SidebarPageItem } from './tabs-config';
import { getGuideData } from './content-loader';

/**
 * Get all ordered guide pages (for generators/sitemap).
 * Returns pages from all guide sections + API guide pages + home.
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

  // Guide sections
  for (const section of GUIDE_SECTIONS) {
    for (const item of section.items) {
      if (item.children) {
        for (const child of item.children) {
          addPage(pages, child, '/guides/', item.title);
        }
      } else {
        addPage(pages, item, '/guides/');
      }
    }
  }

  // Footer pages (updates)
  for (const item of SIDEBAR_FOOTER) {
    if (item.external) continue;
    const data = getGuideData(item.path.replace('/', ''));
    if (data) {
      pages.push({
        path: item.path,
        title: data.frontmatter.title || item.title,
        description: data.frontmatter.description || '',
      });
    }
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
