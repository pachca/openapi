'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import { SidebarItem } from './sidebar-item';
import type { NavigationSection, NavigationItem } from '@/lib/openapi/types';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef, useCallback } from 'react';
import { transliterate } from '@/lib/utils/transliterate';

interface SidebarNavProps {
  navigation: NavigationSection[];
  onNavigate?: (href: string) => void;
  /**
   * Highlight this href instead of the current pathname. Used while a
   * navigation started from the sidebar is still in flight, so the target
   * item looks selected right away instead of lighting up after the commit.
   */
  activePath?: string;
  /**
   * Namespace for the accordion element ids (see `accordionIds`). Both
   * sidebars are mounted at once, so each needs its own namespace to keep
   * the ids unique across the document.
   */
  idPrefix: string;
}

/**
 * Deterministic `id` / `aria-controls` / `aria-labelledby` for an accordion
 * group, derived from the group's own key.
 *
 * Radix builds these from `useId()` and freezes the value in state on first
 * render. `Sidebar` is a streamed async server component, so the React tree
 * id at hydration doesn't always match the one the server rendered with, and
 * the pair comes out different on the two sides — React reports a hydration
 * mismatch and leaves the attributes unpatched, which breaks the
 * trigger-to-content wiring for screen readers.
 *
 * Radix spreads caller props *after* its own attributes on both the trigger
 * and the content, so passing our own ids overrides the generated ones and
 * takes `useId` out of the markup entirely.
 */
function accordionIds(prefix: string, key: string) {
  // FNV-1a — keeps ids unique where slugifying alone would collide
  // (`/api/x-y` and `/api/x/y` slugify the same).
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  const slug = transliterate(key)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const base = `${prefix}-${slug}-${(hash >>> 0).toString(36)}`;
  return { triggerId: `${base}-trigger`, contentId: `${base}-content` };
}

/**
 * Stable accordion key — URL is always unique across the sidebar, so two
 * groups that share the same display title (e.g. "По дням" inside each
 * year section) don't collide on the Radix Accordion value.
 */
function groupKey(item: NavigationItem): string {
  return item.href || item.title;
}

/**
 * Check if a group or any of its children match the current pathname.
 */
function isGroupActive(item: NavigationItem, pathname: string): boolean {
  if (item.href === pathname) return true;
  return item.children?.some((child) => child.href === pathname) ?? false;
}

