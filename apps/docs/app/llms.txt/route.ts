import { parseOpenAPI } from '@/lib/openapi/parser';
import { generateUrlFromOperation, generateTitle } from '@/lib/openapi/mapper';
import { NextResponse } from 'next/server';
import { getOrderedGuidePages, sortTagsByOrder } from '@/lib/guides-config';

// Generate dynamically on each request to show current date
export const dynamic = 'force-dynamic';

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

  // Generate markdown content
  const now = new Date();
  const localDateTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  let content = '# Пачка API Documentation\n\n';
  content += `> Сгенерировано: ${localDateTime}\n\n`;

  // Add guides section (dynamically collected from page.tsx files)
  const guidePages = getOrderedGuidePages();
  content += '## Руководства\n';
  for (const guide of guidePages) {
    content += `- [${guide.title}](${guide.path}): ${guide.description}\n`;
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

      content += `- [${title}](${url}): ${endpoint.method} ${endpoint.path}\n`;
    }

    content += '\n';
  }

  // Add optional section
  content += '## Дополнительно\n';
  content += '- [Веб-сайт](https://pachca.com/)\n';
  content += '- [Получить помощь](mailto:team@pachca.com)\n';
  content += '\n____\n';

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
