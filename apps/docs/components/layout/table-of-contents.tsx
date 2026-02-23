'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import gsap from 'gsap';

interface TocItem {
  id: string;
  title: string;
  level: number;
}

export function TableOfContents() {
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set());
  const isScrollingRef = useRef(false);
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
    const mainContent = document.querySelector('main');
    if (element && mainContent) {
      isScrollingRef.current = true;
      const targetScrollTop =
        element.getBoundingClientRect().top -
        mainContent.getBoundingClientRect().top +
        mainContent.scrollTop -
        80;
      gsap.to(mainContent, {
        duration: 0.4,
        scrollTop: targetScrollTop,
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
    if (isScrollingRef.current) return;
    const firstActiveId = toc.find((item) => activeIds.has(item.id))?.id;
    if (!firstActiveId) return;
    const navContainer = document.querySelector('nav.sticky') as HTMLElement;
    const activeLink = document.querySelector(`a[href="#${firstActiveId}"]`) as HTMLElement;
    if (activeLink && navContainer) {
      const navRect = navContainer.getBoundingClientRect();
      const linkRect = activeLink.getBoundingClientRect();
      const isVisible = linkRect.top >= navRect.top && linkRect.bottom <= navRect.bottom;
      if (!isVisible) {
        const targetScrollTop =
          activeLink.offsetTop - navContainer.clientHeight / 2 + activeLink.clientHeight / 2;
        navContainer.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
      }
    }
  }, [activeIds, toc]);

  useEffect(() => {
    const container = document.querySelector('.prose');
    const mainContent = document.querySelector('main');
    if (!container || !mainContent) return;

    const headings = Array.from(container.querySelectorAll('h2, h3')) as HTMLElement[];

    const items: TocItem[] = headings.map((heading, index) => {
      if (!heading.id) heading.id = `heading-${index}`;
      return {
        id: heading.id,
        title: heading.textContent || '',
        level: parseInt(heading.tagName[1]),
      };
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setToc(items);
    if (items.length > 0) setActiveIds(new Set([items[0].id]));

    // Абсолютная позиция заголовка от начала контента main (независимо от scroll)
    const computeHeadingTop = (h: HTMLElement) => {
      const mainRect = mainContent.getBoundingClientRect();
      const hRect = h.getBoundingClientRect();
      return hRect.top - mainRect.top + mainContent.scrollTop;
    };

    let headingTops: number[] = [];
    const computePositions = () => {
      headingTops = headings.map(computeHeadingTop);
    };
    computePositions();

    const updateActive = () => {
      const scrollTop = mainContent.scrollTop;
      // Зона видимости: от 80px (фиксированная шапка) до 80% высоты вьюпорта
      const visibleTop = scrollTop + 80;
      const visibleBottom = scrollTop + mainContent.clientHeight * 0.8;

      const visibleIds: string[] = [];

      items.forEach((item, i) => {
        // Секция занимает место от своего заголовка до начала следующего (или конца страницы)
        const sectionStart = headingTops[i];
        const sectionEnd = i < items.length - 1 ? headingTops[i + 1] : mainContent.scrollHeight;

        if (sectionStart < visibleBottom && sectionEnd > visibleTop) {
          visibleIds.push(item.id);
        }
      });

      if (visibleIds.length > 0) {
        setActiveIds(new Set(visibleIds));
      } else {
        // Ни одна секция не пересекается — выбираем последнюю, которую уже проскроллили
        const lastPassed = [...items]
          .reverse()
          .find((_, reverseIdx) => headingTops[items.length - 1 - reverseIdx] <= visibleTop);
        if (lastPassed) {
          setActiveIds(new Set([lastPassed.id]));
        } else if (items.length > 0) {
          setActiveIds(new Set([items[0].id]));
        }
      }
    };

    updateActive();

    mainContent.addEventListener('scroll', updateActive);

    // Пересчитываем позиции при изменении размеров контента (например, раскрытие спойлеров)
    const resizeObserver = new ResizeObserver(() => {
      computePositions();
      updateActive();
    });
    resizeObserver.observe(container);

    return () => {
      mainContent.removeEventListener('scroll', updateActive);
      resizeObserver.disconnect();
    };
  }, []);

  if (toc.length === 0) return null;

  return (
    <nav className="sticky top-6 lg:top-10 max-h-[calc(100vh-80px)] overflow-y-auto no-scrollbar py-2">
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
