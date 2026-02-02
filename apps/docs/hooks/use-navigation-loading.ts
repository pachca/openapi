'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export function useNavigationLoading(href: string, delay: number = 200) {
  const [showLoader, setShowLoader] = useState(false);
  const pathname = usePathname();
  const targetHrefRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (targetHrefRef.current && pathname === targetHrefRef.current) {
      targetHrefRef.current = null;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowLoader(false);
    }
  }, [pathname]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleClick = useCallback(() => {
    if (href === pathname) return;

    targetHrefRef.current = href;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (targetHrefRef.current === href) {
        setShowLoader(true);
      }
    }, delay);
  }, [href, pathname, delay]);

  return { isLoading: showLoader, handleClick };
}
