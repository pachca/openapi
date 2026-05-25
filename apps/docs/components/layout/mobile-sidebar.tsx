'use client';

import { useState, useEffect } from 'react';
import { PanelLeftClose, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import * as Select from '@radix-ui/react-select';
import { SidebarNav } from './sidebar-nav';
import { SearchButton } from './search-button';
import type { NavigationSection } from '@/lib/openapi/types';
import { TABS, type TabId } from '@/lib/tabs-config';
import { useActiveTab } from './use-last-tab';
import { useRouter } from 'next/navigation';

interface MobileSidebarProps {
  navigationByTab: Record<TabId, NavigationSection[]>;
}

export function MobileSidebar({ navigationByTab }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const activeTab = useActiveTab();
  const [selectedTab, setSelectedTab] = useState<TabId>(activeTab);

  // Sync selectedTab when the active tab changes (e.g. user navigated to a page in another tab)
  useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

  const navigation = navigationByTab[selectedTab] || [];

  // Listen for toggle event from nav bar
  useEffect(() => {
    const handler = () =>
      setIsOpen((prev) => {
        const next = !prev;
        if (next) setHasOpened(true);
        return next;
      });
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

  const handleTabChange = (value: string) => {
    const tabId = value as TabId;
    setSelectedTab(tabId);
    const tabConfig = TABS.find((t) => t.id === tabId);
    if (tabConfig) {
      router.push(tabConfig.defaultHref);
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

          {/* Search */}
          <div className="px-2.5 pb-3 shrink-0">
            <SearchButton />
          </div>

          {/* Tab switcher (select) */}
          <div className="px-2.5 pb-3 shrink-0">
            <Select.Root value={selectedTab} onValueChange={handleTabChange}>
              <Select.Trigger
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-md border border-glass-border bg-glass text-[14px] font-medium text-text-primary cursor-pointer hover:bg-glass-hover transition-colors"
                aria-label="Раздел"
              >
                <Select.Value />
                <Select.Icon>
                  <ChevronDown className="w-4 h-4 text-text-secondary" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  position="popper"
                  sideOffset={4}
                  className="z-[80] min-w-[var(--radix-select-trigger-width)] rounded-md border border-glass-border bg-background-secondary/95 backdrop-blur-xl shadow-lg overflow-hidden"
                >
                  <Select.Viewport className="p-1">
                    {TABS.map((tab) => (
                      <Select.Item
                        key={tab.id}
                        value={tab.id}
                        className="px-3 py-1.5 text-[14px] rounded-md text-text-primary cursor-pointer hover:bg-glass-hover data-[highlighted]:bg-glass-hover outline-none"
                      >
                        <Select.ItemText>{tab.title}</Select.ItemText>
                      </Select.Item>
                    ))}
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>

          {/* Navigation — lazy-rendered to keep SSR output free of duplicate nav text */}
          {hasOpened && navigation.length > 0 && (
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
