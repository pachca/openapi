'use client';

import { SidebarScrollWrapper } from './sidebar-scroll-wrapper';
import { SidebarNav } from './sidebar-nav';
import { SidebarHeader } from './sidebar-header';
import { SidebarFooter } from './sidebar-footer';
import { MobileSidebar } from './mobile-sidebar';
import type { NavigationSection } from '@/lib/openapi/types';

interface SidebarClientProps {
  navigation: NavigationSection[];
}

function SidebarClient({ navigation }: SidebarClientProps) {
  return (
    <>
      {/* Мобильная версия */}
      <MobileSidebar navigation={navigation} />

      {/* Десктопная версия */}
      <aside className="hidden lg:flex w-[320px] min-w-[320px] h-screen bg-background-secondary border-r border-background-border flex-col shrink-0 z-40">
        <SidebarHeader />
        <SidebarScrollWrapper>
          <SidebarNav navigation={navigation} />
        </SidebarScrollWrapper>
        <SidebarFooter />
      </aside>
    </>
  );
}

export { SidebarClient };
