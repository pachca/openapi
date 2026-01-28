'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function useNavigationLoading(href: string, delay: number = 200) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (pendingHref && pathname === pendingHref) {
      setIsLoading(false);
      setPendingHref(null);
    }
  }, [pathname, pendingHref]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href === pathname) {
      return;
    }

    // Устанавливаем загрузку с задержкой
    const timeoutId = setTimeout(() => {
      setIsLoading(true);
      setPendingHref(href);
    }, delay);

    // Сохраняем таймер для возможной отмены
    (e.currentTarget as any).__loadingTimeout = timeoutId;
  };

  return { isLoading, handleClick };
}
