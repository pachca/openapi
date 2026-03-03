/**
 * Generic cursor-based pagination for the Pachca API.
 *
 * All 14 paginated endpoints use the same pattern:
 * - Request:  query.cursor (string), query.limit (number, max 50)
 * - Response: { data: T[], meta?: { paginate?: { next_page?: string } } }
 */

export interface PaginatedResponse<T> {
  data: T[];
  meta?: {
    paginate?: {
      next_page?: string | null;
    };
  };
}

export type PaginatedOptions = {
  query?: {
    cursor?: string;
    limit?: number;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

type PaginatedFn<TOptions extends PaginatedOptions, TItem> = (
  options: TOptions
) => Promise<{ data?: PaginatedResponse<TItem>; error?: unknown }>;

/**
 * Async generator that auto-paginates through all pages.
 * Yields individual items from each page.
 *
 * @example
 * ```ts
 * for await (const user of paginate(listUsers, { client })) {
 *   console.log(user.first_name);
 * }
 * ```
 */
export async function* paginate<TOptions extends PaginatedOptions, TItem>(
  fn: PaginatedFn<TOptions, TItem>,
  options: TOptions
): AsyncGenerator<TItem, void, undefined> {
  let cursor: string | undefined;

  do {
    const callOptions = {
      ...options,
      query: {
        ...options.query,
        ...(cursor ? { cursor } : {}),
      },
    } as TOptions;

    const result = await fn(callOptions);

    if (result.error) {
      throw result.error;
    }

    const items = result.data?.data;
    if (!items || items.length === 0) {
      return;
    }

    for (const item of items) {
      yield item;
    }

    cursor = result.data?.meta?.paginate?.next_page ?? undefined;
  } while (cursor);
}

/**
 * Collect all items from a paginated endpoint into an array.
 */
export async function paginateAll<TOptions extends PaginatedOptions, TItem>(
  fn: PaginatedFn<TOptions, TItem>,
  options: TOptions
): Promise<TItem[]> {
  const items: TItem[] = [];
  for await (const item of paginate(fn, options)) {
    items.push(item);
  }
  return items;
}
