/**
 * Centralized configuration for guides and API sections.
 * Dynamically collects guide metadata from MDX frontmatter.
 */

import fs from 'fs';
import path from 'path';
import { getAllGuidesWithFrontmatter, getGuideData } from './content-loader';

export interface GuideConfig {
  path: string;
  title: string;
  description: string;
}

/**
 * Dynamically collects all guide pages from content/guides MDX files.
 * Reads metadata (title, description) from frontmatter.
 */
export function getGuidePages(): GuideConfig[] {
  const guides: GuideConfig[] = [];

  // Add overview page (homepage) from content/home.mdx
  const homeData = getGuideData('home');
  if (homeData) {
    guides.push({
      path: '/',
      title: homeData.frontmatter.title || 'Обзор',
      description: homeData.frontmatter.description || 'Документация API',
    });
  }

  // Collect all guides from content/guides/*.mdx
  const allGuides = getAllGuidesWithFrontmatter();
  for (const guide of allGuides) {
    guides.push({
      path: guide.path,
      title: guide.frontmatter.title,
      description: guide.frontmatter.description || '',
    });
  }

  return guides;
}

/**
 * Order of guides in navigation (by path).
 * Guides not in this list appear at the end.
 */
const GUIDES_ORDER = [
  '/',
  '/guides/ai-agents',
  '/guides/webhook',
  '/guides/authorization',
  '/guides/requests-responses',
  '/guides/errors',
  '/guides/export',
  '/guides/forms',
  '/guides/dlp',
  '/guides/audit-events',
  '/guides/updates',
];

/**
 * Get all guide pages sorted by predefined order.
 */
export function getOrderedGuidePages(): GuideConfig[] {
  const guides = getGuidePages();

  return guides.sort((a, b) => {
    const aIndex = GUIDES_ORDER.indexOf(a.path);
    const bIndex = GUIDES_ORDER.indexOf(b.path);
    if (aIndex === -1 && bIndex === -1) return a.title.localeCompare(b.title);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

/**
 * Get guide config by path.
 */
export function getGuideByPath(guidePath: string): GuideConfig | undefined {
  return getGuidePages().find((guide) => guide.path === guidePath);
}

/**
 * Gets tag order directly from OpenAPI specification.
 * Tags are sorted in the order they appear in the OpenAPI tags array.
 */
export function getTagOrderFromOpenAPI(): string[] {
  const openapiPath = path.join(process.cwd(), '..', '..', 'packages', 'spec', 'openapi.yaml');

  if (!fs.existsSync(openapiPath)) {
    return [];
  }

  const content = fs.readFileSync(openapiPath, 'utf-8');

  // Parse tags from YAML - they appear as "  - name: TagName"
  const tagMatches = content.match(/^tags:\s*\n((?:\s+-\s+name:\s+.+\n?)+)/m);
  if (!tagMatches) {
    return [];
  }

  const tagLines = tagMatches[1].match(/-\s+name:\s+(.+)/g) || [];
  return tagLines
    .map((line) => {
      const match = line.match(/-\s+name:\s+(.+)/);
      return match ? match[1].trim() : '';
    })
    .filter(Boolean);
}

/**
 * Helper to sort tags by OpenAPI order.
 */
export function sortTagsByOrder(tags: string[]): string[] {
  const sectionOrder = getTagOrderFromOpenAPI();

  return [...tags].sort((a, b) => {
    const aIndex = sectionOrder.indexOf(a);
    const bIndex = sectionOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}
