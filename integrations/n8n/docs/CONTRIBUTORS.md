# Contributors

## How to Contribute

1. Fork the repository
2. Create a feature branch from `main`
3. Make your changes
4. Run `npx turbo build && npx turbo check` to verify
5. Submit a pull request

## Project Structure

```
integrations/n8n/
├── scripts/                    # Generator code
│   ├── generate-n8n.ts             # Main generator (~1000 lines)
│   ├── freeze-v1.ts                # Captures V1 snapshot from npm
│   └── utils.ts                    # Body field extraction helpers
├── nodes/Pachca/               # Node files
│   ├── Pachca.node.ts              # VersionedNodeType wrapper (generated)
│   ├── SharedRouter.ts             # Shared router with V1→V2 translation (generated)
│   ├── GenericFunctions.ts         # Utilities (hand-written)
│   ├── PachcaTrigger.node.ts       # Trigger node (hand-written)
│   ├── V1/
│   │   ├── PachcaV1.node.ts        # Frozen V1 class
│   │   └── *Description.ts         # 12 frozen V1 descriptions
│   └── V2/
│       ├── PachcaV2.node.ts        # Generated V2 class
│       ├── FormDescription.ts      # Form resource (hand-written)
│       └── *Description.ts         # 18 generated V2 descriptions
├── credentials/                # Credential type (generated)
├── icons/                      # Node icons (SVG adaptive + PNG)
├── tests/                      # Unit + contract tests (vitest)
├── e2e/                        # Playwright E2E tests
├── examples/                   # Example workflow JSON files
├── docs/                       # Documentation
└── changelog.json              # Version history
```

## Key Guidelines

- **Do not manually edit generated files** — modify the generator instead
- **Do not edit V1/ files** — they are frozen from npm v1.0.27 and ensure backward compatibility
- **GenericFunctions.ts**, **V2/FormDescription.ts**, and **PachcaTrigger.node.ts** are hand-written — edit directly
- **Always run tests** after changes: `cd integrations/n8n && npx vitest run`
- **Follow n8n conventions**: ESLint with `@n8n/node-cli` rules
- **Update changelog.json** when making changes that warrant a release

## Generated vs Hand-Written

The generator (`scripts/generate-n8n.ts`) reads the OpenAPI spec and produces:
- VersionedNodeType wrapper (`Pachca.node.ts`) with V1/V2 class references
- Shared router (`SharedRouter.ts`) with V1 name translation maps and route table
- V2 resource descriptions with operations, parameters, and routing
- Credential type with fields and authentication

Hand-written files handle logic that can't be expressed declaratively:
- Cursor-based pagination with retry
- S3 two-stage file upload
- Webhook signature verification
- Form template resolution
- Button layout transformation
- Error message extraction and formatting
- 5xx/429 retry with exponential backoff and jitter

## Maintainers

- [Pachca](https://github.com/pachca) — API specification and node generator

## License

MIT License — see [LICENSE](../LICENSE) for details.
