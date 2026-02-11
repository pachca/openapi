import { parseOpenAPI } from '@/lib/openapi/parser';
import {
  generateEndpointMarkdown,
  generateStaticPageMarkdownAsync,
} from '@/lib/markdown-generator';
import { NextResponse } from 'next/server';
import { getOrderedGuidePages, sortTagsByOrder } from '@/lib/guides-config';

export const dynamic = 'force-static';

export async function GET() {
  const api = await parseOpenAPI();
  const baseUrl = api.servers[0]?.url;

  // Group endpoints by tag
  const grouped = new Map<string, typeof api.endpoints>();
  for (const endpoint of api.endpoints) {
    const tag = endpoint.tags[0] || 'Общее';
    if (!grouped.has(tag)) {
      grouped.set(tag, []);
    }
    grouped.get(tag)!.push(endpoint);
  }

  // Sort tags by predefined order
  const sortedTags = sortTagsByOrder(Array.from(grouped.keys()));

  let content = '# Пачка API - Полная документация\n\n';
  content +=
    '> REST API мессенджера Пачка для управления сообщениями, чатами, пользователями и задачами.\n\n';

  // Get guides dynamically from page.tsx files
  const guidePages = getOrderedGuidePages();

  // Table of contents
  content += '## Содержание\n\n';
  content += '### Руководства\n';
  for (const guide of guidePages) {
    const anchor = guide.title.toLowerCase().replace(/\s+/g, '-');
    content += `- [${guide.title}](#${anchor})\n`;
  }
  content += '\n';

  content += '### API Методы\n';
  for (const tag of sortedTags) {
    const categoryTitle = tag;
    content += `- [${categoryTitle}](#api-${categoryTitle.toLowerCase().replace(/\s+/g, '-')})\n`;
  }
  content += '\n---\n\n';

  // Guide pages content
  content += '# Руководства\n\n';

  for (const guide of guidePages) {
    const guideContent = await generateStaticPageMarkdownAsync(guide.path);
    if (guideContent) {
      content += guideContent;
      content += '\n---\n\n';
    }
  }

  // API Methods by category
  content += '# API Методы\n\n';

  for (const tag of sortedTags) {
    const endpoints = grouped.get(tag)!;
    const categoryTitle = tag;

    content += `## API: ${categoryTitle}\n\n`;

    for (const endpoint of endpoints) {
      // Use the shared markdown generator with baseUrl from OpenAPI
      const endpointMarkdown = generateEndpointMarkdown(endpoint, baseUrl);
      content += endpointMarkdown;
      content += '\n---\n\n';
    }
  }

  // Footer
  content += '## Дополнительная информация\n\n';
  content += '- **Веб-сайт**: https://pachca.com/\n';
  content += '- **Получить помощь**: team@pachca.com\n\n';
  content += '---\n\n';
  content += '_Документация автоматически сгенерирована из OpenAPI спецификации_\n';

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=0, must-revalidate, s-maxage=86400',
    },
  });
}
