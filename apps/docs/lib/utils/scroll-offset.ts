export function getScrollOffset(): number {
  const style = getComputedStyle(document.documentElement);
  const header = parseInt(style.getPropertyValue('--mobile-header-height') || '56', 10);
  const nav = parseInt(style.getPropertyValue('--mobile-nav-height') || '0', 10);
  return header + nav + 24;
}
