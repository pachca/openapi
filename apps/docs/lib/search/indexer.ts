import { parseOpenAPI } from '../openapi/parser';
import {
  generateUrlFromOperation,
  generateTitle,
  getDescriptionWithoutTitle,
} from '../openapi/mapper';
import type { Schema, Endpoint } from '../openapi/types';
import { loadUpdates } from '../updates-parser';
import { getGuideSchema } from '../schemas/guide-schemas';
import { getContextualTitle } from '../tabs-config';
import {
  expandQueryWithSynonyms,
  removeStopWords,
  extractActionIntent,
  addStems,
  stemRussian,
  getWordVariants,
  isBrandWord,
} from './synonyms';
import {
  buildSectionIndex,
  escapeRegExp,
  extractSections,
  hyphenPhrase,
  isStrongMatch,
  ORPHAN_MAX,
  rankSections,
  stripMarkdown,
  type PageSection,
  type RankedSection,
  type SectionIndex,
  type SectionPage,
} from './sections';
import * as fs from 'fs';
import * as path from 'path';
import FlexSearch from 'flexsearch';
import matter from 'gray-matter';

export interface SearchIndex {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'api' | 'guide';
  category?: string;
  keywords: string[];
  /** Field names from schemas with descriptions for highlighting in search results */
  schemaFields?: CodeValueWithDescription[];
  /** Code values from MDX files (values in backticks) for highlighting */
  codeValues?: CodeValueWithDescription[];
  /**
   * Set on a section result: the title of the page the section belongs to.
   * `title` is then the heading and `url` is the page URL with `#anchor`.
   */
  pageTitle?: string;
}

interface SearchState {
  /** FlexSearch document index for fast full-text search */
  flexIndex: FlexSearch.Document<SearchIndex, string[]> | null;
  searchIndex: SearchIndex[];
  /**
   * Headings of guide pages (`##`, `###`, `<Step title>`), see sections.ts. A
   * separate index: the page and endpoint candidates (and FlexSearch's
   * per-field limit) stay exactly what they are without sections.
   */
  sectionIndex: SectionIndex | null;
  buildPromise: Promise<SearchIndex[]> | null;
}

function emptyState(): SearchState {
  return { flexIndex: null, searchIndex: [], sectionIndex: null, buildPromise: null };
}

/**
 * The index lives on `globalThis`, once per server process. Next bundles
 * `instrumentation.ts` and the search route into different module graphs
 * (the `instrument` and `rsc` layers), and each graph gets its own copy of
 * this module: with module-level state the warm-up at server start built an
 * index the route never read. In development every copy keeps its own state,
 * so an edit to the indexer rebuilds the index with the new code on reload.
 */
const state: SearchState =
  process.env.NODE_ENV === 'production'
    ? ((globalThis as { __pachcaSearchState?: SearchState }).__pachcaSearchState ??= emptyState())
    : emptyState();

/**
 * Clear the search index cache (useful for development)
 */
export function clearSearchCache() {
  Object.assign(state, emptyState());
}

/**
 * Initialize FlexSearch document index with optimized settings for API docs
 */
function createFlexSearchIndex(): FlexSearch.Document<SearchIndex, string[]> {
  return new FlexSearch.Document<SearchIndex, string[]>({
    document: {
      id: 'id',
      index: [
        {
          field: 'title',
          tokenize: 'forward',
        },
        {
          field: 'description',
          tokenize: 'forward',
        },
        {
          field: 'keywords',
          tokenize: 'forward',
        },
      ],
      store: ['id', 'title', 'description', 'url', 'type', 'category', 'keywords'],
    },
    cache: 100,
  });
}

interface SchemaFieldInfo {
  description?: string;
  path: string;
  isEnum?: boolean;
}

interface SchemaFieldsResult {
  fields: Map<string, SchemaFieldInfo>;
  keywords: string[];
}

/**
 * Extract field names and descriptions from a schema recursively
 */
function extractSchemaFields(
  schema: Schema | undefined,
  depth = 0,
  parentPath = ''
): SchemaFieldsResult {
  const fields = new Map<string, SchemaFieldInfo>();
  const keywords: string[] = [];

  if (!schema || depth > 10) {
    return { fields, keywords };
  }

  // Extract enum values
  if (schema.enum && Array.isArray(schema.enum)) {
    const enumDescriptions = schema['x-enum-descriptions'] || {};
    for (const enumValue of schema.enum) {
      if (typeof enumValue === 'string' && enumValue.length <= 100) {
        const desc = enumDescriptions[enumValue]
          ? stripMarkdown(enumDescriptions[enumValue]).slice(0, 100)
          : undefined;
        // Use -- as separator for enum values (will be preserved in param ID)
        const enumPath = parentPath ? `${parentPath}--${enumValue}` : enumValue;

        // Store enum value as a field
        const existing = fields.get(enumValue);
        if (!existing || enumPath.length < existing.path.length) {
          fields.set(enumValue, { description: desc, path: enumPath, isEnum: true });
        }

        keywords.push(enumValue.toLowerCase());
        if (desc) {
          keywords.push(
            ...desc
              .toLowerCase()
              .split(/\s+/)
              .filter((w) => w.length > 2)
          );
        }
      }
    }
  }

  // Extract from properties
  if (schema.properties) {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      const desc = propSchema.description
        ? stripMarkdown(propSchema.description).slice(0, 100)
        : undefined;
      const fieldPath = parentPath ? `${parentPath}.${propName}` : propName;

      // Compute array depth for display (e.g. buttons[][] for nested arrays)
      let displayName = propName;
      if (propSchema.type === 'array') {
        let arrayDepth = 1;
        let items = propSchema.items;
        while (items?.type === 'array' && items.items) {
          arrayDepth++;
          items = items.items;
        }
        displayName = propName + '[]'.repeat(arrayDepth);
      }

      // Store with full path - prefer shorter paths for the same field name
      const existing = fields.get(displayName);
      if (!existing || fieldPath.length < existing.path.length) {
        fields.set(displayName, { description: desc, path: fieldPath });
      }

      keywords.push(propName.toLowerCase());
      if (desc) {
        keywords.push(
          ...desc
            .toLowerCase()
            .split(/\s+/)
            .filter((w) => w.length > 2)
        );
      }

      // Recursively extract nested fields
      const nested = extractSchemaFields(propSchema, depth + 1, fieldPath);
      for (const [name, nestedInfo] of nested.fields) {
        const existingNested = fields.get(name);
        if (!existingNested || nestedInfo.path.length < existingNested.path.length) {
          fields.set(name, nestedInfo);
        }
      }
      keywords.push(...nested.keywords);
    }
  }

  // Extract from array items
  if (schema.items) {
    const arrayPath = parentPath ? `${parentPath}[]` : '[]';
    const nested = extractSchemaFields(schema.items, depth + 1, arrayPath);
    for (const [name, info] of nested.fields) {
      const existing = fields.get(name);
      if (!existing || info.path.length < existing.path.length) {
        fields.set(name, info);
      }
    }
    keywords.push(...nested.keywords);
  }

  // Extract from additionalProperties (Record types)
  if (schema.additionalProperties && typeof schema.additionalProperties !== 'boolean') {
    const recordPath = parentPath ? `${parentPath}[*]` : '[*]';
    const nested = extractSchemaFields(schema.additionalProperties, depth + 1, recordPath);
    for (const [name, info] of nested.fields) {
      const existing = fields.get(name);
      if (!existing || info.path.length < existing.path.length) {
        fields.set(name, info);
      }
    }
    keywords.push(...nested.keywords);
  }

  // Extract from allOf, oneOf, anyOf
  for (const compositeKey of ['allOf', 'oneOf', 'anyOf'] as const) {
    const compositeSchemas = schema[compositeKey];
    if (compositeSchemas) {
      for (const subSchema of compositeSchemas) {
        const nested = extractSchemaFields(subSchema, depth + 1, parentPath);
        for (const [name, info] of nested.fields) {
          const existing = fields.get(name);
          if (!existing || info.path.length < existing.path.length) {
            fields.set(name, info);
          }
        }
        keywords.push(...nested.keywords);
      }
    }
  }

  return { fields, keywords };
}

