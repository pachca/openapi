import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { getActiveTab, type TabId } from '@/lib/tabs-config';

/**
 * Module-level store for the last known tab.
 * Preserved across client-side navigations, resets to 'guides' on full page load.
 */
let storedTab: TabId = 'guides';

/**
 * Returns the active tab for the current pathname.
 * If the current page is tab-neutral, preserves the last known tab.
 * On full page load, defaults to 'guides'.
 */
export function useActiveTab(): TabId {
  const pathname = usePathname();
  const rawTab = getActiveTab(pathname);

  useEffect(() => {
    if (rawTab) storedTab = rawTab;
  }, [rawTab]);

  return rawTab ?? storedTab;
}
