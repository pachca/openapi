/**
 * Tab-based navigation configuration for the developer portal.
 * Six top-level tabs rendered under the logo in the header.
 */

export type TabId = 'guides' | 'api' | 'cli' | 'sdk' | 'n8n' | 'updates';

export interface TabConfig {
  id: TabId;
  title: string;
  /** Shorter title for mobile UI */
  shortTitle: string;
  /** URL prefix(es) for matching active tab (longer/more specific prefixes match first) */
  prefix: string;
  /** Landing page for the tab (used when clicking the tab in the header) */
  defaultHref: string;
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
    id: 'guides',
    title: 'Руководства',
    shortTitle: 'Руководства',
    prefix: '/guides',
    defaultHref: '/',
    hasSidebar: true,
  },
  {
    id: 'api',
    title: 'Документация API',
    shortTitle: 'API',
    prefix: '/api',
    defaultHref: '/api/authorization',
    hasSidebar: true,
  },
  {
    id: 'cli',
    title: 'CLI',
    shortTitle: 'CLI',
    prefix: '/guides/cli',
    defaultHref: '/guides/cli/overview',
    hasSidebar: true,
  },
  {
    id: 'sdk',
    title: 'SDK',
    shortTitle: 'SDK',
    prefix: '/guides/sdk',
    defaultHref: '/guides/sdk/overview',
    hasSidebar: true,
  },
  {
    id: 'n8n',
    title: 'n8n',
    shortTitle: 'n8n',
    prefix: '/guides/n8n',
    defaultHref: '/guides/n8n/overview',
    hasSidebar: true,
  },
  {
    id: 'updates',
    title: 'Обновления',
    shortTitle: 'Обновления',
    prefix: '/updates',
    defaultHref: '/updates',
    hasSidebar: true,
  },
];

/**
 * Developer Guides sidebar — top-level tab "Руководства".
 * Excludes CLI, SDK, n8n (they live in their own tabs).
 * Home page is the first item.
 */
