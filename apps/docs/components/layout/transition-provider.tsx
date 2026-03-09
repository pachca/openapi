'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { toSlug } from '@/lib/utils/transliterate';

// Хранилище позиций скролла по URL
const scrollPositions = new Map<string, number>();

// Флаг навигации назад/вперёд
let isBackForwardNavigation = false;

export function TransitionProvider() {
  const pathname = usePathname();
  const firstRender = useRef(true);
  const lastPathname = useRef(pathname);

  // Отключаем браузерное восстановление скролла
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  // Слушаем popstate для определения навигации назад/вперёд
  useEffect(() => {
    const handlePopState = () => {
      isBackForwardNavigation = true;

      const targetUrl = window.location.pathname;
      const savedPosition = scrollPositions.get(targetUrl);

      if (savedPosition !== undefined) {
        const restoreScroll = (attempts: number) => {
          window.scrollTo(0, savedPosition);
          if (attempts > 0) {
            requestAnimationFrame(() => restoreScroll(attempts - 1));
          }
        };

        requestAnimationFrame(() => restoreScroll(5));
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Сохраняем позицию скролла при каждом скролле
  useEffect(() => {
    let scrollTimeout: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        scrollPositions.set(pathname, window.scrollY);
      }, 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(scrollTimeout);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

  // Сохраняем позицию перед переходом по ссылке
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a');
      if (!link) return;

      if (link.href && !link.href.startsWith('javascript:')) {
        scrollPositions.set(pathname, window.scrollY);
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [pathname]);

  // Скролл при смене страницы
  useLayoutEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      lastPathname.current = pathname;

      // Обработка якоря при первой загрузке страницы
      const hash = window.location.hash;
      if (hash) {
        requestAnimationFrame(() => {
          const rawId = decodeURIComponent(hash.slice(1));
          const element = document.getElementById(rawId) || document.getElementById(toSlug(rawId));
          if (element) {
            element.scrollIntoView({ block: 'start' });
          }
        });
      }
      return;
    }

    if (lastPathname.current !== pathname) {
      lastPathname.current = pathname;
    }

    if (isBackForwardNavigation) {
      isBackForwardNavigation = false;
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  useEffect(() => {
    if (firstRender.current) {
      return;
    }

    document.documentElement.classList.add('disable-transitions');

    const timer = setTimeout(() => {
      document.documentElement.classList.remove('disable-transitions');
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
