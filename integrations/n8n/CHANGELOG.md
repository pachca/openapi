# Changelog

## 2.0.1 (2026-04-07)

### Bug Fixes

- Fix Form Visual Builder "Could not get parameter" error — `Type` field must be first in `fixedCollection` values so other fields can reference it via `displayOptions.show.type`
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
