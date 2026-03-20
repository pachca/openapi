/**
 * Expand MDX components to their markdown representation
 * Used when generating raw .md files from .mdx sources
 */

import {
  getSchemaByName,
  getEndpointByOperation,
  getBaseUrl,
  parseOpenAPI,
} from './openapi/parser';
import { generateCurl } from './code-generators/curl';
import { groupEndpointsByTag, generateUrlFromOperation, generateTitle } from './openapi/mapper';
import { schemaToMarkdown } from './markdown-generator';
import { getSdkExampleForLang } from './sdk-examples';
import type { Schema } from './openapi/types';
import { HTTP_CODES } from './schemas/guide-schemas';
import { getOrderedPages } from './ordered-pages';
import { generateNavigation } from './navigation';
import { sortTagsByOrder } from './guides-config';
import { WORKFLOWS } from '@pachca/spec/workflows';
import { SKILL_TAG_MAP } from '../scripts/skills/config';

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

function guideCardsToMarkdown(): string {
  const guides = getOrderedPages().filter(
    (g) => g.path !== '/' && !g.path.startsWith('/updates') && !g.path.startsWith('/api/')
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
  const methodsSection = sections.find((s) => s.title === 'Методы API');
  const apiGroups = methodsSection?.items ?? [];

  let md = '';
  for (const group of apiGroups) {
    const meta = API_SECTION_META[group.title];
    const firstHref = group.children?.[0]?.href || group.href;
    if (!firstHref) continue;

    md += `- [${group.title}](${firstHref})`;
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

  // Build tree with ├──/└──/│ connectors
  // Group entries by parent to determine last-child status
  const isLastAtDepth = (index: number, targetDepth: number): boolean => {
    for (let j = index + 1; j < entries.length; j++) {
      if (entries[j].depth === targetDepth) return false;
      if (entries[j].depth < targetDepth) break;
    }
    return true;
  };

  // Track which depths have continuing siblings (for │ vs space)
  const continuingDepths = new Set<number>();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const name = entry.isFolder ? `${entry.name}/` : entry.name;

    if (entry.depth === 0) {
      const connector = isLastAtDepth(i, 0) ? '└── ' : '├── ';
      if (isLastAtDepth(i, 0)) {
        continuingDepths.delete(0);
      } else {
        continuingDepths.add(0);
      }
      lines.push(`${connector}${name}`);
    } else {
      let prefix = '';
      for (let d = 0; d < entry.depth; d++) {
        prefix += continuingDepths.has(d) ? '│   ' : '    ';
      }
      const isLast = isLastAtDepth(i, entry.depth);
      const connector = isLast ? '└── ' : '├── ';
      if (isLast) {
        continuingDepths.delete(entry.depth);
      } else {
        continuingDepths.add(entry.depth);
      }
      lines.push(`${prefix}${connector}${name}`);
    }
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

  // <Steps><Step title="...">...</Step>...</Steps> -> numbered steps
  result = result.replace(/<Steps>([\s\S]*?)<\/Steps>/g, (_, inner) => {
    let stepNum = 0;
    return inner.replace(
      /<Step\s+title="([^"]*)">([\s\S]*?)<\/Step>/g,
      (_: string, title: string, content: string) => {
        stepNum++;
        return `### Шаг ${stepNum}. ${title}\n\n${content.trim()}\n\n`;
      }
    );
  });

  // <HttpCodes />
  result = result.replace(/<HttpCodes\s*\/>/g, httpCodesToMarkdown());

  // <ErrorSchema /> - load from OpenAPI
  if (result.includes('<ErrorSchema')) {
    let errorSchemaMarkdown = '';

    const apiError = await getSchemaByName('ApiError');
    if (apiError) {
      errorSchemaMarkdown += formatSchemaWithTitle(
        apiError,
        'ApiError (400, 402, 403, 404, 409, 410, 422)'
      );
      errorSchemaMarkdown += '\n';
    }

    const oauthError = await getSchemaByName('OAuthError');
    if (oauthError) {
      errorSchemaMarkdown += formatSchemaWithTitle(oauthError, 'OAuthError (401, 403)');
    }

    result = result.replace(/<ErrorSchema\s*\/>/g, errorSchemaMarkdown);
  }

  // <Warning>...</Warning> -> > **Внимание:** ...
  result = result.replace(/<Warning>([\s\S]*?)<\/Warning>/g, (_, inner) => {
    const text = inner.trim().replace(/<br\s*\/?>/g, '\n> ');
    return `> **Внимание:** ${text}\n`;
  });

  // <Danger>...</Danger> -> > **Важно:** ...
  result = result.replace(/<Danger>([\s\S]*?)<\/Danger>/g, (_, inner) => {
    const text = inner.trim().replace(/<br\s*\/?>/g, '\n> ');
    return `> **Важно:** ${text}\n`;
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

  // <HomeHero>...<HomeHeroContent>...<HomeHeroCode>...</HomeHero> -> markdown
  result = result.replace(/<HomeHero>\s*([\s\S]*?)\s*<\/HomeHero>/g, (_, inner) => {
    let md = '';

    // Extract HomeHeroContent props
    const contentMatch = inner.match(/<HomeHeroContent\s+([\s\S]*?)>([\s\S]*?)<\/HomeHeroContent>/);
    if (contentMatch) {
      const attrs = contentMatch[1];
      const children = contentMatch[2];
      const title = attrs.match(/title="([^"]+)"/)?.[1];
      const description = attrs.match(/description="([^"]+)"/)?.[1];

      if (title) md += `# ${title}\n\n`;
      if (description) md += `${description}\n\n`;

      // Extract compact Card links
      const compactCards: string[] = [];
      const compactCardRegex = /<Card\s+compact\s+([\s\S]*?)\/>/g;
      let cm;
      while ((cm = compactCardRegex.exec(children)) !== null) {
        const cAttrs = cm[1];
        const cTitle = cAttrs.match(/title="([^"]+)"/)?.[1] ?? '';
        const cHref = cAttrs.match(/href="([^"]+)"/)?.[1];
        compactCards.push(cHref ? `- [${cTitle}](${cHref})` : `- ${cTitle}`);
      }
      if (compactCards.length > 0) {
        md += compactCards.join('\n') + '\n\n';
      }
    }

    // Extract HomeHeroCode children (ApiCodeExample will be expanded later)
    const codeMatch = inner.match(/<HomeHeroCode>([\s\S]*?)<\/HomeHeroCode>/);
    if (codeMatch) {
      md += codeMatch[1].trim() + '\n\n';
    }

    return md;
  });

  // <CardRow>...</CardRow> -> expand inner content (wrapper for prose context)
  result = result.replace(/<CardRow>([\s\S]*?)<\/CardRow>/g, (_, inner) => inner.trim() + '\n');

  // Standalone <Card compact ... >children</Card> -> markdown link
  result = result.replace(
    /<Card\s+compact\s+([\s\S]*?)>([\s\S]*?)<\/Card>/g,
    (_, attrs, children) => {
      const title = attrs.match(/title="([^"]+)"/)?.[1] ?? '';
      const href = attrs.match(/href="([^"]+)"/)?.[1];
      const text = children.trim();
      const titlePart = href ? `[${title}](${href})` : `**${title}**`;
      return text ? `${titlePart} ${text}\n` : `${titlePart}\n`;
    }
  );

  // <CardGroup>...<Card>...</Card>...</CardGroup> -> markdown list (only cards with descriptions)
  result = result.replace(/<CardGroup[^>]*>([\s\S]*?)<\/CardGroup>/g, (_, inner) => {
    const items: string[] = [];
    // Match both <Card ...>...</Card> and self-closing <Card ... />
    const cardRegex = /<Card\s+([\s\S]*?)(?:>([\s\S]*?)<\/Card>|\/>)/g;
    let cardMatch;
    while ((cardMatch = cardRegex.exec(inner)) !== null) {
      const attrs = cardMatch[1];
      const content = (cardMatch[2] ?? '').trim();
      if (!content) continue; // Skip navigation-only cards without descriptions
      const title = attrs.match(/title="([^"]+)"/)?.[1] ?? '';
      const href = attrs.match(/href="([^"]+)"/)?.[1];
      const titlePart = href ? `[${title}](${href})` : `**${title}**`;
      items.push(`- ${titlePart} — ${content}`);
    }
    return items.length > 0 ? items.join('\n') + '\n' : '';
  });

  // <Image src="..." alt="..." /> -> ![alt](src)
  result = result.replace(/<Image\s+src="([^"]+)"\s+alt="([^"]*)"[^/]*\/>/g, '![$2]($1)');
  result = result.replace(/<Image\s+alt="([^"]*)"\s+src="([^"]+)"[^/]*\/>/g, '![$1]($2)');

  // <ImageCard src="..." alt="..." caption="..." hint="..." /> -> markdown with optional hint/caption
  result = result.replace(/<ImageCard\s+([\s\S]*?)\/>/g, (_, attrs) => {
    const src = attrs.match(/src="([^"]+)"/)?.[1] ?? '';
    const alt = attrs.match(/alt="([^"]*)"/)?.[1] ?? '';
    const caption = attrs.match(/caption="([^"]*)"/)?.[1];
    const hint = attrs.match(/hint="([^"]*)"/)?.[1];

    let md = '';
    if (hint) md += `*${hint}*\n\n`;
    md += `![${alt}](${src})\n`;
    if (caption) md += `\n*${caption}*\n`;
    return md;
  });

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
      // Strip JSX template literal wrapper {`...`}
      const cleanCode = code.trim().replace(/^\{\`([\s\S]*)\`\}$/, '$1');
      return `${header}\`\`\`${lang}\n${cleanCode}\n\`\`\`\n`;
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

  // <SdkCommands lang="python" /> -> markdown table of SDK methods
  if (result.includes('<SdkCommands')) {
    const sdkCmdRegex = /<SdkCommands\s+lang="([^"]+)"\s*\/>/g;
    const sdkCmdMatches = [...result.matchAll(sdkCmdRegex)];

    for (const match of sdkCmdMatches) {
      const [fullMatch, lang] = match;
      const api = await parseOpenAPI();
      const grouped = groupEndpointsByTag(api.endpoints);
      const sortedTags = sortTagsByOrder(Array.from(grouped.keys()));

      const METHOD_ORDER: Record<string, number> = {
        POST: 0,
        GET: 1,
        PUT: 2,
        PATCH: 3,
        DELETE: 4,
      };

      const tagToProperty = (tag: string): string => {
        const words = tag.split(/\s+/);
        return words
          .map((w, i) =>
            i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
          )
          .join('');
      };

      const operationToMethod = (opId: string): string => {
        const parts = opId.split('_');
        return parts.length > 1 ? parts.slice(1).join('_') : parts[0];
      };

      const camelToSnake = (str: string): string =>
        str
          .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
          .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
          .toLowerCase();

      const formatCall = (tag: string, opId: string): string => {
        const service = tagToProperty(tag);
        const method = operationToMethod(opId);
        switch (lang) {
          case 'python':
            return `client.${camelToSnake(service)}.${camelToSnake(method)}()`;
          case 'go':
            return `client.${service.charAt(0).toUpperCase() + service.slice(1)}.${method.charAt(0).toUpperCase() + method.slice(1)}()`;
          default:
            return `client.${service}.${method}()`;
        }
      };

      let md = '| Метод | Метод API |\n';
      md += '|-------|----------|\n';
      for (const tag of sortedTags) {
        const endpoints = grouped.get(tag)!;
        endpoints.sort((a, b) => (METHOD_ORDER[a.method] ?? 99) - (METHOD_ORDER[b.method] ?? 99));
        for (const ep of endpoints) {
          const call = formatCall(tag, ep.id);
          const href = generateUrlFromOperation(ep);
          const epTitle = generateTitle(ep);
          md += `| \`${call}\` | [${epTitle}](${href}) |\n`;
        }
      }
      md += '\n';
      result = result.replace(fullMatch, md);
    }
  }

  // <ApiCodeExample operationId="..." title="..." params={{ ... }} />
  // <ApiCodeExample lang="python" operations={[...]} showInit={false} />
  if (result.includes('<ApiCodeExample')) {
    const apiCodeRegex = /<ApiCodeExample\s+([\s\S]*?)\/>/g;
    const apiCodeMatches = [...result.matchAll(apiCodeRegex)];

    const SDK_LANGS = ['typescript', 'python', 'go', 'kotlin', 'swift'];

    for (const match of apiCodeMatches) {
      const [fullMatch, attrs] = match;
      const lang = attrs.match(/lang="([^"]+)"/)?.[1];
      const operationId = attrs.match(/operationId="([^"]+)"/)?.[1];
      const title = attrs.match(/title="([^"]+)"/)?.[1];
      const paramsMatch = attrs.match(/params=\{\{([^}]*)\}\}/);

      // SDK language mode: generate from examples.json
      if (lang && SDK_LANGS.includes(lang)) {
        const ops: Array<{ id: string; comment?: string }> = [];
        const opRegex = /id:\s*"([^"]+)"(?:,\s*comment:\s*"([^"]*)")?/g;
        let opMatch;
        while ((opMatch = opRegex.exec(attrs)) !== null) {
          ops.push({ id: opMatch[1], comment: opMatch[2] });
        }
        if (operationId) ops.push({ id: operationId });

        const showInit = !attrs.includes('showInit={false}');
        const code = getSdkExampleForLang(lang, ops, showInit);

        if (code) {
          let md = '';
          if (title) md += `**${title}**\n\n`;
          md += `\`\`\`${lang}\n${code}\n\`\`\`\n`;
          result = result.replace(fullMatch, md);
        } else {
          result = result.replace(fullMatch, '');
        }
        continue;
      }

      // curl/cli mode: generate from endpoint
      if (!operationId) {
        result = result.replace(fullMatch, '*Endpoint not found*\n');
        continue;
      }

      const endpoint = await getEndpointByOperation(operationId);
      if (!endpoint) {
        result = result.replace(fullMatch, `*Endpoint not found: ${operationId}*\n`);
        continue;
      }

      // Parse and apply param overrides
      let finalEndpoint = endpoint;
      if (paramsMatch) {
        const paramsStr = paramsMatch[1];
        const paramOverrides: Record<string, unknown> = {};
        for (const pair of paramsStr.matchAll(/(\w+):\s*(?:"([^"]*)"|([\d.]+))/g)) {
          paramOverrides[pair[1]] = pair[2] !== undefined ? pair[2] : Number(pair[3]);
        }
        const paramNames = Object.keys(paramOverrides);
        finalEndpoint = {
          ...endpoint,
          parameters: endpoint.parameters
            .filter((p) => p.in !== 'query' || p.required || paramNames.includes(p.name))
            .map((p) =>
              paramNames.includes(p.name) ? { ...p, example: paramOverrides[p.name] } : p
            ),
        };
      }

      const baseUrl = await getBaseUrl();
      let md = '';
      if (title) md += `**${title}**\n\n`;

      // If lang is specified (curl/cli), use that; otherwise default to curl
      if (lang === 'cli') {
        const { generateCLI } = await import('./code-generators/cli');
        md += '```bash\n' + generateCLI(finalEndpoint) + '\n```\n';
      } else {
        md += '```bash\n' + generateCurl(finalEndpoint, baseUrl) + '\n```\n';
      }

      result = result.replace(fullMatch, md);
    }
  }

  // <AgentSkillsWorkflows /> -> markdown list of skills and workflows
  if (result.includes('<AgentSkillsWorkflows')) {
    let md = '';
    for (const skill of SKILL_TAG_MAP) {
      const workflows = WORKFLOWS[skill.name] ?? [];
      if (!workflows.length) continue;
      md += `### ${skill.name}\n\n`;
      for (const wf of workflows) {
        md += `**${wf.title}**\n\n`;
        wf.steps.forEach((step, i) => {
          const text = typeof step === 'string' ? step : step.description;
          md += `${i + 1}. ${text}\n`;
        });
        if (wf.notes) md += `\n> ${wf.notes}\n`;
        md += '\n';
      }
    }
    result = result.replace(/<AgentSkillsWorkflows\s*\/>/g, md);
  }

  // <NpmBadge package="..." version="..." date="..." /> -> markdown link
  result = result.replace(/<NpmBadge\s+([\s\S]*?)\/>/g, (_, attrs) => {
    const pkg = attrs.match(/package="([^"]+)"/)?.[1] ?? '';
    const version = attrs.match(/version="([^"]+)"/)?.[1];
    const date = attrs.match(/date="([^"]+)"/)?.[1];
    let text = `[${pkg}](https://www.npmjs.com/package/${pkg})`;
    if (version) text += ` ${version}`;
    if (date) text += ` · ${date}`;
    return text + '\n';
  });

  // <CliCommands /> -> markdown table of CLI commands
  if (result.includes('<CliCommands')) {
    const sections = await generateNavigation();
    const methodsSec = sections.find((s) => s.title === 'Методы API');
    const allCommands = methodsSec ? methodsSec.items.flatMap((group) => group.children ?? []) : [];

    let md = '| Команда | Описание |\n';
    md += '|---------|----------|\n';
    for (const item of allCommands) {
      const command = `pachca ${item.href.replace(/^\/api\//, '').replace(/\//g, ' ')}`;
      md += `| \`${command}\` | ${item.title} |\n`;
    }
    md += '\n';

    result = result.replace(/<CliCommands\s*\/>/g, md);
  }

  // <ScopeRoles /> -> OAuth scopes table with roles
  if (result.includes('<ScopeRoles')) {
    const oauthScope = await getSchemaByName('OAuthScope');
    if (oauthScope) {
      const enumValues = (oauthScope.enum as string[]) || [];
      const descriptions = (oauthScope['x-enum-descriptions'] as Record<string, string>) || {};
      const scopeRoles = (oauthScope['x-scope-roles'] as Record<string, string[]>) || {};

      const ROLE_LABELS: Record<string, string> = {
        owner: 'Владелец',
        admin: 'Администратор',
        user: 'Сотрудник',
        bot: 'Бот',
      };
      const ALL_ROLES = ['owner', 'admin', 'user', 'bot'];

      let md = '| Скоуп | Описание | Роли |\n';
      md += '|-------|----------|------|\n';
      for (const scope of enumValues) {
        const desc = descriptions[scope] || '';
        const roles = scopeRoles[scope] || [];
        const rolesStr =
          roles.length === ALL_ROLES.length
            ? 'Все'
            : roles.map((r) => ROLE_LABELS[r] || r).join(', ');
        md += `| \`${scope}\` | ${desc} | ${rolesStr} |\n`;
      }
      md += '\n';
      result = result.replace(/<ScopeRoles\s*\/>/g, md);
    }
  }

  // <ModelSchema name="..." /> -> load and expand schema from OpenAPI
  if (result.includes('<ModelSchema')) {
    const modelSchemaRegex = /<ModelSchema\s+name="([^"]+)"[^/]*\/>/g;
    const modelSchemaMatches = [...result.matchAll(modelSchemaRegex)];

    for (const match of modelSchemaMatches) {
      const [fullMatch, schemaName] = match;
      const schema = await getSchemaByName(schemaName);

      if (schema) {
        let md = '';
        if (schema.description) {
          md += schema.description + '\n\n';
        }
        md += schemaToMarkdown(schema, 0, schema.required || [], true);
        result = result.replace(fullMatch, md);
      } else {
        result = result.replace(fullMatch, `*Схема ${schemaName} не найдена.*\n`);
      }
    }
  }

  // Clean up multiple newlines
  result = result.replace(/\n{4,}/g, '\n\n\n');

  return result;
}
