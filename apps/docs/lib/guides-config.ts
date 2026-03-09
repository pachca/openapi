/**
 * OpenAPI tag ordering utilities.
 * Guide page ordering moved to tabs-config.ts.
 */

import fs from 'fs';
import path from 'path';

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
