import { parseOpenAPI } from './openapi/parser';
import { generateUrlFromOperation, generateTitle, groupEndpointsByTag } from './openapi/mapper';
import type { NavigationSection } from './openapi/types';
import { getOrderedGuidePages, sortTagsByOrder } from './guides-config';
import { loadUpdates, isNewUpdate } from './updates-parser';

const METHOD_ORDER: Record<string, number> = { POST: 0, GET: 1, PUT: 2, PATCH: 3, DELETE: 4 };

const TAG_TRANSLATIONS: Record<string, string> = {
  Common: 'Общие методы',
  Profile: 'Профиль и статус',
  Users: 'Сотрудники',
  'Group tags': 'Теги',
  Chats: 'Чаты',
  Members: 'Участники чатов',
  Thread: 'Треды',
  Messages: 'Сообщения',
  'Read member': 'Прочтение сообщения',
  Reactions: 'Реакции на сообщения',
  'Link Previews': 'Ссылки',
  Tasks: 'Напоминания',
  Views: 'Формы',
  Bots: 'Боты и Webhook',
  Security: 'Безопасность',
  Search: 'Поиск',
};

export async function generateNavigation(): Promise<NavigationSection[]> {
  const api = await parseOpenAPI();

  const sections: NavigationSection[] = [];

  // Check if there are new updates (within last 7 days)
  const updates = loadUpdates();
  const hasNewUpdates = updates.some((update) => isNewUpdate(update.date));

  // Add "Getting Started" section (dynamically collected from page.tsx files)
  const guidePages = getOrderedGuidePages();
  sections.push({
    title: 'Начало работы',
    items: guidePages.map((guide) => ({
      title: guide.title,
      href: guide.path,
      // Add badge for updates page if there are new updates
      badge: guide.path === '/guides/updates' && hasNewUpdates ? 'new' : undefined,
    })),
  });

  // Group endpoints by tag
  const grouped = groupEndpointsByTag(api.endpoints);

  // Sort sections by OpenAPI tag order
  const sortedTags = sortTagsByOrder(Array.from(grouped.keys()));

  // Create sections from tags
  for (const tag of sortedTags) {
    const endpoints = grouped.get(tag)!;
    endpoints.sort((a, b) => (METHOD_ORDER[a.method] ?? 99) - (METHOD_ORDER[b.method] ?? 99));
    const translation = TAG_TRANSLATIONS[tag];
    const title = translation || tag;

    sections.push({
      title,
      originalTitle: translation ? tag : undefined,
      items: endpoints.map((endpoint) => ({
        title: generateTitle(endpoint),
        href: generateUrlFromOperation(endpoint),
        method: endpoint.method,
      })),
    });
  }

  return sections;
}

export async function getAdjacentItems(currentHref: string) {
  const sections = await generateNavigation();
  const allItems = sections.flatMap((s) => s.items);
  const currentIndex = allItems.findIndex((item) => item.href === currentHref);

  return {
    prev: currentIndex > 0 ? allItems[currentIndex - 1] : null,
    next: currentIndex < allItems.length - 1 ? allItems[currentIndex + 1] : null,
  };
}
