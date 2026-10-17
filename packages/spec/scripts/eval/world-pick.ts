/**
 * How the fake workspace (`world.json`) answers a call: which of its texts a
 * call gets. Shared by the stub, which answers with it, and by build-inputs,
 * which sends every scenario's right path through it before a run.
 */

/**
 * Arguments that ride along with what a call is about, and that no key names
 * by a bare value: a send that replies in a chain carries the id of the message
 * it answers in `parent_message_id`, and a key `603381` written for that number
 * sent as a chat refused the chain reply it did not mean.
 */
const RIDERS = new Set(['parent_message_id', 'draft_id', 'files']);

/** The answer to a page the world does not have: an empty last one. */
const endOfList = (cursor: string): string => `Nothing matched after cursor ${cursor}.\nEnd of list.`;

const spelled = (value: unknown): string => (typeof value === 'object' ? JSON.stringify(value) : String(value)).toLowerCase();

/**
 * Which answer of a set a call gets. A key is one value the call passed, or
 * several joined by `+` that must all be among its values — `thread+87215` is a
 * send to thread 87215, while `87215` alone is the same number sent as a chat.
 * A part written `name=value` matches only that argument. The key with more
 * parts wins, an exact value before a word found inside free text, and then the
 * order of the set. A key of one Russian word such as «ревью» also matches a
 * longer query that contains it — what a person types is never the key exactly —
 * while an enum value has to be exact: «undone» is not «done». A call that pages
 * on with a cursor the world does not know has reached the end, whether the
 * world keeps pages for that tool or one text; `*` answers anything else.
 */
export function pick(entry: unknown, given: Record<string, unknown>): unknown {
  const cursor = given.cursor;
  const paging = typeof cursor === 'string' && cursor !== '';
  if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
    return paging && typeof entry === 'string' ? endOfList(cursor) : entry;
  }
  const set = entry as Record<string, unknown>;
  if (paging) return set[cursor] ?? endOfList(cursor);
  const about = Object.entries(given).filter(([name]) => !RIDERS.has(name));
  const exact = new Set(about.map(([, v]) => spelled(v)));
  for (const [, v] of about) if (Array.isArray(v)) v.forEach((item) => exact.add(String(item).toLowerCase()));
  const text = [...exact].join(' ');
  let best: { key: string; parts: number; exact: number } | undefined;
  for (const key of Object.keys(set)) {
    if (key === '*') continue;
    const parts = key.toLowerCase().split('+');
    let exactParts = 0;
    const fits = parts.every((part) => {
      const named = part.match(/^([a-z_]+)=(.+)$/);
      if (named) {
        const value = given[named[1]!];
        if (value === undefined || value === null || spelled(value) !== named[2]) return false;
        exactParts += 1;
        return true;
      }
      if (exact.has(part)) {
        exactParts += 1;
        return true;
      }
      return parts.length === 1 && /[а-яё]/i.test(part) && text.includes(part);
    });
    if (!fits) continue;
    if (!best || parts.length > best.parts || (parts.length === best.parts && exactParts > best.exact)) {
      best = { key, parts: parts.length, exact: exactParts };
    }
  }
  return best ? set[best.key] : set['*'];
}

/**
 * A refusal written into the world: `!<status> <code> · key … · value … · message …`.
 * The stub answers it the way `RESPONSE_FORMAT.errors` asks — the line of
 * `REFUSALS` for its status, then the error item whole — and records it as
 * refused, since the call changed nothing.
 */
export const REFUSAL = /^!(\d{3}) (\S+)(.*)$/;
