# @pachca/mcp-manifest

The tool manifest of the Pachca MCP server, published as a versioned package.
The server keeps no list of tools of its own: it loads this manifest at start
and serves exactly what is in it. The manifest is generated from the Pachca
OpenAPI spec in [pachca/openapi](https://github.com/pachca/openapi).

## Files

| File                       | What it is                                                                                                                                                                                                                                            |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mcp-manifest.json`        | The set: server info and instructions, every tool with its input schema, the schema of the API body its text answer is made from (not published to clients), the HTTP request it makes, its scope, plan and roles, and the tool listings per audience |
| `mcp-manifest.schema.json` | The contract, as JSON Schema 2020-12. A server validates the manifest against it before it boots. `schema_version` inside the manifest names the contract version the file was built for.                                                             |

`generated_from.digest` in the manifest changes whenever anything the manifest
says changes, so it works as a cache key.

## Fetching a version without Node

Every version is a plain tarball on the npm registry. No Node or npm is needed
to take it:

```sh
VERSION=1.0.0
curl -fsSLO "https://registry.npmjs.org/@pachca/mcp-manifest/-/mcp-manifest-${VERSION}.tgz"
tar -xzf "mcp-manifest-${VERSION}.tgz"
# package/mcp-manifest.json
# package/mcp-manifest.schema.json
```

The version document `https://registry.npmjs.org/@pachca/mcp-manifest/<version>`
lists the tarball URL in `dist.tarball` and its SHA-512 in `dist.integrity`, to
check the download against:

```sh
echo "sha512-$(openssl dgst -sha512 -binary "mcp-manifest-${VERSION}.tgz" | openssl base64 -A)"
```

With Node, install the package and import the files:

```js
import manifest from '@pachca/mcp-manifest' with { type: 'json' };
import schema from '@pachca/mcp-manifest/mcp-manifest.schema.json' with { type: 'json' };
```

## Validating at start

Validate `mcp-manifest.json` against `mcp-manifest.schema.json` with any JSON
Schema 2020-12 validator and refuse to start when it fails. Then compare the major of
`schema_version` with the one the server was written for: a different major
means the server has to be updated before it can serve this manifest.

## Versioning

The package follows semver. The package version and `schema_version` are
separate numbers: the package major moves whenever the `schema_version` major
does.

| Step  | When                                                                                                                                                                                                      |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| major | The `schema_version` major changes, so the server that executes the manifest has to change before it loads the new file, or a tool or an argument is removed or renamed, so a client loses what it called |
| minor | Tools or arguments are added or changed, and anything else the current server loads as is, including a `schema_version` minor step                                                                        |
| patch | Only texts change: tool descriptions, instructions, titles                                                                                                                                                |

Pin a major (`^1.0.0`) to take new tools and text fixes as they ship, or pin an
exact version to move on your own schedule.

## Changelog

Every version is listed in [CHANGELOG.md](./CHANGELOG.md), which also ships in
the package.
