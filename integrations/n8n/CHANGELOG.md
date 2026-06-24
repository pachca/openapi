<!-- markdownlint-disable MD024 -->
# Changelog

## 2.0.13 (2026-06-24)

### Improvements

- Bot: new `Recreate Token` operation — rotate a bot token by its ID
- Bot: new `Recreate Token Self` operation — a bot rotates its own token with its own token
- Bot: incoming webhook settings on `Create`/`Update` and in the response — `Ignore Self Messages` and `Events History Enabled`
- Resources realigned with the API: chat export moved into the `Chat` resource (`Request Export`, `Download Export`), unfurl into `Message` (`Unfurl`), token info into a new `OAuth` resource. Workflows saved with the old `Chat Export` / `Link Preview` / `Profile → Get Info` values keep working

## 2.0.12 (2026-06-19)

### Improvements

- Bot: incoming webhook settings on `Create`/`Update` and in the response — `Template`, `Template Engine`, `Challenge Key`, `Link Preview Enabled`
- Search: message search operation — `Sort` field (`Created At` or `Relevance`)

## 2.0.11 (2026-06-16)

### Improvements

- Bot: configurable token scopes — `Scopes` parameter on Create/Update and `scopes` field in the response
- Bot: new `Update Webhook` operation — the bot self-registers its outgoing webhook URL with its own token
- Trigger: Automatic webhook setup now works with bot tokens — the node self-registers and clears the webhook (no Bot ID needed); personal tokens still need a Bot ID

## 2.0.10 (2026-06-15)

### Improvements

- Bot: new `Create` and `Get` operations
- Message: voice message support — `voice_content` field and `duration_ms` / `waveform` file parameters

## 2.0.9 (2026-05-20)

### Improvements

- Thread: new `Get Many` operation — list available threads with filtering by last message time (`Last Message At After` / `Last Message At Before`) and cursor pagination

## 2.0.8 (2026-05-17)

### Improvements

- Create User: new `chat_ids` parameter — add the employee to the given company chats right at creation (the token must have invite rights for each chat)
- Create User: `role` now accepts `guest`. For the `guest` role `chat_ids` is required and must contain exactly one active chat of your company, otherwise the API returns `400`. Backward compatible — integrations not sending `role: "guest"` / `chat_ids` keep working

## 2.0.7 (2026-05-06)

### Improvements

- Pachca Trigger: `link_shared` webhook payload now carries `skip: boolean` on every link in the `links` array — `true` means the message author hid the preview for this link and the bot must skip it
- Support for the updated cursor-based pagination format in list operations

## 2.0.6 (2026-05-04)

### Improvements

- Pachca Trigger: webhook payloads for `reaction_new`, `reaction_delete` and `view_submit` events now include `chat_id` — id of the chat where the event happened. Always present in the payload, in rare cases may be `null`. Removes the need for an extra `GET /messages/{id}` lookup in reaction handlers. For `view_submit`, `chat_id` reflects the chat at the moment the form was **opened** (not submitted)
- User schema: new `inviter_id` field — ID of the employee who invited this user (`null` for self-registered users or when the inviter has been deleted)
- User schema: `last_name`, `email`, `phone_number`, `department`, `title`, `time_zone`, `last_activity_at` are now correctly typed as nullable (matches actual API behavior — bots without `can_see_personal_data?` get `null` for `email`/`phone_number`)

### Build

- Add `prebuild` script that cleans `e2e/.n8n-test/` before build — prevents `ENAMETOOLONG` failure caused by recursive symlink left over from local E2E runs

## 2.0.5 (2026-04-13)

### Bug Fixes

