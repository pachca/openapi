# Changelog

## 1.0.0 (2026-10-18)

- Initial release: `mcp-manifest.json`, the tool set of the Pachca MCP server for the public API — every tool with its description, arguments, response, scope and roles, and the tool listings per role
- `mcp-manifest.schema.json`, the JSON Schema 2020-12 of the manifest: a server validates the manifest against it at start, and a new `schema_version` major means the server has to change before it loads the file
