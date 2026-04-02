# Development Guide

## Architecture

The n8n node is **auto-generated** from the Pachca OpenAPI specification using the **VersionedNodeType** pattern (same as Slack, Gmail, HTTP Request in n8n-nodes-base):

```
TypeSpec (typespec.tsp)
    |
OpenAPI YAML (openapi.yaml + overlay.en.yaml)
    |
n8n Node Generator (scripts/generate-n8n.ts)
    |
nodes/Pachca/
|- Pachca.node.ts          <- VersionedNodeType wrapper (defaultVersion: 2)
|- SharedRouter.ts         <- Shared router with V1->V2 name translation
|- V1/
|   |- PachcaV1.node.ts    <- Frozen V1 class (from npm v1.0.27)
|   +- *Description.ts     <- 12 frozen V1 description files
+- V2/
    |- PachcaV2.node.ts    <- Generated V2 class
    +- *Description.ts     <- 18 generated V2 description files
```

- Existing workflows keep `typeVersion: 1` -> load PachcaV1 with V1 UI
- New workflows get `typeVersion: 2` -> load PachcaV2 with clean V2 UI
- Node Creator shows only V2 operations (no duplicates)
- V1 nodes show a yellow "New node version available" banner

### Generated Files (do not edit manually)

| File | What is generated |
|------|-------------------|
| `Pachca.node.ts` | VersionedNodeType wrapper with V1/V2 classes |
| `SharedRouter.ts` | Shared router with V1_RESOURCE_MAP, V1_OP_MAP, and ROUTES |
| `V2/PachcaV2.node.ts` | V2 node class with resource list |
| `V2/*Description.ts` | 18 V2 resource descriptions (operations, fields, routing) |
| `PachcaApi.credentials.ts` | Credential type with fields and test endpoint |

### Frozen V1 Files (do not edit)

| File | What it contains |
|------|-----------------|
| `V1/PachcaV1.node.ts` | Frozen V1 node class from npm v1.0.27 |
| `V1/*Description.ts` | 12 frozen V1 resource descriptions |

These files were captured by `scripts/freeze-v1.ts` and must not be modified. They ensure existing V1 workflows continue to work.

### Hand-Written Files

| File | Purpose |
|------|---------|
| `GenericFunctions.ts` | Cursor paginator, body wrapper, S3 upload, error handler, button transformer, form resolver, webhook signature verification, 5xx/429 retry with backoff |
| `PachcaTrigger.node.ts` | Webhook trigger with auto-registration, 16 event types, signature verification |
| `V2/FormDescription.ts` | Form resource with template/JSON builder modes |

### Source Data

| Source | What it provides |
|--------|-----------------|
| `@pachca/openapi-parser` | API endpoints, schemas, parameters |
| `packages/spec/workflows.ts` | English descriptions for operations |
| `packages/spec/examples.ts` | Form templates (Feedback, Time Off, Survey, Bug Report) |
| `packages/generator/src/naming.ts` | Case conversion utilities |
| `apps/docs/lib/openapi/mapper.ts` | URL generation for API docs |

## Local Development

```bash
# Install dependencies
bun install

# Generate the node from OpenAPI
bun run integrations/n8n/scripts/generate-n8n.ts

# Run unit + contract tests (excludes e2e)
cd integrations/n8n && npx vitest run

# Type check
cd integrations/n8n && npx tsc --noEmit

# Lint (n8n community node rules)
cd integrations/n8n && npx eslint nodes/ credentials/

# Build for distribution
cd integrations/n8n && npx n8n-node build

# Full CI check (from repo root)
npx turbo check
```

## Testing Locally in n8n

```bash
# Build the node
cd integrations/n8n && npx n8n-node build

# Symlink into n8n's custom extensions directory
mkdir -p ~/.n8n/custom/node_modules
ln -sf "$(pwd)" ~/.n8n/custom/node_modules/n8n-nodes-pachca

# Restart n8n
pkill -f n8n; npx n8n start
```

> **Note:** `~/.n8n/custom/node_modules/` is scanned on startup without needing a DB record.
> Community nodes installed via UI (`~/.n8n/node_modules/`) require a record in `installed_packages` table — manual `npm install` there won't work.

## Adding New API Endpoints

1. Add the endpoint to `packages/spec/typespec.tsp`
2. Run `npx turbo build --filter=@pachca/spec --force` to regenerate OpenAPI YAML
3. Run `bun run integrations/n8n/scripts/generate-n8n.ts` to regenerate V2 node files
4. Add English descriptions to `packages/spec/workflows.ts` if needed
5. Run tests: `cd integrations/n8n && npx vitest run`
6. Run full check: `npx turbo check`

> V1 files are frozen and never regenerated. New endpoints appear only in V2.

## Test Structure

| Test File | What it covers |
|-----------|---------------|
| `tests/contract.test.ts` | Generated output matches OpenAPI spec (endpoints, methods, parameters) |
| `tests/compatibility.test.ts` | V1 backward compatibility (operations, parameters, pagination) |
| `tests/generic-functions.test.ts` | Unit tests for GenericFunctions.ts (paginator, buttons, forms, upload) |
| `e2e/` | Playwright E2E tests against a real n8n instance (mock + integration) |

## Versioning

- **npm version**: SemVer (`MAJOR.MINOR.PATCH`), current: `2.0.0`
- **n8n node version**: VersionedNodeType with `defaultVersion: 2`
  - `typeVersion: 1` — loads PachcaV1 (frozen V1 class)
  - `typeVersion: 2` — loads PachcaV2 (generated V2 class)
- **Source of truth**: `changelog.json`
- **CI**: Reads version from `changelog.json[0].version`, compares with npm, publishes if new
