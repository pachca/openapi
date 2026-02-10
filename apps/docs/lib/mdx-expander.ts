/**
 * Expand MDX components to their markdown representation
 * Used when generating raw .md files from .mdx sources
 */

import { getSchemaByName } from './openapi/parser';
import { schemaToMarkdown } from './markdown-generator';
import type { Schema } from './openapi/types';
import { HTTP_CODES } from './schemas/guide-schemas';

// ============================================
// Helper functions
// ============================================

/**
 * Format a schema to markdown with title
 * Uses schemaToMarkdown from markdown-generator for consistency
 */
function formatSchemaWithTitle(schema: Schema, title?: string): string {
  let md = '';

  const schemaTitle = title || schema.title;
  if (schemaTitle) {
    md += `### ${schemaTitle}\n\n`;
  }

  md += schemaToMarkdown(schema, 0, schema.required || []);
  return md;
}

function httpCodesToMarkdown(): string {
  let md = '### Коды ответов HTTP\n\n';
  md += '| Код | Сообщение | Описание |\n';
  md += '|-----|-----------|----------|\n';

  for (const item of HTTP_CODES) {
    md += `| ${item.code} | ${item.message} | ${item.description} |\n`;
  }
  md += '\n';

  return md;
}

function markdownSyntaxTableToMarkdown(): string {
  let md = '| Элемент | Синтаксис | Результат |\n';
  md += '|---------|-----------|----------|\n';
  md += '| Жирный | `**текст**` или `__текст__` | **текст** |\n';
  md += '| Курсив | `*текст*` или `_текст_` | *текст* |\n';
  md += '| Ссылки | `[текст](url)` | [текст](url) |\n';
  md += '| Маркированный список | `- пункт` | • пункт |\n';
  md += '| Нумерованный список | `1. пункт` | 1. пункт |\n';
  md += '| Зачеркнутый | `~~текст~~` | ~~текст~~ |\n';
  md += '| Строчный код | `` `код` `` | `код` |\n';
  md += '| Блок кода | ` ```код``` ` | код |\n';
  md += '\n';

  return md;
}

// ============================================
// Main expander function (async)
// ============================================

/**
 * Expand MDX components in content to their markdown representation
 * This is used when generating raw .md files from .mdx sources
 */
export async function expandMdxComponents(content: string): Promise<string> {
  let result = content;

  // <HttpCodes />
  result = result.replace(/<HttpCodes\s*\/>/g, httpCodesToMarkdown());

  // <ErrorSchema /> - load from OpenAPI
  if (result.includes('<ErrorSchema')) {
    let errorSchemaMarkdown = '';

    const apiError = await getSchemaByName('ApiError');
    if (apiError) {
      errorSchemaMarkdown += formatSchemaWithTitle(
        apiError,
        'ApiError (400, 403, 404, 409, 410, 422)'
      );
      errorSchemaMarkdown += '\n';
    }

    const oauthError = await getSchemaByName('OAuthError');
    if (oauthError) {
      errorSchemaMarkdown += formatSchemaWithTitle(oauthError, 'OAuthError (401, 403)');
    }

    result = result.replace(/<ErrorSchema\s*\/>/g, errorSchemaMarkdown);
  }

  // <MarkdownSyntaxTable />
  result = result.replace(/<MarkdownSyntaxTable\s*\/>/g, markdownSyntaxTableToMarkdown());

  // <Warning>...</Warning> -> > **Внимание:** ...
  result = result.replace(/<Warning>([\s\S]*?)<\/Warning>/g, (_, inner) => {
    const text = inner.trim().replace(/<br\s*\/?>/g, '\n> ');
    return `> **Внимание:** ${text}\n`;
  });

  // <Info>...</Info> -> > ...
  result = result.replace(/<Info>([\s\S]*?)<\/Info>/g, (_, inner) => {
    const text = inner.trim().replace(/<br\s*\/?>/g, '\n> ');
    return `> ${text}\n`;
  });

  // <Callout type="warning">...</Callout>
  result = result.replace(/<Callout\s+type="warning">([\s\S]*?)<\/Callout>/g, (_, inner) => {
    const text = inner.trim().replace(/<br\s*\/?>/g, '\n> ');
    return `> **Внимание:** ${text}\n`;
  });

  // <Callout type="info">...</Callout> or <Callout>...</Callout>
  result = result.replace(/<Callout(?:\s+type="info")?>([\s\S]*?)<\/Callout>/g, (_, inner) => {
    const text = inner.trim().replace(/<br\s*\/?>/g, '\n> ');
    return `> ${text}\n`;
  });

  // <Image src="..." alt="..." /> -> ![alt](src)
  result = result.replace(/<Image\s+src="([^"]+)"\s+alt="([^"]*)"[^/]*\/>/g, '![$2]($1)');
  result = result.replace(/<Image\s+alt="([^"]*)"\s+src="([^"]+)"[^/]*\/>/g, '![$1]($2)');

  // <Limit ... /> -> just remove (limit info is contextual)
  result = result.replace(/<Limit\s+[^/]*\/>/g, '');

  // <Updates /> -> generate full updates markdown from MDX file
  if (result.includes('<Updates')) {
    const { loadUpdates } = await import('./updates-parser');
    const updates = loadUpdates();

    let updatesMarkdown = '';
    for (const update of updates) {
      updatesMarkdown += `## ${update.displayDate} — ${update.title}\n\n`;
      updatesMarkdown += update.content + '\n\n';
    }

    result = result.replace(/<Updates\s*\/>/g, updatesMarkdown);
  }

  // <SchemaBlock name="..." /> -> load and expand schema from OpenAPI
  const schemaBlockRegex = /<SchemaBlock\s+name="([^"]+)"(?:\s+title="([^"]*)")?[^/]*\/>/g;
  const schemaMatches = [...result.matchAll(schemaBlockRegex)];

  for (const match of schemaMatches) {
    const [fullMatch, schemaName, customTitle] = match;
    const schema = await getSchemaByName(schemaName);

    if (schema) {
      const title = customTitle || schema.title || schemaName;
      let schemaMarkdown = `#### ${title}\n\n`;
      schemaMarkdown += schemaToMarkdown(schema, 0, schema.required || []);
      result = result.replace(fullMatch, schemaMarkdown);
    } else {
      result = result.replace(fullMatch, `*Схема ${schemaName} не найдена.*\n`);
    }
  }

  // <CodeBlock language="..." title="...">...</CodeBlock> -> ```language ... ```
  result = result.replace(
    /<CodeBlock\s+language="([^"]*)"(?:\s+title="([^"]*)")?>([\s\S]*?)<\/CodeBlock>/g,
    (_, lang, title, code) => {
      const header = title ? `**${title}**\n\n` : '';
      return `${header}\`\`\`${lang}\n${code.trim()}\n\`\`\`\n`;
    }
  );

  // Clean up multiple newlines
  result = result.replace(/\n{4,}/g, '\n\n\n');

  return result;
}