interface EndpointSchemaResult {
  fields: CodeValueWithDescription[];
  keywords: string[];
}

/**
 * Extract all schema fields from an endpoint (request body + responses)
 */
function extractEndpointSchemaFields(endpoint: Endpoint): EndpointSchemaResult {
  const allFields = new Map<string, SchemaFieldInfo>();
  const allKeywords: string[] = [];

  // Extract from request body (highest priority for field descriptions)
  if (endpoint.requestBody?.content) {
    for (const mediaType of Object.values(endpoint.requestBody.content)) {
      const result = extractSchemaFields(mediaType.schema);
      for (const [name, info] of result.fields) {
        const existing = allFields.get(name);
        if (!existing || info.path.length < existing.path.length) {
          allFields.set(name, info);
        }
      }
      allKeywords.push(...result.keywords);
    }
  }

  // Extract from responses (only add fields not already present from request body)
  for (const response of Object.values(endpoint.responses)) {
    if (response.content) {
      for (const mediaType of Object.values(response.content)) {
        const result = extractSchemaFields(mediaType.schema);
        for (const [name, info] of result.fields) {
          if (!allFields.has(name)) {
            allFields.set(name, info);
          }
        }
        allKeywords.push(...result.keywords);
      }
    }
  }

  // Extract from parameters (URL/query params don't have paths)
  for (const param of endpoint.parameters) {
    const desc = param.description ? stripMarkdown(param.description).slice(0, 100) : undefined;
    if (!allFields.has(param.name)) {
      allFields.set(param.name, { description: desc, path: param.name });
    }
    allKeywords.push(param.name.toLowerCase());
    if (desc) {
      allKeywords.push(
        ...desc
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 2)
      );
    }

    const result = extractSchemaFields(param.schema, 0, param.name);
    for (const [name, info] of result.fields) {
      const existing = allFields.get(name);
      if (!existing || info.path.length < existing.path.length) {
        allFields.set(name, info);
      }
    }
    allKeywords.push(...result.keywords);
  }

  // Convert map to array with path information
  const fields: CodeValueWithDescription[] = [];
  for (const [value, info] of allFields) {
    fields.push({ value, description: info.description, path: info.path, isEnum: info.isEnum });
  }

  return {
    fields,
    keywords: [...new Set(allKeywords)],
  };
}

export interface CodeValueWithDescription {
  value: string;
  description?: string;
  /** Full path for schema fields (e.g., 'data.accounts.name') for generating param links */
  path?: string;
  /** Whether this is an enum value (for display purposes) */
  isEnum?: boolean;
}

interface MdxExtractResult {
  keywords: string[];
  /** Code values with optional descriptions for display */
  codeValues: CodeValueWithDescription[];
}

/**
 * Extract code values and important keywords from MDX content
 */
