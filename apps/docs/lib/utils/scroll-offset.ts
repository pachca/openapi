export function getScrollOffset(): number {
  const style = getComputedStyle(document.documentElement);
  const header = parseInt(style.getPropertyValue('--mobile-header-height') || '56', 10);
  const mobileNav = parseInt(style.getPropertyValue('--mobile-nav-height') || '0', 10);
  const tabs = parseInt(style.getPropertyValue('--header-tabs-height') || '0', 10);
  // Mirror the CSS breakpoint in globals.css: desktop swaps the mobile
  // bottom nav for a second header row with tab links.
  const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
  return header + (isDesktop ? tabs : mobileNav) + 24;
}
