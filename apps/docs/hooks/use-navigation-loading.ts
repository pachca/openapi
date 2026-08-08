'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Loader state for a link that starts a navigation.
 *
 * `pending` starts the same delayed loader without a click — for navigations
 * kicked off elsewhere (e.g. picking a section in the mobile menu jumps to its
 * landing page, and that page's sidebar item should look like it was clicked).
 */
export function useNavigationLoading(href: string, delay: number = 200, pending: boolean = false) {
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

  useEffect(() => {
    if (pending) handleClick();
  }, [pending, handleClick]);

  return { isLoading: showLoader, handleClick };
}
