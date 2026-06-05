'use client';

import { useState, useEffect } from 'react';
import { PanelLeftClose, ChevronDown } from 'lucide-react';
import { usePathname } from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { SidebarNav } from './sidebar-nav';
import type { NavigationSection } from '@/lib/openapi/types';
import { TABS, type TabId } from '@/lib/tabs-config';
import { useActiveTab } from './use-last-tab';
import { useBodyScrollLock } from '@/lib/hooks/use-body-scroll-lock';

interface MobileSidebarProps {
  navigationByTab: Record<TabId, NavigationSection[]>;
}

export function MobileSidebar({ navigationByTab }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const activeTab = useActiveTab();
  const [selectedTab, setSelectedTab] = useState<TabId>(activeTab);

  // Radix DropdownMenu generates random ids via useId, which differ between
  // SSR and the first client render and trigger a hydration warning. Render
  // a non-Radix placeholder until after mount to keep the markup stable.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync selectedTab when active tab changes (e.g. user navigated outside the panel)
  useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

  const navigation = navigationByTab[selectedTab] || [];

  // Listen for toggle event from nav bar
  useEffect(() => {
    const handler = () =>
      setIsOpen((prev) => {
        const next = !prev;
        if (next) {
          setHasOpened(true);
          // Reset tab switcher to the actually-active tab on each open,
          // so a previous in-panel selection doesn't survive across closes.
          setSelectedTab(activeTab);
        }
        return next;
      });
    window.addEventListener('toggle-mobile-menu', handler);
    return () => window.removeEventListener('toggle-mobile-menu', handler);
  }, [activeTab]);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when open (shared with the search modal)
  useBodyScrollLock(isOpen);

  const handleTabChange = (tabId: TabId) => {
    setSelectedTab(tabId);
  };

  const selectedTabConfig = TABS.find((t) => t.id === selectedTab);

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
            style={{ height: 'var(--logo-row-height)' }}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center p-2 rounded-md transition-colors cursor-pointer text-text-primary"
              aria-label="Закрыть меню"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          </div>

          {/* Tab switcher — same Radix DropdownMenu pattern used elsewhere */}
          <div className="px-2.5 pb-3 shrink-0">
            {!mounted ? (
              <button
                type="button"
                aria-label="Раздел"
                disabled
                className="w-full h-9 flex items-center justify-between gap-2 px-3 rounded-md border border-glass-border bg-glass text-[14px] font-medium text-text-primary cursor-pointer hover:bg-glass-hover transition-colors outline-none focus:outline-none focus-visible:ring-0 select-none group"
              >
                <span className="truncate">{selectedTabConfig?.title ?? 'Раздел'}</span>
                <ChevronDown
                  className="w-3.5 h-3.5 text-text-secondary group-hover:text-text-primary transition-colors shrink-0"
                  strokeWidth={2.5}
                />
              </button>
            ) : (
              <DropdownMenu.Root modal={false}>
                <DropdownMenu.Trigger asChild>
                  <button
                    aria-label="Раздел"
                    className="w-full h-9 flex items-center justify-between gap-2 px-3 rounded-md border border-glass-border bg-glass text-[14px] font-medium text-text-primary cursor-pointer hover:bg-glass-hover transition-colors outline-none focus:outline-none focus-visible:ring-0 select-none group"
                  >
                    <span className="truncate">{selectedTabConfig?.title ?? 'Раздел'}</span>
                    <ChevronDown
                      className="w-3.5 h-3.5 text-text-secondary group-hover:text-text-primary transition-colors shrink-0"
                      strokeWidth={2.5}
                    />
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className="z-[80] w-[var(--radix-dropdown-menu-trigger-width)] bg-glass-heavy backdrop-blur-xl border border-glass-heavy-border rounded-xl p-1.5 space-y-0.5 shadow-xl animate-dropdown"
                    align="start"
                    sideOffset={6}
                  >
                    {TABS.map((tab) => (
                      <DropdownMenu.Item
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`flex items-center px-2.5 py-1.5 text-[14px] font-medium rounded-md cursor-pointer outline-none transition-colors ${
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
            )}
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
