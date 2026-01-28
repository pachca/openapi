'use client';

import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { PachkaLogo } from './pachka-logo';
import { ThemeToggle } from './theme-toggle';
import { SearchButton } from './search-button';
import { SidebarNav } from './sidebar-nav';
import type { NavigationSection } from '@/lib/openapi/types';
import { usePathname } from 'next/navigation';

interface MobileSidebarProps {
  navigation: NavigationSection[];
}

export function MobileSidebar({ navigation }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Закрываем меню при смене маршрута
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- closing menu on route change is intentional
    setIsOpen(false);
  }, [pathname]);

  // Блокируем скролл body когда меню открыто
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

  return (
    <>
      {/* Мобильный хедер */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 bg-background-secondary border-b border-background-border z-50 flex items-center px-4 justify-between"
        style={{ height: 'var(--mobile-header-height)' }}
      >
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <PachkaLogo className="text-text-primary" />
            <span className="text-[14px] font-semibold text-primary tracking-tight translate-y-px">
              API
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <SearchButton variant="header" />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg bg-background transition-colors cursor-pointer border border-background-border"
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="w-5 h-5 text-text-primary" />
            ) : (
              <Menu className="w-5 h-5 text-text-primary" />
            )}
          </button>
        </div>
      </div>

      {/* Оверлей */}
      <div
        className={`
          lg:hidden fixed inset-0 bg-black/20 z-40 backdrop-blur-sm
          transition-all duration-300 ease-in-out
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setIsOpen(false)}
        style={{ top: 'var(--mobile-header-height)' }}
      />

      {/* Выдвижное меню */}
      <div
        className={`
          lg:hidden fixed left-0 right-0 bg-background-secondary border-b border-background-border z-50
          transition-all duration-300 ease-in-out overflow-hidden
          ${isOpen ? 'translate-y-0 opacity-100 visible' : '-translate-y-4 opacity-0 invisible'}
        `}
        style={{
          top: 'var(--mobile-header-height)',
          height: 'calc(100dvh - var(--mobile-header-height))',
        }}
      >
        <div
          className="overflow-y-auto custom-scrollbar h-full"
          id="mobile-sidebar-scroll-container"
        >
          <div className="p-4 space-y-4">
            <SidebarNav navigation={navigation} />
          </div>
        </div>
      </div>
    </>
  );
}
