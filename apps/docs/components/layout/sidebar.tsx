'use client';

import { SidebarScrollWrapper } from './sidebar-scroll-wrapper';
import { SidebarNav } from './sidebar-nav';
import { SearchButton } from './search-button';
import { MobileSidebar } from './mobile-sidebar';
import type { NavigationSection } from '@/lib/openapi/types';
import { usePathname } from 'next/navigation';
import { getActiveTab } from '@/lib/tabs-config';

interface SidebarClientProps {
  guideNavigation: NavigationSection[];
  apiNavigation: NavigationSection[];
}

function SidebarClient({ guideNavigation, apiNavigation }: SidebarClientProps) {
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);

  // Choose navigation based on active tab (tabs without navigation get empty array)
  const navigationByTab: Record<string, NavigationSection[]> = {
    guide: guideNavigation,
    api: apiNavigation,
  };
  const navigation = navigationByTab[activeTab ?? 'guide'] || [];

  return (
    <>
      {/* Мобильная версия */}
      <MobileSidebar guideNavigation={guideNavigation} apiNavigation={apiNavigation} />

      {/* Десктопная версия */}
      <aside className="hidden lg:flex w-[280px] fixed top-[var(--mobile-header-height)] bottom-0 left-0 bg-background-secondary/80 backdrop-blur-xl border-r border-glass-border flex-col z-40">
        <div className="px-2.5 py-4 shrink-0">
          <SearchButton />
        </div>
        {navigation.length > 0 && (
          <SidebarScrollWrapper>
            <SidebarNav navigation={navigation} />
          </SidebarScrollWrapper>
        )}
      </aside>
    </>
  );
}

export { SidebarClient };
