'use client';

import { useEffect, useState, useRef } from 'react';
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
          const navScrollTop = navContainer.scrollTop;
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
      
      const isAtBottom = mainContent.scrollTop + mainContent.clientHeight >= mainContent.scrollHeight - 10;
      if (isAtBottom && items.length > 0) {
        setActiveId(items[items.length - 1].id);
      }
    };

    mainContent?.addEventListener('scroll', handleScroll);

    return () => {
      headings.forEach((heading) => observer.unobserve(heading));
      mainContent?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  if (toc.length === 0) return null;

  return (
    <nav className="sticky top-6 lg:top-10 max-h-[calc(100vh-80px)] overflow-y-auto no-scrollbar py-2">
      <div className="flex flex-col border-l-2 border-background-border ml-4">
        {toc.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault();
              isScrollingRef.current = true;
              const element = document.getElementById(item.id);
              const mainContent = document.querySelector('main');
              
              if (element && mainContent) {
                gsap.to(mainContent, {
                  duration: 0.4,
                  scrollTop: element.offsetTop - 80,
                  ease: 'power2.out',
                  onComplete: () => {
                    // Разрешаем автопрокрутку через 100мс после завершения анимации
                    setTimeout(() => {
                      isScrollingRef.current = false;
                    }, 100);
                  }
                });
                window.history.pushState(null, '', `#${item.id}`);
              }
            }}
            className={`
              block py-1 text-[13px] transition-all duration-200 border-l-2 -ml-[2px] font-medium
              ${item.level === 3 ? 'pl-6' : 'pl-4'}
              ${activeId === item.id 
                ? 'text-text-primary border-primary' 
                : 'text-text-secondary border-transparent hover:text-text-primary'
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
