'use client';

import { useState, useEffect } from 'react';
import { PanelLeftClose, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { SidebarNav } from './sidebar-nav';
import type { NavigationSection } from '@/lib/openapi/types';
import { TABS, getActiveTab, type TabId } from '@/lib/tabs-config';

interface MobileSidebarProps {
  guideNavigation: NavigationSection[];
  apiNavigation: NavigationSection[];
}

export function MobileSidebar({ guideNavigation, apiNavigation }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabId>('guide');
  const pathname = usePathname();
  const activeTab = getActiveTab(pathname);

  const navigationByTab: Record<string, NavigationSection[]> = {
    guide: guideNavigation,
    api: apiNavigation,
  };
  const navigation = navigationByTab[selectedTab] || [];
  const selectedTabConfig = TABS.find((t) => t.id === selectedTab);

  // Listen for toggle event from Header hamburger
  useEffect(() => {
    const handler = () => setIsOpen((prev) => !prev);
    window.addEventListener('toggle-mobile-menu', handler);
    return () => window.removeEventListener('toggle-mobile-menu', handler);
  }, []);

  // Close on route change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- closing menu on route change is intentional
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset selected tab to active tab when sidebar opens
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting tab on open is intentional
      setSelectedTab(activeTab ?? 'guide');
    }
  }, [isOpen, activeTab]);

  const handleTabSelect = (tabId: TabId) => {
    setSelectedTab(tabId);
    const scrollContainer = document.getElementById('mobile-sidebar-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTop = 0;
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`
          lg:hidden fixed inset-0 bg-[oklch(0%_0_0/0.2)] z-[60] backdrop-blur-sm
          transition-all duration-200 ease-in-out
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setIsOpen(false)}
      />

      {/* Full-height sidebar over header */}
      <div
        className={`
          lg:hidden fixed inset-y-0 left-0 w-[280px] max-w-[85vw] bg-background-secondary/80 backdrop-blur-xl z-[70]
          transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Close button */}
          <div
            className="flex items-center px-3 shrink-0"
            style={{ height: 'var(--mobile-header-height)' }}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center p-2 rounded-md transition-colors cursor-pointer text-text-primary"
              aria-label="Закрыть меню"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          {/* Tab selector dropdown */}
          <div className="px-2.5 pb-3 shrink-0">
            <DropdownMenu.Root modal={false}>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-1.5 px-2 py-1.5 w-full rounded-md bg-glass backdrop-blur-md border border-glass-heavy-border text-text-primary transition-colors cursor-pointer outline-none">
                  <span className="text-[13px] font-medium flex-1 text-left">
                    {selectedTabConfig?.title || 'Руководство разработчика'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-[80] bg-glass-heavy backdrop-blur-xl border border-glass-heavy-border rounded-xl p-1.5 space-y-0.5 shadow-xl animate-dropdown"
                  style={{ width: 'var(--radix-dropdown-menu-trigger-width)' }}
                  align="start"
                  side="bottom"
                  sideOffset={4}
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  {TABS.map((tab) => (
                    <DropdownMenu.Item
                      key={tab.id}
                      onClick={() => handleTabSelect(tab.id)}
                      className={`flex items-center px-2.5 py-1.5 text-[13px] font-medium rounded-md cursor-pointer outline-none transition-colors ${
                        selectedTab === tab.id
                          ? 'bg-primary/15 text-primary'
                          : 'text-text-primary hover:bg-glass-hover'
                      }`}
                    >
                      {tab.title}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>

          {/* Navigation */}
          {navigation.length > 0 && (
            <div
              className="overflow-y-auto custom-scrollbar flex-1"
              id="mobile-sidebar-scroll-container"
            >
              <div className="px-2.5 pb-4">
                <SidebarNav navigation={navigation} onNavigate={() => setIsOpen(false)} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
