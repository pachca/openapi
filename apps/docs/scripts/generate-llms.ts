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
import { getSdkExamples, getValidSdkSymbols } from '../lib/sdk-examples';

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

function generateLibraryRules(): string {
  return `# LIBRARY RULES

## Authentication
- All requests require Bearer token in Authorization header: \`Authorization: Bearer <TOKEN>\`
- Token types: **admin** (full access — manage users, tags, delete messages), **bot** (send messages with custom name/avatar, receive webhooks), **user** (limited access)
- Get admin token: Settings → Automations → API. Get bot token: per-bot in Settings → Automations → Integrations
- Tokens are long-lived and do not expire. Can be reset by admin in Settings
- TypeScript SDK: \`const client = new PachcaClient("YOUR_TOKEN")\`
- Python SDK: \`client = PachcaClient("YOUR_TOKEN")\`

## Pagination
- Cursor-based: use \`limit\` (1–50, default 50) and \`cursor\` query parameters
- Response includes \`meta.paginate.next_page\` — cursor for next page
- End of data: when \`data\` array is empty (cursor is never null)
- TypeScript auto-pagination: \`client.users.listUsersAll()\` returns flat array of all results
- Python auto-pagination: \`await client.users.list_users_all()\` returns list of all results
- Available for: users, chats, messages, members, tags, reactions, tasks, search results, audit events, webhook events

## Rate Limiting
- Messages (POST/PUT/DELETE /messages): ~4 req/sec per chat (burst: 30/sec for 5s)
- Message read (GET /messages): ~10 req/sec
- Other endpoints: ~50 req/sec
- On \`429 Too Many Requests\`: respect \`Retry-After\` header value (seconds)
- Recommended retry strategy: exponential backoff with jitter — base delay × 2^attempt × random(0.5–1.5)
- SDK (@pachca/sdk, pachca-sdk) handles retry automatically: 3 retries, respects Retry-After, exponential backoff for 5xx

## Webhooks (Real-time Events)
- Create a bot in Pachca: Automations → Integrations → Bots
- Set webhook URL in bot settings → Outgoing Webhook tab
- Events: \`new_message\`, \`edit_message\`, \`delete_message\`, \`new_reaction\`, \`delete_reaction\`, \`button_pressed\`, \`view_submit\`, \`chat_member_changed\`, \`company_member_changed\`, \`link_shared\`
- Verify: HMAC-SHA256 of raw body with bot's Signing Secret
- Header: \`Pachca-Signature\` contains hex digest
- Replay protection: check \`webhook_timestamp\` within ±60 seconds of current time
- Alternative to webhooks: polling via GET /webhooks/events (enable "Save event history" in bot settings)
- IP whitelist: Pachca webhook IP is \`37.200.70.177\`

## File Uploads (3-step process)
- Step 1: POST /uploads → get S3 presigned params (\`direct_url\`, \`key\`, \`policy\`, \`x-amz-signature\`, etc.)
- Step 2: POST to \`direct_url\` (external S3 URL, NOT a Pachca API endpoint) with multipart/form-data — all params + \`file\` as LAST field
- Step 3: Replace \`\${filename}\` in \`key\` with actual filename, include in message \`files\` array
- Note: \`direct_url\` is an external S3 presigned URL and does not require Authorization header

## User Status
- Get any user's status: GET /users/{id}/status → \`{ emoji, title, expires_at, is_away, away_message }\`
- Set own status: PUT /profile/status \`{ status: { emoji, title, expires_at, is_away, away_message } }\`
- Clear own status: DELETE /profile/status
- Admin can manage any user: PUT /users/{id}/status, DELETE /users/{id}/status
- No real-time presence webhooks — use polling with ≥60s interval for monitoring status changes

## Error Handling
- \`400\`: validation errors — \`{ errors: [{ key, value, message, code }] }\` with codes: \`blank\`, \`invalid\`, \`taken\`, \`too_short\`, \`too_long\`, \`not_a_number\`
- \`401\`: unauthorized — \`{ error, error_description }\` (OAuthError)
- \`403\`: forbidden — insufficient permissions. May return ApiError (business logic) or OAuthError (\`insufficient_scope\`)
- \`404\`: not found
- \`409\`: conflict (duplicate)
- \`422\`: unprocessable — \`{ errors: [{ key, value, message, code }] }\`
- \`429\`: rate limited — respect \`Retry-After\` header, use exponential backoff with jitter
- SDK auto-retries \`429\` and \`5xx\` errors (3 attempts with exponential backoff)

## Idempotency and Reliability
- Pachca API operations are NOT idempotent by default — duplicate POST requests create duplicate resources
- Client-side deduplication: track request IDs, check before sending, store results with TTL
- Webhooks use at-least-once delivery — handlers MUST be idempotent (dedup by event fields: id + type + event)
- For multi-step operations: implement compensating actions (saga pattern) for failure recovery
- Separate critical operations (create chat) from non-critical (send welcome message) with independent error handling

## SDK (Typed Clients for 6 Languages)
- Unified pattern: \`PachcaClient(token)\` → \`client.service.method(request)\`
- **Input**: path params and body fields (≤2) expand to method arguments; otherwise a single request object
- **Output**: if API response has a single \`data\` field, SDK returns its contents directly
- Service, method, and field names match operationId and parameters from OpenAPI

| Language | Package | Install |
|----------|---------|---------|
| TypeScript | \`@pachca/sdk\` | \`npm install @pachca/sdk\` |
| Python | \`pachca-sdk\` | \`pip install pachca-sdk\` |
| Go | \`github.com/pachca/go-sdk\` | \`go get github.com/pachca/openapi/sdk/go/generated\` |
| Kotlin | \`com.pachca:sdk\` | \`implementation("com.pachca:pachca-sdk:1.0.1")\` |
| Swift | \`PachcaSDK\` | SPM: \`https://github.com/pachca/openapi\` |
| C# | \`Pachca.Sdk\` | \`dotnet add package Pachca.Sdk\` |

`;
}

