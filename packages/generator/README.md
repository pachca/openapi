# @pachca/generator

OpenAPI → SDK code generator for TypeScript, Python, Go, Kotlin, and Swift.

## Usage

```bash
npx @pachca/generator --spec openapi.yaml --output ./sdk --lang typescript,python,go,kotlin,swift
```

### Options

| Flag | Description |
|------|-------------|
| `--spec` | Path to OpenAPI 3.0 YAML spec |
| `--output` | Output directory for generated files |
| `--lang` | Comma-separated target languages: `typescript`, `python`, `go`, `kotlin`, `swift` |

### Programmatic API

```typescript
import { generate } from '@pachca/generator';

generate('openapi.yaml', './output', ['typescript', 'python']);
```

## Architecture

```
OpenAPI YAML → @pachca/openapi-parser → IR (transform.ts) → Language Generators → Source Files
```

1. **Parser** (`@pachca/openapi-parser`) — reads OpenAPI YAML, resolves `$ref`, extracts endpoints/schemas
2. **Transform** (`transform.ts`) — converts parsed spec to a language-agnostic Intermediate Representation (IR)
3. **Generators** (`lang/*.ts`) — emit idiomatic source code for each language from the IR

## OpenAPI Extensions

| Extension | Level | Description |
|-----------|-------|-------------|
| `x-error: true` | Schema | Marks a schema as an error type (thrown/returned on non-2xx) |
| `x-external-url: "paramName"` | Operation | Generates a `paramName` parameter for dynamic URLs (e.g., S3 upload) |
| `x-requirements` | Operation | `auth: false` skips Authorization header; `scope`/`plan` for metadata |
| `x-paginated: true` | Operation | Generates an `*All` helper that auto-paginates through all pages |
| `x-enum-descriptions` | Schema | Maps enum values to human-readable descriptions |
| `x-param-names` | Parameter | Overrides SDK parameter name derivation |

## Generated Features

- **Type-safe clients** with per-operation methods
- **Cursor-based pagination helpers** (`listChatsAll`, `list_chats_all`, etc.) for `x-paginated` endpoints
- **Retry with `Retry-After`** on 429 Too Many Requests (up to 3 retries with exponential backoff)
- **Enum types** with descriptions
- **Union/discriminated types** (oneOf/anyOf)
- **Request body unwrapping** for single-field wrappers
- **Multipart upload support**
- **`@deprecated` annotations** propagated from the spec
- **Snake/camel case conversion** for language-idiomatic field names

## Output Structure

| Language | Files |
|----------|-------|
| TypeScript | `types.ts`, `client.ts`, `utils.ts` |
| Python | `models.py`, `client.py`, `utils.py`, `__init__.py` |
| Go | `types.go`, `client.go`, `utils.go` |
| Kotlin | `Models.kt`, `Client.kt` |
| Swift | `Models.swift`, `Client.swift`, `Utils.swift` |

## Testing

```bash
bun test
```

Snapshot tests compare generated output against committed fixtures in `tests/*/snapshots/`.

To update snapshots after changing generators:

```bash
bun -e "import { generate } from './src/index.ts'; generate('tests/crud/fixture.yaml', 'tests/crud/snapshots', ['typescript', 'python', 'go', 'kotlin', 'swift']);"
```
