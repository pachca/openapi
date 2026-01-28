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

| API Path                       | Method | Generated Action | Example URL                    |
| ------------------------------ | ------ | ---------------- | ------------------------------ |
| `/chats/{id}/members`          | GET    | `list-members`   | `/chat-members/list-members`   |
| `/chats/{id}/members`          | POST   | `add-members`    | `/chat-members/add-members`    |
| `/chats/{id}/members/{userId}` | GET    | `get-members`    | `/chat-members/get-members`    |
| `/chats/{id}/members/{userId}` | PUT    | `update-members` | `/chat-members/update-members` |
| `/chats/{id}/members/{userId}` | DELETE | `remove-member`  | `/chat-members/remove-member`  |

#### 3. Special Actions

| API Path                | Method | Generated Action   | Example URL               |
| ----------------------- | ------ | ------------------ | ------------------------- |
| `/chats/{id}/archive`   | PUT    | `update-archive`   | `/chats/update-archive`   |
| `/chats/{id}/unarchive` | PUT    | `update-unarchive` | `/chats/update-unarchive` |
| `/messages/{id}/pin`    | POST   | `pin`              | `/messages/pin`           |
| `/messages/{id}/pin`    | DELETE | `unpin`            | `/messages/unpin`         |

#### 4. Action-Only Endpoints (Non-RESTful)

Single-segment paths that don't follow standard CRUD patterns:

| API Path      | Method | Generated Action | Example URL          |
| ------------- | ------ | ---------------- | -------------------- |
| `/direct_url` | POST   | `direct-url`     | `/common/direct-url` |
| `/uploads`    | POST   | `uploads`        | `/common/uploads`    |

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
- Action names are descriptive (e.g., `add-members`, `remove-tag`)

## Manual Overrides

If you need to customize a specific endpoint's URL, use the override maps at the top of `lib/openapi/mapper.ts`:

```typescript
const OPERATION_URL_OVERRIDES: Record<string, string> = {
  ChatOperations_updateChat: '/chats/custom-action',
};

const OPERATION_TITLE_OVERRIDES: Record<string, string> = {
  ChatOperations_updateChat: 'Custom Title',
};
```

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
PUT    /chats/{id}/archive           → /chats/update-archive
PUT    /chats/{id}/unarchive         → /chats/update-unarchive
GET    /chats/{id}/members           → /chat-members/list-members
POST   /chats/{id}/members           → /chat-members/add-members
DELETE /chats/{id}/members/{userId}  → /chat-members/remove-member
POST   /messages/{id}/pin            → /messages/pin
DELETE /messages/{id}/pin            → /messages/unpin
```