// SDK types that are valid exports but never appear in examples.json operation imports
const ALWAYS_VALID_SDK_IMPORTS = new Set(['PachcaClient', 'ApiError', 'OAuthError']);

/**
 * Build-time validation: extracts client.service.method() calls and SDK imports
 * from How-to Guide code blocks, validates them against examples.json data.
 * Throws on first batch of errors to fail the build with a clear message.
 */
function validateSdkCodeBlocks(sectionName: string, content: string): void {
  const tsSymbols = getValidSdkSymbols('typescript');
  const pySymbols = getValidSdkSymbols('python');

  const codeBlockRegex = /```(typescript|python)\n([\s\S]*?)```/g;
  const errors: string[] = [];

  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    const lang = match[1] as 'typescript' | 'python';
    const code = match[2];
    const symbols = lang === 'typescript' ? tsSymbols : pySymbols;

    // Validate client.service.method() calls
    const methodRegex = /client\.(\w+)\.(\w+)\s*\(/g;
    const hasMethodCalls = methodRegex.test(code);
    methodRegex.lastIndex = 0;

    let m;
    while ((m = methodRegex.exec(code)) !== null) {
      const [, service, method] = m;
      if (!symbols.methods.has(service)) {
        errors.push(
          `[${lang}] Unknown service: client.${service}.${method}() — valid services: ${[...symbols.methods.keys()].join(', ')}`
        );
      } else if (!symbols.methods.get(service)!.has(method)) {
        errors.push(
          `[${lang}] Unknown method: client.${service}.${method}() — valid for ${service}: ${[...symbols.methods.get(service)!].join(', ')}`
        );
      }
    }

    // Only validate imports in code blocks with actual SDK method calls
    // (skip showcase/reference blocks that just list all available types)
    if (!hasMethodCalls) continue;

    // Validate TypeScript SDK imports
    if (lang === 'typescript') {
      const importRegex = /import\s*\{([^}]+)\}\s*from\s*["']@pachca\/sdk["']/g;
      let im;
      while ((im = importRegex.exec(code)) !== null) {
        const names = im[1]
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        for (const name of names) {
          if (!symbols.imports.has(name) && !ALWAYS_VALID_SDK_IMPORTS.has(name)) {
            errors.push(`[typescript] Unknown SDK import: ${name}`);
          }
        }
      }
    }

    // Validate Python SDK imports (single-line and parenthesized multiline)
    if (lang === 'python') {
      const pyImportRegex = /from\s+pachca\.models\s+import\s+(?:\(([\s\S]*?)\)|([^\n]+))/g;
      let im;
      while ((im = pyImportRegex.exec(code)) !== null) {
        const raw = im[1] || im[2];
        // Strip Python comments and extract only PascalCase type names
        const names = raw
          .split('\n')
          .map((line) => line.replace(/#.*/, ''))
          .join(',')
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && /^[A-Z]/.test(s));
        for (const name of names) {
          if (!symbols.imports.has(name) && !ALWAYS_VALID_SDK_IMPORTS.has(name)) {
            errors.push(`[python] Unknown SDK import: ${name} from pachca.models`);
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `\n❌ SDK code validation failed in "${sectionName}"!\n` +
        `The following SDK symbols don't match examples.json:\n\n` +
        errors.map((e) => `  • ${e}`).join('\n') +
        `\n\nFix the code or update the SDK.\n`
    );
  }
}

function generateHowToGuides(): string {
  let content = '# How-to Guides\n\n';

  // Q1: Auth + TypeScript SDK
  content += `## How to authenticate with the API

All API requests require a Bearer token in the Authorization header.

### curl
\`\`\`bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.pachca.com/api/shared/v1/users
\`\`\`

### TypeScript SDK
\`\`\`typescript
import { PachcaClient } from "@pachca/sdk"

const client = new PachcaClient("YOUR_TOKEN")
const profile = await client.profile.getProfile()
console.log(profile.id, profile.firstName)
\`\`\`

### Python SDK
\`\`\`python
from pachca.client import PachcaClient

client = PachcaClient("YOUR_TOKEN")
profile = await client.profile.get_profile()
print(profile.id, profile.first_name)
\`\`\`

Token types: **admin** (full access, get in Settings → Automations → API), **bot** (messaging + webhooks, per-bot in Integrations), **user** (limited).

`;

  // Q2: Pagination SDK
  content += `## How to paginate through results

### TypeScript SDK — auto-pagination
\`\`\`typescript
// Returns all results as a flat array (handles cursors automatically)
const allUsers = await client.users.listUsersAll()
console.log(\`Total: \${allUsers.length}\`)

// Manual pagination with cursor control
let cursor: string | undefined
for (;;) {
  const response = await client.users.listUsers({ limit: 50, cursor })
  if (response.data.length === 0) break
  for (const user of response.data) {
    console.log(user.firstName, user.lastName)
  }
  cursor = response.meta.paginate.nextPage
}
\`\`\`

### Python SDK — auto-pagination
\`\`\`python
# Returns all results as a list (handles cursors automatically)
all_users = await client.users.list_users_all()
print(f"Total: {len(all_users)}")

# Manual pagination with cursor control
from pachca.models import ListUsersParams

cursor = None
while True:
    response = await client.users.list_users(ListUsersParams(limit=50, cursor=cursor))
    if not response.data:
        break
    for user in response.data:
        print(user.first_name, user.last_name)
    cursor = response.meta.paginate.next_page
\`\`\`

Auto-pagination methods: \`listUsersAll()\`, \`listChatsAll()\`, \`listChatMessagesAll()\`, \`listMembersAll()\`, \`listTagsAll()\`, \`listTasksAll()\`, \`searchMessagesAll()\`, \`searchChatsAll()\`, \`searchUsersAll()\`, \`listReactionsAll()\`, \`getAuditEventsAll()\`, \`getWebhookEventsAll()\`.

`;

  // Q4: Create chat + add members (SDK)
  content += `## How to create chats and manage members

### TypeScript SDK
\`\`\`typescript
import { PachcaClient, MessageEntityType } from "@pachca/sdk"

const client = new PachcaClient("YOUR_TOKEN")

// Create a group chat with initial members
const chat = await client.chats.createChat({
  chat: { name: "Project Discussion", memberIds: [1, 2, 3], channel: false, public: false }
})
console.log("Created chat:", chat.id, chat.name)

// Add more members later
await client.members.addMembers(chat.id, { memberIds: [4, 5] })

// Remove a member
await client.members.removeMember(chat.id, 5)

// List current members
const members = await client.members.listMembersAll(chat.id)
console.log("Members:", members.map(m => m.firstName))

// Send a message to the chat
await client.messages.createMessage({
  message: { entityType: MessageEntityType.Discussion, entityId: chat.id, content: "Welcome everyone!" }
})
\`\`\`

### Python SDK
\`\`\`python
from pachca.client import PachcaClient
from pachca.models import ChatCreateRequest, ChatCreateRequestChat, MessageCreateRequest, MessageCreateRequestMessage, AddMembersRequest

client = PachcaClient("YOUR_TOKEN")

# Create a group chat with initial members
chat = await client.chats.create_chat(ChatCreateRequest(
    chat=ChatCreateRequestChat(name="Project Discussion", member_ids=[1, 2, 3], channel=False, public=False)
))
print("Created chat:", chat.id, chat.name)

# Add more members later
await client.members.add_members(chat.id, AddMembersRequest(member_ids=[4, 5]))

# List current members
members = await client.members.list_members_all(chat.id)

# Send a message to the chat
await client.messages.create_message(MessageCreateRequest(
    message=MessageCreateRequestMessage(entity_type="discussion", entity_id=chat.id, content="Welcome everyone!")
))
\`\`\`

Chat types: \`channel: true\` creates a channel (one-way announcements), \`channel: false\` creates a group chat (everyone can write). \`public: true\` makes it visible to all workspace members.

`;

  // Q3+Q7: Webhooks
  content += `## How to set up webhooks for real-time updates

### Step-by-step setup
1. Create a bot in Pachca: **Automations** → **Integrations** → **Bots**
2. In bot settings, go to **Outgoing Webhook** tab and set your HTTPS URL
3. Copy the **Signing Secret** for signature verification
4. Select event types: new messages, reactions, button presses, form submissions, etc.
5. Add the bot to chats where you want to receive events (global events like company member changes work without adding to chat)

### TypeScript webhook handler (Express.js)
\`\`\`typescript
import express from "express"
import crypto from "crypto"

const SIGNING_SECRET = "your_signing_secret" // From bot settings → Outgoing Webhook
const app = express()

app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  // Step 1: Verify HMAC-SHA256 signature
  const signature = crypto.createHmac("sha256", SIGNING_SECRET)
    .update(req.body).digest("hex")
  if (signature !== req.headers["pachca-signature"]) {
    return res.status(401).send("Invalid signature")
  }

  // Step 2: Check timestamp for replay protection (±60 seconds)
  const event = JSON.parse(req.body.toString())
  if (Math.abs(Date.now() / 1000 - event.webhook_timestamp) > 60) {
    return res.status(401).send("Expired event")
  }

  // Step 3: Process event by type
  switch (event.type) {
    case "message":
      if (event.event === "new") console.log("New message:", event.content, "from user:", event.user_id)
      if (event.event === "update") console.log("Message edited:", event.id)
      if (event.event === "delete") console.log("Message deleted:", event.id)
      break
    case "reaction":
      console.log(event.event === "new" ? "Reaction added:" : "Reaction removed:", event.emoji)
      break
    case "button":
      console.log("Button pressed:", event.data, "by user:", event.user_id)
      // Use event.trigger_id within 3 seconds to open a form
      break
    case "view_submit":
      console.log("Form submitted:", event.payload)
      break
  }

  res.status(200).send("OK")
})
app.listen(3000)
\`\`\`

### Python webhook handler (Flask)
\`\`\`python
import hmac, hashlib, json, time
from flask import Flask, request, abort

SIGNING_SECRET = "your_signing_secret"  # From bot settings → Outgoing Webhook
app = Flask(__name__)

@app.route("/webhook", methods=["POST"])
def webhook():
    raw_body = request.get_data()

    # Step 1: Verify HMAC-SHA256 signature
    expected = hmac.new(SIGNING_SECRET.encode(), raw_body, hashlib.sha256).hexdigest()
    if expected != request.headers.get("Pachca-Signature"):
        abort(401)

    # Step 2: Check timestamp for replay protection
    event = json.loads(raw_body)
    if abs(time.time() - event["webhook_timestamp"]) > 60:
        abort(401)

    # Step 3: Process event by type
    if event["type"] == "message" and event["event"] == "new":
        print("New message:", event["content"], "from user:", event["user_id"])
    elif event["type"] == "button":
        print("Button pressed:", event["data"])

    return "OK", 200
\`\`\`

### Webhook event types
| Event type | Description | Fields |
|-----------|-------------|--------|
| message (new) | New message in chat | id, content, user_id, chat_id, entity_type, entity_id, created_at, url |
| message (update) | Message edited | id, content, user_id, chat_id |
| message (delete) | Message deleted | id, user_id, chat_id |
| reaction (new/delete) | Reaction added/removed | message_id, user_id, emoji, chat_id |
| button | Button pressed | message_id, user_id, data, trigger_id, chat_id |
| view_submit | Form submitted | payload (form field values), user_id, trigger_id |
| chat_member (new/delete) | Member added/removed from chat | chat_id, user_id, event |
| company_member (new/update/delete) | Workspace member changes | user_id, event (no chat needed) |
| link_shared | URL shared (unfurl bots) | url, message_id, chat_id |

### Alternative: Polling (when webhook URL is not available)
Enable "Save event history" in bot settings, then poll:
\`\`\`typescript
// Poll for events periodically
const events = await client.bots.getWebhookEvents()
for (const event of events.data) {
  processEvent(event)
  await client.bots.deleteWebhookEvent(event.id) // Remove processed event
}
\`\`\`

`;

  // Q5: Rate limiting + retry
  content += `## How to handle rate limits and implement retry logic

Both SDKs handle retry automatically — 3 retries with exponential backoff for \`429\` and \`5xx\` errors. No extra code needed:

### TypeScript SDK
\`\`\`typescript
import { PachcaClient, ApiError } from "@pachca/sdk"

const client = new PachcaClient("YOUR_TOKEN")

// SDK retries 429 and 5xx automatically (3 attempts, exponential backoff)
// Just call methods normally — retries are transparent
const users = await client.users.listUsersAll()

// If all retries are exhausted, ApiError is thrown
try {
  await client.messages.createMessage({
    message: { entityId: 12345, content: "Hello" }
  })
} catch (error) {
  if (error instanceof ApiError) {
    // After 3 retries, the error is surfaced — check error.errors for details
    for (const e of error.errors ?? []) {
      console.error(e.key, e.message)
    }
  }
}
\`\`\`

### Python SDK
\`\`\`python
from pachca.client import PachcaClient
from pachca.models import ApiError

client = PachcaClient("YOUR_TOKEN")

# SDK retries 429 and 5xx automatically (3 attempts, exponential backoff)
# Just call methods normally — retries are transparent
users = await client.users.list_users_all()

# If all retries are exhausted, ApiError is raised
try:
    await client.messages.create_message(request)
except ApiError as e:
    # After 3 retries, the error is surfaced — check e.errors for details
    for err in e.errors:
        print(err.key, err.message)
\`\`\`

Rate limits by endpoint category:
- Messages send/edit/delete: ~4 req/sec per chat (burst: 30/sec for 5s)
- Messages read: ~10 req/sec per token
- All other endpoints: ~50 req/sec per token
- On 429: SDK respects \`Retry-After\` header automatically

`;

  // Q6: File upload
  content += `## How to upload files and attach to messages

File upload is a 3-step process: get presigned params → upload to S3 → attach to message.

### TypeScript SDK
\`\`\`typescript
import { PachcaClient, FileType } from "@pachca/sdk"
import fs from "fs"
import path from "path"

const client = new PachcaClient("YOUR_TOKEN")

const filePath = "./report.pdf"
const fileName = path.basename(filePath)
const fileBuffer = fs.readFileSync(filePath)

// Step 1: Get S3 presigned upload parameters
const params = await client.common.getUploadParams()

// Step 2: Upload file to S3 (direct_url is an external presigned URL, not Pachca API)
await client.common.uploadFile(params.directUrl, {
  contentDisposition: params.contentDisposition,
  acl: params.acl,
  policy: params.policy,
  xAmzCredential: params.xAmzCredential,
  xAmzAlgorithm: params.xAmzAlgorithm,
  xAmzDate: params.xAmzDate,
  xAmzSignature: params.xAmzSignature,
  key: params.key,
  file: new File([fileBuffer], fileName)
})

// Step 3: Attach file to message (replace ${'$'}{filename} in key with actual name)
const fileKey = params.key.replace("${'$'}{filename}", fileName)
await client.messages.createMessage({
  message: {
    entityId: 12345,
    content: "Report attached",
    files: [{ key: fileKey, name: fileName, fileType: FileType.File, size: fileBuffer.length }]
  }
})
\`\`\`

### Python SDK
\`\`\`python
from pachca.client import PachcaClient
from pachca.models import (
    FileUploadRequest, MessageCreateRequest, MessageCreateRequestMessage,
    MessageCreateRequestFile, FileType
)
import os

client = PachcaClient("YOUR_TOKEN")

file_path = "report.pdf"
file_name = os.path.basename(file_path)

# Step 1: Get S3 presigned upload parameters
params = await client.common.get_upload_params()

# Step 2: Upload file to S3 (direct_url is an external presigned URL, not Pachca API)
with open(file_path, "rb") as f:
    await client.common.upload_file(
        direct_url=params.direct_url,
        request=FileUploadRequest(
            content_disposition=params.content_disposition,
            acl=params.acl,
            policy=params.policy,
            x_amz_credential=params.x_amz_credential,
            x_amz_algorithm=params.x_amz_algorithm,
            x_amz_date=params.x_amz_date,
            x_amz_signature=params.x_amz_signature,
            key=params.key,
            file=f.read()
        )
    )

# Step 3: Attach file to message (replace ${'$'}{filename} in key with actual name)
file_key = params.key.replace("${'$'}{filename}", file_name)
await client.messages.create_message(MessageCreateRequest(
    message=MessageCreateRequestMessage(
        entity_id=12345,
        content="Report attached",
        files=[MessageCreateRequestFile(key=file_key, name=file_name, file_type=FileType.FILE, size=os.path.getsize(file_path))]
    )
))
\`\`\`

File types: \`FileType.File\` / \`FileType.FILE\` (any file), \`FileType.Image\` / \`FileType.IMAGE\` (add \`width\` and \`height\`).

`;

  // Q8: User status + presence
  content += `## How to monitor user status and presence

### TypeScript SDK
\`\`\`typescript
import { PachcaClient } from "@pachca/sdk"

const client = new PachcaClient("YOUR_TOKEN")

// Get any user's status
const status = await client.users.getUserStatus(userId)
console.log(status.emoji, status.title, status.isAway, status.awayMessage)

// Set your own status
await client.profile.updateStatus({
  status: { emoji: "🏖️", title: "On vacation", isAway: true, awayMessage: "Back on Monday" }
})

// Set status with expiration
await client.profile.updateStatus({
  status: { emoji: "🍽️", title: "Lunch break", expiresAt: new Date(Date.now() + 3600000).toISOString() }
})

// Clear your status
await client.profile.deleteStatus()
\`\`\`

### Python SDK
\`\`\`python
from pachca.client import PachcaClient
from pachca.models import StatusUpdateRequest, StatusUpdateRequestStatus

client = PachcaClient("YOUR_TOKEN")

# Get any user's status
status = await client.users.get_user_status(user_id)
print(status.emoji, status.title, status.is_away, status.away_message)

# Set your own status
await client.profile.update_status(StatusUpdateRequest(
    status=StatusUpdateRequestStatus(emoji="🏖️", title="On vacation", is_away=True, away_message="Back on Monday")
))

# Clear your status
await client.profile.delete_status()
\`\`\`

### Polling pattern for monitoring status changes
Pachca does not provide real-time webhooks for status/presence changes. Use polling with caching:

\`\`\`typescript
const cache = new Map<number, { status: any; fetchedAt: number }>()
const CACHE_TTL = 60_000 // Minimum 60 seconds between polls per user

async function getUserPresence(userId: number) {
  const cached = cache.get(userId)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached.status
  const status = await client.users.getUserStatus(userId)
  cache.set(userId, { status, fetchedAt: Date.now() })
  return status
}

// Batch refresh for a team
async function refreshTeamPresences(userIds: number[]) {
  const results = []
  for (const id of userIds) {
    cache.delete(id)
    results.push(await getUserPresence(id))
  }
  return results
}
\`\`\`

Status fields: \`emoji\` (string), \`title\` (string), \`expires_at\` (ISO datetime or null), \`is_away\` (boolean), \`away_message\` (string). Admin can manage any user's status via PUT/DELETE /users/{id}/status.

`;

  content += '---\n\n';
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

  content += '\n---\n\n';

  content += generateLibraryRules();
  content += '---\n\n';
  const howToContent = generateHowToGuides();
  validateSdkCodeBlocks('How-to Guides', howToContent);
  content += howToContent;

  content += '# Руководства\n\n';
  let guidesContent = '';
  for (const guide of guidePages) {
    const guideContent = await generateStaticPageMarkdownAsync(guide.path);
    if (guideContent) {
      guidesContent += guideContent;
      guidesContent += '\n---\n\n';
    }
  }
  validateSdkCodeBlocks('Guides (MDX)', guidesContent);
  content += guidesContent;

  content += '# API Методы\n\n';
  for (const tag of sortedTags) {
    const endpoints = grouped.get(tag)!;
    content += `## API: ${tag}\n\n`;
    for (const endpoint of endpoints) {
      const endpointMarkdown = generateEndpointMarkdown(endpoint, baseUrl);
      content += endpointMarkdown;

      // Add TypeScript and Python SDK examples for each endpoint
      const sdkExamples = getSdkExamples(endpoint.id);
      if (sdkExamples.typescript || sdkExamples.python) {
        content += '\n## SDK примеры\n';
        if (sdkExamples.typescript) {
          content += '\n### TypeScript\n\n```typescript\n' + sdkExamples.typescript + '\n```\n';
        }
        if (sdkExamples.python) {
          content += '\n### Python\n\n```python\n' + sdkExamples.python + '\n```\n';
        }
      }

      content += '\n---\n\n';
    }
  }

  content += '## Дополнительная информация\n\n';
  content += '- **Веб-сайт**: https://pachca.com/\n';
  content += '- **Получить помощь**: team@pachca.com\n\n';
  content += '---\n\n';
  content += '_Документация автоматически сгенерирована из OpenAPI спецификации_\n';

  // Post-process: insert Document Map with calculated line ranges
  content = insertDocumentMap(content);

  return content;
}

/**
 * Post-process: scan generated content for section headers,
 * build a Document Map with real line ranges, and insert it after TOC.
 */
function insertDocumentMap(content: string): string {
  const lines = content.split('\n');

  // Find section start lines (1-based)
  const markers: { name: string; desc: string; line: number }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l === '# LIBRARY RULES')
      markers.push({
        name: 'LIBRARY RULES',
        desc: 'Core rules, auth, pagination, rate limits, SDK overview',
        line: i + 1,
      });
    else if (l === '# How-to Guides')
      markers.push({
        name: 'How-to Guides',
        desc: 'Step-by-step solutions with TypeScript + Python code',
        line: i + 1,
      });
    else if (l === '# Руководства')
      markers.push({
        name: 'Guides',
        desc: 'Full SDK docs (6 languages), webhooks, bots, forms, n8n',
        line: i + 1,
      });
    else if (l === '# API Методы')
      markers.push({
        name: 'API Reference',
        desc: 'Complete REST API — every endpoint with schemas and examples',
        line: i + 1,
      });
  }

  if (markers.length === 0) return content;

  // Build the map block
  const mapLines = [
    '',
    '## Document Map',
    '',
    '| Section | Description | Lines |',
    '|---------|-------------|-------|',
  ];
  const mapBlockSize = mapLines.length + markers.length; // join adds length-1 newlines

  // Adjust line numbers by the map block we're about to insert
  for (const m of markers) {
    m.line += mapBlockSize;
  }
  const totalLines = lines.length + mapBlockSize;

  for (let i = 0; i < markers.length; i++) {
    const start = markers[i].line;
    const end = i < markers.length - 1 ? markers[i + 1].line - 1 : totalLines;
    mapLines.push(`| ${markers[i].name} | ${markers[i].desc} | ${start}–${end} |`);
  }
  mapLines.push('');

  // Insert after TOC (before the first ---)
  const insertIdx = content.indexOf('\n---\n\n# LIBRARY RULES');
  if (insertIdx === -1) return content;

  return content.slice(0, insertIdx) + mapLines.join('\n') + content.slice(insertIdx);
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
