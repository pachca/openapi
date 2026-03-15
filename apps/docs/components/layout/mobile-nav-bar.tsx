'use client';

import { usePathname } from 'next/navigation';
import { ChevronRight, PanelLeft } from 'lucide-react';
import type { NavigationSection } from '@/lib/openapi/types';

interface Breadcrumb {
  section: string;
  page?: string;
}

function findBreadcrumb(navigation: NavigationSection[], pathname: string): Breadcrumb | null {
  for (const section of navigation) {
    for (const item of section.items) {
      if (item.href === pathname) {
        return {
          section: section.title || item.title,
          page: section.title ? item.title : undefined,
        };
      }
      if (item.children) {
        for (const child of item.children) {
          if (child.href === pathname) {
            return { section: item.title, page: child.title };
          }
        }
      }
    }
  }
  return null;
}

interface MobileNavBarProps {
  guideNavigation: NavigationSection[];
  apiNavigation: NavigationSection[];
}

export function MobileNavBar({ guideNavigation, apiNavigation }: MobileNavBarProps) {
  const pathname = usePathname();

  const breadcrumb =
    findBreadcrumb(guideNavigation, pathname) || findBreadcrumb(apiNavigation, pathname);

  return (
    <div
      className="lg:hidden fixed left-0 right-0 bg-background/80 backdrop-blur-xl border-b border-background-border z-50"
      style={{ top: 'var(--mobile-header-height)', height: 'var(--mobile-nav-height)' }}
    >
      <button
        onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-menu'))}
        className="flex items-center gap-2 w-full h-full px-3 text-[14px] font-medium text-text-secondary active:bg-glass-hover transition-colors cursor-pointer"
        aria-label="Открыть меню"
      >
        <PanelLeft className="w-4 h-4 shrink-0 text-text-tertiary" />
        {breadcrumb ? (
          <>
            <span className="truncate shrink-0">{breadcrumb.section}</span>
            {breadcrumb.page && (
              <>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 text-text-tertiary" strokeWidth={2} />
                <span className="truncate text-text-primary">{breadcrumb.page}</span>
              </>
            )}
          </>
        ) : (
          <span className="truncate">Главная</span>
        )}
      </button>
    </div>
  );
}