export function SidebarNav({ navigation, onNavigate, activePath, idPrefix }: SidebarNavProps) {
  const currentPathname = usePathname();
  const pathname = activePath ?? currentPathname;
  const isInternalNav = useRef(false);

  // Collect all groups (items with children) across all sections
  const allGroups = navigation.flatMap((s) => s.items.filter((i) => i.children));

  // Initialize open groups based on current path
  const [openGroups, setOpenGroups] = useState<string[]>(() => {
    return allGroups.filter((g) => isGroupActive(g, pathname)).map(groupKey);
  });

  const handleItemClick = (href: string) => {
    isInternalNav.current = true;
    onNavigate?.(href);
  };

  // On external navigation: expand group containing active item
  useEffect(() => {
    if (isInternalNav.current) {
      isInternalNav.current = false;
      return;
    }

    const activeGroup = allGroups.find((g) => isGroupActive(g, pathname));
    if (activeGroup) {
      const key = groupKey(activeGroup);
      setOpenGroups((prev) => (prev.includes(key) ? prev : [...prev, key]));
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
        const accordionItem = container.querySelector<HTMLElement>(
          `[data-group-key="${CSS.escape(newlyOpened)}"]`
        );
        if (!accordionItem) return;

        const containerRect = container.getBoundingClientRect();
        const itemRect = accordionItem.getBoundingClientRect();
        const groupHeight = itemRect.height;
        const visibleHeight = containerRect.height;

        // Priority: the group's trigger (top of the item) must stay visible.
        // — If the group fits entirely in the viewport and its bottom
        //   overflows, scroll just enough to show the whole group.
        // — Otherwise (large group) keep the trigger pinned to the top of
        //   the viewport and let the user scroll the rest by hand.
        // — If the top is already above the viewport, scroll up to reveal it.
        const padding = 8;
        let targetScrollTop: number | null = null;

        if (itemRect.top < containerRect.top) {
          // Top of the group is above the viewport — reveal it.
          targetScrollTop = container.scrollTop + (itemRect.top - containerRect.top) - padding;
        } else if (groupHeight <= visibleHeight && itemRect.bottom > containerRect.bottom) {
          // Whole group fits but its bottom overflows — pull the bottom up.
          targetScrollTop =
            container.scrollTop + (itemRect.bottom - containerRect.bottom) + padding;
        } else if (groupHeight > visibleHeight && itemRect.top > containerRect.top) {
          // Group is taller than the viewport — pin its top to the viewport top.
          targetScrollTop = container.scrollTop + (itemRect.top - containerRect.top) - padding;
        }

        if (targetScrollTop !== null) {
          container.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
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
                    isOpen={openGroups.includes(groupKey(item))}
                    onItemClick={handleItemClick}
                    activePath={activePath}
                    idPrefix={idPrefix}
                  />
                </li>
              ) : (
                <SidebarItem
                  key={iIdx}
                  item={item}
                  onItemClick={handleItemClick}
                  activePath={activePath}
                />
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
  activePath,
  idPrefix,
}: {
  item: NavigationItem;
  pathname: string;
  isOpen: boolean;
  onItemClick: (href: string) => void;
  activePath?: string;
  idPrefix: string;
}) {
  const activeChild = item.children?.find((c) => c.href === pathname);
  const key = groupKey(item);
  const { triggerId, contentId } = accordionIds(idPrefix, key);

  return (
    <>
      <Accordion.Item value={key} data-group-key={key} className="overflow-hidden">
        <Accordion.Header>
          <Accordion.Trigger
            id={triggerId}
            aria-controls={contentId}
            className="flex gap-1.5 w-full items-center justify-between px-2.5 py-1.5 text-[14px] leading-[1.4] rounded-md text-text-secondary hover:bg-glass-hover transition-colors duration-200 font-medium tracking-tight group cursor-pointer outline-none"
          >
            <span className="min-w-0 flex items-center gap-1">
              <span className="truncate">{item.title}</span>
            </span>
            <ChevronDown
              className="w-3.5 h-3.5 text-text-secondary group-hover:text-text-primary transition-all duration-200 -rotate-90 group-data-[state=open]:rotate-0 shrink-0"
              strokeWidth={2.5}
            />
          </Accordion.Trigger>
        </Accordion.Header>

        <Accordion.Content
          id={contentId}
          aria-labelledby={triggerId}
          className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden"
        >
          <div className="ml-3 pl-4 border-l border-glass-divider mt-1 space-y-0.5">
            <ul className="list-none space-y-0.5">
              {item.children!.map((child, cIdx) => (
                <SidebarItem
                  key={cIdx}
                  item={child}
                  onItemClick={onItemClick}
                  activePath={activePath}
                />
              ))}
            </ul>
          </div>
        </Accordion.Content>
      </Accordion.Item>

      {/* Active child shortcut — рендерится СНАРУЖИ Accordion.Item, потому что
          условный блок внутри Item меняет позицию Content в дереве и триггерит
          расхождение `useId` в Radix → hydration mismatch на aria-controls.
          См. radix-ui/primitives#3700, vercel/next.js#84029. */}
      {!isOpen && activeChild && (
        <div className="ml-3 pl-4 border-l border-glass-divider mt-1 space-y-0.5">
          <ul className="list-none space-y-0.5">
            <SidebarItem item={activeChild} onItemClick={onItemClick} activePath={activePath} />
          </ul>
        </div>
      )}
    </>
  );
}
