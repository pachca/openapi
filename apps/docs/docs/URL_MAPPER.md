# URL Mapper Documentation

## Overview

The URL mapper automatically generates unique documentation URLs from OpenAPI endpoint definitions based on their HTTP method and path structure. This approach is universal and doesn't require manual configuration for each endpoint.

## How It Works

### URL Format

Generated URLs follow this pattern:

```
/{section}/{action}[-{sub-action}]
```

Where:

- `{section}` = tag name converted to URL-friendly format (from TAG_URL_MAPPING)
- `{action}` = automatically determined from path structure and HTTP method
- `{sub-action}` = optional, for nested resources

### Action Extraction Logic

The mapper analyzes the API path structure and HTTP method to determine the appropriate action:

#### 1. Standard CRUD Operations (Single Resource)

| API Path      | Method | Generated Action | Example URL     |
| ------------- | ------ | ---------------- | --------------- |
| `/chats`      | GET    | `list`           | `/chats/list`   |
| `/chats/{id}` | GET    | `get`            | `/chats/get`    |
| `/chats`      | POST   | `create`         | `/chats/create` |
| `/chats/{id}` | PUT    | `update`         | `/chats/update` |
| `/chats/{id}` | DELETE | `delete`         | `/chats/delete` |

#### 2. Sub-Resources (Nested Collections)

Redundant sub-resource suffix is stripped when it matches the section name.

| API Path                       | Method | Generated Action | Example URL            |
| ------------------------------ | ------ | ---------------- | ---------------------- |
| `/chats/{id}/members`          | GET    | `list`           | `/members/list`        |
| `/chats/{id}/members`          | POST   | `add`            | `/members/add`         |
| `/chats/{id}/members/{userId}` | GET    | `get-members`    | `/members/get-members` |
| `/chats/{id}/members/{userId}` | PUT    | `update`         | `/members/update`      |
| `/chats/{id}/members/{userId}` | DELETE | `remove`         | `/members/remove`      |

#### 3. Special Actions

Action-only sub-paths return the verb directly, regardless of HTTP method.

| API Path                | Method | Generated Action | Example URL        |
| ----------------------- | ------ | ---------------- | ------------------ |
| `/chats/{id}/archive`   | PUT    | `archive`        | `/chats/archive`   |
| `/chats/{id}/unarchive` | PUT    | `unarchive`      | `/chats/unarchive` |
| `/chats/{id}/leave`     | DELETE | `leave`          | `/members/leave`   |
| `/views/open`           | POST   | `open`           | `/views/open`      |
| `/messages/{id}/pin`    | POST   | `pin`            | `/messages/pin`    |
| `/messages/{id}/pin`    | DELETE | `unpin`          | `/messages/unpin`  |

#### 4. Action-Only Endpoints (Non-RESTful)

Single-segment paths that don't follow standard CRUD patterns:

| API Path             | Method | Generated Action    | Example URL                 |
| -------------------- | ------ | ------------------- | --------------------------- |
| `/direct_url`        | POST   | `direct-url`        | `/common/direct-url`        |
| `/uploads`           | POST   | `uploads`           | `/common/uploads`           |
| `/custom_properties` | GET    | `custom-properties` | `/common/custom-properties` |

> **Common section rule:** for single-segment paths in the `Common` tag that would otherwise generate a bare CRUD verb (`list`, `create`, etc.), the mapper replaces the verb with the resource name from the path. This avoids ambiguous commands like `pachca common list` or `pachca common create`.

#### 5. Collection Actions (No Parameter Before Sub-Resource)

| API Path              | Method | Generated Action | Example URL              |
| --------------------- | ------ | ---------------- | ------------------------ |
| `/chats/exports`      | POST   | `request-export` | `/common/request-export` |
| `/chats/exports/{id}` | GET    | `get-exports`    | `/common/get-exports`    |

## Key Features

### 1. **Zero Configuration**

- No need to manually define URL mappings for each endpoint
- Automatically handles new endpoints added to OpenAPI spec

### 2. **Guaranteed Uniqueness**

- Combination of method + path structure ensures unique URLs
- All 53 endpoints generate unique documentation URLs

### 3. **Predictable Patterns**

- Follows RESTful conventions
- Easy to understand and navigate

### 4. **Self-Documenting**

- URL structure reflects the API structure
- Action names are descriptive (e.g., `add`, `remove`, `archive`)

## Manual Overrides

If the auto-generated URL is ugly or confusing, add an entry to `OPERATION_OVERRIDES` at the top of `lib/openapi/mapper.ts`.

Key format: `"METHOD /path"` (HTTP method in uppercase, path as in OpenAPI spec).
Value format: `"/section/action"` (the desired CLI URL).

```typescript
const OPERATION_OVERRIDES: Record<string, string> = {
  'GET /messages/{id}/read_member_ids': '/read-member/list-readers',
};
```

Current overrides:

| Key                                  | Value                       | Reason                                             |
| ------------------------------------ | --------------------------- | -------------------------------------------------- |
| `GET /messages/{id}/read_member_ids` | `/read-member/list-readers` | Auto-generated `list-read-member-ids` is redundant |

## Tag to Section Mapping

Tags from OpenAPI are converted to URL-friendly section names:

```typescript
const TAG_URL_MAPPING: Record<string, string> = {
  Сообщения: 'messages',
  Сотрудники: 'users',
  Чаты: 'chats',
  // ... etc
};
```

## Testing

To verify URL generation and check for duplicates, the project includes validation during build:

```bash
npm run build
```

The build process will:

1. Parse the OpenAPI specification
2. Generate URLs for all endpoints
3. Verify uniqueness
4. Build the documentation site

## Benefits

1. **Maintainability**: No need to update URL mappings when API changes
2. **Consistency**: All URLs follow the same logical pattern
3. **Reliability**: Automatic duplicate detection prevents URL collisions
4. **Scalability**: Easily handles new endpoints without manual intervention

## Examples from Current API

```
GET    /chats                        → /chats/list
GET    /chats/{id}                   → /chats/get
PUT    /chats/{id}                   → /chats/update
PUT    /chats/{id}/archive           → /chats/archive
PUT    /chats/{id}/unarchive         → /chats/unarchive
GET    /chats/{id}/members           → /members/list
POST   /chats/{id}/members           → /members/add
DELETE /chats/{id}/members/{userId}  → /members/remove
POST   /messages/{id}/pin            → /messages/pin
DELETE /messages/{id}/pin            → /messages/unpin
GET    /profile                      → /profile/get
```
