'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { SidebarItem } from './sidebar-item';
import type { NavigationSection, NavigationItem } from '@/lib/openapi/types';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';

interface SidebarNavProps {
  navigation: NavigationSection[];
  onNavigate?: () => void;
}

/**
 * Check if a group or any of its children match the current pathname.
 */
function isGroupActive(item: NavigationItem, pathname: string): boolean {
  if (item.href === pathname) return true;
  return item.children?.some((child) => child.href === pathname) ?? false;
}

export function SidebarNav({ navigation, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const isInternalNav = useRef(false);

  // Collect all groups (items with children) across all sections
  const allGroups = navigation.flatMap((s) => s.items.filter((i) => i.children));

  // Initialize open groups based on current path
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    return allGroups.filter((g) => isGroupActive(g, pathname)).map((g) => g.title);
  });

  const handleItemClick = () => {
    isInternalNav.current = true;
    onNavigate?.();
  };

  // On external navigation: expand group containing active item
  useEffect(() => {
    if (isInternalNav.current) {
      isInternalNav.current = false;
      return;
    }

    const activeGroup = allGroups.find((g) => isGroupActive(g, pathname));
    if (activeGroup) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentionally updating state on navigation
      setOpenGroups((prev) =>
        prev.includes(activeGroup.title) ? prev : [...prev, activeGroup.title]
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleGroupsChange = useCallback(
    (value: string[]) => {
      const newlyOpened = value.find((v) => !openGroups.includes(v));
      setOpenGroups(value);

      if (!newlyOpened) return;

      const container =
        document.getElementById('sidebar-scroll-container') ||
        document.getElementById('mobile-sidebar-scroll-container');
      if (!container) return;

      // Wait for accordion animation to finish
      setTimeout(() => {
        // Find the accordion item that just opened
        const openItems = container.querySelectorAll('[data-state=open]');
        const accordionItem = Array.from(openItems)
          .find((el) => el.closest('.overflow-hidden')?.textContent?.includes(newlyOpened))
          ?.closest('.overflow-hidden');
        if (!accordionItem) return;

        const containerRect = container.getBoundingClientRect();
        const itemRect = accordionItem.getBoundingClientRect();

        // Only scroll if the bottom of the group overflows the visible area
        if (itemRect.bottom > containerRect.bottom) {
          const overflow = itemRect.bottom - containerRect.bottom;
          container.scrollTo({
            top: container.scrollTop + overflow + 32,
            behavior: 'smooth',
          });
        }
      }, 220);
    },
    [openGroups]
  );

  return (
    <Accordion.Root
      type="multiple"
      value={openGroups}
      onValueChange={handleGroupsChange}
      className="flex flex-col gap-4"
    >
      {navigation.map((section, sIdx) => (
        <div key={sIdx} className="navigation-section">
          {/* Section header or divider */}
          {section.title ? (
            <div className="px-2.5 pb-2 pt-1 text-[14px] font-medium text-text-primary">
              {section.title}
            </div>
          ) : (
            <div className="mx-2.5 mb-4 border-t border-glass-divider" />
          )}

          {/* Section items */}
          <ul className="space-y-0.5 list-none">
            {section.items.map((item, iIdx) =>
              item.children ? (
                <li key={iIdx}>
                  <SidebarGroup
                    item={item}
                    pathname={pathname}
                    isOpen={openGroups.includes(item.title)}
                    onItemClick={handleItemClick}
                  />
                </li>
              ) : (
                <SidebarItem key={iIdx} item={item} onItemClick={handleItemClick} />
              )
            )}
          </ul>
        </div>
      ))}
    </Accordion.Root>
  );
}

/**
 * Collapsible group within a section.
 */
function SidebarGroup({
  item,
  pathname,
  isOpen,
  onItemClick,
}: {
  item: NavigationItem;
  pathname: string;
  isOpen: boolean;
  onItemClick: () => void;
}) {
  const activeChild = item.children?.find((c) => c.href === pathname);

  return (
    <Accordion.Item value={item.title} className="overflow-hidden">
      <Accordion.Header>
        <Accordion.Trigger className="flex gap-1.5 w-full items-center justify-between px-2.5 py-1.5 text-[14px] leading-[1.4] rounded-lg text-text-secondary hover:bg-glass-hover transition-colors duration-200 font-medium tracking-tight group cursor-pointer outline-none">
          <span className="min-w-0 flex items-center gap-1">
            <span className="truncate">{item.title}</span>
            {item.originalTitle && (
              <span className="shrink-0 text-text-secondary">({item.originalTitle})</span>
            )}
          </span>
          <ChevronDown
            className="w-3.5 h-3.5 text-text-secondary group-hover:text-text-primary transition-all duration-200 -rotate-90 group-data-[state=open]:rotate-0 shrink-0"
            strokeWidth={2.5}
          />
        </Accordion.Trigger>
      </Accordion.Header>

      {/* Show active child when group is collapsed */}
      {!isOpen && activeChild && (
        <div className="ml-3 pl-4 border-l border-glass-divider mt-1 space-y-0.5">
          <ul className="list-none space-y-0.5">
            <SidebarItem item={activeChild} onItemClick={onItemClick} />
          </ul>
        </div>
      )}

      <Accordion.Content className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
        <div className="ml-3 pl-4 border-l border-glass-divider mt-1 space-y-0.5">
          <ul className="list-none space-y-0.5">
            {item.children!.map((child, cIdx) => (
              <SidebarItem key={cIdx} item={child} onItemClick={onItemClick} />
            ))}
          </ul>
        </div>
      </Accordion.Content>
    </Accordion.Item>
  );
}