function extractKeywordsFromMdx(content: string): MdxExtractResult {
  const keywords: string[] = [];
  const codeValuesMap = new Map<string, string | undefined>();

  // Extract code values with descriptions from list items: `- \`value\` - description`
  const listItemWithCodeMatches = content.match(/^-\s+`([^`]+)`\s*[-–—]\s*(.+)$/gm);
  if (listItemWithCodeMatches) {
    for (const match of listItemWithCodeMatches) {
      const parsed = match.match(/^-\s+`([^`]+)`\s*[-–—]\s*(.+)$/);
      if (parsed) {
        const [, value, description] = parsed;
        // Only add short, single-line values (not JSON objects, etc.)
        if (value.length <= 50 && !value.includes('\n') && !value.includes('{')) {
          codeValuesMap.set(value, description.trim());
          keywords.push(value.toLowerCase());
          // Also add description words to keywords
          const descWords = description
            .toLowerCase()
            .split(/\s+/)
            .filter((w) => w.length > 2);
          keywords.push(...descWords);
        }
      }
    }
  }

  // Extract standalone inline code values (not in list items with descriptions)
  const inlineCodeMatches = content.match(/`([^`]+)`/g);
  if (inlineCodeMatches) {
    for (const match of inlineCodeMatches) {
      const code = match.slice(1, -1);
      // Only add short, single-line values that aren't already in the map
      if (
        code.length <= 50 &&
        !code.includes('\n') &&
        !code.includes('{') &&
        !codeValuesMap.has(code)
      ) {
        codeValuesMap.set(code, undefined);
        keywords.push(code.toLowerCase());
      }
    }
  }

  // Extract words from list items (- item)
  const listItemMatches = content.match(/^-\s+(.+)$/gm);
  if (listItemMatches) {
    for (const match of listItemMatches) {
      const text = match.replace(/^-\s+/, '').replace(/`[^`]+`/g, '');
      const words = text
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2);
      keywords.push(...words);
    }
  }

  // Extract headings
  const headingMatches = content.match(/^#{1,6}\s+(.+)$/gm);
  if (headingMatches) {
    for (const match of headingMatches) {
      const text = match.replace(/^#{1,6}\s+/, '');
      const words = text
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2);
      keywords.push(...words);
    }
  }

  // Extract words from regular paragraphs (lines that are not headings, list items, or special markup)
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    // Skip empty lines, headings, list items, HTML/JSX tags, and comments
    if (
      !trimmedLine ||
      trimmedLine.startsWith('#') ||
      trimmedLine.startsWith('-') ||
      trimmedLine.startsWith('<') ||
      trimmedLine.startsWith('<!--') ||
      trimmedLine.startsWith('```') ||
      trimmedLine.startsWith('|')
    ) {
      continue;
    }
    // Extract words from regular paragraph text (remove inline code and links)
    const cleanedText = trimmedLine
      .replace(/`[^`]+`/g, '') // Remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Replace links with link text
    const words = cleanedText
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2);
    keywords.push(...words);
  }

  // Convert map to array
  const codeValues: CodeValueWithDescription[] = [];
  for (const [value, description] of codeValuesMap) {
    codeValues.push({ value, description });
  }

  return {
    keywords: [...new Set(keywords)],
    codeValues,
  };
}

/**
 * Read content file and return its content
 */
function readContentFile(filePath: string): string | null {
  try {
    // Try .mdx first, then .md
    const mdxPath =
      filePath.endsWith('.mdx') || filePath.endsWith('.md') ? filePath : `${filePath}.mdx`;
    const mdPath = filePath.replace(/\.mdx$/, '.md');

    if (fs.existsSync(mdxPath)) {
      return fs.readFileSync(mdxPath, 'utf8');
    }
    if (fs.existsSync(mdPath)) {
      return fs.readFileSync(mdPath, 'utf8');
    }
  } catch (error) {
    console.error(`Error reading content file: ${filePath}`, error);
  }
  return null;
}

interface GuideMetadata {
  id: string;
  title: string;
  description: string;
  url: string;
  keywords: string[];
  codeValues: CodeValueWithDescription[];
  /** Schema names referenced in the guide (from <SchemaBlock name="..." />) */
  schemaNames: string[];
  /** h2/h3 headings and steps with their text */
  sections: PageSection[];
}

/**
 * Extract schema names referenced in MDX content
 * Looks for patterns like: <SchemaBlock name="SchemaName" />
 */
function extractSchemaNames(content: string): string[] {
  const schemaNames: string[] = [];

  // Match <SchemaBlock name="..." /> patterns - единственный универсальный паттерн
  const schemaBlockMatches = content.matchAll(/<SchemaBlock\s+name=["']([^"']+)["']/g);
  for (const match of schemaBlockMatches) {
    schemaNames.push(match[1]);
  }

  // ErrorSchema - особый случай (2 схемы из OpenAPI)
  if (content.includes('<ErrorSchema')) {
    schemaNames.push('ApiError', 'OAuthError');
  }

  return [...new Set(schemaNames)];
}

/**
 * Extract title and description from MDX/MD content (supports frontmatter)
 */
function extractGuideMetadata(
  content: string,
  id: string,
  url: string,
  { withSections = true }: { withSections?: boolean } = {}
): GuideMetadata {
  // Parse frontmatter if present
  const { data: frontmatter, content: mdxContent } = matter(content);

  const lines = mdxContent.split('\n');

  // Extract title from frontmatter or first # heading
  let title = frontmatter.title || id;
  if (!frontmatter.title) {
    const titleMatch = mdxContent.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
  }

  // Extract description from frontmatter or first paragraph after title
  let description = frontmatter.description || '';
  if (!description) {
    let foundTitle = false;
    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines and title
      if (!trimmedLine || trimmedLine.startsWith('# ')) {
        foundTitle = trimmedLine.startsWith('# ');
        continue;
      }

      // Skip component tags like <Info>, <Image>, etc.
      if (trimmedLine.startsWith('<') && !trimmedLine.startsWith('</')) {
        continue;
      }

      // Found first real paragraph
      if (foundTitle || !trimmedLine.startsWith('#')) {
        description = stripMarkdown(trimmedLine).slice(0, 200);
        break;
      }
    }
  }

  // Extract keywords and code values
  const mdxData = extractKeywordsFromMdx(mdxContent);

  // Add title words to keywords
  const titleWords = title
    .toLowerCase()
    .split(/\s+/)
    .filter((w: string) => w.length > 2);
  mdxData.keywords.push(...titleWords);

  // Extract schema names from MDX
  const schemaNames = extractSchemaNames(mdxContent);

  return {
    id,
    title,
    description,
    url,
    keywords: [...new Set(mdxData.keywords)],
    codeValues: mdxData.codeValues,
    schemaNames,
    sections: withSections ? extractSections(mdxContent) : [],
  };
}

/**
 * Build content for updates page by combining guide header with parsed updates
 */
function buildUpdatesContent(): string {
  const updates = loadUpdates();

  // Build searchable content from updates
  const contentParts: string[] = [
    '# Последние обновления',
    'Новые методы в API и дополнения в уже существующих',
  ];

  for (const update of updates) {
    contentParts.push(`## ${update.title}`);
    contentParts.push(update.content);
  }

  return contentParts.join('\n\n');
}

/**
 * Dynamically scan and load all guide pages
 */
