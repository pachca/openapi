import fs from 'fs';
import path from 'path';
import { parseOpenAPI, clearCache } from '../lib/openapi/parser';
import { generateUrlFromOperation, generateTitle } from '../lib/openapi/mapper';
import {
  generateEndpointMarkdown,
  generateStaticPageMarkdownAsync,
} from '../lib/markdown-generator';
import { sortTagsByOrder } from '../lib/guides-config';
import { getOrderedPages } from '../lib/ordered-pages';
import type { Endpoint } from '../lib/openapi/types';
import { generateRequestExample, generateExample } from '../lib/openapi/example-generator';
import { generateAllSkills } from './skills/generate';
import { SKILL_TAG_MAP, ROUTER_SKILL_CONFIG } from './skills/config';

const SITE_URL = 'https://dev.pachca.com';

function groupByTag(endpoints: Endpoint[]) {
  const grouped = new Map<string, Endpoint[]>();
  for (const ep of endpoints) {
    const tag = ep.tags[0] || 'Общее';
    if (!grouped.has(tag)) grouped.set(tag, []);
    grouped.get(tag)!.push(ep);
  }
  return grouped;
}

function generateLlmsTxt(api: Awaited<ReturnType<typeof parseOpenAPI>>) {
  const grouped = groupByTag(api.endpoints);
  const sortedTags = sortTagsByOrder(Array.from(grouped.keys()));
  const guidePages = getOrderedPages();

  let content = '# Пачка API Documentation\n\n';
  content +=
    '> REST API мессенджера Пачка для управления сообщениями, чатами, пользователями и задачами.\n\n';
  content += `> Полная документация в одном файле: [llms-full.txt](${SITE_URL}/llms-full.txt)\n\n`;

  content += '## CLI Quick Start\n\n';
  content += '```bash\n';
  content += '# Zero-install (npx)\n';
  content += 'npx @pachca/cli <command> --token <TOKEN>\n';
  content += '\n';
  content += '# For regular use\n';
  content += 'npm install -g @pachca/cli\n';
  content += 'pachca auth login\n';
  content += 'pachca messages create --entity-id=<chat_id> --content="Hello"\n';
  content += 'pachca guide "отправить сообщение"  # CLI guide for humans\n';
  content += '```\n\n';

  content += '## Руководства\n';
  for (const guide of guidePages) {
    const mdPath = guide.path === '/' ? '/.md' : `${guide.path}.md`;
    const displayTitle = guide.sectionTitle ? `${guide.sectionTitle}: ${guide.title}` : guide.title;
    content += `- [${displayTitle}](${SITE_URL}${mdPath}): ${guide.description}\n`;
  }
  content += '\n';

  for (const tag of sortedTags) {
    const endpoints = grouped.get(tag)!;
    content += `## ${tag}\n`;
    for (const endpoint of endpoints) {
      const title = generateTitle(endpoint);
      const url = generateUrlFromOperation(endpoint);
      content += `- [${title}](${SITE_URL}${url}.md): ${endpoint.method} ${endpoint.path}\n`;
    }
    content += '\n';
  }

  content += '## SDK\n\n';
  content +=
    'Типизированные клиенты для 6 языков. Все следуют единому паттерну: `PachcaClient(token)` → `client.service.method(request)`.\n\n';
  content += '| Язык | Пакет | Установка |\n';
  content += '|------|-------|----------|\n';
  content += '| TypeScript | `@pachca/sdk` | `npm install @pachca/sdk` |\n';
  content += '| Python | `pachca-sdk` | `pip install pachca-sdk` |\n';
  content +=
    '| Go | `github.com/pachca/go-sdk` | `go get github.com/pachca/openapi/sdk/go/generated` |\n';
  content += '| Kotlin | `com.pachca:sdk` | `implementation("com.pachca:pachca-sdk:1.0.1")` |\n';
  content += '| Swift | `PachcaSDK` | SPM: `https://github.com/pachca/openapi` |\n';
  content += '| C# | `Pachca.Sdk` | `dotnet add package Pachca.Sdk` |\n\n';
  content += 'Конвенции:\n';
  content +=
    '- **Вход**: path-параметры и body-поля (если ≤2) разворачиваются в аргументы метода. Иначе — один объект-запрос.\n';
  content +=
    '- **Выход**: если ответ API содержит единственное поле `data`, SDK возвращает его содержимое напрямую.\n';
  content +=
    '- Имена сервисов, методов и полей соответствуют operationId и параметрам из OpenAPI.\n\n';
  content += '```\n';
  content += 'TypeScript: new PachcaClient("TOKEN") → pachca.messages.createMessage({...})\n';
  content += 'Python:     PachcaClient("TOKEN")     → await client.messages.create_message(...)\n';
  content += 'Go:         NewPachcaClient("TOKEN")  → client.Messages.CreateMessage(ctx, ...)\n';
  content += 'Kotlin:     PachcaClient("TOKEN")     → pachca.messages.createMessage(...)\n';
  content +=
    'Swift:      PachcaClient(token: "TOKEN") → try await pachca.messages.createMessage(...)\n';
  content +=
    'C#:         new PachcaClient("TOKEN")    → await client.Messages.CreateMessageAsync(...)\n';
  content += '```\n\n';

  content += '## Agent Skills\n\n';
  content += 'Скиллы для AI-агентов (Claude Code, Cursor и др.):\n\n';
  content += '| Скилл | Описание |\n';
  content += '|-------|---------|\n';
  for (const config of SKILL_TAG_MAP) {
    const shortDesc = config.description.split('.')[0];
    content += `| ${config.name} | ${shortDesc} |\n`;
  }
  content += `| ${ROUTER_SKILL_CONFIG.name} | ${ROUTER_SKILL_CONFIG.description.split('.')[0]} |\n`;
  content += '\n';
  content += 'Установка: `npx skills add pachca/openapi`\n\n';
  content += `Индекс скиллов: [${SITE_URL}/.well-known/skills/index.json](${SITE_URL}/.well-known/skills/index.json)\n\n`;

  content += '## Дополнительно\n';
  content += `- [Agent Skill](${SITE_URL}/skill.md): Описание API для AI-агентов (SKILL.md)\n`;
  content += '- [Веб-сайт](https://pachca.com/)\n';
  content += '- [Получить помощь](mailto:team@pachca.com)\n';
  content += '\n____\n';

  return content;
}

