# Pagination: full walks and polling

Source of truth: <https://dev.pachca.com/api/pagination.md>. This file covers the parts a model gets wrong.

## Know the group before you write the loop

| Group                      | Methods                                                                                                                                        | `meta`                                                         | Stop when                                                    |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| List                       | employees (no `query`), chats, chat members, chat messages, reactions, message readers, tags, tag members, tasks, audit log, bot event history | `meta.paginate.next_page`, `prev_page`, `has_next`, `has_prev` | `has_next: false`                                            |
| Search                     | search employees, chats, messages                                                                                                              | `meta.total`, `meta.paginate.next_page`                        | collected count equals `total`, or an empty `data`           |
| Employee list with `query` | the employee list called with `query`                                                                                                          | `meta.paginate.next_page`, `has_next`                          | `has_next: false` (`next_page` still comes on the last page) |

The method page says which group it is in. In the CLI, typed list commands take `--limit`, `--cursor` and `--all`.

## Full walk

```text
cursor = none
loop:
  page = GET list(limit = <explicit>, cursor = cursor if set)
  collect page.data
  list group:   if not page.meta.paginate.has_next: stop
  search group: if page.data is empty or collected == page.meta.total: stop
  cursor = page.meta.paginate.next_page
```

Rules for list methods:

- The four `paginate` fields are always present, even when `data` is empty. Cursors are never `null`.
- `data` can hold fewer than `limit` records on a middle page. Never infer the end from the length.
- `limit` limits differ by method (most list methods 1–50, some up to 100, 200 or 300). Out-of-range integers are clamped to the nearest bound; any other value is `400` `invalid` with `limit` in `key`.
- The cursor is an opaque token: do not parse, build or persist it across sessions.

A walk is many requests under one token. Message reads have their own, lower limit than other methods, and workspace inventory (all chats, all bots of the workspace) is much stricter still. Check <https://dev.pachca.com/api/limits.md> before walking large lists, and honour `Retry-After`.

Prefer the SDK `*All()` methods or CLI `--all`: they walk the pages for you. With `--all` the CLI prints progress to stderr and the final result to stdout as one array.

## Polling for new records (list methods only)

`prev_page` fetches records that appeared "before" the first page, without refetching everything.

1. Make the first request without a cursor; keep `prev_page`.
2. Periodically request with `cursor = prev_page`.
3. Non-empty `data`: new records arrived. Take the new `prev_page` from the response.
4. `has_prev: true`: more new records than `limit`. Keep requesting by `prev_page` until `has_prev` is `false`.

While nothing is new, the response has empty `data` and the same `prev_page`, so repeating with that cursor is safe and keeps your anchor.

Two behaviours that look like bugs and are not:

- **Batch order.** Each batch returns the records closest to the anchor, not the top of the list. With sort DESC and 8 new chats `c1 < … < c8` and `limit = 5`, the first batch is `[c5, c4, c3, c2, c1]` and the next is `[c8, c7, c6]`. Order inside a batch is right; between batches you must merge by the sort field.
- **Records come back as "new".** If the sort field of a record changes (for example a chat's `last_message_at`), polling returns it again: it changed position. Always dedupe by `id` and update the existing item instead of appending.

Search methods have no `prev_page`, so search results cannot be polled by cursor. Re-run the search instead.

## Pitfalls

- Treating an empty page in a list method as the end.
- Using `has_next` with a search method: it is not there.
- Saving a cursor to a file and resuming next day: cursors are not meant to be kept between sessions.
- Relying on the default `limit`: always pass it.