function loadAllGuides(): GuideMetadata[] {
  const guides: GuideMetadata[] = [];
  const contentDir = path.join(process.cwd(), 'content');
  const guidesDir = path.join(contentDir, 'guides');
  const apiDir = path.join(contentDir, 'api');

  // Add home page
  const homeContent = readContentFile(path.join(contentDir, 'home'));
  if (homeContent) {
    guides.push(extractGuideMetadata(homeContent, 'home', '/'));
  }

  // Add updates page. No sections: its headings are rendered by the updates
  // list, not from this text.
  const updatesContent = buildUpdatesContent();
  if (updatesContent) {
    guides.push(
      extractGuideMetadata(updatesContent, 'updates', '/updates', { withSections: false })
    );
  }

  // Scan guides directory (recursively for nested paths like forms/blocks)
  function scanDir(dir: string, urlPrefix: string) {
    try {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && (entry.name.endsWith('.mdx') || entry.name.endsWith('.md'))) {
          const name = entry.name.replace(/\.(mdx?|md)$/, '');
          const filePath = path.join(dir, entry.name);

          if (name === 'index') {
            // Directory index — use parent dir name as id
            const dirName = path.basename(dir);
            const content = readContentFile(filePath);
            if (content) {
              guides.push(extractGuideMetadata(content, dirName, urlPrefix));
            }
          } else if (name === 'updates' && urlPrefix === '/guides') {
            // Skip — updates moved to content/updates.mdx
          } else {
            const content = readContentFile(filePath);
            if (content) {
              guides.push(extractGuideMetadata(content, name, `${urlPrefix}/${name}`));
            }
          }
        } else if (entry.isDirectory()) {
          scanDir(path.join(dir, entry.name), `${urlPrefix}/${entry.name}`);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dir}:`, error);
    }
  }

  scanDir(guidesDir, '/guides');

  // Scan API guides directory
  scanDir(apiDir, '/api');

  return guides;
}

/**
 * Resolve $ref references in a schema
 */
function resolveSchemaRefs(schema: Schema, allSchemas: Record<string, Schema>, depth = 0): Schema {
  if (!schema || depth > 15) return schema;

  // Resolve $ref
  if (schema.$ref) {
    const refName = schema.$ref.replace('#/components/schemas/', '');
    const referencedSchema = allSchemas[refName];
    if (referencedSchema) {
      return resolveSchemaRefs(referencedSchema, allSchemas, depth + 1);
    }
  }

  // Create a copy to avoid mutating original
  const resolved: Schema = { ...schema };

  // Resolve properties
  if (resolved.properties) {
    const resolvedProps: Record<string, Schema> = {};
    for (const [key, propSchema] of Object.entries(resolved.properties)) {
      resolvedProps[key] = resolveSchemaRefs(propSchema, allSchemas, depth + 1);
    }
    resolved.properties = resolvedProps;
  }

  // Resolve array items
  if (resolved.items) {
    resolved.items = resolveSchemaRefs(resolved.items, allSchemas, depth + 1);
  }

  // Resolve additionalProperties (Record types)
  if (resolved.additionalProperties && typeof resolved.additionalProperties !== 'boolean') {
    resolved.additionalProperties = resolveSchemaRefs(
      resolved.additionalProperties,
      allSchemas,
      depth + 1
    );
  }

  // Resolve allOf/oneOf/anyOf
  if (resolved.allOf) {
    resolved.allOf = resolved.allOf.map((s) => resolveSchemaRefs(s, allSchemas, depth + 1));
  }
  if (resolved.oneOf) {
    resolved.oneOf = resolved.oneOf.map((s) => resolveSchemaRefs(s, allSchemas, depth + 1));
  }
  if (resolved.anyOf) {
    resolved.anyOf = resolved.anyOf.map((s) => resolveSchemaRefs(s, allSchemas, depth + 1));
  }

  return resolved;
}

/**
 * Extract schema fields (including enums) from a guide's referenced schemas
 */
function extractGuideSchemaFields(
  schemaNames: string[],
  schemas: Record<string, Schema>
): { fields: CodeValueWithDescription[]; keywords: string[] } {
  const allFields = new Map<string, SchemaFieldInfo>();
  const allKeywords: string[] = [];

  for (const schemaName of schemaNames) {
    // First try OpenAPI schemas, then fall back to guide-specific schemas
    const guideSchemaEntry = getGuideSchema(schemaName);
    const rawSchema = schemas[schemaName] || guideSchemaEntry?.schema;
    if (rawSchema) {
      // Resolve $ref references before extracting fields
      const resolvedSchema = resolveSchemaRefs(rawSchema, schemas);
      // Extract fields without schema name prefix in the internal path
      const result = extractSchemaFields(resolvedSchema, 0, '');
      for (const [name, info] of result.fields) {
        // Use unique key combining schema name and field name to avoid collisions
        const uniqueKey = `${schemaName}:${name}`;
        const existing = allFields.get(uniqueKey);
        if (!existing || info.path.length < existing.path.length) {
          // Build path that matches DOM param IDs generated by SchemaTree.
          // SchemaTree receives parentPath={schemaName}, so DOM IDs are:
          //   - Fields: param-{schemaName}-{fieldPath} (dots replaced with hyphens)
          //   - Enums:  param-{schemaName}--{enumValue} (double hyphen separator)
          // For root-level enums (no parent path), info.path is just the enum value
          // without "--", so we join with "--" to match generateEnumId format.
          const pathWithSchema =
            info.isEnum && !info.path.includes('--')
              ? `${schemaName}--${info.path}`
              : `${schemaName}.${info.path}`;
          allFields.set(uniqueKey, { ...info, path: pathWithSchema });
        }
      }
      allKeywords.push(...result.keywords);
    }
  }

  // Convert map to array
  const fields: CodeValueWithDescription[] = [];
  for (const [uniqueKey, info] of allFields) {
    // uniqueKey is "SchemaName:fieldName", extract just the field name for display
    const fieldName = uniqueKey.split(':')[1] || uniqueKey;
    fields.push({
      value: fieldName,
      description: info.description,
      path: info.path,
      isEnum: info.isEnum,
    });
  }

  return { fields, keywords: [...new Set(allKeywords)] };
}

/**
 * Build the index once. Concurrent callers (a query that arrives while the
 * index is warming up at server start) share the same build.
 */
export function buildSearchIndex(): Promise<SearchIndex[]> {
  if (state.searchIndex.length > 0 && state.flexIndex && state.sectionIndex) {
    return Promise.resolve(state.searchIndex);
  }
  state.buildPromise ??= buildIndexes().catch((error: unknown) => {
    state.buildPromise = null;
    throw error;
  });
  return state.buildPromise;
}

async function buildIndexes(): Promise<SearchIndex[]> {
  const api = await parseOpenAPI();
  const index: SearchIndex[] = [];

  // Initialize FlexSearch index
  const pageFlex = createFlexSearchIndex();
  const sectionPages: SectionPage[] = [];

  // Dynamically load all guide pages from content directory
  const guides = loadAllGuides();

  for (const guide of guides) {
    // Extract schema fields from referenced schemas
    const schemaData = extractGuideSchemaFields(guide.schemaNames, api.schemas);

    // Merge schema keywords with existing keywords + stems for Russian morphology
    const allKeywords = addStems([...guide.keywords, ...schemaData.keywords]);

    const guideDoc: SearchIndex = {
      // The URL, not the file name: many pages are called overview.mdx, and a
      // shared id kept only one of them in the index.
      id: guide.url,
      title: getContextualTitle(guide.url, guide.title),
      description: guide.description,
      url: guide.url,
      type: 'guide' as const,
      keywords: [...new Set(allKeywords)],
      codeValues: guide.codeValues,
      schemaFields: schemaData.fields.length > 0 ? schemaData.fields : undefined,
    };

    index.push(guideDoc);

    // Add to FlexSearch index with keywords as space-separated string for better matching
    pageFlex.add({
      ...guideDoc,
      keywords: allKeywords.join(' '),
    } as unknown as SearchIndex);

    if (guide.sections.length > 0) {
      sectionPages.push({ url: guide.url, title: guideDoc.title, sections: guide.sections });
    }
  }

  // Add API endpoints
  for (const endpoint of api.endpoints) {
    const title = generateTitle(endpoint);
    const url = generateUrlFromOperation(endpoint);
    const tag = endpoint.tags[0] || 'API';

    // Get description without the title (first line) and strip markdown
    const rawDescription = getDescriptionWithoutTitle(endpoint) || endpoint.summary || '';
    const description = stripMarkdown(rawDescription);

    // Build comprehensive keywords for better search
    const keywords = [
      title.toLowerCase(),
      endpoint.method.toLowerCase(),
      endpoint.path.toLowerCase(),
      tag.toLowerCase(),
      endpoint.id.toLowerCase(),
    ];

    // Add words from title
    keywords.push(...title.toLowerCase().split(/\s+/));

    // Add words from description/summary (already stripped of markdown)
    if (description) {
      // Split by whitespace and filter out empty strings and very short words
      keywords.push(
        ...description
          .toLowerCase()
          .split(/\s+/)
          .filter((w) => w.length > 2)
      );
    }

    // Add path segments (without {params})
    const pathSegments = endpoint.path
      .split('/')
      .filter((seg) => seg && !seg.startsWith('{'))
      .map((seg) => seg.toLowerCase());
    keywords.push(...pathSegments);

    // Extract schema field names and descriptions for search
    const schemaResult = extractEndpointSchemaFields(endpoint);

    // Add schema keywords
    keywords.push(...schemaResult.keywords);

    // Add stems for Russian morphology matching
    const keywordsWithStems = addStems(keywords);

    const endpointDoc: SearchIndex = {
      id: endpoint.id,
      title,
      description: description,
      url,
      type: 'api',
      category: tag,
      keywords: [...new Set(keywordsWithStems)],
      schemaFields: schemaResult.fields,
    };

    index.push(endpointDoc);

    // Add to FlexSearch index with keywords as space-separated string for better matching
    pageFlex.add({
      ...endpointDoc,
      keywords: keywordsWithStems.join(' '),
    } as unknown as SearchIndex);
  }

  state.flexIndex = pageFlex;
  state.sectionIndex = buildSectionIndex(sectionPages);
  state.searchIndex = index;
  return index;
}

export interface SearchResult extends SearchIndex {
  /** Matched value with optional description (from schema field or MDX code) */
  matchedValue?: CodeValueWithDescription;
  /** True when the result was found primarily because of a field/code match, not title/description */
  matchedByField?: boolean;
  /** FlexSearch relevance score (higher = better match) */
  score?: number;
  /**
   * A section of the page the reader is on (`currentPath`). Server side only:
   * the dialog tells such results by their path.
   */
  onCurrentPage?: boolean;
  /** A section right in front of its own page (`limitResults`). Server side only. */
  anchored?: boolean;
}

interface MatchedValueResult {
  value: CodeValueWithDescription;
  /** True if matched from schemaFields (API parameters), false if from codeValues (text mentions) */
  isSchemaField: boolean;
}

/**
 * Find matching schema field or code value for highlighting in search results.
 * With `latinWords` (see `latinWordsOf`) a schema field has to have each of
 * them, unless the item has that word elsewhere (its title, a keyword from
 * the word start): a field `code` is no match for "как подключить vs code" on
 * a method that never mentions "vs".
 */
function findMatchedValue(
  item: SearchIndex,
  lowerQuery: string,
  queryWords: string[],
  latinWords: string[] = []
): MatchedValueResult | undefined {
  const matches = (value: CodeValueWithDescription) => {
    const lowerValue = value.value.toLowerCase();
    const lowerDesc = value.description?.toLowerCase() || '';
    return (
      lowerValue.includes(lowerQuery) ||
      lowerDesc.includes(lowerQuery) ||
      queryWords.some((word) => lowerValue.includes(word)) ||
      (queryWords.length > 1 && queryWords.every((word) => lowerDesc.includes(word)))
    );
  };
  // A Latin word of the query the item has apart from its fields, looked up once.
  const elsewhere = new Map<string, boolean>();
  const hasElsewhere = (word: string) => {
    let has = elsewhere.get(word);
    if (has === undefined) {
      has =
        item.title.toLowerCase().includes(word) || item.keywords.some((k) => k.startsWith(word));
      elsewhere.set(word, has);
    }
    return has;
  };
  const coversQuery = (field: CodeValueWithDescription) => {
    const lowerValue = field.value.toLowerCase();
    return latinWords.every((word) => lowerValue.includes(word) || hasElsewhere(word));
  };

  // Check for schema field match (for both API endpoints and guides)
  // This is a real API parameter - highest priority
  const matchedField = item.schemaFields?.find((f) => matches(f) && coversQuery(f));

  if (matchedField) return { value: matchedField, isSchemaField: true };

  // Check for code value match (for guides)
  // This is just a mention in text - lower priority
  const matchedCodeValue = item.codeValues?.find(matches);

  if (matchedCodeValue) return { value: matchedCodeValue, isSchemaField: false };

  return undefined;
}

/**
 * Check if query looks like a code/variable name (e.g., callback_id, entityType)
 */
function isCodeLikeQuery(query: string): boolean {
  // Contains underscore (snake_case)
  if (query.includes('_')) return true;
  // Contains dot (object.property)
  if (query.includes('.')) return true;
  // Single word that looks like camelCase (has lowercase followed by uppercase)
  if (!query.includes(' ') && /[a-z][A-Z]/.test(query)) return true;
  // Single technical-looking word without spaces
  if (!query.includes(' ') && /^[a-z_]+$/i.test(query) && query.length >= 3) return true;
  return false;
}

const LATIN_WORD = /^[a-z0-9_.-]*[a-z][a-z0-9_.-]*$/;
const CYRILLIC = /[а-яё]/;

/**
 * The Latin words of a Russian query, brand words aside ("vs code" of "как
 * подключить vs code", "mcp vs code" of "mcp в vs code"): what the query
 * names. A schema field is a match only with every one of them, in its name or
 * elsewhere in the item (`findMatchedValue`): a field `code` names a part of
 * "VS Code", not the query's subject. `redirect_uri` stays one for "redirect
 * uri для бота", `code` for "поле code в реакции".
 *
 * None for a query in Latin letters only ("cursor pagination", "upload file"):
 * the docs are in Russian, a field name is all of English a method has. Nor
 * for a code-like query (`chat_id`) or one in Russian only ("обменять код на
 * токен"): they keep every field match.
 */
function latinWordsOf(lowerQuery: string, cleanedQuery: string): string[] {
  if (!CYRILLIC.test(lowerQuery)) return [];
  return cleanedQuery
    .split(/\s+/)
    .filter((w) => w.length > 1 && LATIN_WORD.test(w) && !isBrandWord(w));
}

/** A word with a hyphen inside: "gemini-cli", "ссылка-приглашение", "idempotency-key". */
const HYPHENATED = /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+$/u;

/** The query with its hyphenated words as phrases: "gemini-cli" is "gemini cli". */
function withoutHyphens(query: string): string {
  return query
    .split(/\s+/)
    .map((w) => (HYPHENATED.test(w) ? w.replace(/-/g, ' ') : w))
    .join(' ');
}

/**
 * A query word for the content relevance of a result: its variants (stem,
 * synonyms) or, for a hyphenated word, its parts in a row (`hyphenPhrase`),
 * which count as that many words: "gemini-cli" in "Gemini CLI" is two, as
 * "gemini cli" is.
 */
type ContentTerm = { phrase: RegExp; words: number } | { variants: string[] };

function contentTermsOf(query: string): ContentTerm[] {
  return query
    .split(/\s+/)
    .filter((w) => w.length > 1)
    .map((term) => {
      const phrase = HYPHENATED.test(term) ? hyphenPhrase(term) : undefined;
      return phrase
        ? { phrase, words: term.split('-').length }
        : { variants: getWordVariants(term) };
    });
}

/** How many words of the query the title or the description has, see `ContentTerm`. */
function contentMatchCount(terms: ContentTerm[], titleLower: string, descLower: string): number {
  let count = 0;
  for (const term of terms) {
    if ('phrase' in term) {
      if (term.phrase.test(titleLower) || term.phrase.test(descLower)) count += term.words;
    } else if (term.variants.some((v) => titleLower.includes(v) || descLower.includes(v))) {
      count++;
    }
  }
  return count;
}

/**
 * Check if item contains the exact query string in any searchable field
 */
function itemContainsExactQuery(item: SearchIndex, lowerQuery: string): boolean {
  // Check title
  if (item.title.toLowerCase().includes(lowerQuery)) return true;
  // Check description
  if (item.description.toLowerCase().includes(lowerQuery)) return true;
  // Check keywords
  if (item.keywords.some((k) => k.includes(lowerQuery))) return true;
  // Check schema fields
  if (item.schemaFields?.some((f) => f.value.toLowerCase().includes(lowerQuery))) return true;
  // Check code values
  if (item.codeValues?.some((v) => v.value.toLowerCase().includes(lowerQuery))) return true;
  return false;
}

export interface SearchResponse {
  results: SearchResult[];
}

/** A result as the search dialog gets it: keywords and field lists stay on the server. */
export type SearchHit = Pick<
  SearchResult,
  'id' | 'type' | 'title' | 'description' | 'url' | 'pageTitle' | 'matchedValue' | 'matchedByField'
>;

/** Longer than the two lines the dialog shows. */
const HIT_DESCRIPTION_LENGTH = 300;

export function toSearchHit(result: SearchResult): SearchHit {
  const { id, type, title, url, pageTitle, matchedValue, matchedByField } = result;
  const description =
    result.description.length > HIT_DESCRIPTION_LENGTH
      ? `${result.description.slice(0, HIT_DESCRIPTION_LENGTH).trimEnd()}…`
      : result.description;
  return {
    id,
    type,
    title,
    description,
    url,
    ...(pageTitle ? { pageTitle } : {}),
    ...(matchedValue ? { matchedValue } : {}),
    ...(matchedByField ? { matchedByField } : {}),
  };
}

const MAX_PATH_LENGTH = 200;

/**
 * The `page` parameter of a search request: the path of the page the dialog
 * is open on. Only a site path counts (`/guides/mcp/connect`): no protocol or
 * host, query or hash, at most 200 characters. Anything else is ignored.
 */
export function parseCurrentPath(value: string | null | undefined): string | undefined {
  if (!value || value.length > MAX_PATH_LENGTH) return undefined;
  if (!/^\/(?!\/)[A-Za-z0-9\-._~%/]*$/.test(value)) return undefined;
  return value.length > 1 ? value.replace(/\/+$/, '') || '/' : value;
}

export interface SearchOptions {
  /** Path of the page the reader is on (`/guides/mcp/connect`): its sections go first */
  currentPath?: string;
}

export async function search(
  query: string,
  { currentPath }: SearchOptions = {}
): Promise<SearchResponse> {
  const index = await buildSearchIndex();
  const lowerQuery = query.toLowerCase().trim();
  const { flexIndex, sectionIndex } = state;

  if (!lowerQuery || !flexIndex) {
    return { results: [] };
  }

  // Detect if this is a code-like query (variable name, field name, etc.)
  const isCodeQuery = isCodeLikeQuery(query);

  // For natural language queries: expand with synonyms and extract action intent
  const cleanedQuery = isCodeQuery ? lowerQuery : removeStopWords(lowerQuery);
  const expandedQuery = isCodeQuery ? lowerQuery : expandQueryWithSynonyms(cleanedQuery);
  const actionIntent = isCodeQuery ? undefined : extractActionIntent(lowerQuery);

  // Split expanded query into words for multi-word matching (includes synonyms)
  const expandedWords = expandedQuery.split(/\s+/).filter((w) => w.length > 1);

  // Build stemmed query for Russian morphology matching
  const stemmedWords = isCodeQuery
    ? []
    : expandedWords.map((w) => stemRussian(w)).filter((s): s is string => s !== undefined);
  const stemmedQuery = stemmedWords.join(' ');

  // Expand stemmed words with synonyms (e.g., "канала" → stem "канал" → synonyms "чат", "chat")
  const stemSynonymsQuery = isCodeQuery ? '' : expandQueryWithSynonyms(stemmedQuery);

  // Search with original, expanded, stemmed, and stem-synonym queries
  const searchQueries = isCodeQuery
    ? [lowerQuery]
    : [...new Set([lowerQuery, expandedQuery, stemmedQuery, stemSynonymsQuery].filter(Boolean))];

  // Hyphenated words as phrases ("gemini-cli" is "gemini cli"), as the
  // section search reads them; Latin words a field has to have all of.
  const spacedQuery = isCodeQuery ? lowerQuery : withoutHyphens(lowerQuery);
  const latinWords = isCodeQuery ? [] : latinWordsOf(lowerQuery, cleanedQuery);
  const contentTerms = isCodeQuery ? [] : contentTermsOf(lowerQuery);

  // Collect unique document IDs from all field results
  const matchedIds = new Set<string>();
  const idToFieldMatches = new Map<string, string[]>();

  for (const sq of searchQueries) {
    const searchResults = flexIndex.search(sq, {
      limit: 50,
      suggest: !isCodeQuery,
    });

    for (const fieldResult of searchResults) {
      const field = fieldResult.field as string;
      for (const id of fieldResult.result) {
        const docId = String(id);
        matchedIds.add(docId);

        if (!idToFieldMatches.has(docId)) {
          idToFieldMatches.set(docId, []);
        }
        const fields = idToFieldMatches.get(docId)!;
        if (!fields.includes(field)) {
          fields.push(field);
        }
      }
    }
  }

  // Build index map for fast lookup
  const indexMap = new Map(index.map((item) => [item.id, item]));

  // Build results with matched values for highlighting
  const results: SearchResult[] = [];

  for (const id of matchedIds) {
    const item = indexMap.get(id);
    if (!item) continue;

    const matchResult = findMatchedValue(item, lowerQuery, expandedWords, latinWords);
    const fieldMatches = idToFieldMatches.get(id) || [];

    // For code-like queries, only include results that actually contain the query
    if (isCodeQuery) {
      const hasExactMatch = matchResult || itemContainsExactQuery(item, lowerQuery);
      if (!hasExactMatch) continue;
    }

    // Calculate score based on match quality (not type)
    let score = 0;

    // Exact title match is strongest signal
    const lowerTitle = item.title.toLowerCase();
    if (lowerTitle.includes(lowerQuery) || lowerTitle.includes(spacedQuery)) score += 10;

    // Content relevance: count how many query words match title+description (via stems + synonyms)
    if (!isCodeQuery) {
      const contentMatches = contentMatchCount(
        contentTerms,
        lowerTitle,
        item.description.toLowerCase()
      );
      if (contentMatches >= 2) score += 20;
      else if (contentMatches === 1) score += 3;
    }

    // Matched in schema fields (actual API parameter)
    if (matchResult?.isSchemaField) score += 8;
    // Matched in code values (just mentioned in text)
    else if (matchResult) score += 4;

    // Field match priority
    if (fieldMatches.includes('title')) score += 5;
    if (fieldMatches.includes('description')) score += 3;
    if (fieldMatches.includes('keywords')) score += 1;

    // Small bonus for guides (but not dominant)
    if (item.type === 'guide') score += 2;

    // Action intent boost: if query matches action+entity pattern, boost matching endpoints
    if (actionIntent && item.type === 'api') {
      const itemKeywords = item.keywords.join(' ').toLowerCase();
      const itemTitle = item.title.toLowerCase();
      const hasAction = actionIntent.action.some(
        (a) => itemKeywords.includes(a) || itemTitle.includes(a)
      );
      const entityWords = actionIntent.entity.split(/\s+/);
      const hasEntity = entityWords.some((e) => itemKeywords.includes(e) || itemTitle.includes(e));
      if (hasAction && hasEntity) score += 15;
      else if (hasEntity) score += 5;
    }

    // Determine if the result was found primarily through a field match
    // (i.e., title and description don't already match significant query words)
    let matchedByField = false;
    if (matchResult) {
      const titleLower = item.title.toLowerCase();
      const descLower = item.description.toLowerCase();
      const significantWords = lowerQuery.split(/\s+/).filter((w) => w.length > 2);
      const titleOrDescMatchCount = significantWords.filter((w) => {
        const variants = getWordVariants(w);
        return variants.some((v) => titleLower.includes(v) || descLower.includes(v));
      }).length;
      // If less than half of significant query words match title/description,
      // the field match is likely the primary reason this result appeared
      matchedByField =
        significantWords.length === 0 || titleOrDescMatchCount < significantWords.length / 2;
    }

    results.push({
      ...item,
      matchedValue: matchResult?.value,
      matchedByField,
      score,
    });
  }

  const hasQueryInTitle = titleMatcher(lowerQuery, cleanedQuery);
  sortResults(results, hasQueryInTitle);

  if (!sectionIndex) return { results };

  const pageScores = new Map<string, number>();
  for (const result of results) {
    if (result.type === 'guide') pageScores.set(result.url, result.score ?? 0);
  }
  const titleMatches = results.filter((r) => hasQueryInTitle(r.title));
  const orphanMax = Math.min(ORPHAN_MAX, ...titleMatches.map((r) => (r.score ?? 0) - 1));
  // A weak section of a page that did not match stays below every page and
  // method among the first ten.
  const top = results.slice(0, ORPHAN_FLOOR_RESULTS);
  const orphanWeakMax = top.length > 0 ? Math.min(...top.map((r) => r.score ?? 0)) - 1 : undefined;
  const ranked = rankSections(sectionIndex, { isCodeQuery, lowerQuery, cleanedQuery }, pageScores, {
    currentPath,
    orphanMax,
    orphanWeakMax,
  });

  return { results: mergeSections(results, ranked, { currentPath, hasQueryInTitle }) };
}

/**
 * A result with the whole query in its title, from a word start ("форма" is
 * not in "Информация"): on a tie it goes first (`sortResults`), a section
 * never goes above it unless the section's own page does, and a weak match
 * on the reader's page leaves it in the top three.
 */
export function titleMatcher(lowerQuery: string, cleanedQuery: string): (title: string) => boolean {
  const patterns = [...new Set([lowerQuery, cleanedQuery])]
    .filter(Boolean)
    .map((q) => new RegExp(String.raw`(?:^|[^\p{L}\p{N}_])${escapeRegExp(q)}`, 'u'));
  return (title) => {
    const lower = title.toLowerCase();
    return patterns.some((pattern) => pattern.test(lower));
  };
}

/** Page and method results by score (higher = better); on a tie, a title match first. Stable, in place. */
export function sortResults(
  results: SearchResult[],
  hasQueryInTitle: (title: string) => boolean
): SearchResult[] {
  const titleMatches = new Set(results.filter((r) => hasQueryInTitle(r.title)));
  return results.sort(
    (a, b) =>
      (b.score || 0) - (a.score || 0) || Number(titleMatches.has(b)) - Number(titleMatches.has(a))
  );
}

/** The first this many page and method results set the cap of weak orphan sections */
const ORPHAN_FLOOR_RESULTS = 10;

/** Sections of other pages in the results, at most */
const MAX_SECTION_RESULTS = 8;

/** Of the first this many other results, a weak match on the reader's page stays below title matches */
const TOP_TITLE_MATCHES = 3;

/** At most this many weak sections of the reader's page go above other results */
const MAX_PINNED_WEAK = 2;

/** A weak section of the reader's page goes above other results with a score at least this one's */
const PIN_AGAINST = 4;

function sectionResult(section: RankedSection): SearchResult {
  const { entry, score, current } = section;
  return {
    id: entry.id,
    title: entry.title,
    description: section.snippet,
    url: entry.url,
    type: 'guide',
    keywords: [],
    pageTitle: entry.pageTitle,
    score,
    ...(current ? { onCurrentPage: true } : {}),
  };
}

/**
 * Sections among the page and endpoint results (`pages`, sorted):
 *
 * - a strong section (`heading`, `breadcrumb`, `near`) goes right in front
 *   of its own page, with the page's score; other sections by score, below a
 *   page on a tie;
 * - at most eight sections of other pages, so pages and methods stay in the
 *   twenty results the dialog gets;
 * - the reader's page (`currentPath`): its strong sections (`heading`,
 *   `breadcrumb`, `near`) first of all. Of its `partial` and `body` sections
 *   at most two follow them, and only those scored at least as the fourth
 *   other result; even these stay below every result among the first three
 *   other results that is named after the query: the query in the title of
 *   a page or method, or a strong section of another page. The rest go
 *   among the other results by score. A mention in the text of this page is
 *   weaker ("токен" on the MCP connection page: its "Токен бота" and "Codex с
 *   токеном" first, then "Новый токен бота" and the other token methods,
 *   the page's mentions of tokens far below). With a section of the reader's
 *   page in the list the page itself goes: the reader is on it.
 */
export function mergeSections(
  pages: SearchResult[],
  ranked: RankedSection[],
  {
    currentPath,
    hasQueryInTitle,
  }: { currentPath?: string; hasQueryInTitle: (title: string) => boolean }
): SearchResult[] {
  const current = ranked.filter((s) => s.current);
  const anchored = new Map<string, SearchResult[]>();
  const floating: SearchResult[] = [];
  /** Strong sections of other pages (see `isStrongMatch`) */
  const strongElsewhere = new Set<SearchResult>();
  for (const section of ranked) {
    if (section.current) continue;
    const result = sectionResult(section);
    if (isStrongMatch(section.match)) strongElsewhere.add(result);
    if (section.anchored) {
      result.anchored = true;
      const list = anchored.get(section.entry.pageUrl) ?? [];
      list.push(result);
      anchored.set(section.entry.pageUrl, list);
    } else {
      floating.push(result);
    }
  }
  // Stable: on a tie, in the order rankSections gave.
  floating.sort((a, b) => (b.score || 0) - (a.score || 0));

  const shownPages = current.length > 0 ? pages.filter((page) => page.url !== currentPath) : pages;
  const merged: SearchResult[] = [];
  let next = 0;
  for (const page of shownPages) {
    while (next < floating.length && (floating[next].score || 0) > (page.score || 0)) {
      merged.push(floating[next++]);
    }
    if (page.type === 'guide') merged.push(...(anchored.get(page.url) ?? []));
    merged.push(page);
  }
  merged.push(...floating.slice(next));

  let sections = 0;
  const capped = merged.filter((r) => !r.pageTitle || ++sections <= MAX_SECTION_RESULTS);
  if (current.length === 0) return capped;

  const strong = current.filter((s) => isStrongMatch(s.match)).map(sectionResult);
  const weak = current.filter((s) => !isStrongMatch(s.match)).map(sectionResult);
  const bar = capped[PIN_AGAINST - 1]?.score ?? -Infinity;
  const pinned = weak.filter((r) => (r.score || 0) >= bar).slice(0, MAX_PINNED_WEAK);
  const rest = weak
    .filter((r) => !pinned.includes(r))
    .sort((a, b) => (b.score || 0) - (a.score || 0));

  let keep = 0;
  for (let i = 0; i < Math.min(TOP_TITLE_MATCHES, capped.length); i++) {
    if (strongElsewhere.has(capped[i]) || hasQueryInTitle(capped[i].title)) keep = i + 1;
  }
  // A section kept on top takes its page along: nothing between them.
  while (keep > 0 && keep < capped.length && capped[keep - 1].anchored) keep++;

  // The other weak sections among the results by score, below results of the
  // same score: never between a section and its page, which share a score.
  const below: SearchResult[] = [];
  let nextWeak = 0;
  for (const result of capped.slice(keep)) {
    while (nextWeak < rest.length && (rest[nextWeak].score || 0) > (result.score || 0)) {
      below.push(rest[nextWeak++]);
    }
    below.push(result);
  }
  below.push(...rest.slice(nextWeak));
  return [...strong, ...capped.slice(0, keep), ...pinned, ...below];
}

/**
 * The first `limit` results for the dialog. A page keeps one section right in
 * front of it: a second one of the same page would only take a place. A
 * section whose page falls off the list goes too: it is placed by its page's
 * score and leads to the page.
 */
export function limitResults(results: SearchResult[], limit: number): SearchResult[] {
  const out: SearchResult[] = [];
  const pages = new Set<string>();
  for (const result of results) {
    if (out.length >= limit) break;
    if (result.anchored) {
      const page = result.url.split('#')[0];
      // Its page follows it: the next place must be free for the page.
      if (pages.has(page) || out.length + 1 >= limit) continue;
      pages.add(page);
    }
    out.push(result);
  }
  return out;
}
