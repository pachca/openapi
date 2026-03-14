'use client';

import { useState, useEffect } from 'react';
import { PanelLeftClose } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SidebarNav } from './sidebar-nav';
import type { NavigationSection } from '@/lib/openapi/types';
import { TABS, type TabId } from '@/lib/tabs-config';
import { useActiveTab } from './use-last-tab';

interface MobileSidebarProps {
  guideNavigation: NavigationSection[];
  apiNavigation: NavigationSection[];
}

export function MobileSidebar({ guideNavigation, apiNavigation }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabId>('guide');
  const pathname = usePathname();
  const activeTab = useActiveTab();

  const navigationByTab: Record<string, NavigationSection[]> = {
    guide: guideNavigation,
    api: apiNavigation,
  };
  const navigation = navigationByTab[selectedTab] || [];
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
          lg:hidden fixed inset-y-0 left-0 w-[300px] max-w-[85vw] bg-background-secondary/80 backdrop-blur-xl z-[70]
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

          {/* Tab selector pills */}
          <div className="px-2.5 pb-3 shrink-0">
            <nav className="flex items-center gap-0.5 p-1 rounded-full bg-glass backdrop-blur-md border border-glass-border w-full">
              {TABS.map((tab, i) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabSelect(tab.id)}
                  className={`flex-auto px-3 py-1.5 text-[14px] leading-[1.4] font-medium rounded-full transition-colors duration-200 cursor-pointer text-center whitespace-nowrap ${
                    i === 0 ? 'min-w-0 truncate' : ''
                  } ${
                    selectedTab === tab.id
                      ? 'bg-primary/15 text-primary'
                      : 'text-text-secondary hover:bg-glass-hover hover:text-text-primary'
                  }`}
                >
                  {tab.shortTitle}
                </button>
              ))}
            </nav>
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
