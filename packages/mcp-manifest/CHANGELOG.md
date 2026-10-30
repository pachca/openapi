# Changelog

## 1.5.0 (2026-10-30)

Reminders named as in the Pachca app, deleting an incoming webhook, the output of opening a form, audit details as the API writes them, and rules for mentions and missing scopes; schema_version stays 1.2.0.

- `pachca_get_audit_events`: `details.dlp_rule_id` of `dlp_violation_detected` is a string made from the rule name, for example `pasport-rf`, as the API returns it, and it is listed among the untrusted fields.
- `pachca_get_audit_events`: details list the token, application, bot and webhook fields the API writes (including bot token records from before 7 October 2026 and the `null` application of a refused CLI sign-in), the setting keys of `bot_webhook_settings_updated`, and the values of `reason` for `kms_*`.
- `pachca_update_bot`: `kind` accepts `null`, which deletes the incoming webhook: the address stops working, the template and its settings are reset, and the next enabling gives a new address.
- `pachca_create_bot` and `pachca_update_bot`: `commands` say how a command matches: the first word of the text, exactly, case included.
- `pachca_open_form` has an output: `success`, always `true`.
- `pachca_send_message`: a voice message (`file_type` `voice`) is sent with a personal token, and a bot token gets `403`.
- `pachca_send_message`, `pachca_update_message`, `pachca_create_draft` and `pachca_update_draft`: `duration_ms` is required for a voice message, optional for a video and not saved for other types. Message and draft outputs describe `duration_ms` the same way.
- `pachca_download_export`: after 7 days the method still answers with a link, but the archive is gone, so the export is requested again.
- `pachca_create_task`, `pachca_list_tasks`, `pachca_get_task`, `pachca_update_task` and `pachca_delete_task` are titled and described as reminders, as the Pachca app names them: New reminder, List reminders, Reminder info, Edit reminder, Delete reminder. The tool names stay the same. The server instructions name reminders in the catalogue, and `pachca_update_user`, `pachca_delete_user` and `pachca_list_custom_fields` (`entity_type` `Task`) say reminder too.
- `pachca_get_audit_events`: details of `bot_token_updated` carry `scopes` with the token scopes before and after the change (`previous` and `new`) when the request passed scopes.
- `pachca_get_audit_events`: `details.scopes` of bot token records from before 7 October 2026 is described as the API wrote it: a list of scopes for `bot_token_created` and an object with `previous` and `new` for `bot_token_updated` when the request passed scopes.
- `pachca_update_user`: `list_tags` names the "Who can add the bot to chats" values that lead to `restricted_bot_tag_denied`, "Creator" and "Creator and Administrators".
- `pachca_send_message` and `pachca_update_message`: `content` says to take a nickname from a tool's answer and a `user_id` from data, since a nickname made up from a name mentions nobody.
- A `403` with `insufficient_scope` tells the model not to retry: a person connected through the browser signs in again without narrowing the scopes, a personal token gets the scope in its menu, a bot's creator adds it to the bot's token.
- `pachca_search_users`, `pachca_search_chats` and `pachca_search_messages`: the output `meta.paginate` has `has_next`, `false` on the last page, where `next_page` still comes.

## 1.4.0 (2026-10-28)

Tools for the «Important» section, making an employee a guest, and tool texts that follow what the server actually does; schema_version stays 1.2.0.

- Tools `pachca_list_important_messages`, `pachca_add_message_to_important` and `pachca_remove_message_from_important`: the caller's own «Important» section, in every audience but `bot`; adding is not destructive, removing is. `pachca_get_token_info` names the scopes `important_messages:read` and `important_messages:write`.
- `pachca_update_user`: `role` takes `guest` together with the new `chat_ids` argument, and the description says what making a person a guest takes away (tags, other conversations and channels, every token, answering `401`).
- Message outputs carry `important`, left out of the compact card.
- `pachca_create_chat`: the output `meta` carries `not_found_group_tag_ids`, and unknown tags no longer read as skipped silently.
- `GET /webhooks/events/stream` is no tool: its answer is a link that only a program holding a connection can use, and it opens the bot's events with no token.
- Field and tool texts follow the server: `name` of `pachca_create_chat`, `emoji` of the status tools, `files` and `name` of `pachca_update_message`, `content` of the message and draft tools (one limit, 40,000 bytes), `pachca_download_file` (a virus), `pachca_create_bot` and `pachca_self_update_bot_webhook` (`400 forbidden`), `pachca_rotate_bot_client_secret` (`400 invalid`), `pachca_recreate_bot_token` and `pachca_rotate_bot_client_secret` (webhook credentials in the answer), the `webhook` fields of a bot in every bot output (they come in an answer about a single bot to a token with `bots:write` that can manage its tokens), `pachca_create_task` (the calendar event invites the assignees), `pachca_create_unattached_thread`, `pachca_remove_member` and `pachca_delete_message` (the owner of an unattached thread and workspace admins added to it), `pachca_get_chat` and `pachca_mark_chat_unread` (`404` for another workspace), `pachca_request_export` (`too_long`, `invalid`, which rejections start no pause), `pachca_create_tag` and `pachca_update_tag` (`blank`), `limit` and `filters` of search audit details (`limit` now nullable), `reason` of token audit details.
- `pachca_list_chats` and `pachca_list_chat_messages`: `order` takes effect only together with `sort`, so oldest first is `sort=id` with `order=asc`.
- `pachca_add_reaction` and `pachca_remove_reaction`: `name` is the name of a custom emoji of the workspace, a name the workspace does not have answers `404`, and `code` must be the emoji character only without `name`.
- `pachca_create_draft` and `pachca_update_draft`: a repeating schedule takes hour, minute and weekday from `start_date` as written and runs on UTC, so a repetition is written in UTC and `next_send_at` is checked; a single send honours the offset.
- `pachca_send_message` and `pachca_update_message`: only `data` buttons need a bot sender, a `url` button opens its link whoever sent the message; `skip_invite_mentions` acts only while the workspace setting for cross threads is on.
- `pachca_list_tasks`: without `chat_ids` the list holds every task of the active chats you are in, other employees' included, plus unbound tasks you created or are assigned to.
- `pachca_create_task` and `pachca_update_task`: a task binds to a conversation or a direct chat you are in, not to a channel, a thread or an archived chat; `all_day` goes together with `due_at` at 23:59:59 of that day in the employee's offset; `performer_ids` replaces the whole list of assignees.
- `pachca_search_messages`: without `chat_ids` threads under direct chats, standalone threads and threads you joined without their parent chat are not searched.
- `pachca_archive_chat`: archiving removes guests, multi-guests stay.
- `pachca_get_upload_params`: a key is checked against its owner only in drafts.
- `pachca_send_message`, `pachca_update_message`, `pachca_create_draft` and `pachca_update_draft`: a file passed by key without `size` gets its size from storage after the save, so a reader who got the message before that may see 0 KB; the file record of a message or a draft carries no size to copy.
- `pachca_delete_task`: the calendar event goes away with the task only when its author deletes it; after an assignee deletes it, the event can stay in the author's calendar.
- Every tool that takes or returns a message, a task or a bot carries the corrected field texts of its model: `root_chat_id` of a message in a standalone thread equals `chat_id`, `all_day`, and the rules for `redirect_uris`.
- The instructions say when the model asks before a change: its target is a guess, it cannot be undone while a reversible step would do, it touches many objects at once, or it sends words the model chose for the person; any other change it carries out, and the client asks its own approval.

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