async function generateLlmsFullTxt(api: Awaited<ReturnType<typeof parseOpenAPI>>) {
  const baseUrl = api.servers[0]?.url;
  const grouped = groupByTag(api.endpoints);
  const sortedTags = sortTagsByOrder(Array.from(grouped.keys()));
  const guidePages = getOrderedPages();

  let content = '# Пачка API - Полная документация\n\n';
  content +=
    '> REST API мессенджера Пачка для управления сообщениями, чатами, пользователями и задачами.\n\n';
  content += '> Краткий индекс: [llms.txt](https://dev.pachca.com/llms.txt)\n\n';

  content += '## Содержание\n\n';
  content += '### Руководства\n';
  for (const guide of guidePages) {
    const displayTitle = guide.sectionTitle ? `${guide.sectionTitle}: ${guide.title}` : guide.title;
    const anchor = displayTitle
      .toLowerCase()
      .replace(/[#?&=]/g, '')
      .replace(/\s+/g, '-');
    content += `- [${displayTitle}](#${anchor})\n`;
  }
  content += '\n';

  content += '### API Методы\n';
  for (const tag of sortedTags) {
    content += `- [${tag}](#api-${tag.toLowerCase().replace(/\s+/g, '-')})\n`;
  }
  content += '\n';

  content += '### SDK\n';
  content += '- [SDK](#sdk)\n';
  content += '\n---\n\n';

  content += '# SDK\n\n';
  content +=
    'Типизированные клиенты для 6 языков. Единый паттерн: `PachcaClient(token)` → `client.service.method(request)`.\n\n';
  content += '| Язык | Пакет | Установка |\n';
  content += '|------|-------|----------|\n';
  content += '| TypeScript | `@pachca/sdk` | `npm install @pachca/sdk` |\n';
  content += '| Python | `pachca-sdk` | `pip install pachca-sdk` |\n';
  content +=
    '| Go | `github.com/pachca/go-sdk` | `go get github.com/pachca/openapi/sdk/go/generated` |\n';
  content += '| Kotlin | `com.pachca:sdk` | `implementation("com.pachca:pachca-sdk:1.0.1")` |\n';
  content += '| Swift | `PachcaSDK` | SPM: `https://github.com/pachca/openapi` |\n';
  content += '| C# | `Pachca.Sdk` | `dotnet add package Pachca.Sdk` |\n\n';
  content += '## Конвенции SDK\n\n';
  content +=
    '- **Вход**: path-параметры и body-поля (если ≤2) разворачиваются в аргументы метода. Иначе — один объект-запрос.\n';
  content +=
    '- **Выход**: если ответ API содержит единственное поле `data`, SDK возвращает его содержимое напрямую.\n';
  content +=
    '- Имена сервисов, методов и полей соответствуют operationId и параметрам из OpenAPI.\n\n';
  content += '### Примеры вызова по языкам\n\n';
  content +=
    '**TypeScript:**\n```typescript\nimport { PachcaClient } from "@pachca/sdk";\nconst pachca = new PachcaClient("YOUR_TOKEN");\nconst users = await pachca.users.listUsers();\nawait pachca.reactions.addReaction(messageId, { code: "👍" });\n```\n\n';
  content +=
    '**Python:**\n```python\nfrom pachca import PachcaClient\nclient = PachcaClient("YOUR_TOKEN")\nusers = await client.users.list_users()\nawait client.reactions.add_reaction(message_id, ReactionRequest(code="👍"))\n```\n\n';
  content +=
    '**Go:**\n```go\nclient := pachca.NewPachcaClient("YOUR_TOKEN")\nusers, err := client.Users.ListUsers(ctx, nil)\nreaction, err := client.Reactions.AddReaction(ctx, messageId, pachca.ReactionRequest{Code: "👍"})\n```\n\n';
  content +=
    '**Kotlin:**\n```kotlin\nval pachca = PachcaClient("YOUR_TOKEN")\nval users = pachca.users.listUsers()\npachca.reactions.addReaction(messageId, ReactionRequest(code = "👍"))\n```\n\n';
  content +=
    '**Swift:**\n```swift\nlet pachca = PachcaClient(token: "YOUR_TOKEN")\nlet users = try await pachca.users.listUsers()\ntry await pachca.reactions.addReaction(messageId, ReactionRequest(code: "👍"))\n```\n\n';
  content +=
    '**C#:**\n```csharp\nusing var client = new PachcaClient("YOUR_TOKEN");\nvar users = await client.Users.ListUsersAsync();\nawait client.Reactions.AddReactionAsync(messageId, new ReactionRequest { Code = "👍" });\n```\n\n';

  content += '---\n\n';

  content += '# Руководства\n\n';
  for (const guide of guidePages) {
    const guideContent = await generateStaticPageMarkdownAsync(guide.path);
    if (guideContent) {
      content += guideContent;
      content += '\n---\n\n';
    }
  }

  content += '# API Методы\n\n';
  for (const tag of sortedTags) {
    const endpoints = grouped.get(tag)!;
    content += `## API: ${tag}\n\n`;
    for (const endpoint of endpoints) {
      const endpointMarkdown = generateEndpointMarkdown(endpoint, baseUrl);
      content += endpointMarkdown;
      content += '\n---\n\n';
    }
  }

  content += '## Дополнительная информация\n\n';
  content += '- **Веб-сайт**: https://pachca.com/\n';
  content += '- **Получить помощь**: team@pachca.com\n\n';
  content += '---\n\n';
  content += '_Документация автоматически сгенерирована из OpenAPI спецификации_\n';

  return content;
}

function generateWorkflowsSection(): string {
  let content = '## Common Workflows\n\n';
  content += '### CLI Quick Start\n\n';
  content += '```bash\n';
  content += 'npx @pachca/cli <command> --token <TOKEN>\n';
  content += '```\n\n';

  // English workflow summaries for skill.md (source workflows are in Russian)
  const featured: { title: string; steps: { desc: string; cmd?: string; note?: string }[] }[] = [
    {
      title: 'Find chat by name and send message',
      steps: [
        {
          desc: 'List all chats, find by `name` field',
          cmd: 'pachca chats list --all',
          note: 'GET /chats does not support name search — paginate through all',
        },
        {
          desc: 'Send message to the chat',
          cmd: 'pachca messages create --entity-id=<chat_id> --content="Hello"',
        },
      ],
    },
    {
      title: 'Find active chats in a date range',
      steps: [
        {
          desc: 'List chats with activity after a date',
          cmd: 'pachca chats list --last-message-at-after=<date> --all',
          note: 'Add `--last-message-at-before` for range. Date in ISO-8601 UTC',
        },
      ],
    },
    {
      title: 'Set up a bot with outgoing webhook',
      steps: [
        { desc: 'Create bot in Pachca UI: Automations → Integrations → Webhook' },
        { desc: 'Get `access_token` from bot API settings tab' },
        { desc: 'Set Webhook URL to receive events' },
      ],
    },
    {
      title: 'Show interactive form to user',
      steps: [
        {
          desc: 'Send message with button',
          cmd: `pachca messages create --entity-id=<chat_id> --content="Fill the form" --buttons='[[{"text":"Open","data":"open_form"}]]'`,
        },
        { desc: 'On button click — receive webhook event with `trigger_id`' },
        {
          desc: 'Open form immediately',
          cmd: `pachca views open --type=modal --trigger-id=<trigger_id> --title="Request" --blocks='[...]'`,
          note: '`trigger_id` expires in 3 seconds — prepare form object in advance',
        },
        { desc: 'On form submit — receive webhook, process data' },
      ],
    },
  ];

  for (const wf of featured) {
    content += `### ${wf.title}\n\n`;
    for (let i = 0; i < wf.steps.length; i++) {
      const step = wf.steps[i];
      content += `${i + 1}. ${step.desc}`;
      if (step.cmd) content += `: \`${step.cmd}\``;
      content += '\n';
      if (step.note) content += `   > ${step.note}\n`;
    }
    content += '\n';
  }

  return content;
}

function generateEnglishTitle(ep: Endpoint): string {
  // Derive English title from operationId: "MessageOperations_createMessage" → "Create message"
  const parts = ep.id.split('_');
  const action = parts.length > 1 ? parts[1] : ep.id;
  // camelCase → words: "createMessage" → "create message", "listChatMessages" → "list chat messages"
  const words = action
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function generateModularSkillsSection(): string {
  let section = '## Modular Skills\n\n';
  section +=
    'For AI agents that support modular skills, install specialized skills for better context efficiency:\n\n';
  section += '```bash\nnpx skills add pachca/openapi\n```\n\n';
  section += '| Skill | Description |\n';
  section += '|-------|-------------|\n';
  for (const config of SKILL_TAG_MAP) {
    const shortDesc = config.description.split('.')[0];
    section += `| ${config.name} | ${shortDesc} |\n`;
  }
  section += `\nSkills index: \`${SITE_URL}/.well-known/skills/index.json\`\n`;
  return section;
}

function generateLegacySkillMd(api: Awaited<ReturnType<typeof parseOpenAPI>>) {
  const baseUrl = api.servers[0]?.url;
  const grouped = groupByTag(api.endpoints);
  const sortedTags = sortTagsByOrder(Array.from(grouped.keys()));
  const guidePages = getOrderedPages();

  const FRONTMATTER = `---
name: pachca
description: Interact with the Pachca corporate messenger API — send messages, manage chats, users, tags, tasks, handle webhooks, upload files, and build bots. Use when integrating with Pachca or automating team communication workflows.
metadata:
  author: pachca
  version: "1.0"
---`;

  const STATIC_SECTIONS = `## CLI (recommended)

\`\`\`bash
# Zero-install
npx @pachca/cli <command> --token <TOKEN>

# For regular use
npm install -g @pachca/cli && pachca auth login
\`\`\`

## Authentication

All requests require a Bearer token. With CLI, use \`--token\` flag or \`PACHCA_TOKEN\` env var.

For direct API calls, add the \`Authorization\` header:

\`\`\`
Authorization: Bearer <access_token>
\`\`\`

**Token types and their permissions:**
- **Admin token** — full access: manage users, tags, delete messages. Get it in Settings → Automations → API.
- **Owner token** — admin access plus audit events and data export (Corporation plan only).
- **Bot token** — send messages with custom display name/avatar, receive webhook events, manage webhook settings. Created per-bot in Settings → Automations.

Tokens are long-lived and do not expire. They can be reset by the admin/owner in Settings.`;

  const workflowsSection = generateWorkflowsSection();

  const CONSTRAINTS = `## Constraints

### Rate Limits
- **Message send/edit/delete:** ~4 req/sec per chat (burst: 30/sec for 5s)
- **Message read:** ~10 req/sec
- **Other endpoints:** ~50 req/sec
- **Webhooks:** ~4 req/sec per webhook ID
- On \`429\` response, respect the \`Retry-After\` header.

### Pagination
- **Cursor-based** (preferred): use \`limit\` (1–50) and \`cursor\` parameters. Check \`meta.paginate.next_page\` in response.
- **Offset-based** (legacy): use \`per\` (1–50) and \`page\` parameters.

### Permissions
- User management, tag management, and message deletion require an **admin** token.
- Audit events and data export require an **owner** token and **Corporation** pricing plan.
- Link preview (unfurling) requires a dedicated unfurling bot token with whitelisted domains.
- \`POST /direct_url\` is the only endpoint that does not require authentication.

### Error Handling
- \`400\` — validation error
- \`401\` — missing or invalid token
- \`403\` — insufficient permissions
- \`404\` — resource not found
- \`429\` — rate limited (check \`Retry-After\`)

Error response body: \`{ "errors": [{ "key": "field", "value": "description" }] }\``;

  let capabilities = '## Capabilities\n\n';
  for (const tag of sortedTags) {
    capabilities += `### ${tag}\n`;
    for (const ep of grouped.get(tag)!) {
      capabilities += `- \`${ep.method} ${ep.path}\` — ${generateEnglishTitle(ep)}\n`;
    }
    capabilities += '\n';
  }

  let guides = '## Guides\n\nDetailed documentation on specific topics is available at:\n\n';
  for (const guide of guidePages) {
    if (guide.path === '/') continue;
    const displayTitle = guide.sectionTitle ? `${guide.sectionTitle}: ${guide.title}` : guide.title;
    guides += `- [${displayTitle}](${SITE_URL}${guide.path}) — ${guide.description}\n`;
  }

  return [
    FRONTMATTER,
    '',
    `# Pachca API`,
    '',
    'Pachca is a corporate messenger for teams. The REST API lets you automate communication workflows: send and manage messages, organize chats and channels, manage users and permissions, build interactive bots, handle file uploads, and react to real-time events via webhooks.',
    '',
    `**Base URL:** \`${baseUrl}\``,
    '',
    '## Accessing Documentation',
    '',
    '| Format | URL | Best for |',
    '|--------|-----|----------|',
    `| LLM-friendly summary | \`${SITE_URL}/llms.txt\` | Quick overview with links |`,
    `| Full documentation | \`${SITE_URL}/llms-full.txt\` | Complete reference in one file |`,
    `| OpenAPI 3.0 spec | \`${SITE_URL}/openapi.yaml\` | Programmatic parsing and code generation |`,
    '',
    'For detailed endpoint documentation, parameters, and response schemas, fetch `/llms-full.txt`.',
    '',
    STATIC_SECTIONS,
    '',
    capabilities,
    workflowsSection,
    '',
    CONSTRAINTS,
    '',
    guides,
    '',
    generateModularSkillsSection(),
  ].join('\n');
}

function generatePostmanCollection(api: Awaited<ReturnType<typeof parseOpenAPI>>) {
  const baseUrl = api.servers[0]?.url ?? 'https://api.pachca.com/api/shared/v1';
  const grouped = groupByTag(api.endpoints);
  const sortedTags = sortTagsByOrder(Array.from(grouped.keys()));

  interface PostmanVariable {
    key: string;
    value: string;
    type?: string;
  }
  interface PostmanUrl {
    raw: string;
    host: string[];
    path: string[];
    variable?: PostmanVariable[];
    query?: { key: string; value: string }[];
  }
  interface PostmanHeader {
    key: string;
    value: string;
  }
  interface PostmanBody {
    mode: string;
    raw: string;
    options: { raw: { language: string } };
  }
  interface PostmanRequest {
    method: string;
    header: PostmanHeader[];
    url: PostmanUrl;
    body?: PostmanBody;
  }
  interface PostmanItem {
    name: string;
    request: PostmanRequest;
  }
  interface PostmanFolder {
    name: string;
    item: PostmanItem[];
  }

  function buildUrl(endpointPath: string): PostmanUrl {
    // Replace {param} with :param for Postman style
    const postmanPath = endpointPath.replace(/\{([^}]+)\}/g, ':$1');
    const pathSegments = postmanPath.split('/').filter(Boolean);
    const pathVariables = [...endpointPath.matchAll(/\{([^}]+)\}/g)].map((m) => ({
      key: m[1],
      value: '',
    }));

    const url: PostmanUrl = {
      raw: `{{baseUrl}}${postmanPath}`,
      host: ['{{baseUrl}}'],
      path: pathSegments,
    };

    if (pathVariables.length > 0) {
      url.variable = pathVariables;
    }

    return url;
  }

  function buildRequest(endpoint: Endpoint): PostmanRequest {
    const header: PostmanHeader[] = [];
    const hasBody =
      ['POST', 'PUT', 'PATCH'].includes(endpoint.method) && endpoint.requestBody != null;

    if (hasBody) {
      header.push({ key: 'Content-Type', value: 'application/json' });
    }

    const request: PostmanRequest = {
      method: endpoint.method,
      header,
      url: buildUrl(endpoint.path),
    };

    if (hasBody && endpoint.requestBody) {
      let bodyObj: unknown;

      // Try explicit example first, then generate from schema
      const requestExample = generateRequestExample(endpoint.requestBody);
      if (requestExample !== undefined) {
        bodyObj = requestExample;
      } else {
        const jsonContent = endpoint.requestBody.content['application/json'];
        if (jsonContent?.schema) {
          bodyObj = generateExample(jsonContent.schema);
        }
      }

      if (bodyObj !== undefined) {
        request.body = {
          mode: 'raw',
          raw: JSON.stringify(bodyObj, null, 2),
          options: { raw: { language: 'json' } },
        };
      }
    }

    return request;
  }

  const folders: PostmanFolder[] = sortedTags.map((tag) => ({
    name: tag,
    item: (grouped.get(tag) ?? []).map((endpoint) => ({
      name: generateTitle(endpoint),
      request: buildRequest(endpoint),
    })),
  }));

  return {
    info: {
      name: 'Пачка API',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    auth: {
      type: 'bearer',
      bearer: [{ key: 'token', value: '{{PACHCA_TOKEN}}', type: 'string' }],
    },
    variable: [
      { key: 'baseUrl', value: baseUrl },
      { key: 'PACHCA_TOKEN', value: 'YOUR_TOKEN_HERE' },
    ],
    item: folders,
  };
}

async function generateEndpointMdFiles(api: Awaited<ReturnType<typeof parseOpenAPI>>) {
  const baseUrl = api.servers[0]?.url;
  const files: { path: string; content: string }[] = [];

  for (const endpoint of api.endpoints) {
    const url = generateUrlFromOperation(endpoint);
    const filePath = `public${url}.md`;
    const markdown = generateEndpointMarkdown(endpoint, baseUrl);
    files.push({ path: filePath, content: markdown });
  }

  return files;
}

async function generateGuideMdFiles() {
  const guidePages = getOrderedPages();
  const files: { path: string; content: string }[] = [];

  for (const guide of guidePages) {
    const markdown = await generateStaticPageMarkdownAsync(guide.path);
    if (!markdown) continue;

    if (guide.path === '/') {
      files.push({ path: 'public/index.md', content: markdown });
    } else {
      files.push({ path: `public${guide.path}.md`, content: markdown });
    }
  }

  return files;
}

const REPO_ROOT = path.join(process.cwd(), '..', '..');

const UTF8_BOM = '\uFEFF';

function writeFile(filePath: string, content: string) {
  const fullPath = path.join(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  const data = filePath.endsWith('.txt') ? UTF8_BOM + content : content;
  fs.writeFileSync(fullPath, data, 'utf-8');
}

function writeFileFromRoot(filePath: string, content: string) {
  const fullPath = path.join(REPO_ROOT, filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
}

async function main() {
  clearCache();
  const api = await parseOpenAPI();

  const llmsTxt = generateLlmsTxt(api);
  writeFile('public/llms.txt', llmsTxt);
  console.log('✓ public/llms.txt');

  const llmsFullTxt = await generateLlmsFullTxt(api);
  writeFile('public/llms-full.txt', llmsFullTxt);
  console.log('✓ public/llms-full.txt');

  const skillMd = generateLegacySkillMd(api);
  writeFile('public/skill.md', skillMd);
  console.log('✓ public/skill.md');

  const skillFiles = generateAllSkills(api);
  for (const file of skillFiles) {
    writeFileFromRoot(file.path, file.content);
  }
  console.log(`✓ ${skillFiles.length} skill files`);

  // scenarios.json removed — its role is covered by the n8n node (n8n-nodes-pachca)

  const postmanCollection = generatePostmanCollection(api);
  writeFile('public/pachca.postman_collection.json', JSON.stringify(postmanCollection, null, 2));
  console.log('✓ public/pachca.postman_collection.json');

  const endpointFiles = await generateEndpointMdFiles(api);
  for (const file of endpointFiles) {
    writeFile(file.path, file.content);
  }
  console.log(`✓ ${endpointFiles.length} endpoint .md files`);

  const guideFiles = await generateGuideMdFiles();
  for (const file of guideFiles) {
    writeFile(file.path, file.content);
  }
  console.log(`✓ ${guideFiles.length} guide .md files`);

  console.log(
    `\nTotal: ${6 + skillFiles.length + endpointFiles.length + guideFiles.length} files generated`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
