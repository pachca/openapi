# Security and compliance

Audit log, message export, DLP rules, IP allowlist and encryption. All of it
needs the **Corporation** plan and the **Owner**. Through the API an
Administrator gets `403` for the audit log and export; in the web interface an
Administrator does not see the DLP and Security tabs, so DLP rules are pasted
by the Owner.

## Audit log

Tool `pachca_get_audit_events`, CLI `pachca security list`, scope
`audit_events:read`.

What to know before answering from it:

- Events are recorded only while the workspace is on Corporation; nothing is
  backfilled after switching. Records are kept 90 days. For anything longer,
  the security team must export them regularly.
- Every event has an actor (an employee or a bot); `oauth_token_revoked` is the
  exception, its actor is the app.
- `event_key` takes one type per request, so several types mean several
  requests.
- For regular export to a SIEM, keep `meta.paginate.prev_page` between runs: a
  request with it returns only events newer than the last run.
- Top-level `actor_id` and `entity_id` are strings, ids inside `details` are
  numbers. Normalize before comparing.
- `ip_address` and `user_agent` are `null` for events the server records on its
  own.

Map the question to event keys before querying. A `*` stands for every key with
that prefix, as listed in the tool's `event_key` values and in the full event
list linked below. The filter matches one exact key and takes no wildcards
(over REST `tag_*` returns an empty list without an error), so expand the
prefix and send one request per key:

| Question                                  | Event keys                                                                                                                                                  |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Suspicious logins                         | `user_login`, `user_2fa_fail`, `user_2fa_disabled`, `login_grant_denied` (`details.reason`)                                                                 |
| Who changed someone's role                | `user_role_changed` (`details` has old role, new role, initiator)                                                                                           |
| Chat access settings changed              | `chat_permission_changed` (`details.public_access`)                                                                                                         |
| Who deleted messages                      | `message_deleted`                                                                                                                                           |
| Chat membership changes                   | `user_chat_join` (`inviter_id`), `user_chat_leave` (`initiator_id`)                                                                                         |
| Tag changes                               | `tag_*`, `user_added_to_tag`, `user_removed_from_tag`                                                                                                       |
| Who issued, changed or revoked API access | `access_token_*`, `bot_token_*`, `bot_oauth_client_*`, `bot_scopes_updated`, `oauth_authorization_*`, `oauth_device_authorization_*`, `oauth_token_revoked` |
| DLP hits                                  | `dlp_violation_detected`                                                                                                                                    |

Traps when reading records:

- In `user_role_changed`, `user_chat_join`, `user_chat_leave`,
  `user_added_to_tag` and `user_removed_from_tag` the actor is the employee
  whose role changed or who was added or removed. Whoever did it is in
  `details`: `inviter_id` for a join, `initiator_id` for the rest. A query with
  an Administrator's `actor_id` does not return these events: to see what they
  did, request each of these event keys and keep the records whose `details`
  id matches. Role and tag changes made by editing a profile also appear under
  the Administrator's own `actor_id` as `user_updated`, with `company_role` or
  `group_tags` in `changed_attrs` but without the values.
- To find who removed someone from a chat, query `user_chat_leave` with the
  chat as `entity_id` and read `initiator_id`. Leaving a chat on one's own is
  not logged.
- A QR sign-in to the mobile app asks for no 2FA, so it never produces
  `user_2fa_*`. Wrong digits there give `login_grant_denied` with
  `reason: verification_failed`.
- When an Administrator revokes someone's access on the All tokens tab, the
  actor is the Administrator; the access owner is `resource_owner_id` (tokens)
  or `user_id` (bot authorizations).
- Making an employee a guest revokes all their tokens at once: one
  `access_token_destroy` per token with `reason: guest_downgrade` in
  `details`, and the actor is whoever changed the role. Access they gave bots
  and apps comes this way too, not as `oauth_authorization_revoked`. Report
  such records as the demotion, not as a manual revocation.
- Code exchange and token refresh leave no records; the consent does.
- Changes to the IP allowlist and encryption settings are not logged.

