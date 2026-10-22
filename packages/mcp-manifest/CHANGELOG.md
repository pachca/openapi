# Changelog

## 1.3.0 (2026-10-22)

An agent with a shell uploads a file itself and attaches it by key; schema_version stays 1.2.0.

- `pachca_get_upload_params` is a tool, beside the upload the server still runs inside a send. A document or picture an agent would not write out as base64 goes this way: the agent asks for the signed form, puts the file name in place of `${filename}` in `key`, posts the form with the file to `direct_url` from its own shell, every other field as it is and the file last, and passes the key in `files`. `direct_url` is the cloud storage Pachca keeps files in, a host outside pachca.com that changes with the provider, so it is always taken from the same answer; the description names it as the one outside address a tool answer goes to. The fields of the form are Pachca's own text and go without the untrusted wrapper. The server still downloads no link, and the tool is not destructive: nothing in the workspace changes until a message takes the key.
- A file item in `files` takes `size`: with contents the server fills it in, and with a key and no `id` the agent passes it, or readers see 0 KB. The descriptions of `files`, of `key` and of `content` in the tools that send or edit a message or a draft, and of `key` in `promo_images`, name the upload tool.
- A link in the spec's words to an upload step that is no tool reaches the model as `pachca_get_upload_params`: the image key of `pachca_add_link_preview` names it, and that field and `image_url` no longer say upload keys are out of reach.

## 1.2.0 (2026-10-21)

Rules from a live run of the server, schema_version 1.2.0.

- Other people's text inside an object or a list is wrapped once: when a path in the tool's untrusted list points inside a top-level field, that whole field goes inside the wrapper as compact JSON, never value by value, unless every value at such a path inside it is absent, null, or an empty string, list or object. Compact JSON escapes only what JSON requires and keeps `<`, `>` and `&` as they are. An empty string stays unwrapped.
- A refusal ends with the footer like every other result.
- The footer says that times ending in Z are UTC. Its Days line, and the `{days}` placeholder of the instructions with it, marks the first Monday with «next week:».
- When data is empty, only the Showing line is replaced, by `empty_result` or, after a cursor, by nothing, and the second line of `pagination_footer` stays. A search page that shows at least the total it names ends with «End of list.».
- `day_fields` and the `whole_day` rule: the `due_at` of an all-day task reads as its date in the zone of Now with « (all day)».
- `argument_reading`: a number, true or false where a string is declared reads as text, and base64 text drops a `data:` prefix and line breaks. A field that an object of the arguments does not list is refused like an argument the tool does not have: every such object is closed with `additionalProperties: false`, and a map takes any key. A value declared base64 that does not decode is refused at its own path, such as `files[0].content`, and the contents of a file or an image declare `contentEncoding: base64`.
- `rate_limit`: a limit the server keeps on requests itself counts only `tools/call`, never a handshake, a notification or a listing, and a call it holds back is a refusal read like the API's 429, never an HTTP error.
- A scalar keeps its line breaks with no indent, and a listing holds only tools of this manifest.
- The note on secrets stays only on tools whose answer carries the secret whole: `pachca_list_bots`, `pachca_list_bot_tokens` and `pachca_update_bot_token` answer with masked tokens or none and no longer carry it.
- The answers of `pachca_create_bot` and `pachca_recreate_bot_token` mark a bot the caller created «(you)», like `pachca_get_bot`.
- The description of `pachca_create_draft` says that `pachca_send_message` with the draft's `draft_id` deletes the draft.
- `pachca_get_audit_events`: `event_key` takes `login_grant_created`, `login_grant_approved` and `login_grant_denied`, the events of a QR code sign-in to the mobile app, and the answer describes their details and the details `user_login` carries after such a sign-in. The device data in them comes from the app itself and is marked untrusted.
- Descriptions from the spec now say what the API does: a thread cannot be left, a deleted message answers 403 to a second deletion, a task with a performer who does not exist or cannot be seen is refused, `list_tags` of a new employee creates a missing tag, only a workspace administrator or owner turns link unfurling on or off for a bot and, for a bot that unfurls links, changes the domains or the webhook address or turns on the event history, so such a bot cannot change its own webhook address, `limit` outside its range is clamped and `pachca_get_audit_events` declares its minimum of 1, a search query in typographic quotes is an exact phrase too, and an empty chat name becomes the name of the token owner.

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
