'use client';

import { SidebarScrollWrapper } from './sidebar-scroll-wrapper';
import { SidebarNav } from './sidebar-nav';
import { MobileSidebar } from './mobile-sidebar';
import { MobileNavBar } from './mobile-nav-bar';
import type { NavigationSection } from '@/lib/openapi/types';
import type { TabId } from '@/lib/tabs-config';
import { useActiveTab } from './use-last-tab';

interface SidebarClientProps {
  navigationByTab: Record<TabId, NavigationSection[]>;
}

function SidebarClient({ navigationByTab }: SidebarClientProps) {
  const activeTab = useActiveTab();
  const navigation = navigationByTab[activeTab] || [];

  return (
    <>
      {/* Mobile */}
      <MobileNavBar navigationByTab={navigationByTab} />
      <MobileSidebar navigationByTab={navigationByTab} />

      {/* Desktop */}
      {navigation.length > 0 && (
        <aside className="hidden lg:flex w-[300px] fixed top-[var(--desktop-header-height)] bottom-0 left-0 bg-background-secondary/80 backdrop-blur-xl border-r border-glass-border flex-col z-40">
          <SidebarScrollWrapper key={activeTab}>
            <SidebarNav navigation={navigation} />
          </SidebarScrollWrapper>
        </aside>
      )}
    </>
  );
}

export { SidebarClient };
