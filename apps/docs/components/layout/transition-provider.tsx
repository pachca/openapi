'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef } from 'react';
import {
  rememberedScrollPosition,
  rememberScrollPosition,
  scrollToHash,
} from '@/lib/utils/scroll-offset';

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
    const restoreScroll = (position: number, attempts: number) => {
      window.scrollTo(0, position);
      if (attempts > 0) {
        requestAnimationFrame(() => restoreScroll(position, attempts - 1));
      }
    };

    const handlePopState = () => {
      const targetUrl = window.location.pathname;

      // Назад/вперёд в пределах страницы (раздел открытой страницы из поиска,
      // ссылка-якорь): меняется только hash, pathname тот же, и эффект смены
      // страницы ниже не сработает. Флаг не поднимаем, иначе он дожил бы до
      // следующего перехода и тот не прокрутил бы наверх. «Назад» — к месту,
      // откуда прыгнули; «вперёд» — снова к якорю.
      if (targetUrl === lastPathname.current) {
        const origin = rememberedScrollPosition();
        if (origin !== undefined) {
          requestAnimationFrame(() => restoreScroll(origin, 5));
        } else {
          requestAnimationFrame(() => scrollToHash());
        }
        return;
      }

      isBackForwardNavigation = true;

      const savedPosition = scrollPositions.get(targetUrl);
      if (savedPosition !== undefined) {
        requestAnimationFrame(() => restoreScroll(savedPosition, 5));
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
        // Якорь на этой же странице: «Назад» вернёт сюда (handlePopState).
        // Кнопки и пункты меню (поиск, мобильное оглавление) сюда не попадают
        // и запоминают позицию сами, через pushHash.
        const { origin, pathname: path, search } = window.location;
        if (
          link.hash &&
          link.origin === origin &&
          link.pathname === path &&
          link.search === search
        ) {
          rememberScrollPosition();
        }
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
      if (window.location.hash) {
        requestAnimationFrame(() => scrollToHash());
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
      // Переход на страницу с якорем (раздел из поиска, ссылка page#section):
      // ставим раздел под шапку, как при первой загрузке, поверх прокрутки
      // наверх выше. Элемента нет (якорь параметра в скрытой вкладке) —
      // остаёмся наверху, параметр прокрутит schema-tree. Адрес читаем в
      // кадре после коммита: к нему Next уже записал новый URL.
      requestAnimationFrame(() => scrollToHash());
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