export const GUIDE_SECTIONS: SidebarSection[] = [
  {
    title: 'Инструменты',
    items: [
      { title: 'Главная', path: '/' },
      { title: 'Быстрый старт', path: '/guides/quickstart' },
      {
        title: 'AI агенты',
        path: '/guides/ai-agents/overview',
        children: [
          { title: 'Обзор', path: '/guides/ai-agents/overview' },
          { title: 'Взаимодействие с агентом', path: '/guides/ai-agents/interaction' },
          { title: 'Markdown и документы', path: '/guides/ai-agents/markdown' },
        ],
      },
      { title: 'Треды', path: '/guides/threads' },
    ],
  },
  {
    title: 'Боты и автоматизации',
    items: [
      {
        title: 'Боты',
        path: '/guides/bots/overview',
        children: [
          { title: 'Обзор', path: '/guides/bots/overview' },
          { title: 'Создание и настройка', path: '/guides/bots/setup' },
          { title: 'Доступы к чатам и сообщениям', path: '/guides/bots/access' },
          { title: 'Готовые примеры', path: '/guides/bots/examples' },
        ],
      },
      { title: 'Входящие вебхуки', path: '/guides/incoming-webhooks' },
      {
        title: 'Исходящие вебхуки',
        path: '/guides/webhook/overview',
        children: [
          { title: 'Обзор', path: '/guides/webhook/overview' },
          { title: 'Настройка и типы событий', path: '/guides/webhook/events' },
          { title: 'Безопасность и обработчик', path: '/guides/webhook/handler' },
          { title: 'Поллинг', path: '/guides/webhook/polling' },
        ],
      },
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
    title: 'Справочники',
    items: [
      { title: 'Форматирование текста', path: '/guides/markdown' },
      { title: 'Сценарии', path: '/guides/workflows' },
    ],
  },
];

/** CLI tab sidebar — все страницы под /guides/cli */
export const CLI_SECTIONS: SidebarSection[] = [
  {
    title: 'Основы CLI',
    items: [
      { title: 'Обзор', path: '/guides/cli/overview' },
      { title: 'Установка', path: '/guides/cli/installation' },
      { title: 'Авторизация', path: '/guides/cli/authentication' },
    ],
  },
  {
    title: 'Руководства',
    items: [
      { title: 'Вывод', path: '/guides/cli/output' },
      { title: 'Флаги и скрипты', path: '/guides/cli/scripting' },
      { title: 'Сценарии', path: '/guides/cli/workflows' },
      { title: 'Файлы', path: '/guides/cli/files' },
      { title: 'Прямые запросы', path: '/guides/cli/api-requests' },
    ],
  },
  {
    title: 'Справочники',
    items: [{ title: 'Команды', path: '/guides/cli/commands' }],
  },
];

/** SDK tab sidebar — все страницы под /guides/sdk */
export const SDK_SECTIONS: SidebarSection[] = [
  {
    title: 'Основы SDK',
    items: [{ title: 'Обзор', path: '/guides/sdk/overview' }],
  },
  {
    title: 'Языки',
    items: [
      { title: 'TypeScript', path: '/guides/sdk/typescript' },
      { title: 'Python', path: '/guides/sdk/python' },
      { title: 'Go', path: '/guides/sdk/go' },
      { title: 'Kotlin', path: '/guides/sdk/kotlin' },
      { title: 'Swift', path: '/guides/sdk/swift' },
      { title: 'C#', path: '/guides/sdk/csharp' },
    ],
  },
];

/** n8n tab sidebar — все страницы под /guides/n8n */
export const N8N_SECTIONS: SidebarSection[] = [
  {
    title: 'Основы n8n',
    items: [
      { title: 'Обзор', path: '/guides/n8n/overview' },
      { title: 'Начало работы', path: '/guides/n8n/setup' },
    ],
  },
  {
    title: 'Руководства',
    items: [
      { title: 'Ресурсы и операции', path: '/guides/n8n/resources' },
      { title: 'Триггер', path: '/guides/n8n/trigger' },
      { title: 'Тестирование', path: '/guides/n8n/testing' },
      { title: 'Примеры workflow', path: '/guides/n8n/workflows' },
      { title: 'Продвинутые функции', path: '/guides/n8n/advanced' },
    ],
  },
  {
    title: 'Справочники',
    items: [
      { title: 'Устранение ошибок', path: '/guides/n8n/troubleshooting' },
      { title: 'Миграция с v1', path: '/guides/n8n/migration' },
    ],
  },
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
  { title: 'Ошибки', path: '/api/errors' },
  { title: 'Лимиты', path: '/api/limits' },
  { title: 'Модели', path: '/api/models' },
];

/**
 * Determine which tab is active based on the current pathname.
 * Iterates TABS in order of prefix length (longest first) so nested
 * paths like /guides/cli/* match the CLI tab before /guides matches Guides.
 */
export function getActiveTab(pathname: string): TabId | null {
  if (pathname === '/') return 'guides';

  const sorted = [...TABS].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const tab of sorted) {
    if (pathname === tab.prefix || pathname.startsWith(tab.prefix + '/')) {
      return tab.id;
    }
  }
  return null;
}

/**
 * Get the parent item title for a nested page (e.g. "n8n" for /guides/n8n/advanced).
 * Returns null for top-level pages. Used to disambiguate shared child titles like "Обзор".
 */
export function getNestedParentTitle(pathname: string): string | null {
  const allSections = [...GUIDE_SECTIONS, ...CLI_SECTIONS, ...SDK_SECTIONS, ...N8N_SECTIONS];
  for (const section of allSections) {
    for (const item of section.items) {
      if (!item.children) continue;
      if (item.path === pathname) return item.title;
      for (const child of item.children) {
        if (child.path === pathname) return item.title;
      }
    }
  }
  return null;
}

/**
 * Get the section title for a given pathname (for breadcrumb labels).
 */
export function getSectionTitle(pathname: string): string | null {
  const allSections = [
    { sections: GUIDE_SECTIONS },
    { sections: CLI_SECTIONS },
    { sections: SDK_SECTIONS },
    { sections: N8N_SECTIONS },
  ];

  for (const { sections } of allSections) {
    for (const section of sections) {
      for (const item of section.items) {
        if (item.path === pathname) return item.children ? item.title : section.title;
        if (item.children) {
          for (const child of item.children) {
            if (child.path === pathname) return item.title;
          }
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
