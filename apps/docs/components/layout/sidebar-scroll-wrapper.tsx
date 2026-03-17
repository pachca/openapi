'use client';

import { useState, useRef, useEffect, useLayoutEffect, ReactNode } from 'react';

interface SidebarScrollWrapperProps {
  children: ReactNode;
}

export function SidebarScrollWrapper({ children }: SidebarScrollWrapperProps) {
  const [scrolled, setScrolled] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  // Scroll to active item before first paint — no visible jump
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const activeItem = nav.querySelector('[data-active]');
    if (!activeItem) return;

    const navRect = nav.getBoundingClientRect();
    const itemRect = activeItem.getBoundingClientRect();

    if (itemRect.top < navRect.top || itemRect.bottom > navRect.bottom) {
      // Calculate position relative to scroll container
      const relativeTop = itemRect.top - navRect.top + nav.scrollTop;
      nav.scrollTop = relativeTop - nav.clientHeight / 2;
    }
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = navRef.current;
        setScrolled(scrollTop > 4);
        setScrolledToBottom(scrollHeight - scrollTop - clientHeight < 4);
      }
    };

    const currentNav = navRef.current;
    if (currentNav) {
      currentNav.addEventListener('scroll', handleScroll, { passive: true });
      // Проверяем начальное состояние
      handleScroll();
    }

    return () => {
      if (currentNav) {
        currentNav.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  return (
    <div className="relative flex-1 overflow-hidden flex flex-col min-h-0">
      <div
        className={`absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-background-secondary via-background-secondary/80 to-transparent z-20 pointer-events-none transition-opacity duration-200 ${
          scrolled ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <nav
        ref={navRef}
        id="sidebar-scroll-container"
        className="px-2.5 flex-1 overflow-y-auto min-h-0 custom-scrollbar pb-4"
      >
        {children}
      </nav>
      <div
        className={`absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-background-secondary via-background-secondary/80 to-transparent z-20 pointer-events-none transition-opacity duration-200 ${
          scrolledToBottom ? 'opacity-0' : 'opacity-100'
        }`}
      />
    </div>
  );
}
