# Changelog

## 2.0.0 (2026-04-03)

### New

- **Auto-generated from OpenAPI** with full v1 backward compatibility
- **New resources:** Member, Read Member, Link Preview, Search, Security
- **Task resource** now supports full CRUD (was create-only)
- **Auto-pagination** with Return All / Limit (cursor-based)
- **AI Tool Use** support (`usableAsTool: true`)
- **Pachca Trigger** node with automatic webhook registration
- **English descriptions** for common fields
- **Bot update** with dedicated webhookUrl field

### v1 Compatibility

All v1 workflows continue to work without changes:

- Resource values preserved: `reactions`, `status`, `customFields`
- Operation values preserved: `send`, `getById`, `addReaction`, etc.
- Parameter names preserved: `reactionsMessageId`, `threadMessageId`, etc.
- Legacy pagination (`per`/`page`) supported alongside cursor-based
- v1 alias operations: `getMembers`, `addUsers`, `removeUser`, `updateRole`, `leaveChat`, `getReadMembers`, `unfurl`
- v1 collections: `paginationOptions`, `filterOptions`, `additionalOptions`
- v1 hidden params: `getAllUsersNoLimit`, `buttonLayout`
