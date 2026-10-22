# Security and compliance

Audit log, message export, DLP rules, IP allowlist and encryption. All of it
needs the **Corporation** plan. The audit log and export also need the
**Owner**; an Administrator gets `403`.

## Audit log

Tool `pachca_get_audit_events`, CLI `pachca security list`, scope
`audit_events:read`.

What to know before answering from it:

- Events are recorded only while the workspace is on Corporation; nothing is
  backfilled after switching. Data starts on 12 May 2025 and is kept 90 days.
  For anything longer, the security team must export it regularly.
- Records are read-only. Every event has an actor (an employee or a bot);
  `oauth_token_revoked` is the exception, its actor is the app.
- Reading the log is itself logged (`audit_events_accessed`).
- Filters combine: `start_time` and `end_time` (inclusive), `event_key` (one
  type per request, so several types mean several requests), `actor_id` and
  `actor_type`, `entity_id` and `entity_type`.
- Newest first, cursor pagination, up to 50 records per page. For regular
  export to a SIEM, keep `meta.paginate.prev_page` between runs: a request with
  it returns only events newer than the last run.
- Top-level `actor_id` and `entity_id` are strings, ids inside `details` are
  numbers. Normalize before comparing.
- `ip_address` and `user_agent` are `null` for events the server records on its
  own.

Map the question to event keys before querying:

| Question                         | Event keys                                                                                                      |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Suspicious logins                | `user_login`, `user_2fa_fail`                                                                                   |
| Who changed someone's role       | `user_role_changed` (`details` has old role, new role, initiator)                                               |
| Chat access settings changed     | `chat_permission_changed` (`details.public_access`)                                                             |
| Who deleted messages             | `message_deleted`                                                                                               |
| Chat membership changes          | `user_chat_join` (`inviter_id`), `user_chat_leave` (`initiator_id`)                                             |
| Tag changes                      | `tag_*`, `user_added_to_tag`, `user_removed_from_tag`                                                           |
| Who issued or revoked API access | `access_token_*`, `bot_token_*`, `oauth_authorization_*`, `oauth_device_authorization_*`, `oauth_token_revoked` |
| DLP hits                         | `dlp_violation_detected`                                                                                        |

Traps when reading records:

- In `user_added_to_tag` and `user_removed_from_tag` the actor is the employee
  who got or lost the tag; whoever made the change is `details.initiator_id`.
- When an Administrator revokes someone's access on the All tokens tab, the
  actor is the Administrator; the access owner is `resource_owner_id` (tokens)
  or `user_id` (bot authorizations).
- Code exchange and token refresh leave no records; the consent does.
- Changes to the IP allowlist and encryption settings are not logged.