Full event list and `details` fields: [audit log guide](https://dev.pachca.com/guides/audit-events.md).

## Message export

Tools `pachca_request_export` and `pachca_download_export`, CLI
`pachca chats request-export` and `pachca chats download-export`. Scopes
`chat_exports:write` and `chat_exports:read`.

The archive holds open, closed and archived chats with threads, regardless of
the Owner's membership. Direct chats come with author and time but no content;
threads in direct chats, attachments and forwarded messages are not included.
Treat the archive as sensitive data, and say so when you request it.

1. Period: up to 45 days; with `chat_ids` (up to 50 chats) up to 366 days,
   and `end_at` not earlier than `start_at`. A longer or reversed period gives
   `422` `invalid_date_range`, and more than 50 `chat_ids` gives `422`
   `too_long`. Dates go as `YYYY-MM-DD` (a time after the date is dropped):
   another format gets `422` `invalid`. For a longer history, request
   consecutive periods.
2. Export requests from one workspace have their own pause between them,
   counted even while the previous export is still building
   ([export guide](https://dev.pachca.com/guides/export.md)). An early request
   returns `422` `rate_limit`, so space consecutive periods out.
3. It runs in the background. With raw HTTP send
   `Prefer: return=representation` to get `202` with the id in `data.id`;
   without it the answer is an empty `204`. SDK, CLI and n8n send the header
   themselves.
4. `webhook_url` (REST, SDK, CLI `--webhook-url`; the MCP tool does not take
   it, so download by the id instead) is optional and must be a public address
   over `http` or `https`. A malformed URL, one without a host, another
   scheme or a private IP address is refused at once with `422`
   `invalid_webhook_url`. A host name that does not resolve or leads to a
   private address (such as `localhost`) gets the same error, but only after
   the request has started the pause from step 2: fix the address and wait
   before retrying, or the retry gets `rate_limit`. If at delivery the address no longer resolves to a public one,
   the export still succeeds and only the webhook never comes. The requester
   always gets an email and a Pachca notification, with or without a webhook.
5. Download: `404` `export_file_not_found` means still building, retry later.
   The ready link is short-lived, so use it at once. The archive is kept
   7 days, and only the employee who requested it can download it.
6. Layout: a folder per chat (`Name_ID`) with a JSON file per day, plus
   `chats.json` with members and their chat roles (skipped with
   `skip_chats_file: true`). Access type and archive status are not in it.

## DLP rules

Rules live in the web interface (Workspace > DLP, shown to the Owner only) as
JSON text in a single field. There is no tool or CLI command: draft the JSON,
test it, and hand it to the Owner to paste.

A rule has a name, a priority and a JSON body with `conditions` (required),
`action` (required) and `scope` (optional).

- **Name**: unique in the workspace, ignoring case and punctuation.
- **Priority**: an integer from 1, higher runs first. Two rules may share a
  value; on a tie the rule created earlier runs first. The first matching rule
  stops processing.
- **Conditions**: `all` (every item matches), `any` (at least one), or both
  (the two lists are ANDed). A nested group is rejected when the rule is saved.
  Each item has `type`: `regex` with `pattern`, or `keyword` with `value`, plus
  optional `min_hits` (default 1) and `max_hits`.
- **Regex**: write it in the syntax the DLP guide names (Ruby regular
  expressions). A pattern that engine cannot parse is rejected on save, such
  as `(?P<name>…)` (write `(?<name>…)`), the flags `(?s)` and `(?U)`, or
  `\x{…}`. The guide does not promise lookahead, lookbehind or
  backreferences, so prefer patterns without them. Matching rules: `^` and
  `$` match at every line, `.` matches a newline, `\b` works next to Cyrillic
  letters, `\w`, `\d` and `\s` are ASCII only (use `\p{L}` or `\p{Cyrillic}`
  for Russian letters), and matching is case-sensitive unless the pattern
  starts with `(?i)`.
  Pattern up to 2000 characters. A check that runs over 200 ms counts as no
  match and gives no error.
- **Keyword** matches a whole word, case-insensitively, plus one common form
  with an «н» suffix: «секрет» matches «секретный» but not «секреты». Use a
  regex for other word forms.
- **Action**: `AUDIT_LOG` (message passes, event logged), `BLOCK` (text
  replaced, no log), `BLOCK_AND_AUDIT_LOG` (both). The replacement is
  `action.message`, or a default text if unset. Rules check only the message
  text, on send and on every edit: messages from employees and guests are
  checked, including those sent through the API with an employee's token.
  Attachments, system messages and messages from bots are not. `BLOCK`
  replaces the text after the message is sent, so participants may already
  have seen the original.
- **Scope** (AND-combined): `to_external` (`true` only chats with guests or
  multi-guests; never set `false`: such a rule never fires in any chat, and no
  setting limits a rule to chats without guests), `channel_type` (`personal`,
  `discussion`, `channel`, `thread`), `user_role` (author's chat role:
  `owner`, `admin`, `editor`, `member`, `subscriber`, `not_member`). Write
  `channel_type` and `user_role` as a single string: a list is dropped on save
  without an error, and the rule then applies to every chat type or role. For
  several values make one rule per value, and reopen the rule after saving to
  check that `scope` is still there.

Drafting procedure:

1. Ask what must be caught, where (scope) and what should happen.
2. Write the pattern and test it on positive and negative samples under the
   matching rules above (a tester for another engine, such as RE2 or
   JavaScript, gives different hits for `^`, `$`, `.` and `\b`), including
   multi-line text and the word forms a keyword will miss.
3. Ask for the existing rules' priorities. A higher-priority `BLOCK` rule hides
   a lower `AUDIT_LOG` rule on the same message, which then leaves no record.
4. Write `action.message` neutrally: it is shown in the chat to every
   participant, not only to the author.
5. After it is live, check hits in the audit log with
   `event_key=dlp_violation_detected`.

## IP allowlist and encryption

Both are on Workspace > Security in the web interface, visible to the Owner
only (an Administrator does not see the screen). There is no tool or CLI
command for them. Warn before any change.

**IP allowlist (secure perimeter).** IPv4, IPv6 or CIDR, added one at a time;
active while the list is not empty.

- A file uploaded from a listed address can be downloaded only from listed
  addresses, forever. A copy forwarded while the list is not empty inherits
  this; a copy forwarded after the list was cleared is an ordinary file.
- Clearing the list stops downloads of every such file. A file keeps only the
  protected mark, not the address it was sent from: once any address is added
  back, all of these files download again from the listed addresses.
- The check uses the address of the request, so an integration server's
  outgoing IP must be on the list. Refusal: `403`
  `confidential_download_denied` (also returned for a file with a virus).
- The "allow viewing" toggle does not apply to the API: the file is either
  returned whole or refused.

**Encryption on your own key** (Yandex KMS, Cloud.ru, Vault).

- Encrypts message text and part of attachments, for new messages only.
- Changing the key or turning encryption off makes **older messages
  unreadable**; Pachca cannot recover them without the key.
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
