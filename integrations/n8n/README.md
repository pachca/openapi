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

Or install from archive (Docker, custom n8n images):

```bash
# Download from GitHub Releases
# Find the latest n8n-nodes-pachca.tgz at:
# https://github.com/pachca/openapi/releases?q=n8n
wget https://github.com/pachca/openapi/releases/download/n8n-v2.2.2/n8n-nodes-pachca.tgz

# Via npm (recommended)
cd ~/.n8n/nodes && npm install ./n8n-nodes-pachca.tgz

# Or extract directly (no npm needed)
tar -xzf n8n-nodes-pachca.tgz -C ~/.n8n/nodes/

# Restart n8n
```

## Nodes

### Pachca

Main node for interacting with the Pachca API. Supports 19 resources with the operations below:

| Resource          | Operations                                                                                                                                                                                                                                                           |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bot               | Create, Get, Get Many, Update, Delete, Update/Delete Avatar, Update Webhook, Recreate Token, Recreate Token Self, Rotate Client Secret, Get Many/Create/Update/Reissue/Delete Token, Get Scopes, Get Many Events, Remove Events, Get Stream, Get Many Workspace Bots |
| Chat              | Create, Get, Get Many, Update, Archive, Unarchive, Update/Delete Avatar, Mark Unread, Request Export, Download Export, Get Many Workspace Chats                                                                                                                      |
| Chat Member       | Get Many, Create, Delete, Update, Leave, Add/Remove Group Tags                                                                                                                                                                                                       |
| Custom Property   | Get                                                                                                                                                                                                                                                                  |
| Draft             | Create, Get, Get Many, Update, Delete                                                                                                                                                                                                                                |
| File              | Create (S3 two-stage upload), Get                                                                                                                                                                                                                                    |
| Form              | Create (visual builder or JSON), Submit Response                                                                                                                                                                                                                     |
| Group Tag         | Create, Get, Get Many, Update, Delete, Get Many Users                                                                                                                                                                                                                |
| Important Message | Get Many, Create, Delete                                                                                                                                                                                                                                             |
| Message           | Create, Get, Get Many, Update, Delete, Pin, Unpin, Unfurl                                                                                                                                                                                                            |
| OAuth             | Get Info                                                                                                                                                                                                                                                             |
| Profile           | Get, Update/Delete Avatar, Get/Update/Delete Status                                                                                                                                                                                                                  |
| Reaction          | Create, Delete, Get Many                                                                                                                                                                                                                                             |
| Read Member       | Get Many Read Member IDs                                                                                                                                                                                                                                             |
| Reminder          | Create, Get, Get Many, Update, Delete                                                                                                                                                                                                                                |
| Search            | Get Many Chats, Get Many Messages, Get Many Users                                                                                                                                                                                                                    |
| Security          | Get Many                                                                                                                                                                                                                                                             |
| Thread            | Create, Create Standalone, Get, Get Many                                                                                                                                                                                                                             |
| User              | Create, Get, Get Many, Update, Delete, Update/Delete Avatar, Get/Update/Delete Status                                                                                                                                                                                |

### Pachca Trigger

Webhook-based trigger that listens for 19 Pachca events:

| Category     | Events                                                     |
| ------------ | ---------------------------------------------------------- |
| Messages     | new, updated, deleted                                      |
| Reactions    | new, deleted                                               |
| Interactive  | button pressed, form submitted, link shared                |
| Chat members | added, removed                                             |
| Users        | invited, confirmed, activated, suspended, updated, deleted |
| Video calls  | started, finished, recording ready                         |
| Wildcard     | all events                                                 |