Full event list and `details` fields: [audit log guide](https://dev.pachca.com/guides/audit-events.md).

## Message export

Tools `pachca_request_export` and `pachca_download_export`, CLI
`pachca chats request-export` and `pachca chats download-export`. Scopes
`chat_exports:write` and `chat_exports:read`.

Confirm first: the archive holds open, closed and archived chats with threads,
regardless of the Owner's membership. Direct chats come with author and time but
no content; threads in direct chats, attachments and forwarded messages are not
included. Treat the archive as sensitive data.

1. Period: up to 45 days; with `chat_ids` (up to 50 chats) up to 366 days.
   `end_at` before `start_at` or a longer period returns `422`
   `invalid_date_range`. For a longer history, request consecutive periods.
2. Requests from one workspace must be at least 90 seconds apart, even if the
   previous one is still building; earlier ones return `422` `rate_limit`.
3. It runs in the background. With raw HTTP send
   `Prefer: return=representation` to get `202` with the id in `data.id`;
   without it the answer is an empty `204`. SDK, CLI and n8n send the header
   themselves.
4. `webhook_url` is optional and must be reachable from the internet over
   `http` or `https`. A private or unresolvable address is dropped silently:
   the export still succeeds, only the notification never comes. Without a
   webhook, the requester gets an email and a Pachca notification.
5. Download: `404` `export_file_not_found` means still building, retry later.
   When ready, the answer is a redirect to a link valid for 5 minutes; use it
   at once. The archive is kept 7 days, and only the employee who requested it
   can download it.
6. Layout: a folder per chat (`Name_ID`) with a JSON file per day, plus
   `chats.json` with members and their chat roles (skipped with
   `skip_chats_file: true`). Access type and archive status are not in it.

## DLP rules

Rules live in the web interface (Workspace settings > DLP) as JSON text in a
single field. There is no tool or CLI command: draft the JSON, test it, and
hand it to the person to paste.

A rule has a name, a priority and a JSON body with `conditions` (required),
`action` (required) and `scope` (optional).

- **Priority**: an integer, higher runs first, no two rules share a value.
  The first matching rule stops processing.
- **Conditions**: `all` (every item matches), `any` (at least one), both, or
  nested. Each item is `regex` with `pattern` or `keyword` with `value`, plus
  optional `min_hits` (default 1) and `max_hits`.
- **Regex** is Google RE2, not PCRE: no lookahead, lookbehind or
  backreferences. Pattern up to 2000 characters, 200 ms per check.
- **Keyword** matches a whole word, case-insensitively, plus one common form
  with an «н» suffix: «секрет» matches «секретный» but not «секреты». Use a
  regex for other word forms.
- **Action**: `AUDIT_LOG` (message passes, event logged), `BLOCK` (text
  replaced, no log), `BLOCK_AND_AUDIT_LOG` (both). The replacement is
  `action.message`, or a default text if unset.
- **Scope** (AND-combined): `to_external` (`true` only chats with guests or
  multi-guests, `false` only chats without them), `channel_type` (`personal`,
  `discussion`, `channel`, `thread`), `user_role` (author's chat role:
  `owner`, `admin`, `editor`, `member`, `subscriber`, `not_member`).

Drafting procedure:

1. Ask what must be caught, where (scope) and what should happen.
2. Write an RE2-compatible pattern and test it locally on positive and negative
   samples, including word forms a keyword will miss.
3. Ask for the existing rules' priorities. A higher-priority `BLOCK` rule hides
   a lower `AUDIT_LOG` rule on the same message, which then leaves no record.
4. Write `action.message` neutrally: it is shown in the chat to every
   participant, not only to the author.
5. After it is live, check hits in the audit log with
   `event_key=dlp_violation_detected`.

## IP allowlist and encryption

Both are on Space > Security in the web interface, visible to the Owner only
(an Administrator does not see the screen). There is no tool or CLI command
for them. Warn before any change.

**IP allowlist (secure perimeter).** IPv4, IPv6 or CIDR, added one at a time;
active while the list is not empty.

- A file uploaded from a listed address can be downloaded only from listed
  addresses, forever; forwarded copies inherit this.
- Clearing the list makes every such file undownloadable. Access returns only
  if the address they were sent from is added back.
- The check uses the address of the request, so an integration server's
  outgoing IP must be on the list. Refusal: `403`
  `confidential_download_denied` (also returned for a file with a virus).
- The "allow viewing" toggle does not apply to the API: the file is either
  returned whole or refused.

**Encryption on your own key** (Yandex KMS, Cloud.ru, Vault).

- Encrypts message text and part of attachments, for new messages only.
- Changing the key or turning encryption off makes **older messages
  unreadable**; Pachca cannot recover them without the key.
- While on, message text is limited to 27,000 bytes instead of 40,000
  (longer returns `422`), including scheduled messages and incoming webhooks.
- `400` `decryption_failed` usually means the key store is unreachable or the
  key was revoked. Key use is logged as `kms_encrypt` and `kms_decrypt`.

With either setting, a protected file's `url` points to Pachca's file download
method and needs the `Authorization` header and `files:read`; otherwise it is
a direct storage link valid up to 7 days.

## Read more

- <https://dev.pachca.com/guides/audit-events.md>
- <https://dev.pachca.com/guides/export.md>
- <https://dev.pachca.com/guides/dlp.md>
- <https://dev.pachca.com/guides/data-protection.md>
- <https://dev.pachca.com/api/security/list.md>
