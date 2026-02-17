import { parseOpenAPI } from '@/lib/openapi/parser';
import { generateUrlFromOperation, generateTitle } from '@/lib/openapi/mapper';
import { NextResponse } from 'next/server';
import { getOrderedGuidePages, sortTagsByOrder } from '@/lib/guides-config';

export const dynamic = 'force-static';

export async function GET() {
  const api = await parseOpenAPI();

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

  let content = '# Пачка API Documentation\n\n';
  content +=
    '> REST API мессенджера Пачка для управления сообщениями, чатами, пользователями и задачами.\n\n';

  const siteUrl = 'https://dev.pachca.com';

  // Add guides section (dynamically collected from page.tsx files)
  const guidePages = getOrderedGuidePages();
  content += '## Руководства\n';
  for (const guide of guidePages) {
    const mdPath = guide.path === '/' ? '/.md' : `${guide.path}.md`;
    content += `- [${guide.title}](${siteUrl}${mdPath}): ${guide.description}\n`;
  }
  content += '\n';

  // Add endpoints by category
  for (const tag of sortedTags) {
    const endpoints = grouped.get(tag)!;
    const categoryTitle = tag;

    content += `## ${categoryTitle}\n`;

    for (const endpoint of endpoints) {
      const title = generateTitle(endpoint);
      const url = generateUrlFromOperation(endpoint);

      content += `- [${title}](${siteUrl}${url}.md): ${endpoint.method} ${endpoint.path}\n`;
    }

    content += '\n';
  }

  // Add optional section
  content += '## Дополнительно\n';
  content += `- [Agent Skill](${siteUrl}/skill.md): Описание API для AI-агентов (SKILL.md)\n`;
  content += '- [Веб-сайт](https://pachca.com/)\n';
  content += '- [Получить помощь](mailto:team@pachca.com)\n';
  content += '\n____\n';

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=0, must-revalidate, s-maxage=86400',
    },
  });
}
