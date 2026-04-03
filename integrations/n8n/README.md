# n8n-nodes-pachca

Community node for [n8n](https://n8n.io/) to interact with the [Pachca API](https://dev.pachca.com/).

Auto-generated from the [OpenAPI spec](https://github.com/pachca/openapi) — always in sync with the latest API.

## Installation

In your n8n instance:

1. Go to **Settings > Community Nodes**
2. Enter `n8n-nodes-pachca`
3. Click **Install**

Or install via CLI:

```bash
npm install n8n-nodes-pachca
```

Or install from archive:

```bash
wget https://github.com/pachca/openapi/releases/latest/download/n8n-nodes-pachca.tgz
tar -xzf n8n-nodes-pachca.tgz -C ~/.n8n/nodes/
# Restart n8n
```

## Nodes

### Pachca

Main node for interacting with the Pachca API. Supports 18 resources and 60+ operations:

| Resource | Operations |
|----------|-----------|
| Bot | Update, Get Many Events, Remove Events |
| Chat | Create, Get, Get Many, Update, Archive, Unarchive |
| Chat Export | Create, Get |
| Chat Member | Get Many, Create, Delete, Update, Leave, Add/Remove Group Tags |
| Custom Property | Get |
| File | Create (S3 two-stage upload) |
| Form | Create (visual builder, templates, or JSON) |
| Group Tag | Create, Get, Get Many, Update, Delete, Get Many Users |
| Link Preview | Create |
| Message | Create, Get, Get Many, Update, Delete, Pin, Unpin |
| Profile | Get Info, Get, Get/Update/Delete Status |
| Reaction | Create, Delete, Get Many |
| Read Member | Get Many |
| Search | Chats, Messages, Users |
| Security | Get Many |
| Task | Create, Get, Get Many, Update, Delete |
| Thread | Create, Get |
| User | Create, Get, Get Many, Update, Delete, Get/Update/Delete Status |

### Pachca Trigger

Webhook-based trigger that listens for 16 Pachca event types:

| Category | Events |
|----------|--------|
| Messages | new, updated, deleted |
| Reactions | new, deleted |
| Interactive | button pressed, form submitted, link shared |
| Chat members | added, removed |
| Users | invited, confirmed, activated, suspended, updated, deleted |
| Wildcard | all events |

Automatically registers webhooks via the Bot API when workflow is activated. Deactivation removes the webhook.

## Credentials

Create a **Pachca API** credential with:

| Field | Required | Description |
|-------|----------|-------------|
| **Base URL** | no | Default: `https://api.pachca.com/api/shared/v1`. Change only for on-premise. |
| **Access Token** | yes | Bot or personal API token |
| **Bot ID** | no | For automatic webhook registration in Trigger. Auto-detected from bot tokens. Set explicitly for admin tokens. |
| **Signing Secret** | no | For HMAC-SHA256 verification of incoming webhooks (`pachca-signature` header) |
| **Webhook Allowed IPs** | no | Comma-separated IPs allowed to send webhooks. Pachca sends from `37.200.70.177`. Empty = allow all. |

**Where to get tokens:**

- **Bot token** — Bot settings > API tab
- **Personal token** — Settings > Automations > API

Credentials are tested by calling `GET /oauth/token/info`.

## Key Features

### Pagination

All list operations (Get Many) support automatic cursor-based pagination:

- **Return All** = true — fetches all pages automatically
- **Return All** = false — returns up to **Limit** results (default: 50)

### Simplify

Toggle **Simplify** (on by default) to return only key fields from API responses. Turn off for full response.

- **Message** — id, entity_id, chat_id, content, user_id, created_at
- **Chat** — id, name, channel, public, members_count, created_at
- **User** — id, first_name, last_name, nickname, email, role, suspended
- **Task** — id, content, kind, status, priority, due_at, created_at

### Searchable Dropdowns

Chat ID and User ID fields support search by name — type to find instead of entering numeric IDs.

### Message Buttons

Create messages with interactive buttons via JSON:

```json
[[{"text": "Approve", "data": "approve"}, {"text": "Reject", "data": "reject"}]]
```

Button types: **URL** (opens link) and **Data** (sends `button_pressed` webhook event).

### Forms

Create modal forms with three builder modes:

- **Visual Builder** — add blocks (text input, select, radio, checkboxes, date/time, file upload)
- **Templates** — predefined forms (Feedback, Time Off, Survey, Bug Report)
- **JSON** — paste blocks from the visual playground

Forms require a `trigger_id` from a `button_pressed` webhook event (valid for 3 seconds).

### File Upload

Two-stage S3 upload with automatic retry. Sources: **URL** or **Binary Data** from previous workflow nodes.

### AI Tool Use

Both nodes have `usableAsTool: true` — they can be used as tools for AI Agent nodes in n8n.

### Error Handling

- **5xx/429 retry** — exponential backoff with jitter, respects `Retry-After` header (up to 5 attempts)
- **continueOnFail** — supported on all operations

## v1 Compatibility

Version 2 is fully backward compatible with v1. Existing v1 workflows continue to work without modification.

The node uses the **VersionedNodeType** pattern with `defaultVersion: 2`:

- Existing nodes keep `typeVersion: 1` with v1 UI and parameter names
- New nodes get `typeVersion: 2` with cleaner naming and new resources
- A shared router translates v1 names to v2 at runtime

**Renamed resources:** `reactions` → `reaction`, `status` → `profile`, `customFields` → `customProperty`

**Renamed operations:** `send` → `create`, `getById` → `get`, `addReaction` → `create`, etc.

**New v2 resources:** Chat Member, Custom Property, Read Member, Link Preview, Search, Chat Export, Security

To upgrade a v1 node: delete it, add a new Pachca node (defaults to v2), reconfigure with v2 names. API calls are identical.

## Usage Examples

### Send a message

Set **Resource** = Message, **Operation** = Create:

- **Entity ID** — chat ID (use searchable dropdown or enter number)
- **Content** — message text (supports Markdown)

### Send a message with buttons

Set **Resource** = Message, **Operation** = Create, then in **Additional Fields** add **Buttons**:

```json
[[{"text": "Approve", "data": "approve"}, {"text": "Reject", "data": "reject"}]]
```

When a user clicks a Data button, the Pachca Trigger node receives a `button_pressed` event with the button's `data` value.

### Upload a file and attach to message

1. **Pachca** (File > Create) — upload file from URL or binary data, get `key` in response
2. **Pachca** (Message > Create) — send message with the file key in the `files` field

### Search and process results

Set **Resource** = Search, **Operation** = Get Many Messages:

- **Query** — search text
- **Return All** = false, **Limit** = 10

### Open a modal form

1. **Pachca Trigger** — event `Button Pressed` (provides `trigger_id`)
2. **Pachca** (Form > Create) — set **Title**, **Trigger ID**, choose builder mode
3. **Pachca Trigger** — event `Form Submitted` (in a separate workflow)

### Bot echo workflow

1. **Pachca Trigger** — event `New Message`
2. **IF** — filter: `message.user_id` ≠ bot ID
3. **Pachca** (Message > Create) — echo the message back

## Troubleshooting

### 401 Unauthorized

Token is invalid or expired. Check **Access Token** in Credentials. For bot tokens: Bot settings > API tab. For personal tokens: Settings > Automations > API.

### 403 Forbidden

Token lacks required scopes for this operation. Check available scopes in your token settings. Admin operations (managing users, tags, security log) require admin-level scopes.

### 429 Too Many Requests

Rate limit exceeded (~4 req/sec for messages, ~50 req/sec for other operations). The node retries automatically with exponential backoff. For bulk operations, add a **Wait** node between steps.

### Webhook not received (Trigger)

1. **Bot not in chat** — bot only receives events from chats it's a member of
2. **Workflow not activated** — click **Activate** in the top right
3. **Bot ID missing** — set Bot ID in Credentials for auto-registration, or configure webhook URL manually in bot settings
4. **n8n not reachable** — Pachca can't send webhooks to `localhost`. Use a tunnel (ngrok, Cloudflare Tunnel) or deploy to a server with a public IP

### Form not opening

`trigger_id` from a `button_pressed` event expires in **3 seconds**. Place the Form > Create node immediately after the Trigger, with no Wait nodes or long operations in between.

### Node not showing in n8n

1. Restart n8n after installing the package
2. Check n8n logs for loading errors
3. Verify the package is in the correct directory (`~/.n8n/nodes/` or `~/.n8n/custom/node_modules/`)

## Support

- **GitHub Issues** — [github.com/pachca/openapi/issues](https://github.com/pachca/openapi/issues)
- **Pachca API docs** — [dev.pachca.com](https://dev.pachca.com)
- **n8n Community** — [community.n8n.io](https://community.n8n.io)

## Development

This node is auto-generated from the OpenAPI specification:

```bash
# Generate node files from OpenAPI
bun run integrations/n8n/scripts/generate-n8n.ts

# Run tests
cd integrations/n8n && npx vitest run

# Type check
cd integrations/n8n && npx tsc --noEmit

# Build for distribution
cd integrations/n8n && npx n8n-node build

# Full CI check (from repo root)
npx turbo check
```

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for architecture, local testing, and adding new endpoints.

See [docs/CONTRIBUTORS.md](docs/CONTRIBUTORS.md) for project structure and contribution guidelines.

## License

MIT
