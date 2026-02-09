'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';

interface SidebarScrollWrapperProps {
  children: ReactNode;
}

export function SidebarScrollWrapper({ children }: SidebarScrollWrapperProps) {
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        setScrolled(navRef.current.scrollTop > 4);
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
        className="px-2.5 pb-4 flex-1 overflow-y-auto min-h-0 custom-scrollbar"
      >
        {children}
      </nav>
    </div>
  );
}
