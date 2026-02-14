/**
 * Expand MDX components to their markdown representation
 * Used when generating raw .md files from .mdx sources
 */

import { getSchemaByName } from './openapi/parser';
import { schemaToMarkdown } from './markdown-generator';
import type { Schema } from './openapi/types';
import { HTTP_CODES } from './schemas/guide-schemas';
import { getOrderedGuidePages } from './guides-config';
import { generateNavigation } from './navigation';

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

function guideCardsToMarkdown(): string {
  const guides = getOrderedGuidePages().filter(
    (g) => g.path !== '/' && g.path !== '/guides/updates'
  );

  let md = '';
  for (const guide of guides) {
    md += `- [${guide.title}](${guide.path})`;
    if (guide.description) {
      md += ` — ${guide.description}`;
    }
    md += '\n';
  }
  md += '\n';

  return md;
}

async function apiCardsToMarkdown(): Promise<string> {
  const API_SECTION_META: Record<string, { icon: string; description: string }> = {
    'Общие методы': { icon: 'Zap', description: 'Экспорт и загрузка файлов' },
    'Профиль и статус': { icon: 'User', description: 'Информация о текущем пользователе' },
    Сотрудники: { icon: 'Users', description: 'Управление участниками пространства' },
    Теги: { icon: 'Tag', description: 'Группировка сотрудников по тегам' },
    Чаты: { icon: 'MessagesSquare', description: 'Создание и управление чатами' },
    'Участники чатов': { icon: 'UserPlus', description: 'Добавление и удаление участников' },
    Треды: { icon: 'MessageSquareMore', description: 'Обсуждения внутри сообщений' },
    Сообщения: { icon: 'MessageSquare', description: 'Отправка, редактирование, удаление' },
    'Прочтение сообщения': { icon: 'CheckCheck', description: 'Информация о прочтении' },
    'Реакции на сообщения': { icon: 'SmilePlus', description: 'Реакции на сообщения' },
    Ссылки: { icon: 'LinkIcon', description: 'Разворачивание ссылок (unfurl)' },
    Напоминания: { icon: 'Bell', description: 'Создание и управление напоминаниями' },
    Формы: { icon: 'SquareMousePointer', description: 'Модальные окна с полями ввода' },
    'Боты и Webhook': { icon: 'Bot', description: 'Информация о ботах и вебхуках' },
    Безопасность: { icon: 'Shield', description: 'Аудит и настройки безопасности' },
  };

  const sections = await generateNavigation();
  const apiSections = sections.filter((s) => s.items[0]?.method != null);

  let md = '';
  for (const section of apiSections) {
    const meta = API_SECTION_META[section.title];
    const firstHref = section.items[0]?.href;
    if (!firstHref) continue;

    md += `- [${section.title}](${firstHref})`;
    if (meta?.description) {
      md += ` — ${meta.description}`;
    }
    md += '\n';
  }
  md += '\n';

  return md;
}

function treeToMarkdown(jsx: string): string {
  const lines: string[] = [];

  // Parse JSX tree into flat list of entries with depth
  const entries: { depth: number; name: string; isFolder: boolean }[] = [];
  let depth = 0;

  // Process sequentially through the string
  const tokens: { index: number; type: 'open' | 'file' | 'close'; name: string }[] = [];

  // Collect TreeFolder opens
  for (const m of jsx.matchAll(/<TreeFolder\s+name="([^"]*)"[^>]*>/g)) {
    tokens.push({ index: m.index!, type: 'open', name: m[1] });
  }
  // Collect TreeFile
  for (const m of jsx.matchAll(/<TreeFile\s+name="([^"]*)"[^/]*\/>/g)) {
    tokens.push({ index: m.index!, type: 'file', name: m[1] });
  }
  // Collect TreeFolder closes
  for (const m of jsx.matchAll(/<\/TreeFolder>/g)) {
    tokens.push({ index: m.index!, type: 'close', name: '' });
  }

  // Sort by position in string
  tokens.sort((a, b) => a.index - b.index);

  for (const token of tokens) {
    if (token.type === 'open') {
      entries.push({ depth, name: token.name, isFolder: true });
      depth++;
    } else if (token.type === 'file') {
      entries.push({ depth, name: token.name, isFolder: false });
    } else if (token.type === 'close') {
      depth--;
    }
  }

  // Render as text tree
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const prefix = entry.depth > 0 ? '  '.repeat(entry.depth) : '';
    const icon = entry.isFolder ? '📁 ' : '📄 ';
    lines.push(`${prefix}${icon}${entry.name}${entry.isFolder ? '/' : ''}`);
  }

  return '```\n' + lines.join('\n') + '\n```\n';
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

  // <Mermaid title="..." chart={`...`} /> -> ```mermaid ... ```
  result = result.replace(
    /<Mermaid\s+(?:title="([^"]*?)"\s+)?chart=\{`([\s\S]*?)`\}\s*\/>/g,
    (_, title, chart) => {
      const header = title ? `**${title}**\n\n` : '';
      return `${header}\`\`\`mermaid\n${chart.trim()}\n\`\`\`\n`;
    }
  );

  // <Tree>...</Tree> -> text tree
  result = result.replace(/<Tree>([\s\S]*?)<\/Tree>/g, (_, inner) => {
    return treeToMarkdown(inner.trim()) + '\n';
  });

  // <GuideCards />
  if (result.includes('<GuideCards')) {
    result = result.replace(/<GuideCards\s*\/>/g, guideCardsToMarkdown());
  }

  // <ApiCards />
  if (result.includes('<ApiCards')) {
    const apiCardsMarkdown = await apiCardsToMarkdown();
    result = result.replace(/<ApiCards\s*\/>/g, apiCardsMarkdown);
  }

  // Clean up multiple newlines
  result = result.replace(/\n{4,}/g, '\n\n\n');

  return result;
}
