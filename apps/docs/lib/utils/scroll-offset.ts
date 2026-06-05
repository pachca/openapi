export function getScrollOffset(): number {
  // Mirrors the CSS --scroll-offset (header bottom + 24px). The header bottom
  // is constant at every width, so no breakpoint branch is needed.
  const style = getComputedStyle(document.documentElement);
  const header = parseInt(style.getPropertyValue('--header-height') || '97', 10);
  return header + 24;
}
