import fs from 'fs';
import path from 'path';
import { parseOpenAPI, clearCache } from '../lib/openapi/parser';
import { generateUrlFromOperation, generateTitle } from '../lib/openapi/mapper';
import {
  generateEndpointMarkdown,
  generateStaticPageMarkdownAsync,
} from '../lib/markdown-generator';
import { getOrderedGuidePages, sortTagsByOrder } from '../lib/guides-config';
import type { Endpoint } from '../lib/openapi/types';
import { generateAllSkills } from './skills/generate';

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
  const guidePages = getOrderedGuidePages();

  let content = '# Пачка API Documentation\n\n';
  content +=
    '> REST API мессенджера Пачка для управления сообщениями, чатами, пользователями и задачами.\n\n';
  content += `> Полная документация в одном файле: [llms-full.txt](${SITE_URL}/llms-full.txt)\n\n`;

  content += '## Руководства\n';
  for (const guide of guidePages) {
    const mdPath = guide.path === '/' ? '/.md' : `${guide.path}.md`;
    content += `- [${guide.title}](${SITE_URL}${mdPath}): ${guide.description}\n`;
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
  const guidePages = getOrderedGuidePages();

  let content = '# Пачка API - Полная документация\n\n';
  content +=
    '> REST API мессенджера Пачка для управления сообщениями, чатами, пользователями и задачами.\n\n';
  content += '> Краткий индекс: [llms.txt](https://dev.pachca.com/llms.txt)\n\n';

  content += '## Содержание\n\n';
  content += '### Руководства\n';
  for (const guide of guidePages) {
    const anchor = guide.title.toLowerCase().replace(/\s+/g, '-');
    content += `- [${guide.title}](#${anchor})\n`;
  }
  content += '\n';

  content += '### API Методы\n';
  for (const tag of sortedTags) {
    content += `- [${tag}](#api-${tag.toLowerCase().replace(/\s+/g, '-')})\n`;
  }
  content += '\n---\n\n';

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

function generateLegacySkillMd(api: Awaited<ReturnType<typeof parseOpenAPI>>) {
  const baseUrl = api.servers[0]?.url;
  const grouped = groupByTag(api.endpoints);
  const sortedTags = sortTagsByOrder(Array.from(grouped.keys()));
  const guidePages = getOrderedGuidePages();

  const FRONTMATTER = `---
name: pachca-api
description: Interact with the Pachca corporate messenger API — send messages, manage chats, users, tags, tasks, handle webhooks, upload files, and build bots. Use when integrating with Pachca or automating team communication workflows.
metadata:
  author: pachca
  version: "1.0"
---`;

  const STATIC_SECTIONS = `## Authentication

All requests require a Bearer token in the \`Authorization\` header:

\`\`\`
Authorization: Bearer <access_token>
\`\`\`

**Token types and their permissions:**
- **Admin token** — full access: manage users, tags, delete messages. Get it in Settings → Automations → API.
- **Owner token** — admin access plus audit events and data export (Corporation plan only).
- **Bot token** — send messages with custom display name/avatar, receive webhook events, manage webhook settings. Created per-bot in Settings → Automations.

Tokens are long-lived and do not expire. They can be reset by the admin/owner in Settings.`;

  const WORKFLOWS = `## Common Workflows

### Send a message to a chat

\`\`\`
POST /messages
{
  "message": {
    "entity_type": "discussion",
    "entity_id": 123,
    "content": "Hello from the API!"
  }
}
\`\`\`

\`entity_type\` is \`"discussion"\` for chats/channels, \`"user"\` for direct messages, \`"thread"\` for thread replies. \`entity_id\` is the chat ID, user ID, or thread ID respectively.

### Send a message with a file

1. Get upload parameters: \`POST /uploads\` with \`file_name\` and \`file_size\`
2. Upload to the returned S3 URL using the provided form fields
3. Send a message referencing the uploaded file key in the \`files\` array

### React to webhook events

Configure a webhook URL in your bot settings (Settings → Automations → Bots). The bot receives POST requests for subscribed events:

**Message events:** \`message.new\`, \`message.updated\`, \`message.deleted\`
**Reaction events:** \`reaction.add\`, \`reaction.remove\`
**Interactive events:** \`button.click\`, \`view.submission\`
**Chat membership:** \`chat_member.add\`, \`chat_member.remove\`
**Workspace membership:** \`company_member.invite\`, \`company_member.confirm\`, \`company_member.update\`, \`company_member.suspend\`, \`company_member.activate\`, \`company_member.delete\`

Verify webhook authenticity using the \`Pachca-Signature\` header (HMAC-SHA256 with your bot's signing secret).

### Open an interactive form

When a user clicks a button in a message, your bot receives a \`button.click\` webhook with a \`trigger_id\`. Use it to open a modal:

\`\`\`
POST /views/open
{
  "trigger_id": "<from webhook>",
  "view": {
    "title": "Feedback Form",
    "blocks": [
      { "block_id": "input1", "type": "input", "label": "Your feedback" }
    ]
  }
}
\`\`\`

Form submission results arrive via the \`view.submission\` webhook event.`;

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
      capabilities += `- \`${ep.method} ${ep.path}\` — ${generateTitle(ep)}\n`;
    }
    capabilities += '\n';
  }

  let guides = '## Guides\n\nDetailed documentation on specific topics is available at:\n\n';
  for (const guide of guidePages) {
    if (guide.path === '/') continue;
    guides += `- [${guide.title}](${SITE_URL}${guide.path}) — ${guide.description}\n`;
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
    WORKFLOWS,
    '',
    CONSTRAINTS,
    '',
    guides,
  ].join('\n');
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
  const guidePages = getOrderedGuidePages();
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

function writeFile(filePath: string, content: string) {
  const fullPath = path.join(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
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
    `\nTotal: ${3 + skillFiles.length + endpointFiles.length + guideFiles.length} files generated`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
