# Pagination: full walks and polling

Full reference: <https://dev.pachca.com/api/pagination.md>. This file covers the parts a model gets wrong, and where the two differ, follow this file: the list group holds more methods than that page names, and a polling anchor may be kept between runs (see Rules for list methods).

## Know the group before you write the loop

| Group                      | Methods                                                                                                                                                                                                                | `meta`                                                         | Stop when                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| List                       | employees (no `query`), chats, workspace chats, chat members, chat messages, threads, reactions, message readers, tags, tag members, reminders, drafts, bots, bot tokens, workspace bots, audit log, bot event history | `meta.paginate.next_page`, `prev_page`, `has_next`, `has_prev` | `has_next: false`                                            |
| Search                     | search employees, chats, messages                                                                                                                                                                                      | `meta.total`, `meta.paginate.next_page`, `has_next`            | `has_next: false` (never `total`, see Pitfalls)              |
| Employee list with `query` | the employee list called with `query`                                                                                                                                                                                  | `meta.paginate.next_page`, `has_next`                          | `has_next: false` (`next_page` still comes on the last page) |

For a method not in the table, read the `meta` schema on its page: `meta.total` means search, and `paginate.has_next` without `total` means list. For calls with `query`, the employee list page still shows the full list `meta`, so use the table for that case. In the CLI, typed list commands take `--limit`, `--cursor` and `--all`, but a run without `--all` prints only `data`, never `meta`, so it does not show the next cursor. To page by hand, use `pachca api GET <path> --query limit=50 --query cursor=<next_page>`: it prints the whole response, `meta` included.

## Full walk

```text
cursor = none
loop:
  page = GET list(limit = <explicit>, cursor = cursor if set)
  collect page.data
  if not page.meta.paginate.has_next: stop
  cursor = page.meta.paginate.next_page
```

Rules for list methods:

- The four `paginate` fields are always present, even when `data` is empty. Cursors are never `null`.
- `data` can hold fewer than `limit` records on a middle page. Never infer the end from the length.
- `limit` bounds differ by method: list methods take 1–50 except message readers (up to 300), search takes up to 100 (chats) or 200 (employees, messages). Out-of-range integers are clamped to the nearest bound; any other value is `400` `invalid` with `limit` in `key`.
- The cursor is an opaque token: do not parse or build it, pass back exactly the value the response gave, to the same method with the same parameters as the first page (`sort` included). Between runs keep only a polling anchor (`prev_page`, or the last `next_page` of an oldest-first list, see Polling below), as in a regular audit-log export → pachca-admin. A cursor the method cannot read, a kept one included, gets `400` `invalid` with `cursor` in `key`: start again without a cursor and dedupe by `id`.

A walk is many requests under one token. Message reads (messages, reactions, readers) have a lower limit than the general one, bot event history a lower one still, and workspace inventory (all chats, all bots of the workspace) is the strictest. Check <https://dev.pachca.com/api/limits.md> before walking large lists, and honour `Retry-After`.

Prefer the SDK `*All()` methods (`*_all()` in Python, `*AllAsync()` in C#) or CLI `--all`: they walk the pages for you. With `--all` the CLI writes the final result to stdout as one array (progress goes to stderr only in a terminal). CLI `--all` stops after 500 pages (25,000 records at `limit` 50). At that point it prints a warning to stderr, still outputs the partial array and exits with code 0. For a walk that can be longer, such as the full history of a big chat or the audit log, page yourself with `pachca api` as shown above: take `meta.paginate.next_page` from each response, pass it as `--query cursor=…`, and stop by the rules above.

## Polling for new records

`prev_page` fetches records that sort above the first record you saw, without refetching everything. That catches new records only in lists sorted newest first: employees (no `query`), chats and chat messages with the default `order=desc`, threads, drafts, bots, bot tokens, workspace chats and workspace bots, audit log, bot event history. With `sort` and `order=asc` new records arrive at the tail instead (in these two lists `order` without `sort` changes nothing). Reminders, reactions and tags are always sorted oldest first, so new ones also arrive at the tail: keep `next_page` from the last page and poll with it (an empty response returns the same `next_page`). Chat members, tag members and message readers are not sorted by when someone joined or read, so a new one can land anywhere in the list: re-walk the whole list. A bot can follow chat membership through the `chat_member_add` and `chat_member_remove` events instead → pachca-bots.

Only the raw response carries `prev_page`: HTTP, an SDK's typed responses and `pachca api`. An MCP list tool shows only the forward cursor (`Continue with cursor=…`, or `End of list.` on the last page), and a typed CLI command prints only `data`. Poll from code, an SDK or `pachca api GET <path> --query limit=50 --query cursor=<prev_page>`.

For a newest-first list, poll by `prev_page`:

1. Make the first request without a cursor; keep `prev_page`.
2. Periodically request with `cursor = prev_page`.
3. Non-empty `data`: new records arrived. Take the new `prev_page` from the response.
4. `has_prev: true`: more new records than `limit`. Keep requesting by `prev_page` until `has_prev` is `false`.
5. After an empty first request, its `prev_page` has no anchor. If the first poll that returns data has `has_next: true`, that poll holds the top of the list, and `has_prev` is `false` even though more records arrived. Walk the rest once by `next_page` until `has_next` is `false`. Then keep polling with the `prev_page` from that first poll, not from the walk. Apply this only to that one poll: on ordinary polls by `prev_page`, ignore `has_next`.

While nothing is new, the response has empty `data` and the same `prev_page`, so repeating with that cursor is safe and keeps your anchor.

Two behaviours that look like bugs and are not:

- **Batch order.** Each batch returns the records closest to the anchor, not the top of the list. With sort DESC and 8 new chats `c1 < … < c8` and `limit = 5`, the first batch is `[c5, c4, c3, c2, c1]` and the next is `[c8, c7, c6]`. Order inside a batch is right; between batches you must merge by the sort field.
- **Records come back as "new".** If the sort field of a record changes (for example a chat's `last_message_at`), polling returns it again: it changed position. Always dedupe by `id` and update the existing item instead of appending.

Search methods have no `prev_page`, so search results cannot be polled by cursor. Re-run the search instead.

## Pitfalls

- Treating an empty page in a list method as the end.
- Ending a search walk when the collected count reaches `meta.total`: on large result sets `total` can be capped, and on message search sorted by date (the default) each next page's `total` counts only the matches still ahead of the cursor, so the walk stops early. The end of a search is `has_next: false`.
- Resuming a half-finished walk the next day from a saved `next_page`: records added or re-sorted in between (a chat's `last_message_at`) are skipped. Start a new walk. Keeping a polling anchor between runs is fine.
- Relying on the default `limit`: always pass it.
