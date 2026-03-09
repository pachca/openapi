'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { List } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { usePathname } from 'next/navigation';
import { useToc } from './use-toc';

gsap.registerPlugin(ScrollToPlugin);

export function MobileTableOfContents() {
  const pathname = usePathname();
  const { toc, activeIds } = useToc();
  const [open, setOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [hasToc, setHasToc] = useState(false);

  // Show only on pages that have desktop TOC (StaticPageWrapper with data-has-toc)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasToc(!!document.querySelector('[data-has-toc]'));
  }, [pathname]);

  // Auto-scroll panel to keep all active items visible
  useEffect(() => {
    if (!contentRef.current) return;
    const activeItems = toc.filter((item) => activeIds.has(item.id));
    if (activeItems.length === 0) return;
    const firstLink = contentRef.current.querySelector(
      `[data-toc-id="${activeItems[0].id}"]`
    ) as HTMLElement;
    const lastLink = contentRef.current.querySelector(
      `[data-toc-id="${activeItems[activeItems.length - 1].id}"]`
    ) as HTMLElement;
    if (!firstLink || !lastLink) return;
    const panelRect = contentRef.current.getBoundingClientRect();
    const firstRect = firstLink.getBoundingClientRect();
    const lastRect = lastLink.getBoundingClientRect();
    if (firstRect.top < panelRect.top) {
      contentRef.current.scrollTo({
        top: firstLink.offsetTop - 8,
        behavior: 'smooth',
      });
    } else if (lastRect.bottom > panelRect.bottom) {
      contentRef.current.scrollTo({
        top: lastLink.offsetTop + lastLink.offsetHeight - contentRef.current.clientHeight + 8,
        behavior: 'smooth',
      });
    }
  }, [activeIds, toc]);

  const handleItemClick = useCallback((e: Event, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const targetScrollTop = element.getBoundingClientRect().top + window.scrollY - 80;
      gsap.to(window, {
        duration: 0.4,
        scrollTo: { y: targetScrollTop },
        ease: 'power2.out',
      });
      window.history.pushState(null, '', `#${id}`);
    }
    setOpen(false);
  }, []);

  if (toc.length === 0 || !hasToc) return null;

  return (
    <div
      className="xl:hidden fixed right-6 z-30"
      style={{ top: 'calc(var(--mobile-header-height) + 12px)' }}
    >
      <DropdownMenu.Root open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenu.Trigger asChild>
          <button
            className="p-2 rounded-lg flex items-center justify-center bg-background border border-background-border shadow-lg cursor-pointer transition-colors outline-none"
            aria-label="Table of contents"
          >
            <List className="w-5 h-5 text-text-primary" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            ref={contentRef}
            className="w-72 dropdown-panel animate-dropdown bg-background border border-background-border rounded-xl shadow-lg py-2"
            align="end"
            side="bottom"
            sideOffset={8}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            {toc.map((item) => (
              <DropdownMenu.Item
                key={item.id}
                data-toc-id={item.id}
                onSelect={(e) => handleItemClick(e, item.id)}
                className={`
                  block py-1.5 text-[13px] font-medium rounded-md cursor-pointer outline-none transition-colors
                  ${item.level === 3 ? 'pl-6' : 'pl-4'}
                  ${
                    activeIds.has(item.id)
                      ? 'text-text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                  }
                `}
              >
                {item.title}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
