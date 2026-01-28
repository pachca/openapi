'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import type { NavigationItem } from '@/lib/openapi/types';
import { useNavigationLoading } from '@/hooks/use-navigation-loading';
import { Loader2 } from 'lucide-react';

interface SidebarItemProps {
  item: NavigationItem;
}

const METHOD_COLORS = {
  GET: {
    ghost: 'bg-method-get/10 text-method-get',
    active: 'bg-white text-primary',
  },
  POST: {
    ghost: 'bg-method-post/10 text-method-post',
    active: 'bg-white text-primary',
  },
  PUT: {
    ghost: 'bg-method-put/10 text-method-put',
    active: 'bg-white text-primary',
  },
  DELETE: {
    ghost: 'bg-method-delete/10 text-method-delete',
    active: 'bg-white text-primary',
  },
  PATCH: {
    ghost: 'bg-method-patch/10 text-method-patch',
    active: 'bg-white text-primary',
  },
};

interface SidebarItemProps {
  item: NavigationItem;
  onItemClick?: () => void;
}

export function SidebarItem({ item, onItemClick }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const itemRef = useRef<HTMLAnchorElement>(null);
  const { isLoading, handleClick } = useNavigationLoading(item.href, 200);

  // Check if item has new badge (set by server in navigation.ts)
  const hasNewBadge = item.badge === 'new';

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    handleClick(e);
    onItemClick?.();
  };

  return (
    <li>
      <Link
        href={item.href}
        ref={itemRef}
        onClick={handleLinkClick}
        className={`flex items-center gap-2 px-2 py-1.5 text-[14px] leading-[1.4] rounded-md font-medium group transition-colors duration-200 ${
          isActive
            ? 'bg-primary text-white'
            : 'text-text-secondary hover:bg-background-tertiary hover:text-text-primary'
        }`}
      >
        <span className="truncate flex-1">{item.title}</span>
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
        {!isLoading && hasNewBadge && (
          <div className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
            <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-white' : 'bg-primary'}`} />
          </div>
        )}
        {!isLoading && item.method && (
          <span
            className={`text-[10px] font-bold uppercase tracking-wider ml-auto px-1.5 py-0.5 rounded-full transition-colors duration-200 ${isActive ? METHOD_COLORS[item.method].active : METHOD_COLORS[item.method].ghost}`}
          >
            {item.method}
          </span>
        )}
      </Link>
    </li>
  );
}
