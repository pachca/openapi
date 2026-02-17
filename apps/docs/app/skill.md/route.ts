import { NextResponse } from 'next/server';
import { parseOpenAPI } from '@/lib/openapi/parser';
import { generateTitle } from '@/lib/openapi/mapper';
import { getOrderedGuidePages, sortTagsByOrder } from '@/lib/guides-config';

export const dynamic = 'force-static';

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

const SITE_URL = 'https://dev.pachca.com';

export async function GET() {
  const api = await parseOpenAPI();
  const baseUrl = api.servers[0]?.url;

  const grouped = new Map<string, typeof api.endpoints>();
  for (const endpoint of api.endpoints) {
    const tag = endpoint.tags[0] || 'Общее';
    if (!grouped.has(tag)) grouped.set(tag, []);
    grouped.get(tag)!.push(endpoint);
  }
  const sortedTags = sortTagsByOrder(Array.from(grouped.keys()));

  let capabilities = '## Capabilities\n\n';
  for (const tag of sortedTags) {
    capabilities += `### ${tag}\n`;
    for (const ep of grouped.get(tag)!) {
      capabilities += `- \`${ep.method} ${ep.path}\` — ${generateTitle(ep)}\n`;
    }
    capabilities += '\n';
  }

  const guidePages = getOrderedGuidePages();
  let guides = '## Guides\n\nDetailed documentation on specific topics is available at:\n\n';
  for (const guide of guidePages) {
    if (guide.path === '/') continue;
    guides += `- [${guide.title}](${SITE_URL}${guide.path}) — ${guide.description}\n`;
  }

  const content = [
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

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=0, must-revalidate, s-maxage=86400',
    },
  });
}
