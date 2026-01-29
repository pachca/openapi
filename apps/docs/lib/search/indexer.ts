import { parseOpenAPI } from '../openapi/parser';
import {
  generateUrlFromOperation,
  generateTitle,
  getDescriptionWithoutTitle,
} from '../openapi/mapper';
import type { Schema, Endpoint } from '../openapi/types';
import { loadUpdates } from '../updates-parser';
import { GUIDE_SCHEMAS } from '../schemas/guide-schemas';
import * as fs from 'fs';
import * as path from 'path';
import FlexSearch from 'flexsearch';
import matter from 'gray-matter';

// FlexSearch document index for fast full-text search
let flexIndex: FlexSearch.Document<SearchIndex, string[]> | null = null;

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
}

let searchIndex: SearchIndex[] = [];

/**
 * Clear the search index cache (useful for development)
 */
export function clearSearchCache() {
  searchIndex = [];
  flexIndex = null;
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

      // Store with full path - prefer shorter paths for the same field name
      const existing = fields.get(propName);
      if (!existing || fieldPath.length < existing.path.length) {
        fields.set(propName, { description: desc, path: fieldPath });
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

  // Extract from request body
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

  // Extract from responses
  for (const response of Object.values(endpoint.responses)) {
    if (response.content) {
      for (const mediaType of Object.values(response.content)) {
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
function extractGuideMetadata(content: string, id: string, url: string): GuideMetadata {
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

      // Skip tag lines (e.g., #corporation_price_only #owner_access_token_required)
      if (trimmedLine.match(/^#\w+(\s+#\w+)*$/)) {
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

  // Add home page
  const homeContent = readContentFile(path.join(contentDir, 'home'));
  if (homeContent) {
    guides.push(extractGuideMetadata(homeContent, 'home', '/'));
  }

  // Scan guides directory
  try {
    if (fs.existsSync(guidesDir)) {
      const files = fs.readdirSync(guidesDir);

      for (const file of files) {
        if (file.endsWith('.mdx') || file.endsWith('.md')) {
          const id = file.replace(/\.(mdx?|md)$/, '');
          const filePath = path.join(guidesDir, file);

          // Special handling for updates page - use parsed updates content
          if (id === 'updates') {
            const updatesContent = buildUpdatesContent();
            guides.push(extractGuideMetadata(updatesContent, id, `/guides/${id}`));
          } else {
            const content = readContentFile(filePath);
            if (content) {
              guides.push(extractGuideMetadata(content, id, `/guides/${id}`));
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error scanning guides directory:', error);
  }

  return guides;
}

/**
 * Remove markdown formatting from text for cleaner search results
 */
function stripMarkdown(text: string): string {
  if (!text) return '';

  return (
    text
      // Remove bold (**text** or __text__)
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      // Remove italic (*text* or _text_)
      // Note: Only remove underscores used for markdown, not within words like access_token
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/(?<!\w)_([^_]+)_(?!\w)/g, '$1')
      // Remove inline code (`code`)
      .replace(/`([^`]+)`/g, '$1')
      // Remove links [text](url)
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove blockquotes (> text)
      .replace(/^>\s+/gm, '')
      // Remove headings (# text)
      .replace(/^#+\s+/gm, '')
      // Remove horizontal rules
      .replace(/^[-*_]{3,}\s*$/gm, '')
      // Remove strikethrough (~~text~~)
      .replace(/~~([^~]+)~~/g, '$1')
      // Clean up extra whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
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
    const guideSchemaEntry = GUIDE_SCHEMAS[schemaName];
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
          // Store path with schema name prefix for unique identification
          // Format: "SchemaName___fieldPath" (___ is separator, to avoid conflict with -- used for enums)
          const pathWithSchema = `${schemaName}___${info.path}`;
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

export async function buildSearchIndex(): Promise<SearchIndex[]> {
  if (searchIndex.length > 0 && flexIndex) {
    return searchIndex;
  }

  const api = await parseOpenAPI();
  const index: SearchIndex[] = [];

  // Initialize FlexSearch index
  flexIndex = createFlexSearchIndex();

  // Dynamically load all guide pages from content directory
  const guides = loadAllGuides();

  for (const guide of guides) {
    // Extract schema fields from referenced schemas
    const schemaData = extractGuideSchemaFields(guide.schemaNames, api.schemas);

    // Merge schema keywords with existing keywords
    const allKeywords = [...guide.keywords, ...schemaData.keywords];

    const guideDoc: SearchIndex = {
      id: guide.id,
      title: guide.title,
      description: guide.description,
      url: guide.url,
      type: 'guide' as const,
      keywords: [...new Set(allKeywords)],
      codeValues: guide.codeValues,
      schemaFields: schemaData.fields.length > 0 ? schemaData.fields : undefined,
    };

    index.push(guideDoc);

    // Add to FlexSearch index with keywords as space-separated string for better matching
    flexIndex!.add({
      ...guideDoc,
      keywords: allKeywords.join(' '),
    } as unknown as SearchIndex);
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

    const endpointDoc: SearchIndex = {
      id: endpoint.id,
      title,
      description: description,
      url,
      type: 'api',
      category: tag,
      keywords: [...new Set(keywords)], // Remove duplicates
      schemaFields: schemaResult.fields, // Store fields with descriptions for highlighting
    };

    index.push(endpointDoc);

    // Add to FlexSearch index with keywords as space-separated string for better matching
    flexIndex!.add({
      ...endpointDoc,
      keywords: keywords.join(' '),
    } as unknown as SearchIndex);
  }

  searchIndex = index;
  return index;
}

export interface SearchResult extends SearchIndex {
  /** Matched value with optional description (from schema field or MDX code) */
  matchedValue?: CodeValueWithDescription;
  /** FlexSearch relevance score (higher = better match) */
  score?: number;
}

interface MatchedValueResult {
  value: CodeValueWithDescription;
  /** True if matched from schemaFields (API parameters), false if from codeValues (text mentions) */
  isSchemaField: boolean;
}

/**
 * Find matching schema field or code value for highlighting in search results
 */
function findMatchedValue(
  item: SearchIndex,
  lowerQuery: string,
  queryWords: string[]
): MatchedValueResult | undefined {
  // Check for schema field match (for both API endpoints and guides)
  // This is a real API parameter - highest priority
  const matchedField = item.schemaFields?.find((f) => {
    const lowerValue = f.value.toLowerCase();
    const lowerDesc = f.description?.toLowerCase() || '';
    return (
      lowerValue.includes(lowerQuery) ||
      lowerDesc.includes(lowerQuery) ||
      queryWords.some((word) => lowerValue.includes(word)) ||
      (queryWords.length > 1 && queryWords.every((word) => lowerDesc.includes(word)))
    );
  });

  if (matchedField) return { value: matchedField, isSchemaField: true };

  // Check for code value match (for guides)
  // This is just a mention in text - lower priority
  const matchedCodeValue = item.codeValues?.find((v) => {
    const lowerValue = v.value.toLowerCase();
    const lowerDesc = v.description?.toLowerCase() || '';
    return (
      lowerValue.includes(lowerQuery) ||
      lowerDesc.includes(lowerQuery) ||
      queryWords.some((word) => lowerValue.includes(word)) ||
      (queryWords.length > 1 && queryWords.every((word) => lowerDesc.includes(word)))
    );
  });

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

export async function search(query: string): Promise<SearchResult[]> {
  const index = await buildSearchIndex();
  const lowerQuery = query.toLowerCase().trim();

  if (!lowerQuery || !flexIndex) {
    return [];
  }

  // Split query into words for multi-word search
  const queryWords = lowerQuery.split(/\s+/).filter((w) => w.length > 1);

  // Detect if this is a code-like query (variable name, field name, etc.)
  const isCodeQuery = isCodeLikeQuery(query);

  // Use FlexSearch for fast full-text search across all indexed fields
  // Search in title, description, and keywords with different weights
  const searchResults = flexIndex.search(lowerQuery, {
    limit: 50, // Get more results than needed for better ranking
    suggest: !isCodeQuery, // Disable suggestions for code queries (need exact matches)
  });

  // Collect unique document IDs from all field results
  const matchedIds = new Set<string>();
  const idToFieldMatches = new Map<string, string[]>(); // Track which fields matched

  for (const fieldResult of searchResults) {
    const field = fieldResult.field as string;
    for (const id of fieldResult.result) {
      const docId = String(id);
      matchedIds.add(docId);

      // Track field matches for scoring
      if (!idToFieldMatches.has(docId)) {
        idToFieldMatches.set(docId, []);
      }
      idToFieldMatches.get(docId)!.push(field);
    }
  }

  // Build index map for fast lookup
  const indexMap = new Map(index.map((item) => [item.id, item]));

  // Build results with matched values for highlighting
  const results: SearchResult[] = [];

  for (const id of matchedIds) {
    const item = indexMap.get(id);
    if (!item) continue;

    const matchResult = findMatchedValue(item, lowerQuery, queryWords);
    const fieldMatches = idToFieldMatches.get(id) || [];

    // For code-like queries, only include results that actually contain the query
    if (isCodeQuery) {
      const hasExactMatch = matchResult || itemContainsExactQuery(item, lowerQuery);
      if (!hasExactMatch) continue; // Skip results without exact match
    }

    // Calculate score based on match quality (not type)
    let score = 0;

    // Exact title match is strongest signal
    if (item.title.toLowerCase().includes(lowerQuery)) score += 10;

    // Matched in schema fields (actual API parameter) - highest priority
    if (matchResult?.isSchemaField) score += 12;
    // Matched in code values (just mentioned in text) - lower priority
    else if (matchResult) score += 4;

    // Field match priority
    if (fieldMatches.includes('title')) score += 5;
    if (fieldMatches.includes('description')) score += 3;
    if (fieldMatches.includes('keywords')) score += 1;

    // Small bonus for guides (but not dominant)
    if (item.type === 'guide') score += 2;

    results.push({
      ...item,
      matchedValue: matchResult?.value,
      score,
    });
  }

  // Sort by score (higher = better)
  return results.sort((a, b) => (b.score || 0) - (a.score || 0));
}
