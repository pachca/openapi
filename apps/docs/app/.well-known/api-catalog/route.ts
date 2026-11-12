import { API_GUIDE_PAGES, type SidebarPageItem } from '@/lib/tabs-config';

const SITE_URL = 'https://dev.pachca.com';
// RFC 9727 §4: the anchor names the API itself, not its documentation.
const API_URL = 'https://api.pachca.com/api/shared/v1';
const MCP_URL = 'https://mcp.pachca.com/mcp';

// Hand-written descriptions for API guide pages — gives each service-doc
// entry a useful title beyond the sidebar label. Keys are page paths
// from API_GUIDE_PAGES; missing keys fall back to the sidebar title.
const GUIDE_DESCRIPTIONS: Record<string, string> = {
  '/api/authorization': 'Авторизация (token types and scopes)',
  '/api/requests-responses': 'Запросы и ответы (request/response format, testing)',
  '/api/pagination': 'Пагинация (cursor-based)',
  '/api/file-uploads': 'Загрузка файлов (3-step S3 flow)',
  '/api/errors': 'Ошибки (HTTP codes, ApiError, OAuthError)',
  '/api/limits': 'Лимиты (rate limits, 429, Retry-After, backoff)',
  '/api/models': 'Модели (shared data structures)',
};

function guideLink(page: SidebarPageItem) {
  const description = GUIDE_DESCRIPTIONS[page.path] ?? page.title;
  return {
    href: `${SITE_URL}${page.path}`,
    type: 'text/html',
    title: `API rules — ${description}`,
  };
}

export async function GET(): Promise<Response> {
  // RFC 9727 (well-known API catalog) + RFC 9264 (linkset+json).
  // service-desc: machine-readable specs. service-doc: human-readable docs
  // (top-level entry + agent files + each API rules page from
  // API_GUIDE_PAGES so the list stays in sync with the sidebar).
  // service-meta: agent-skills discovery indexes. The second entry is the
  // MCP server: its guide and the OAuth protected resource metadata that a
  // client reads after the server's 401.
  const linkset = {
    linkset: [
      {
        anchor: API_URL,
        'service-desc': [
          {
            href: `${SITE_URL}/openapi.yaml`,
            type: 'application/yaml',
            title: 'Pachca API — OpenAPI 3.0 specification',
          },
          {
            href: `${SITE_URL}/pachca.postman_collection.json`,
            type: 'application/json',
            title: 'Pachca API — Postman collection',
          },
        ],
        'service-doc': [
          {
            href: SITE_URL,
            type: 'text/html',
            title: 'Pachca developer documentation',
            hreflang: ['ru', 'en'],
          },
          {
            href: `${SITE_URL}/llms.txt`,
            type: 'text/plain',
            title: 'Agent-friendly guide and index',
          },
          {
            href: `${SITE_URL}/llms-full.txt`,
            type: 'text/plain',
            title: 'Agent-friendly full documentation',
          },
          ...API_GUIDE_PAGES.map(guideLink),
        ],
        'service-meta': [
          {
            href: `${SITE_URL}/.well-known/agent-skills/index.json`,
            type: 'application/json',
            title: 'Pachca Skills discovery (agentskills.io 0.2.0)',
          },
          {
            href: `${SITE_URL}/.well-known/skills/index.json`,
            type: 'application/json',
            title: 'Pachca Skills discovery (earlier format, read by npx skills)',
          },
        ],
      },
      {
        anchor: MCP_URL,
        'service-doc': [
          {
            href: `${SITE_URL}/guides/mcp/overview`,
            type: 'text/html',
            title: 'Pachca MCP server',
          },
          {
            href: `${SITE_URL}/guides/mcp/overview.md`,
            type: 'text/markdown',
            title: 'Pachca MCP server (markdown)',
          },
        ],
        'service-meta': [
          {
            href: 'https://mcp.pachca.com/.well-known/oauth-protected-resource/mcp',
            type: 'application/json',
            title: 'OAuth protected resource metadata (RFC 9728)',
          },
        ],
      },
    ],
  };

  return new Response(JSON.stringify(linkset, null, 2) + '\n', {
    headers: {
      'Content-Type': 'application/linkset+json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
