/**
 * Tab-based navigation configuration for the developer portal.
 * Replaces the old flat guides-config.ts with a multi-tab structure.
 */

export type TabId = 'guide' | 'api';

export interface TabConfig {
  id: TabId;
  title: string;
  /** Shorter title for mobile UI */
  shortTitle: string;
  /** URL prefix for matching active tab */
  prefix: string;
  /** Whether to show sidebar for this tab */
  hasSidebar: boolean;
}

export interface SidebarSection {
  title: string;
  items: SidebarPageItem[];
}

export interface SidebarPageItem {
  title: string;
  path: string;
  children?: SidebarPageItem[];
  /** External link (opens in new tab) */
  external?: boolean;
}

/** Header tabs (order matters for rendering) */
export const TABS: TabConfig[] = [
  {
    id: 'guide',
    title: 'Руководство разработчика',
    shortTitle: 'Руководство разработчика',
    prefix: '/guides',
    hasSidebar: true,
  },
  { id: 'api', title: 'Документация API', shortTitle: 'API', prefix: '/api', hasSidebar: true },
];

/** Status page external link */
export const STATUS_URL = 'https://status.pachca.com';

/**
 * Developer Guide sidebar sections with page ordering.
 * Paths correspond to content/guides/*.mdx files.
 */
export const GUIDE_SECTIONS: SidebarSection[] = [
  {
    title: 'Инструменты',
    items: [
      { title: 'Быстрый старт', path: '/guides/quickstart' },
      { title: 'AI агенты', path: '/guides/ai-agents' },
      { title: 'CLI', path: '/guides/cli' },
      { title: 'Сценарии', path: '/guides/workflows' },
    ],
  },
  {
    title: 'Боты и автоматизации',
    items: [
      { title: 'Боты', path: '/guides/bots' },
      { title: 'Входящие вебхуки', path: '/guides/incoming-webhooks' },
      { title: 'Исходящие вебхуки', path: '/guides/webhook' },
      { title: 'Кнопки в сообщениях', path: '/guides/buttons' },
      {
        title: 'Формы',
        path: '/guides/forms/overview',
        children: [
          { title: 'Обзор', path: '/guides/forms/overview' },
          { title: 'Блоки представлений', path: '/guides/forms/blocks' },
          { title: 'Обработка форм', path: '/guides/forms/handling' },
        ],
      },
      { title: 'Разворачивание ссылок', path: '/guides/link-previews' },
    ],
  },
  {
    title: 'Данные и безопасность',
    items: [
      { title: 'Экспорт сообщений', path: '/guides/export' },
      { title: 'DLP-система', path: '/guides/dlp' },
      { title: 'Журнал аудита', path: '/guides/audit-events' },
    ],
  },
  {
    title: 'No-code интеграции',
    items: [
      { title: 'n8n', path: '/guides/n8n' },
      { title: 'Albato', path: '/guides/albato' },
    ],
  },
];

/** Footer links shared across all tabs */
export const SIDEBAR_FOOTER: SidebarPageItem[] = [
  { title: 'Последние обновления', path: '/updates' },
  { title: 'Статус API', path: STATUS_URL, external: true },
];

/**
 * API Reference sidebar — "Using the API" section.
 * The "Справочник методов" section is generated dynamically from OpenAPI.
 */
export const API_GUIDE_PAGES: SidebarPageItem[] = [
  { title: 'Авторизация', path: '/api/authorization' },
  { title: 'Запросы и ответы', path: '/api/requests-responses' },
  { title: 'Пагинация', path: '/api/pagination' },
  { title: 'Загрузка файлов', path: '/api/file-uploads' },
  { title: 'Ошибки и лимиты', path: '/api/errors' },
  { title: 'SDK', path: '/api/sdk' },
];

/**
 * Determine which tab is active based on the current pathname.
 */
export function getActiveTab(pathname: string): TabId | null {
  if (pathname === '/') return 'guide';
  for (const tab of TABS) {
    if (pathname.startsWith(tab.prefix)) return tab.id;
  }
  return null;
}

/**
 * Get the section title for a given pathname (for breadcrumb labels).
 */
export function getSectionTitle(pathname: string): string | null {
  // Guide sections
  for (const section of GUIDE_SECTIONS) {
    for (const item of section.items) {
      if (item.path === pathname) return item.children ? item.title : section.title;
      if (item.children) {
        for (const child of item.children) {
          if (child.path === pathname) return item.title;
        }
      }
    }
  }

  // API guide pages
  for (const page of API_GUIDE_PAGES) {
    if (page.path === pathname) return 'Основы API';
  }

  // API method pages (starts with /api/ but not in guide pages)
  if (pathname.startsWith('/api/')) {
    return null; // Will be resolved from tag name in navigation
  }

  return null;
}

/**
 * Get the breadcrumb for mobile (Tab > Section > Page).
 */
export function getMobileBreadcrumb(pathname: string): { tab: string; section?: string } | null {
  const tab = getActiveTab(pathname);
  if (!tab) return null;

  const tabConfig = TABS.find((t) => t.id === tab);
  if (!tabConfig) return null;

  const section = getSectionTitle(pathname);

  return {
    tab: tabConfig.title,
    section: section || undefined,
  };
}
