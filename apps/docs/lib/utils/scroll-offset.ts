import { toSlug } from './transliterate';

export function getScrollOffset(): number {
  // Mirrors the CSS --scroll-offset (header bottom + 24px). The header bottom
  // is constant at every width, so no breakpoint branch is needed.
  const style = getComputedStyle(document.documentElement);
  const header = parseInt(style.getPropertyValue('--header-height') || '97', 10);
  return header + 24;
}

/**
 * Scroll the window so the element with this id (or with its slug, for a
 * Cyrillic hash) sits right below the fixed header. Null when the element is
 * not on the page (yet).
 */
export function scrollToAnchor(id: string): HTMLElement | null {
  const element = document.getElementById(id) || document.getElementById(toSlug(id));
  if (!element) return null;
  window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - getScrollOffset());
  return element;
}

/** The id in a URL hash (`#…`, encoded or not); a malformed escape is kept as is. */
export function decodeHash(hash: string): string {
  const raw = hash.replace(/^#/, '');
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * Move keyboard and screen reader focus to the element a jump landed on,
 * without scrolling again: a heading or `<main>` gets `tabindex="-1"` to be
 * focusable, outside the Tab order.
 */
export function focusWithoutScroll(element: HTMLElement): void {
  if (element.tabIndex < 0 && !element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '-1');
  }
  element.focus({ preventScroll: true });
}

/**
 * Scroll positions the reader jumped from within a page (a section of the
 * open page from search, an anchor link): URL with its hash → scrollY. Back
 * to that URL returns there (TransitionProvider). Keyed by the URL, not kept
 * in `history.state`: Next reloads the page on Back to an entry whose state
 * is not its own, and an entry of a plain anchor link has none.
 */
const jumpOrigins = new Map<string, number>();

function currentUrlKey(): string {
  const { pathname, search, hash } = window.location;
  return pathname + search + hash;
}

/** Remember where the reader is, right before a jump within the page. */
export function rememberScrollPosition(): void {
  jumpOrigins.set(currentUrlKey(), window.scrollY);
}

/** The position remembered for the current URL, see `rememberScrollPosition`. */
export function rememberedScrollPosition(): number | undefined {
  return jumpOrigins.get(currentUrlKey());
}

/**
 * A jump within the page: remember where the reader is and push `#id` (an
 * empty id: the page without a hash), so Back returns there. TransitionProvider
 * remembers the position by itself for clicks on `<a>`; buttons and menu items
 * (the search dialog, the mobile table of contents) call this.
 */
export function pushHash(id: string): void {
  rememberScrollPosition();
  const { pathname, search } = window.location;
  window.history.pushState(null, '', id ? `#${id}` : pathname + search);
}

/**
 * Scroll to the element of the URL hash, retrying for a few frames while the
 * page is still rendering it.
 */
export function scrollToHash(attempts = 10): void {
  const id = decodeHash(window.location.hash);
  if (!id) return;
  if (scrollToAnchor(id) || attempts <= 0) return;
  requestAnimationFrame(() => scrollToHash(attempts - 1));
}