Pachca sends a bot only the events ticked on the **Outgoing webhook** tab of the bot settings, in both setup modes: the node sets only the webhook URL. A new bot is subscribed only to new messages in the "Starting with commands" mode with an empty command list, so it receives nothing until you tick the events you need and choose **Any messages** or list commands for `New Message`. Which tab item matches which event: [dev.pachca.com/guides/n8n/trigger](https://dev.pachca.com/guides/n8n/trigger#podderzhivaemye-sobytiya).

A bot has a single webhook URL, so give each workflow with Pachca Trigger its own bot, or handle several events in one workflow with `All Events` and a Switch node.

Automatic mode registers the webhook URL when the workflow is activated and clears it on deactivation. A bot token self-registers via `PUT /bot/webhook` (no Bot ID needed) and needs the `profile:read` and `bot_self:webhook:write` scopes; a personal token uses `PUT /bots/:id` and needs the `bots:write` scope, editor access to the bot, and the Bot ID set in the trigger node.

## Credentials

Create a **Pachca API** credential with:

| Field                      | Required | Description                                                                                                                                                                              |
| -------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Base URL**               | no       | Default: `https://api.pachca.com/api/shared/v1`. Keep the default.                                                                                                                       |
| **Access Token**           | yes      | Bot or personal API token                                                                                                                                                                |
| **Webhook Signing Secret** | no       | For HMAC-SHA256 verification of incoming webhooks (`pachca-signature` header). Copy **Signing secret** from the bot's Outgoing webhook tab.                                              |
| **Webhook Allowed IPs**    | no       | Comma-separated IPs allowed to send webhooks. Pachca's addresses: [dev.pachca.com/guides/webhook/handler](https://dev.pachca.com/guides/webhook/handler#bezopasnost). Empty = allow all. |

**Where to get tokens:**

- **Bot token** — Integrations > Bots, then the API tab of the bot. The value is shown once, when the token is created
- **Personal token** — Integrations > API

Credentials are tested by calling `GET /oauth/token/info`.

## Key Features

### Pagination

All list operations (Get Many) support automatic cursor-based pagination:

- **Return All** = true — fetches all pages automatically
- **Return All** = false — returns up to **Limit** results (default: 50)

### Simplify

Toggle **Simplify** (on by default) to return only key fields from API responses. Turn off for full response.

- **Message** — id, entity_id, chat_id, content, user_id, created_at
- **Chat** — id, name, channel, public, member_ids, created_at
- **User** — id, first_name, last_name, nickname, email, role, suspended
- **Reminder** — id, content, kind, status, priority, due_at, created_at
- **Bot** — id, webhook; bot tokens: id, name, scopes, created_at, last_used_at; history events: id, event_type, payload, created_at
- **Group Tag** — id, name, users_count; tag users: the User fields above
- **Reaction** — code, name, user_id, created_at

Other resources return the full response.

### Searchable Dropdowns

Chat, user and Entity ID fields support search by name — type to find instead of entering numeric IDs.

### Message Buttons

Set **Button Layout** to **Single Row** or **Multiple Rows** to build buttons visually, or to **Raw JSON** to paste them as JSON (send `[]` on update to remove all buttons):

```json
[
  [
    { "text": "Approve", "data": "approve" },
    { "text": "Reject", "data": "reject" }
  ]
]
```

Button types: **URL** (opens link) and **Data** (sends `button_pressed` webhook event).

### Forms

Create modal forms with two builder modes:

- **Visual Builder** — add blocks (text input, select, radio, checkboxes, date/time, file upload)
- **JSON** — paste blocks from the visual playground

Forms require a `trigger_id` from a `button_pressed` webhook event (valid for 3 seconds).

### Avatar Upload

Upload avatar images for profiles and users via `multipart/form-data`. Uses binary data from a previous node (HTTP Request, Read Binary File). The **Input Binary Field** parameter (default: `data`) specifies which binary property contains the image.

### File Upload

Two-stage S3 upload with automatic retry. Sources: **URL** or **Binary Data** from previous workflow nodes.

### Clearing a Value

An update clears a value by sending `null`, and each kind of field has its own way to send it:

- **Option field** — the **None** option, such as **Kind** in Bot > Update, which deletes the incoming webhook
- **JSON field** — the text `null`, such as **OAuth Client** in Bot > Update, which disables authorization on behalf of an employee
- **Number field** — the **Clear** toggle next to it, such as **Clear Parent Message ID** in Draft > Update, which removes the reply

### AI Tool Use

Both nodes have `usableAsTool: true` — they can be used as tools for AI Agent nodes in n8n.

### Error Handling

- **429 retry** — waits for the `Retry-After` header, up to 3 retries; a `Retry-After` over a minute (daily chat cap or overload block) fails at once
- **5xx retry** — 500, 502, 503 and 504 on `GET`, `PUT` and `DELETE` only, exponential backoff with jitter, up to 3 retries; a `POST` (send, create) is never retried after a 5xx, and a 504 with code `timeout` (search did not finish) fails at once
- **continueOnFail** — supported on all operations

## v1 Compatibility

Version 2 is fully backward compatible with v1. Existing v1 workflows continue to work without modification.

The node uses the **VersionedNodeType** pattern with `defaultVersion: 2`:

- Existing nodes keep `typeVersion: 1` with v1 UI and parameter names
- New nodes get `typeVersion: 2` with cleaner naming and new resources
- A shared router translates v1 names to v2 at runtime

**Renamed resources:** `reactions` → `reaction`, `status` → `profile`, `customFields` → `customProperty`

**Renamed operations:** `send` → `create`, `getById` → `get`, `addReaction` → `create`, etc.

**New v2 resources:** Chat Member, Draft, Important Message, OAuth, Read Member, Search, Security

To upgrade a v1 node: delete it, add a new Pachca node (defaults to v2), reconfigure with v2 names. The API methods are the same, but in v2 **Simplify** is on by default for Get and Get Many, pagination uses **Return All** / **Limit**, and some parameters are renamed (for example, buttons use **Button Layout**). Check the expressions in the nodes that follow.

## Usage Examples

### Send a message

Set **Resource** = Message, **Operation** = Create:

- **Entity ID** — chat ID (use searchable dropdown or enter number)
- **Content** — message text (supports Markdown)

### Send a message with buttons

Set **Resource** = Message, **Operation** = Create, **Button Layout** = Raw JSON, and paste into **Buttons (JSON)**:

```json
[
  [
    { "text": "Approve", "data": "approve" },
    { "text": "Reject", "data": "reject" }
  ]
]
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

1. **Pachca Trigger** — event `All Events` (a bot has one webhook URL, so one trigger receives both the button press and the form submission)
2. **Switch** — by `type`: `button` for the press, `view` for the submission
3. **Pachca** (Form > Create) — on the button branch: set **Title**, **Trigger ID** (`trigger_id` from the event), choose builder mode
4. On the `view` branch — process the form values from `data`

### Bot echo workflow

1. **Pachca Trigger** — event `New Message`
2. **IF** — filter: `message.user_id` ≠ bot ID
3. **Pachca** (Message > Create) — echo the message back

## Troubleshooting

### 401 Unauthorized

Token is invalid or expired. Check **Access Token** in Credentials. For bot tokens: reissue the token on the API tab of the bot. For personal tokens: create a new one in Integrations > API.

### 403 Forbidden

Token lacks required scopes for this operation, or the operation does not work with this token type. Check available scopes in your token settings. Managing users and tags requires admin-level scopes; the security log is available to the workspace owner on the Corporation plan. Forms, link unfurling and the event history work with a bot token only; drafts and the Important section with a personal token only.

In `Automatic` mode Pachca Trigger reads `GET /profile` to tell a bot token from a personal one, so a bot token needs the `profile:read` scope next to `bot_self:webhook:write`. Without it and with an empty Bot ID the trigger does not activate and names the missing scope: add the scope to the bot token, fill in Bot ID for a personal token, or switch Webhook Setup to `Manual`.

### 429 Too Many Requests

Rate limit exceeded — see [dev.pachca.com/api/limits](https://dev.pachca.com/api/limits) for the current limits. The node retries automatically after the `Retry-After` pause. For bulk operations, add a **Wait** node between steps or split items with **Loop Over Items**.

### Webhook not received (Trigger)

1. **Event not ticked** — tick the event on the bot's Outgoing webhook tab; for `New Message` choose **Any messages** or list commands
2. **Bot not in chat** — bot only receives message, reaction and chat member events from chats it's a member of
3. **Workflow not activated** — click **Activate** in the top right
4. **Webhook URL not set** — in manual mode paste the Production URL into the bot settings; in automatic mode with a personal token set **Bot ID** in the trigger node
5. **Another workflow took the slot** — a bot has one webhook URL; give each workflow with Pachca Trigger its own bot
6. **n8n not reachable** — Pachca can't send webhooks to `localhost`. Use a tunnel (ngrok, Cloudflare Tunnel) or deploy to a server with a public IP

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
