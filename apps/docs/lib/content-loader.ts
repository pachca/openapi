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
 * Get MDX content and frontmatter for a guide page or special page
 * Returns the content without frontmatter and parsed frontmatter data
 *
 * For guides: getGuideData('audit-events') -> content/guides/audit-events.mdx
 * For home: getGuideData('home') -> content/home.mdx
 */
export function getGuideData(guidePath: string): GuideData | null {
  // Remove leading slash and 'guides/' prefix if present
  let fileName = guidePath.replace(/^\//, '').replace(/^guides\//, '');

  // Remove extension if present
  fileName = fileName.replace(/\.(mdx?|md)$/, '');

  // Special case for home page - it's in content/home.mdx, not content/guides/
  const isHomePage = fileName === 'home';
  const baseDir = isHomePage ? CONTENT_DIR : path.join(CONTENT_DIR, 'guides');

  // Try .mdx first, then .md for backwards compatibility
  const mdxPath = path.join(baseDir, `${fileName}.mdx`);
  const mdPath = path.join(baseDir, `${fileName}.md`);

  try {
    let filePath: string | null = null;
    if (fs.existsSync(mdxPath)) {
      filePath = mdxPath;
    } else if (fs.existsSync(mdPath)) {
      filePath = mdPath;
    }

    if (filePath) {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const { data, content } = matter(fileContent);

      return {
        content,
        frontmatter: {
          title: data.title || fileName,
          description: data.description,
          hideTableOfContents: data.hideTableOfContents,
          useUpdatesComponent: data.useUpdatesComponent,
        },
      };
    }
  } catch (error) {
    console.error(`Error reading guide content: ${fileName}`, error);
  }

  return null;
}

/**
 * Get MDX content for a guide page or special page (legacy function)
 * Returns the raw MDX content from the file (without frontmatter)
 *
 * For guides: getGuideContent('audit-events') -> content/guides/audit-events.mdx
 * For home: getGuideContent('home') -> content/home.mdx
 */
export function getGuideContent(guidePath: string): string | null {
  const data = getGuideData(guidePath);
  return data ? data.content : null;
}

/**
 * Get all available guide slugs (file names without extension)
 */
export function getAllGuideSlugs(): string[] {
  const guidesDir = path.join(CONTENT_DIR, 'guides');

  try {
    if (fs.existsSync(guidesDir)) {
      const files = fs.readdirSync(guidesDir);
      return files
        .filter((file) => file.endsWith('.mdx') || file.endsWith('.md'))
        .map((file) => file.replace(/\.(mdx?|md)$/, ''));
    }
  } catch (error) {
    console.error('Error reading guides directory', error);
  }

  return [];
}

/**
 * Get all available guide paths
 */
export function getAllGuidePaths(): string[] {
  return getAllGuideSlugs().map((slug) => `/guides/${slug}`);
}

/**
 * Get all guides with their frontmatter data
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
 * Check if a guide has markdown content file
 */
export function hasGuideContent(guidePath: string): boolean {
  return getGuideData(guidePath) !== null;
}
