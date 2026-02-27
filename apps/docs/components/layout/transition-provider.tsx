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

      // Восстанавливаем скролл после того как Next.js обновит DOM
      const targetUrl = window.location.pathname;
      const savedPosition = scrollPositions.get(targetUrl);

      if (savedPosition !== undefined) {
        // Используем несколько попыток с задержкой, т.к. DOM может обновляться асинхронно
        const restoreScroll = (attempts: number) => {
          const mainContent = document.querySelector('main');
          if (mainContent) {
            mainContent.scrollTop = savedPosition;
          }
          if (attempts > 0) {
            requestAnimationFrame(() => restoreScroll(attempts - 1));
          }
        };

        // Запускаем восстановление с несколькими попытками
        requestAnimationFrame(() => restoreScroll(5));
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Сохраняем позицию скролла при каждом скролле
  useEffect(() => {
    const mainContent = document.querySelector('main');
    if (!mainContent) return;

    let scrollTimeout: ReturnType<typeof setTimeout>;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        scrollPositions.set(pathname, mainContent.scrollTop);
      }, 50);
    };

    mainContent.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      clearTimeout(scrollTimeout);
      mainContent.removeEventListener('scroll', handleScroll);
    };
  }, [pathname]);

  // Сохраняем позицию перед переходом по ссылке и обрабатываем якорные ссылки
  useEffect(() => {
    const mainContent = document.querySelector('main');
    if (!mainContent) return;

    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest('a');
      if (!link) return;

      // Обработка якорных ссылок (начинающихся с #)
      const href = link.getAttribute('href');

      if (href?.startsWith('#')) {
        e.preventDefault();
        e.stopPropagation();
        const targetId = toSlug(decodeURIComponent(href.slice(1)));
        const element = document.getElementById(targetId);

        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          window.history.pushState(null, '', `#${targetId}`);
        }
        return;
      }

      if (link.href && !link.href.startsWith('javascript:')) {
        // Сохраняем текущую позицию перед переходом
        scrollPositions.set(pathname, mainContent.scrollTop);
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
        const rawId = decodeURIComponent(hash.slice(1));
        const element = document.getElementById(rawId) || document.getElementById(toSlug(rawId));
        if (element) {
          element.scrollIntoView({ block: 'start' });
        }
        document.documentElement.classList.remove('hash-loading');
      } else {
        document.documentElement.classList.remove('hash-loading');
      }
      return;
    }

    const mainContent = document.querySelector('main');
    if (!mainContent) return;

    // Сохраняем позицию предыдущей страницы
    if (lastPathname.current !== pathname) {
      lastPathname.current = pathname;
    }

    if (isBackForwardNavigation) {
      // Позиция восстанавливается в handlePopState
      isBackForwardNavigation = false;
    } else {
      // Обычная навигация вперёд - скроллим наверх
      mainContent.scrollTop = 0;
    }
  }, [pathname]);

  useEffect(() => {
    if (firstRender.current) {
      return;
    }

    // Отключаем анимации при смене страницы
    document.documentElement.classList.add('disable-transitions');

    // Включаем анимации обратно
    const timer = setTimeout(() => {
      document.documentElement.classList.remove('disable-transitions');
    }, 50);

    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
