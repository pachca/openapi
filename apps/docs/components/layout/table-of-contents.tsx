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
  const [activeId, setActiveId] = useState<string>('');
  const isScrollingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const isFirstRenderRef = useRef(true);

  // Обработчик клика по ссылкам TOC через нативное делегирование событий
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

  // Подключаем обработчик кликов на document (capture) — гарантирует перехват
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

  // Анимация индикатора активного элемента
  useEffect(() => {
    if (!activeId || !containerRef.current || !indicatorRef.current) return;

    const activeLink = containerRef.current.querySelector(`a[href="#${activeId}"]`) as HTMLElement;
    if (!activeLink) return;

    const top = activeLink.offsetTop;
    const height = activeLink.offsetHeight;

    if (isFirstRenderRef.current) {
      gsap.set(indicatorRef.current, { top, height });
      isFirstRenderRef.current = false;
    } else {
      gsap.to(indicatorRef.current, {
        top,
        height,
        duration: 0.25,
        ease: 'power2.out',
      });
    }
  }, [activeId]);

  // Прокрутка активного элемента в видимую область навигации
  useEffect(() => {
    // Пропускаем автопрокрутку если идет прокрутка после клика пользователя
    if (isScrollingRef.current) {
      return;
    }

    if (activeId) {
      const navContainer = document.querySelector('nav.sticky') as HTMLElement;
      const activeLink = document.querySelector(`a[href="#${activeId}"]`) as HTMLElement;

      if (activeLink && navContainer) {
        const navRect = navContainer.getBoundingClientRect();
        const linkRect = activeLink.getBoundingClientRect();

        // Проверяем, виден ли элемент в навигации
        const isVisible = linkRect.top >= navRect.top && linkRect.bottom <= navRect.bottom;

        if (!isVisible) {
          // Вычисляем позицию элемента относительно контейнера
          const linkOffsetTop = activeLink.offsetTop;
          const navHeight = navContainer.clientHeight;
          const linkHeight = activeLink.clientHeight;

          // Центрируем элемент в контейнере
          const targetScrollTop = linkOffsetTop - navHeight / 2 + linkHeight / 2;

          navContainer.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth',
          });
        }
      }
    }
  }, [activeId]);

  useEffect(() => {
    // Находим все заголовки h2 и h3 внутри .prose
    const container = document.querySelector('.prose');
    if (!container) return;

    const headings = Array.from(container.querySelectorAll('h2, h3'));

    const items: TocItem[] = headings.map((heading, index) => {
      // Если у заголовка нет id, создаем его
      if (!heading.id) {
        heading.id = `heading-${index}`;
      }
      return {
        id: heading.id,
        title: heading.textContent || '',
        level: parseInt(heading.tagName[1]),
      };
    });

    setToc(items);
    if (items.length > 0) {
      setActiveId(items[0].id);
    }

    const visibilityMap: Record<string, boolean> = {};

    // Настройка Intersection Observer для отслеживания активного заголовка
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          visibilityMap[entry.target.id] = entry.isIntersecting;
        });

        // Находим первый видимый заголовок сверху
        const firstVisible = items.find((item) => visibilityMap[item.id]);
        if (firstVisible) {
          setActiveId(firstVisible.id);
        }
      },
      { rootMargin: '-80px 0px -20% 0px' }
    );

    headings.forEach((heading) => observer.observe(heading));

    // Дополнительная проверка для нижнего края страницы
    const mainContent = document.querySelector('main');
    const handleScroll = () => {
      if (!mainContent) return;

      // Если страница прокручена в начало и активный не первый - сбрасываем навигацию
      if (mainContent.scrollTop < 100 && items.length > 0) {
        const firstItemId = items[0].id;
        if (activeId !== firstItemId) {
          setActiveId(firstItemId);
          const navContainer = document.querySelector('nav.sticky') as HTMLElement;
          if (navContainer) {
            navContainer.scrollTop = 0;
          }
        }
      }

      const isAtBottom =
        mainContent.scrollTop + mainContent.clientHeight >= mainContent.scrollHeight - 10;
      if (isAtBottom && items.length > 0) {
        setActiveId(items[items.length - 1].id);
      }
    };

    mainContent?.addEventListener('scroll', handleScroll);

    return () => {
      headings.forEach((heading) => observer.unobserve(heading));
      mainContent?.removeEventListener('scroll', handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally exclude activeId to avoid infinite loop
  }, []);

  if (toc.length === 0) return null;

  return (
    <nav className="sticky top-6 lg:top-10 max-h-[calc(100vh-80px)] overflow-y-auto no-scrollbar py-2">
      <div
        ref={containerRef}
        className="relative flex flex-col border-l-2 border-background-border ml-4"
      >
        <div ref={indicatorRef} className="absolute left-[-2px] w-[2px] bg-primary" />
        {toc.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={`
              block py-1 text-[13px] transition-colors duration-200 font-medium
              ${item.level === 3 ? 'pl-6' : 'pl-4'}
              ${
                activeId === item.id
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