- Fix Pachca Trigger 403 error with bot tokens — trigger no longer tries to auto-register webhook URL via API; new **Webhook Setup** parameter with Manual (default) and Automatic modes; Manual works with any token type including bot tokens
- Fix v1 file attachments — `fileType` → `file_type` mapping now applied to both v1 top-level `files` and v2 `additionalFields.files` (previously v1 blocks sent camelCase and got 422 `system: null`)
- Fix buttons clear in raw JSON mode — `[]` now clears buttons in PUT message (previously only `[[]]` worked; v1 behavior restored)
- Auto-retry on rate limit and server errors — 429 and 5xx responses are retried up to 3 times, honoring `Retry-After` header, with exponential backoff and jitter (aligns with Pachca's documented retry strategy); removes the need for manual Wait nodes

### Improvements

- Pachca Trigger: Automatic mode detects bot tokens via GET /profile and shows clear error instead of generic 403
- Pachca Trigger: block "Listen for test event" when workflow is already active in Automatic mode (prevents overwriting production webhook URL)
- Pachca Trigger: auto-cleanup of webhook URL on workflow deactivation in Automatic mode

## 2.0.4 (2026-04-08)

### Bug Fixes

- Fix file upload 403 error

## 2.0.3 (2026-04-08)

### Improvements

- Message `content` field now documents mention syntax: `@nickname` or `<@user_id>`
- Clean up node code and UI labels per n8n community node review guidelines

## 2.0.2 (2026-04-07)

### Bug Fixes

- Fix Form JSON mode crash — `formTitle` hidden in JSON mode but required by bodyMap; now extracts `title`, `close_text`, `submit_text` from JSON payload

## 2.0.1 (2026-04-07)

### Bug Fixes

- Fix Form Visual Builder "Could not get parameter" error — `Type` field must be first in `fixedCollection` values so other fields can reference it via `displayOptions.show.type`
- Fix v1→v2 migration crash for Form `createView` operation — `type` parameter didn't exist in v1, now defaults to `modal`
- Fix README archive installation URL (use tag-specific URL instead of unreliable `/releases/latest/`)

## 2.0.0 (2026-04-03)

### New

- **Auto-generated from OpenAPI** with full v1 backward compatibility
- **New resources:** Member, Read Member, Link Preview, Chat Export, Search, Security
- **Task resource** now supports full CRUD (was create-only)
- **Auto-pagination** with Return All / Limit (cursor-based)
- **AI Tool Use** support (`usableAsTool: true`)
- **Pachca Trigger** node with automatic webhook registration
- **English descriptions** for common fields
- **Bot update** with dedicated webhookUrl field

### Security

- **Webhook signature verification** — HMAC-SHA256 via `pachca-signature` header
- **IP allowlist** — restrict incoming webhooks by source IP (`Webhook Allowed IPs` credential field)
- **Replay protection** — reject events older than 5 minutes or timestamped >1 minute in the future
- **Filename sanitization** — strip control characters and null bytes, truncate to 255 chars

### Bug Fixes

- Fix `do-while` + `continue` retry bug in pagination — retries on 429/502/503 no longer silently exit the loop when cursor is undefined
- Fix `resolveResourceLocator` — throw on null/undefined/empty values instead of passing them downstream
- Fix `splitAndValidateCommaList` — reject float values (e.g. `3.14`) in integer mode (`Number.isInteger` instead of `isNaN`)
- Fix replay protection — reject far-future timestamps (>1 minute ahead), not just old ones

### v1 Compatibility

All v1 workflows continue to work without changes:

- Resource values preserved: `reactions`, `status`, `customFields`
- Operation values preserved: `send`, `getById`, `addReaction`, etc.
- Parameter names preserved: `reactionsMessageId`, `threadMessageId`, etc.
- Legacy pagination (`per`/`page`) supported alongside cursor-based
- v1 alias operations: `getMembers`, `addUsers`, `removeUser`, `updateRole`, `leaveChat`, `getReadMembers`, `unfurl`
- v1 collections: `paginationOptions`, `filterOptions`, `additionalOptions`
- v1 hidden params: `getAllUsersNoLimit`, `buttonLayout`
