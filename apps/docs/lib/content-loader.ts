import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), 'content');

export interface GuideFrontmatter {
  title: string;
  description?: string;
  hideTableOfContents?: boolean;
  useUpdatesComponent?: boolean;
}

export interface GuideData {
  content: string;
  frontmatter: GuideFrontmatter;
}

/**
 * Get MDX content and frontmatter for a page.
 *
 * Supports multiple content locations:
 * - getGuideData('home') → content/home.mdx
 * - getGuideData('cli') → content/guides/cli.mdx
 * - getGuideData('forms/blocks') → content/guides/forms/blocks.mdx
 * - getGuideData('api/authorization') → content/api/authorization.mdx
 * - getGuideData('updates') → content/updates.mdx
 */
export function getGuideData(guidePath: string): GuideData | null {
  // Remove leading slash and 'guides/' prefix if present
  let fileName = guidePath.replace(/^\//, '').replace(/^guides\//, '');

  // Remove extension if present
  fileName = fileName.replace(/\.(mdx?|md)$/, '');

  // Determine base directory based on path
  let baseDir: string;
  if (fileName === 'home') {
    baseDir = CONTENT_DIR;
  } else if (fileName.startsWith('api/')) {
    baseDir = CONTENT_DIR;
    // Keep the api/ prefix — file is at content/api/*.mdx
  } else if (fileName === 'updates') {
    baseDir = CONTENT_DIR;
    // File is at content/updates.mdx
  } else {
    baseDir = path.join(CONTENT_DIR, 'guides');
  }

  // Try .mdx first, then .md, then index.mdx for directories
  const candidates = [
    path.join(baseDir, `${fileName}.mdx`),
    path.join(baseDir, `${fileName}.md`),
    path.join(baseDir, fileName, 'index.mdx'),
    path.join(baseDir, fileName, 'index.md'),
  ];

  try {
    for (const filePath of candidates) {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(fileContent);

        return {
          content,
          frontmatter: {
            title: data.title || path.basename(fileName),
            description: data.description,
            hideTableOfContents: data.hideTableOfContents,
            useUpdatesComponent: data.useUpdatesComponent,
          },
        };
      }
    }
  } catch (error) {
    console.error(`Error reading guide content: ${fileName}`, error);
  }

  return null;
}

/**
 * Get MDX content for a page (legacy function).
 */
export function getGuideContent(guidePath: string): string | null {
  const data = getGuideData(guidePath);
  return data ? data.content : null;
}

/**
 * Get all available guide slugs from content/guides/ (files and subdirectories).
 */
export function getAllGuideSlugs(): string[] {
  const guidesDir = path.join(CONTENT_DIR, 'guides');
  const slugs: string[] = [];

  try {
    if (fs.existsSync(guidesDir)) {
      collectSlugs(guidesDir, '', slugs);
    }
  } catch (error) {
    console.error('Error reading guides directory', error);
  }

  return slugs;
}

/**
 * Recursively collect slugs from a directory.
 * For files: returns the file name without extension.
 * For directories with index.mdx: returns the directory name.
 * For nested files: returns relative path (e.g., "forms/blocks").
 */
function collectSlugs(dir: string, prefix: string, slugs: string[]): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile() && (entry.name.endsWith('.mdx') || entry.name.endsWith('.md'))) {
      const name = entry.name.replace(/\.(mdx?|md)$/, '');
      if (name === 'index') {
        // Directory index — the slug is the directory name (prefix)
        if (prefix) slugs.push(prefix);
      } else {
        slugs.push(prefix ? `${prefix}/${name}` : name);
      }
    } else if (entry.isDirectory()) {
      const subPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
      collectSlugs(path.join(dir, entry.name), subPrefix, slugs);
    }
  }
}

/**
 * Get all available API guide slugs from content/api/.
 */
export function getAllApiGuideSlugs(): string[] {
  const apiDir = path.join(CONTENT_DIR, 'api');

  try {
    if (fs.existsSync(apiDir)) {
      const files = fs.readdirSync(apiDir);
      return files
        .filter((file) => file.endsWith('.mdx') || file.endsWith('.md'))
        .map((file) => file.replace(/\.(mdx?|md)$/, ''));
    }
  } catch (error) {
    console.error('Error reading api directory', error);
  }

  return [];
}

/**
 * Get all available guide paths.
 */
export function getAllGuidePaths(): string[] {
  return getAllGuideSlugs().map((slug) => `/guides/${slug}`);
}

/**
 * Get all guides with their frontmatter data.
 */
export function getAllGuidesWithFrontmatter(): Array<{
  slug: string;
  path: string;
  frontmatter: GuideFrontmatter;
}> {
  const slugs = getAllGuideSlugs();
  const guides: Array<{ slug: string; path: string; frontmatter: GuideFrontmatter }> = [];

  for (const slug of slugs) {
    const data = getGuideData(slug);
    if (data) {
      guides.push({
        slug,
        path: `/guides/${slug}`,
        frontmatter: data.frontmatter,
      });
    }
  }

  return guides;
}

/**
 * Get all API guide pages with their frontmatter data.
 */
export function getAllApiGuidesWithFrontmatter(): Array<{
  slug: string;
  path: string;
  frontmatter: GuideFrontmatter;
}> {
  const slugs = getAllApiGuideSlugs();
  const guides: Array<{ slug: string; path: string; frontmatter: GuideFrontmatter }> = [];

  for (const slug of slugs) {
    const data = getGuideData(`api/${slug}`);
    if (data) {
      guides.push({
        slug,
        path: `/api/${slug}`,
        frontmatter: data.frontmatter,
      });
    }
  }

  return guides;
}

/**
 * Check if a guide has markdown content file.
 */
export function hasGuideContent(guidePath: string): boolean {
  return getGuideData(guidePath) !== null;
}

/**
 * Extract the first meaningful paragraph from MDX content.
 * Skips headings, hashtag annotations, HTML/JSX components, and code blocks.
 * Strips inline markdown formatting (links, code, bold, italic).
 */
export function extractFirstParagraph(content: string): string {
  const lines = content.split('\n');
  const paragraphLines: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    if (trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('<')) continue;

    if (!trimmed) {
      if (paragraphLines.length > 0) break;
      continue;
    }

    paragraphLines.push(trimmed);
  }

  if (paragraphLines.length === 0) return '';

  return paragraphLines
    .join(' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1');
}
