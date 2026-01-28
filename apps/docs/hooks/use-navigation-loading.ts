'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function useNavigationLoading(href: string, delay: number = 200) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const pendingHrefRef = useRef<string | null>(null);

  useEffect(() => {
    if (pendingHrefRef.current && pathname === pendingHrefRef.current) {
      // Reset loading state when navigation is complete
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: syncing with navigation state
      setIsLoading(false);
      pendingHrefRef.current = null;
    }
  }, [pathname]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href === pathname) {
      return;
    }

    // Устанавливаем загрузку с задержкой
    const timeoutId = setTimeout(() => {
      setIsLoading(true);
      pendingHrefRef.current = href;
    }, delay);

    // Сохраняем таймер для возможной отмены
    const target = e.currentTarget as HTMLAnchorElement & {
      __loadingTimeout?: ReturnType<typeof setTimeout>;
    };
    target.__loadingTimeout = timeoutId;
  };

  return { isLoading, handleClick };
}
