'use client';

import { useState, useEffect } from 'react';
import { PanelLeftClose, ChevronDown, ArrowUpRight } from 'lucide-react';
import { usePathname } from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { SidebarNav } from './sidebar-nav';
import type { NavigationSection } from '@/lib/openapi/types';
import { TABS, STATUS_URL, getActiveTab, type TabId } from '@/lib/tabs-config';

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
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`
          lg:hidden fixed inset-0 bg-black/20 z-[60] backdrop-blur-sm
          transition-all duration-300 ease-in-out
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setIsOpen(false)}
      />

      {/* Full-height sidebar over header */}
      <div
        className={`
          lg:hidden fixed inset-y-0 left-0 w-[280px] max-w-[85vw] bg-background-secondary z-[70]
          transition-transform duration-300 ease-in-out
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
              className="w-full flex items-center p-2 rounded-lg transition-colors cursor-pointer text-text-primary"
              aria-label="Закрыть меню"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          {/* Tab selector dropdown */}
          <div className="px-2.5 pb-3 shrink-0">
            <DropdownMenu.Root modal={false}>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-1.5 px-2 py-1.5 w-full rounded-lg bg-background border border-background-border text-text-primary transition-colors cursor-pointer outline-none">
                  <span className="text-[13px] font-medium flex-1 text-left">
                    {selectedTabConfig?.title || 'Руководство разработчика'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="z-[80] bg-background border border-background-border rounded-lg p-1.5 shadow-xl animate-dropdown"
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
                          ? 'bg-primary text-white'
                          : 'text-text-primary hover:bg-background-tertiary'
                      }`}
                    >
                      {tab.title}
                    </DropdownMenu.Item>
                  ))}
                  <DropdownMenu.Separator className="h-px bg-background-border my-1.5" />
                  <DropdownMenu.Item asChild>
                    <a
                      href={STATUS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-[13px] font-medium rounded-md cursor-pointer outline-none text-text-secondary hover:text-text-primary hover:bg-background-tertiary transition-colors"
                    >
                      Статус
                      <ArrowUpRight className="w-3.5 h-3.5 text-text-tertiary" />
                    </a>
                  </DropdownMenu.Item>
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
