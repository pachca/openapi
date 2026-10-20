# Changelog

## 1.1.0 (2026-10-21)

- `pachca_send_message` no longer takes `link_preview`. With it, Pachca fetched the first link of the text itself, so a link carrying data, written at the request of an injection in a chat, could reach its host with no click. A message sent through the server goes without a link preview.
- A file argument takes its contents or, in `files[]` and `promo_images[]`, the key of a file already in Pachca: `url` of their items and `image_url` of the avatar tools are gone, and the server downloads no link a model passes. The manifest's `files` object loses `url_schemes`, `public_hosts_only`, `max_redirects` and `max_download_bytes`, `request.arguments` loses the `download` effect, and `schema_version` is 1.1.0.
- `pachca_request_export` no longer takes `webhook_url`: Pachca posted to that address itself, so an address carrying data could take it out with no click. The answer carries the export id, and `pachca_download_export` takes it.
- `pachca_create_bot` is marked destructive (`destructiveHint: true`), so a client asks before it runs: a new bot sends its events to an address of the caller's choosing, and its token comes back in the answer. So is `pachca_create_user`: the invitation goes to any address and lets it into the chats `chat_ids` lists. `pachca_add_link_preview` is marked destructive too, since it replaces the card a link already had.
- The address of an incoming webhook and the link to an export are secrets: the tools that answer with them say to hand them to the person and nowhere else.
- The instructions tell the model to put nothing a tool returned into a URL outside Pachca.
- Serving the `search` and `fetch` pair is the server's choice: `response_format.compat` and `compat_address` no longer say a server serves nothing there only until it has the code.
- Taking files no longer makes a tool open-world: its files go to Pachca's own storage, so `openWorldHint` is true only where Pachca itself reaches outside the workspace.
- Removing arguments and a change of the schema a server has to follow are major steps by the versioning rule. This release takes both in a minor one, since no server in use was built on 1.0.0 yet. A server written for 1.0.0 has to drop its link download (the `url` items, the `download` effect, the link limits of `files`) before it serves 1.1.0: loading the new file alone leaves the download in place.

## 1.0.0 (2026-10-20)

- Initial release: `mcp-manifest.json`, the tool set of the Pachca MCP server for the public API — every tool with its description, arguments, response, scope and roles, and the tool listings per role
- `mcp-manifest.schema.json`, the JSON Schema 2020-12 of the manifest: a server validates the manifest against it at start, and a new `schema_version` major means the server has to change before it loads the file
