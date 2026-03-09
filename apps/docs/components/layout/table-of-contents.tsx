'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

interface TocItem {
  id: string;
  title: string;
  level: number;
}

export function TableOfContents() {
  const pathname = usePathname();
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const isScrollingRef = useRef(false);
  const navRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const isFirstRenderRef = useRef(true);

  const handleContainerClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    if (!link) return;
    e.preventDefault();
    const href = link.getAttribute('href');
    if (!href?.startsWith('#')) return;
    const id = href.slice(1);
    const element = document.getElementById(id);
    if (element) {
      isScrollingRef.current = true;
      const targetScrollTop = element.getBoundingClientRect().top + window.scrollY - 80;
      gsap.to(window, {
        duration: 0.4,
        scrollTo: { y: targetScrollTop },
        ease: 'power2.out',
        onComplete: () => {
          setTimeout(() => {
            isScrollingRef.current = false;
          }, 100);
        },
      });
      window.history.pushState(null, '', `#${id}`);
    }
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href^="#"]');
      if (!link || !containerRef.current?.contains(link)) return;
      handleContainerClick(e);
    };
    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [handleContainerClick]);

  // Анимация индикатора: от первого до последнего активного заголовка
  useEffect(() => {
    if (activeIds.size === 0 || !containerRef.current || !indicatorRef.current) return;
    const activeItems = toc.filter((item) => activeIds.has(item.id));
    if (activeItems.length === 0) return;
    const firstEl = containerRef.current.querySelector(
      `a[href="#${activeItems[0].id}"]`
    ) as HTMLElement;
    const lastEl = containerRef.current.querySelector(
      `a[href="#${activeItems[activeItems.length - 1].id}"]`
    ) as HTMLElement;
    if (!firstEl || !lastEl) return;
    const top = firstEl.offsetTop;
    const height = lastEl.offsetTop + lastEl.offsetHeight - firstEl.offsetTop;
    if (isFirstRenderRef.current) {
      gsap.set(indicatorRef.current, { top, height });
      isFirstRenderRef.current = false;
    } else {
      gsap.to(indicatorRef.current, { top, height, duration: 0.25, ease: 'power2.out' });
    }
  }, [activeIds, toc]);

  // Прокрутка первого активного элемента в видимую область навигации
  useEffect(() => {
    if (isScrollingRef.current || !navRef.current) return;
    const firstActiveId = toc.find((item) => activeIds.has(item.id))?.id;
    if (!firstActiveId) return;
    const activeLink = navRef.current.querySelector(`a[href="#${firstActiveId}"]`) as HTMLElement;
    if (activeLink) {
      const navRect = navRef.current.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();
      const isVisible = linkRect.top >= navRect.top && linkRect.bottom <= navRect.bottom;
      if (!isVisible) {
        const targetScrollTop =
          activeLink.offsetTop - navRef.current.clientHeight / 2 + activeLink.clientHeight / 2;
        navRef.current.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      }
    }
  }, [activeIds, toc]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToc([]);
    setActiveIds(new Set());
    isFirstRenderRef.current = true;

    const container = document.querySelector('.prose');
    if (!container) return;

    const headings = Array.from(container.querySelectorAll('h2, h3')) as HTMLElement[];

    const items: TocItem[] = headings.map((heading, index) => {
      if (!heading.id) heading.id = `heading-${index}`;
      return {
        id: heading.id,
        title: heading.textContent || '',
        level: parseInt(heading.tagName[1]),
      };
    });

    setToc(items);
    if (items.length > 0) setActiveIds(new Set([items[0].id]));

    const updateActive = () => {
      const viewportTop = 80;
      const viewportBottom = window.innerHeight * 0.8;

      const visibleIds: string[] = [];

      items.forEach((item, i) => {
        const rect = headings[i].getBoundingClientRect();
        const nextRect = i < items.length - 1 ? headings[i + 1].getBoundingClientRect() : null;
        const sectionTop = rect.top;
        const sectionBottom = nextRect ? nextRect.top : document.documentElement.scrollHeight;

        if (sectionTop < viewportBottom && sectionBottom > viewportTop) {
          visibleIds.push(item.id);
        }
      });

      if (visibleIds.length > 0) {
        setActiveIds(new Set(visibleIds));
      } else {
        const lastPassed = [...items].reverse().find((_, reverseIdx) => {
          const idx = items.length - 1 - reverseIdx;
          return headings[idx].getBoundingClientRect().top <= viewportTop;
        });
        if (lastPassed) {
          setActiveIds(new Set([lastPassed.id]));
        } else if (items.length > 0) {
          setActiveIds(new Set([items[0].id]));
        }
      }
    };

    requestAnimationFrame(updateActive);

    window.addEventListener('scroll', updateActive, { passive: true });

    return () => {
      window.removeEventListener('scroll', updateActive);
    };
  }, [pathname]);

  if (toc.length === 0) return null;

  return (
    <nav
      ref={navRef}
      className="sticky top-[calc(var(--mobile-header-height)+24px)] max-h-[calc(100vh-var(--mobile-header-height)-48px)] overflow-y-auto no-scrollbar py-2"
    >
      <div
        ref={containerRef}
        className="relative flex flex-col border-l-1 border-background-border ml-4"
      >
        <div ref={indicatorRef} className="absolute left-[-1px] w-[1px] bg-primary" />
        {toc.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`
              block py-1 text-[13px] transition-colors duration-200 font-medium
              ${item.level === 3 ? 'pl-6' : 'pl-4'}
              ${
                activeIds.has(item.id)
                  ? 'text-text-primary'
                  : 'text-text-secondary hover:text-text-primary'
              }
            `}
          >
            {item.title}
          </a>
        ))}
      </div>
    </nav>
  );
}
