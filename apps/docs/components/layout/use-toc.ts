'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface TocItem {
  id: string;
  title: string;
  level: number;
}

export function useToc() {
  const pathname = usePathname();
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToc([]);
    setActiveIds(new Set());

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

  return { toc, activeIds };
}
